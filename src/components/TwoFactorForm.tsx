import React, { useState, useEffect } from 'react';
import { Smartphone, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface TwoFactorFormProps {
  onVerify: (code: string) => void;
  phoneNumber: string;
}

export const TwoFactorForm: React.FC<TwoFactorFormProps> = ({ onVerify, phoneNumber }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = code.join('');
    if (finalCode.length === 6) {
      setIsLoading(true);
      onVerify(finalCode);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-lg login-card-shadow overflow-hidden border border-gray-100">
        <div className="p-8 border-b border-gray-100 bg-lloyds-green text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Smartphone size={24} />
            </div>
            <h2 className="text-xl font-bold">Secure Verification</h2>
          </div>
          <p className="text-sm opacity-90">
            To protect your account, we've sent a 6-digit security code to your mobile device ending in <span className="font-bold">...{phoneNumber}</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="flex justify-between gap-2">
            {code.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border border-gray-200 rounded-lg focus-lloyds"
                autoFocus={i === 0}
              />
            ))}
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading || code.some(d => !d)}
              className="w-full h-12 bg-lloyds-green text-white font-bold rounded-md hover:bg-lloyds-dark transition-all flex items-center justify-center gap-2 disabled:bg-gray-300"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Verify & Log On <ArrowRight size={18} /></>
              )}
            </button>

            <button 
              type="button"
              disabled={resendTimer > 0}
              className="w-full flex items-center justify-center gap-2 text-sm text-lloyds-green font-semibold hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              <RefreshCw size={14} />
              {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend security code'}
            </button>
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-start gap-3">
            <ShieldCheck size={18} className="text-lloyds-green shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              If you don't receive the code or no longer have access to this mobile number, please contact your administrator or call our helpdesk.
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
