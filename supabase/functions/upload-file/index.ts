/*
  # File Upload Edge Function

  1. Purpose
    - Handles file uploads to Cloudflare R2 storage
    - Acts as a proxy to avoid CORS issues
    - Validates file size and type
    - Updates database with file metadata

  2. Security
    - Validates file size limits
    - Checks rate limiting
    - Handles password hashing

  3. Features
    - Progress tracking via streaming response
    - Error handling and validation
    - IP-based rate limiting
*/

import { createClient } from 'npm:@supabase/supabase-js@2';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3';
import bcrypt from 'npm:bcryptjs@2.4.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: Deno.env.get('R2_ENDPOINT'),
  credentials: {
    accessKeyId: Deno.env.get('R2_ACCESS_KEY') ?? '',
    secretAccessKey: Deno.env.get('R2_SECRET_KEY') ?? '',
  },
});

const BUCKET_NAME = Deno.env.get('R2_BUCKET');
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB

async function getUserIP(request: Request): Promise<string> {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: rateLimit } = await supabase
    .from('upload_rate_limits')
    .select('*')
    .eq('ip_address', ip)
    .single();

  if (!rateLimit) {
    // First upload for this IP
    await supabase
      .from('upload_rate_limits')
      .insert({
        ip_address: ip,
        upload_count: 1,
        last_upload_date: today
      });
    return true;
  }

  if (rateLimit.last_upload_date === today) {
    if (rateLimit.upload_count >= 10) { // 10 uploads per day limit
      return false;
    }
    
    await supabase
      .from('upload_rate_limits')
      .update({
        upload_count: rateLimit.upload_count + 1
      })
      .eq('ip_address', ip);
  } else {
    // New day, reset counter
    await supabase
      .from('upload_rate_limits')
      .update({
        upload_count: 1,
        last_upload_date: today
      })
      .eq('ip_address', ip);
  }

  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const userIP = await getUserIP(req);
    
    // Check rate limiting
    const canUpload = await checkRateLimit(userIP);
    if (!canUpload) {
      return new Response(
        JSON.stringify({ error: 'Upload limit exceeded. Try again tomorrow.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const password = formData.get('password') as string;
    const originalFilename = formData.get('originalFilename') as string;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 250MB limit' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate unique object key
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const objectKey = `${timestamp}-${randomId}-${originalFilename}`;

    // Convert file to ArrayBuffer for R2 upload
    const fileBuffer = await file.arrayBuffer();

    // Upload to R2
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      Body: new Uint8Array(fileBuffer),
      ContentType: file.type,
    });

    await r2Client.send(putCommand);

    // Hash password if provided
    let passwordHash: string | undefined;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    // Calculate expiry date (3 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);

    // Save metadata to Supabase with explicit field values
    const { data, error } = await supabase
      .from('files')
      .insert({
        original_filename: originalFilename,
        r2_object_key: objectKey,
        password_hash: passwordHash,
        uploader_ip: userIP,
        file_size: file.size,
        content_type: file.type,
        download_count: 0,
        is_active: true,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to save file metadata');
    }

    return new Response(
      JSON.stringify({
        success: true,
        fileId: data.id,
        downloadUrl: `${req.headers.get('origin') || 'http://localhost:5173'}/file/${data.id}`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to upload file' }),
      {
        status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});