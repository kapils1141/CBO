import React, { useState } from 'react';
import { Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { FRStep, FRAuth } from '@forgerock/javascript-sdk';
import { QRCodeSVG } from 'qrcode.react';

interface TwoFactorFormProps {
  step: FRStep;
  onSuccess: () => void;
}

export const TwoFactorForm: React.FC<TwoFactorFormProps> = ({ step, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState<FRStep>(step);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if this is a registration step by looking for HiddenValueCallback with otpauth URI
  const hiddenCallback = currentStep.callbacks.find(
    (cb: any) => cb.payload?.type === 'HiddenValueCallback'
  );
  const otpUri = (hiddenCallback?.payload?.output?.find(
    (o: any) => o.name === 'value'
  )?.value as string) || '';
  const isRegistrationStep = otpUri.startsWith('otpauth://');

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // Called after scanning QR code — moves to TOTP verification step
  const handleRegistrationContinue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextStep = await FRAuth.next(currentStep);
      if (nextStep.type === 'LoginSuccess') {
        onSuccess();
      } else if (nextStep.type === 'LoginFailure') {
        setError('Registration failed. Please try again.');
      } else {
        // Move to TOTP verification step
        setCurrentStep(nextStep);
        setCode(['', '', '', '', '', '']);
      }
    } catch (err) {
      console.error('Registration continuation failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Called when user submits the 6-digit TOTP code
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = code.join('');
    if (finalCode.length !== 6) return;

    setIsLoading(true);
    setError(null);

    try {
      // Find the NameCallback and set the TOTP code correctly
      currentStep.callbacks.forEach((callback: any) => {
        const type = callback.payload?.type;
        console.log('Callback type:', type);

        if (type === 'NameCallback') {
          // Use setName if available, otherwise set directly
          if (typeof callback.setName === 'function') {
            callback.setName(finalCode);
          } else {
            callback.payload.input[0].value = finalCode;
          }
        }

        if (type === 'PasswordCallback') {
          if (typeof callback.setPassword === 'function') {
            callback.setPassword(finalCode);
          } else {
            callback.payload.input[0].value = finalCode;
          }
        }
      });

      console.log('Submitting step:', JSON.stringify(currentStep, null, 2));

      const result = await FRAuth.next(currentStep);

      if (result.type === 'LoginSuccess') {
        onSuccess();
      } else if (result.type === 'LoginFailure') {
        setError('Invalid authentication code. Please try again.');
        setCode(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      } else {
        // Another step returned — update and try again
        setCurrentStep(result);
        setCode(['', '', '', '', '', '']);
        setError('Additional verification required.');
      }
    } catch (err) {
      console.error('TOTP Verification Error:', err);
      setError('Unable to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-lg login-card-shadow overflow-hidden border border-gray-100 w-full">
        <div className="p-8 border-b border-gray-100 bg-lloyds-green text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Smartphone size={24} />
            </div>
            <h2 className="text-xl font-bold">
              {isRegistrationStep ? 'Set Up Authenticator' : 'Secure Verification'}
            </h2>
          </div>
          <p className="text-sm opacity-90">
            {isRegistrationStep
              ? 'Scan the QR code with Google Authenticator to set up two-factor authentication.'
              : 'Enter the 6-digit code from your authenticator app to continue securely.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-6">

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-md">
              {error}
            </div>
          )}

          {isRegistrationStep ? (
            /* QR Code Registration View */
            <div className="space-y-6">
              <div className="flex justify-center">
                <QRCodeSVG
                  value={otpUri}
                  size={180}
                  className="w-full h-auto max-w-[180px]"
                />
              </div>

              <p className="text-xs text-gray-500 text-center">
                Can't scan? Use this secret key:
              </p>

              <div className="text-sm bg-gray-50 border rounded-lg px-4 py-3 text-center font-mono break-all">
                {otpUri.split('secret=')[1]?.split('&')[0]}
              </div>

              <div className="text-sm text-gray-600 leading-relaxed space-y-1">
                <p>1. Open <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong></p>
                <p>2. Tap <strong>+</strong> and scan the QR code above</p>
                <p>3. Click <strong>Continue</strong> below once scanned</p>
              </div>

              <button
                type="button"
                onClick={handleRegistrationContinue}
                disabled={isLoading}
                className="w-full h-12 bg-lloyds-green text-white font-bold rounded-md hover:bg-lloyds-dark transition-all flex items-center justify-center gap-2 disabled:bg-gray-300"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>I've Scanned the Code <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          ) : (
            /* TOTP Code Entry View */
            <>
              <p className="text-sm text-gray-600 text-center">
                Enter the 6-digit code from your authenticator app:
              </p>
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
            </>
          )}

          <div className="pt-6 border-t border-gray-100 flex items-start gap-3">
            <ShieldCheck size={18} className="text-lloyds-green shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              {isRegistrationStep
                ? 'Once set up, you will need your authenticator app every time you log in.'
                : 'If you no longer have access to your authenticator app, please contact your administrator.'}
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
};