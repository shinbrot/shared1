import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

/**
 * Upload file to R2 via Supabase Edge Function (with progress tracking)
 */
export const uploadToR2 = (
  file: File,
  password?: string,
  onProgress?: (progress: number) => void
): Promise<{ fileId: string; downloadUrl: string }> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('originalFilename', file.name);
    if (password) {
      formData.append('password', password);
    }

    const xhr = new XMLHttpRequest();

    // Handle progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    // Handle success
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            fileId: res.fileId,
            downloadUrl: res.downloadUrl,
          });
        } else {
          reject(new Error(res.error || 'Upload failed'));
        }
      } catch (err) {
        reject(new Error('Invalid response'));
      }
    };

    // Handle error
    xhr.onerror = () => {
      reject(new Error('Network error'));
    };

    xhr.open('POST', import.meta.env.VITE_UPLOAD_FUNCTION);
    xhr.setRequestHeader('Authorization', `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`);
    xhr.send(formData);
  });
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
