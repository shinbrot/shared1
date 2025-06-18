import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Share2, Shield, Home } from 'lucide-react';
import { Button } from './ui/Button';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isHomePage = location.pathname === '/';

  return (
    <nav className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Share2 className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white font-semibold text-lg">Jinshi Cloud</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {!isHomePage && (
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            )}
            
            {!isAdminPage && (
              <Link to="/admin">
                <Button variant="secondary" size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};