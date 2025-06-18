import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_KEY,
  },
});

const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET;

// Upload function now uses Edge Function instead of direct R2 upload
export const uploadToR2 = async (
  file: File,
  password?: string,
  onProgress?: (progress: number) => void
): Promise<{ fileId: string; downloadUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('originalFilename', file.name);
  if (password) {
    formData.append('password', password);
  }

  try {
    if (onProgress) onProgress(10);

const response = await fetch(import.meta.env.VITE_UPLOAD_FUNCTION, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  },
  body: formData,
});

    if (onProgress) onProgress(90);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();
    
    if (onProgress) onProgress(100);

    return {
      fileId: result.fileId,
      downloadUrl: result.downloadUrl
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const getSignedDownloadUrl = async (objectKey: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });

  try {
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 1 hour
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate download URL');
  }
};

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