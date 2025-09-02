import { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import bcrypt from 'bcryptjs';
import { createFile } from './firestore';
import { checkRateLimit, getUserIP } from './rateLimiting';
import { FileRecord } from '../types';

// R2 Client setup
const r2Client = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_KEY,
  },
});

const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET;
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB

/**
 * Upload file to R2 and save metadata to Firestore
 */
export const uploadToR2 = async (
  file: File,
  password?: string,
  onProgress?: (progress: number) => void
): Promise<{ fileId: string; downloadUrl: string }> => {
  try {
    // Get user IP
    const userIP = await getUserIP();
    
    // Check rate limiting
    const rateCheck = await checkRateLimit(userIP);
    if (!rateCheck.allowed) {
      throw new Error('Upload limit exceeded. Try again tomorrow.');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 250MB limit');
    }

    // Generate unique object key
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const objectKey = `${timestamp}-${randomId}-${file.name}`;

    // Simulate progress for user feedback
    if (onProgress) {
      onProgress(10);
    }

    // Convert file to ArrayBuffer for R2 upload
    const fileBuffer = await file.arrayBuffer();
    
    if (onProgress) {
      onProgress(30);
    }

    // Upload to R2
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      Body: new Uint8Array(fileBuffer),
      ContentType: file.type,
    });

    await r2Client.send(putCommand);
    
    if (onProgress) {
      onProgress(70);
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    // Calculate expiry date (3 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);

    // Save metadata to Firestore
    const fileData: Omit<FileRecord, 'id'> = {
      original_filename: file.name,
      r2_object_key: objectKey,
      password_hash: passwordHash,
      uploader_ip: userIP,
      file_size: file.size,
      content_type: file.type,
      download_count: 0,
      is_active: true,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    };

    const fileId = await createFile(fileData);
    
    if (onProgress) {
      onProgress(100);
    }

    return {
      fileId,
      downloadUrl: `${window.location.origin}/file/${fileId}`
    };

  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Generate signed URL for downloading
 */
export const getSignedDownloadUrl = async (objectKey: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });

  try {
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate download URL');
  }
};

/**
 * Delete file from R2
 */
export const deleteFromR2 = async (objectKey: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });

  try {
    await r2Client.send(command);
  } catch (error) {
    console.error('R2 delete error:', error);
    throw new Error('Failed to delete file from storage');
  }
};