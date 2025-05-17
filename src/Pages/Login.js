import React, { useState, useEffect } from 'react';
import { Lock, User, LogIn, ChevronRight } from 'lucide-react';
import { authAPI } from '../Intercepter/APiClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    
    setAnimateIn(true);
    
   
    if (authAPI.isAuthenticated()) {
      
      console.log('User already authenticated');
    }
  }, []);
  
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
   
    setErrorMessage('');
    
    
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await authAPI.login(email, password);
      
      if (result.success) {
        
        console.log('Login successful');
        window.location.href = '/console'; 
      } else {
        setErrorMessage(result.message || 'Login failed');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
    
    
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Section - Branding */}
      <div 
        className={`bg-blue-600 text-white w-full p-8 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${animateIn ? 'opacity-100' : 'opacity-0 -translate-y-10'}`}
      >
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-xl mb-6">Manage your application with a powerful and intuitive admin interface.</p>
          
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <div className="flex items-center">
              <div className="bg-blue-500 p-2 rounded-full mr-3">
                <ChevronRight size={18} />
              </div>
              <p>Complete control</p>
            </div>
            <div className="flex items-center">
              <div className="bg-blue-500 p-2 rounded-full mr-3">
                <ChevronRight size={18} />
              </div>
              <p>Advanced analytics</p>
            </div>
            <div className="flex items-center">
              <div className="bg-blue-500 p-2 rounded-full mr-3">
                <ChevronRight size={18} />
              </div>
              <p>User management</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Section - Login Form */}
      <div 
        className={`bg-white flex-grow w-full flex items-center justify-center p-6 transition-all duration-1000 ease-in-out ${animateIn ? 'opacity-100' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Sign in to your admin account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {errorMessage}
              </div>
            )}
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User size={20} />
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 pl-12 pr-4 text-gray-700 border rounded-lg outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={20} />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 pl-12 pr-4 text-gray-700 border rounded-lg outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-blue-600 hover:underline cursor-pointer">
                Forgot password?
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all ${isLoading ? 'opacity-70' : ''}`}
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              ) : (
                <LogIn size={20} className="mr-2" />
              )}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account? <span className="text-blue-600 hover:underline cursor-pointer">Contact administrator</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}