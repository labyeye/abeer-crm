import React, { useState } from 'react';
import { Camera, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { addNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      addNotification({
        type: 'success',
        title: 'Login Successful',
        message: 'Welcome to PhotoERP System!'
      });
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Login Failed',
        message: error instanceof Error ? error.message : 'Please check your credentials and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {}
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start mb-6">
            <div className="bg-brand p-3 rounded-xl">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-3xl font-bold text-gray-900">PhotoERP</h1>
              <p className="text-gray-600 text-sm">Business Management System</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Streamline Your
            <span className="text-brand"> Photography Business</span>
          </h2>
          
          <p className="text-lg text-gray-600 mb-8">
            Complete ERP solution with multi-level access control, automated workflows, 
            and smart communication for photography businesses.
          </p>
        </div>

        {}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Welcome Back</h3>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand text-white font-semibold py-3 rounded-lg hover:opacity-95 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Signing In...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button className="text-brand hover:text-opacity-90 text-sm font-medium">
              Forgot your password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;