import { FileValidationResult } from '../types';

const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB
const ALLOWED_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp3',
  
  // Other
  'application/json',
  'application/xml',
  'application/octet-stream'
];

export const validateFile = (file: File): FileValidationResult => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds 250MB limit. Your file is ${formatFileSize(file.size)}.`
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('application/')) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not supported.`
    };
  }

  // Check filename
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: 'Filename is too long. Maximum 255 characters allowed.'
    };
  }

  return { isValid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (contentType: string): string => {
  if (contentType.startsWith('image/')) return '🖼️';
  if (contentType.startsWith('video/')) return '🎥';
  if (contentType.startsWith('audio/')) return '🎵';
  if (contentType.includes('pdf')) return '📄';
  if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('7z')) return '📦';
  if (contentType.includes('word') || contentType.includes('document')) return '📝';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
  if (contentType.includes('powerpoint') || contentType.includes('presentation')) return '📊';
  return '📁';
};