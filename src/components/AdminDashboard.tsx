import React, { useState, useEffect } from 'react';
import { 
  Files, 
  Download, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  HardDrive,
  Users,
  LogOut,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { supabase } from '../utils/supabase';
import { deleteFromR2 } from '../utils/r2Client';
import { formatFileSize, getFileIcon } from '../utils/fileValidation';
import { useAuth } from '../hooks/useAuth';
import { FileRecord } from '../types';

export const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'expired'>('all');
  const [stats, setStats] = useState({
    totalFiles: 0,
    activeFiles: 0,
    totalSize: 0,
    totalDownloads: 0
  });

  useEffect(() => {
    fetchFiles();
    fetchStats();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('is_active, file_size, download_count, expires_at');

      if (error) throw error;

      const now = new Date();
      const stats = data.reduce((acc, file) => {
        const isActive = file.is_active && new Date(file.expires_at) > now;
        
        return {
          totalFiles: acc.totalFiles + 1,
          activeFiles: acc.activeFiles + (isActive ? 1 : 0),
          totalSize: acc.totalSize + file.file_size,
          totalDownloads: acc.totalDownloads + file.download_count
        };
      }, {
        totalFiles: 0,
        activeFiles: 0,
        totalSize: 0,
        totalDownloads: 0
      });

      setStats(stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleDeleteFile = async (file: FileRecord) => {
    if (!confirm(`Are you sure you want to delete "${file.original_filename}"?`)) {
      return;
    }

    try {
      // Delete from R2
      await deleteFromR2(file.r2_object_key);
      
      // Delete from Supabase
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', file.id);

      if (error) throw error;

      toast.success('File deleted successfully');
      fetchFiles();
      fetchStats();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete file');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.uploader_ip.includes(searchTerm);
    
    const now = new Date();
    const isExpired = new Date(file.expires_at) < now;
    const isActive = file.is_active && !isExpired;

    if (filterActive === 'active') return matchesSearch && isActive;
    if (filterActive === 'expired') return matchesSearch && (!file.is_active || isExpired);
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isFileExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 mt-1">Welcome back, {user?.email}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" onClick={fetchFiles}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Files className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Files</p>
                <p className="text-white text-xl font-semibold">{stats.totalFiles}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Active Files</p>
                <p className="text-white text-xl font-semibold">{stats.activeFiles}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Size</p>
                <p className="text-white text-xl font-semibold">{formatFileSize(stats.totalSize)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Downloads</p>
                <p className="text-white text-xl font-semibold">{stats.totalDownloads}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search files by name or IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterActive === 'all' ? 'primary' : 'secondary'}
                onClick={() => setFilterActive('all')}
                size="sm"
              >
                All ({files.length})
              </Button>
              <Button
                variant={filterActive === 'active' ? 'primary' : 'secondary'}
                onClick={() => setFilterActive('active')}
                size="sm"
              >
                Active ({stats.activeFiles})
              </Button>
              <Button
                variant={filterActive === 'expired' ? 'primary' : 'secondary'}
                onClick={() => setFilterActive('expired')}
                size="sm"
              >
                Expired ({stats.totalFiles - stats.activeFiles})
              </Button>
            </div>
          </div>
        </Card>

        {/* Files List */}
        <Card noPadding>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Loading files...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="p-8 text-center">
              <Files className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No files found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-300 font-medium">File</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Size</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Uploader</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Downloads</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Status</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Expires</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => {
                    const expired = isFileExpired(file.expires_at);
                    const hasPassword = !!file.password_hash;
                    
                    return (
                      <tr key={file.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{getFileIcon(file.content_type)}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium truncate">{file.original_filename}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-slate-500 font-mono">
                                  {file.id.slice(0, 8)}...
                                </span>
                                {hasPassword && (
                                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                                    Protected
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400">{formatFileSize(file.file_size)}</td>
                        <td className="p-4">
                          <div>
                            <p className="text-slate-400 font-mono text-sm">{file.uploader_ip}</p>
                            {file.uploader_email && (
                              <p className="text-slate-500 text-xs">{file.uploader_email}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-slate-400">{file.download_count}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            expired || !file.is_active
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {expired || !file.is_active ? 'Expired' : 'Active'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 text-sm">
                          {formatDate(file.expires_at)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/file/${file.id}`, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(file)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};