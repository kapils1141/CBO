import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Info, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginFormProps {
  onLoginSuccess: (userId: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setIsLoading(true);
    setError(null);
    
    // Simulate ForgeRock Authentication Call
    // In production, this would use the ForgeRock SDK:
    // FRAuth.next({ username, password })
    setTimeout(() => {
      setIsLoading(false);
      // In this demo, any login is "successful" for the UI flow
      onLoginSuccess(username);
    }, 1500);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg login-card-shadow overflow-hidden border border-gray-100">
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Log On</h2>
          <p className="text-sm text-gray-500">
            Enter your credentials for Commercial Banking Online.
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-md">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2 flex justify-between">
                Username
                <span className="text-xs text-lloyds-green font-medium cursor-help flex items-center gap-1">
                  <HelpCircle size={12} /> What's this?
                </span>
              </label>
              <input
                id="username"
                type="text"
                required
                autoFocus
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus-lloyds"
                placeholder="Enter your Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="auth" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="auth"
                type="password"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus-lloyds"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <Info size={18} className="text-blue-500 shrink-0" />
              <p className="text-xs text-blue-800 leading-relaxed">
                We'll verify your credentials with ForgeRock identity services.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full h-12 bg-lloyds-green text-white font-bold rounded-md hover:bg-lloyds-dark transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Log On <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <p className="text-center">
              <a href="#" className="text-sm text-lloyds-green hover:underline font-medium">Forgotten your log on details?</a>
            </p>
          </form>
        </div>
      </div>

      <div className="mt-8 text-center space-y-4">
        <div className="flex justify-center items-center gap-2 text-gray-500 text-sm font-medium">
          <ShieldCheck size={16} className="text-lloyds-green" />
          Secure Connection Guaranteed
        </div>
        <p className="text-xs text-gray-400">
          Lloyds Bank plc. Registered Office: 25 Gresham Street, London EC2V 7HN. Registered in England and Wales no. 2065.
        </p>
      </div>
    </div>
  );
};
