export interface FileRecord {
  id: string;
  original_filename: string;
  r2_object_key: string;
  password_hash?: string;
  created_at: string;
  expires_at: string;
  download_count: number;
  uploader_ip: string;
  uploader_email?: string;
  file_size: number;
  content_type: string;
  is_active: boolean;
}

export interface UploadRateLimit {
  id: string;
  ip_address: string;
  upload_count: number;
  last_upload_date: string;
  created_at: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface AdminConfig {
  adminUserId: string;
  adminEmail: string;
  createdAt: string;
}