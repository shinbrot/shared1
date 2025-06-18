import React from 'react';
import { Shield, Clock, Zap } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { Card } from '../components/ui/Card';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Secure File Sharing
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Upload and share large files up to 250MB with optional password protection. 
            Files auto-expire in 3 days for security.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Password Protection</h3>
            <p className="text-slate-400 text-sm">
              Secure your files with optional password protection using bcrypt encryption.
            </p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Large Files</h3>
            <p className="text-slate-400 text-sm">
              Upload files up to 250MB including videos, archives, documents, and more.
            </p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Auto-Expiry</h3>
            <p className="text-slate-400 text-sm">
              Files automatically expire after 3 days to prevent storage abuse and maintain security.
            </p>
          </Card>
        </div>

        {/* Upload Component */}
        <div className="max-w-2xl mx-auto">
          <FileUpload />
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-slate-800">
          <p className="text-slate-500 text-sm">
            Files expire after 3 days • Secure file sharing with optional password protection
          </p>
        </div>
      </div>
    </div>
  );
};