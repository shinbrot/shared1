import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Lock, File, AlertCircle, Clock } from 'lucide-react';
import bcrypt from 'bcryptjs';
import toast from 'react-hot-toast';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { supabase } from '../utils/supabase';
import { getSignedDownloadUrl } from '../utils/r2Client';
import { formatFileSize, getFileIcon } from '../utils/fileValidation';
import { FileRecord } from '../types';

export const FileDownload: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<FileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Invalid file ID');
      setLoading(false);
      return;
    }

    fetchFileInfo();
  }, [id]);

  const fetchFileInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('File not found or has expired');
        } else {
          setError('Failed to load file information');
        }
        return;
      }

      // Check if file has expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This file has expired');
        return;
      }

      setFile(data);
      setPasswordRequired(!!data.password_hash);
    } catch (err) {
      console.error('Error fetching file:', err);
      setError('Failed to load file information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    try {
      setDownloading(true);

      // Verify password if required
      if (passwordRequired && password.trim()) {
        const isValid = await bcrypt.compare(password.trim(), file.password_hash!);
        if (!isValid) {
          toast.error('Invalid password');
          return;
        }
      } else if (passwordRequired) {
        toast.error('Password is required');
        return;
      }

      // Generate signed download URL
      const downloadUrl = await getSignedDownloadUrl(file.r2_object_key);

      // Update download count
      await supabase
        .from('files')
        .update({ download_count: file.download_count + 1 })
        .eq('id', file.id);

      // Start download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download started!');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const formatTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) {
      return `${hours} hours remaining`;
    }
    
    const days = Math.floor(hours / 24);
    return `${days} days remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading file information...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">File Not Available</h2>
          <p className="text-slate-400">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  if (!file) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <File className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Download File</h2>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileIcon(file.content_type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{file.original_filename}</p>
              <p className="text-slate-400 text-sm">{formatFileSize(file.file_size)}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1 text-slate-400">
              <Clock className="w-4 h-4" />
              <span>{formatTimeRemaining(file.expires_at)}</span>
            </div>
            <span className="text-slate-400">
              {file.download_count} downloads
            </span>
          </div>
        </div>

        {passwordRequired && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400">This file is password protected</span>
            </div>
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={downloading}
            />
          </div>
        )}

        <Button
          variant="primary"
          onClick={handleDownload}
          disabled={downloading || (passwordRequired && !password.trim())}
          loading={downloading}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          {downloading ? 'Preparing Download...' : 'Download File'}
        </Button>

        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate('/')}>
            Upload your own files
          </Button>
        </div>
      </Card>
    </div>
  );
};