import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ProgressBar } from './ui/ProgressBar';
import { validateFile, formatFileSize } from '../utils/fileValidation';
import { uploadToR2 } from '../utils/r2Client';
import { generateQRCode } from '../utils/qrCode';

export const FileUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    fileId?: string;
    downloadUrl?: string;
    qrCode?: string;
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.error!);
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: uploading
  });

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Upload file using Edge Function
      const result = await uploadToR2(
        selectedFile,
        password.trim() || undefined,
        (progress) => setUploadProgress(progress)
      );

      // Generate QR code
      const qrCode = await generateQRCode(result.downloadUrl);

      setUploadResult({
        success: true,
        fileId: result.fileId,
        downloadUrl: result.downloadUrl,
        qrCode
      });

      toast.success('File uploaded successfully!');
      
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  if (uploadResult?.success) {
    return (
      <Card className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <File className="w-8 h-8 text-green-400" />
        </div>
        
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Upload Successful!</h3>
          <p className="text-slate-400">Your file has been uploaded and is ready to share.</p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-400 mb-2">Download Link:</p>
            <div className="flex gap-2">
              <Input
                value={uploadResult.downloadUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="secondary"
                onClick={() => copyToClipboard(uploadResult.downloadUrl!)}
              >
                Copy
              </Button>
            </div>
          </div>

          {uploadResult.qrCode && (
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <img
                  src={uploadResult.qrCode}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            variant="primary"
            onClick={() => window.open(uploadResult.downloadUrl, '_blank')}
          >
            Test Download
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedFile(null);
              setUploadResult(null);
              setPassword('');
            }}
          >
            Upload Another
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Upload Files</h2>
        <p className="text-slate-400">Share files up to 250MB with optional password protection</p>
      </div>

      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
            transition-all duration-200
            ${isDragActive 
              ? 'border-blue-400 bg-blue-500/10' 
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/20'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-blue-400 text-lg">Drop your file here...</p>
          ) : (
            <div>
              <p className="text-slate-300 text-lg mb-2">
                Drag & drop a file here, or click to select
              </p>
              <p className="text-slate-500 text-sm">
                Maximum file size: 250MB
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-3">
              <File className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-slate-400 text-sm">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Optional password protection</span>
            </div>
            <Input
              type="password"
              placeholder="Enter password (optional)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={uploading}
            />
          </div>

          {uploading && uploadProgress > 0 && (
            <ProgressBar progress={uploadProgress} />
          )}

          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={uploading}
            loading={uploading}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      )}
    </Card>
  );
};