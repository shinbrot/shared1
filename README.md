# Secure File Sharing Platform

A modern, secure file sharing platform built with React, TypeScript, and Firebase. Features include large file uploads (up to 250MB), optional password protection, automatic expiry, and an admin dashboard.

## Features

- **Large File Support**: Upload files up to 250MB
- **Password Protection**: Optional bcrypt-encrypted password protection
- **Auto-Expiry**: Files automatically expire after 3 days
- **Admin Dashboard**: Manage all uploaded files with detailed statistics
- **Rate Limiting**: IP-based upload limits to prevent abuse
- **QR Code Generation**: Easy sharing with QR codes
- **Responsive Design**: Works on all devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **File Storage**: Cloudflare R2
- **Deployment**: Vercel/Netlify ready

## Setup

### 1. Environment Variables

Create a `.env.local` file with the following variables:

```env
# Cloudflare R2 Configuration (for file storage)
VITE_R2_ENDPOINT=your_r2_endpoint
VITE_R2_ACCESS_KEY=your_r2_access_key
VITE_R2_SECRET_KEY=your_r2_secret_key
VITE_R2_BUCKET=your_r2_bucket_name

# Firebase Configuration (for authentication and database)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Set up Firestore Database
4. Add the following Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // App settings for admin configuration
    match /app_settings/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Files collection
    match /files/{fileId} {
      allow read: if true; // Public read for file downloads
      allow write: if request.auth != null; // Only authenticated admin can write
    }
    
    // Rate limits collection
    match /upload_rate_limits/{limitId} {
      allow read, write: if true; // Public access for rate limiting
    }
  }
}
```

### 3. Cloudflare R2 Setup

1. Create an R2 bucket in Cloudflare Dashboard
2. Generate API tokens with R2 permissions
3. Configure CORS settings for your domain

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

## Usage

### For Users
1. Visit the homepage
2. Drag and drop or select a file (up to 250MB)
3. Optionally set a password for protection
4. Upload and receive a shareable link with QR code
5. Files automatically expire after 3 days

### For Admins
1. Visit `/admin` to access the admin panel
2. Create an admin account (only one allowed)
3. View all uploaded files with statistics
4. Delete files and monitor usage

## Architecture

- **Authentication**: Firebase handles user authentication
- **Database**: Firebase Firestore stores file metadata and rate limiting data
- **File Storage**: Files stored in Cloudflare R2 for fast global delivery
- **Upload Processing**: Client-side upload directly to R2 with metadata saved to Firestore
- **Rate Limiting**: IP-based limits stored in Firestore

## Data Structure

### Firestore Collections

#### `files` Collection
```javascript
{
  id: "auto-generated-id",
  original_filename: "example.pdf",
  r2_object_key: "timestamp-randomid-filename",
  password_hash: "bcrypt-hashed-password", // optional
  created_at: "2025-01-18T10:00:00Z",
  expires_at: "2025-01-21T10:00:00Z",
  download_count: 0,
  uploader_ip: "192.168.1.1",
  uploader_email: "user@example.com", // optional
  file_size: 1048576,
  content_type: "application/pdf",
  is_active: true
}
```

#### `upload_rate_limits` Collection
```javascript
{
  id: "auto-generated-id",
  ip_address: "192.168.1.1",
  upload_count: 5,
  last_upload_date: "2025-01-18",
  created_at: "2025-01-18T10:00:00Z"
}
```

#### `app_settings/admin_config` Document
```javascript
{
  adminUserId: "firebase-user-uid",
  adminEmail: "admin@example.com",
  createdAt: "2025-01-18T10:00:00Z"
}
```

## Security Features

- Password protection using bcrypt hashing
- Firebase security rules for data access control
- Rate limiting to prevent abuse
- Automatic file expiry
- Secure signed URLs for downloads
- CORS protection

## License

MIT License - see LICENSE file for details