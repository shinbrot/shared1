import React, { useState } from 'react';
import { Shield, Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../hooks/useAuth';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, checkAdminExists } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (isSignUp && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      
      if (isSignUp) {
        const { error } = await signUp(email.trim(), password);
        
        if (error) {
          if (error.message.includes('already registered') || error.message.includes('email-already-in-use')) {
            toast.error('An admin user already exists. Please sign in instead.');
            setIsSignUp(false);
          } else {
            toast.error(error.message || 'Failed to create admin account');
          }
        } else {
          toast.success('Admin account created successfully! Please sign in.');
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        const { error } = await signIn(email.trim(), password);
        
        if (error) {
          if (error.message.includes('invalid-credential') || error.message.includes('user-not-found') || error.message.includes('wrong-password')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message || 'Login failed');
          }
        } else {
          toast.success('Welcome to admin panel');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      toast.error(isSignUp ? 'Failed to create account' : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = async () => {
    if (!isSignUp) {
      // Check if admin exists before allowing signup
      const adminExists = await checkAdminExists();
      if (adminExists) {
        toast.error('An admin user already exists. Please sign in.');
        return;
      }
    }
    
    setIsSignUp(!isSignUp);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {isSignUp ? (
              <UserPlus className="w-8 h-8 text-blue-400" />
            ) : (
              <Shield className="w-8 h-8 text-blue-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isSignUp ? 'Create Admin Account' : 'Admin Access'}
          </h2>
          <p className="text-slate-400">
            {isSignUp 
              ? 'Set up your admin account to manage files' 
              : 'Sign in to manage uploaded files'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-300"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {isSignUp && (
            <Input
              type="password"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full"
          >
            {isSignUp ? 'Create Admin Account' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            disabled={loading}
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : 'Need to create an admin account? Sign up'
            }
          </button>
        </div>

      </Card>
    </div>
  );
};