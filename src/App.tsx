/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoginForm } from './components/LoginForm';
import { TwoFactorForm } from './components/TwoFactorForm';
import { Dashboard } from './components/dashboard/Dashboard';
import { motion } from 'motion/react';
import { Lock, CheckCircle2, AlertTriangle, Phone } from 'lucide-react';
import { forgerockService, initForgeRock } from './services/forgerock';
import { FRStep, TokenManager } from '@forgerock/javascript-sdk';

type AuthStage = 'loading' | 'login' | '2fa' | 'success' | 'dashboard' | 'expired' | 'unavailable';
type ExpiredReason = 'idle' | 'absolute' | null;

// ─────────────────────────────────────────────────────────────────────────────
// MODULE-LEVEL FLAGS — outside the component
// These survive React StrictMode double-mount and component re-renders
// ─────────────────────────────────────────────────────────────────────────────
let callbackHandled = false;
let tokenAcquisitionInProgress = false;

export default function App() {
  const [stage, setStage] = useState<AuthStage>('loading');
  const [userId, setUserId] = useState('');
  const [authStep, setAuthStep] = useState<FRStep | null>(null);
  const [expiredReason, setExpiredReason] = useState<ExpiredReason>(null);

  useEffect(() => {
    const checkSystem = async () => {
      initForgeRock();

      // ─── Handle OAuth2 callback ───────────────────────────────────────────
      if (window.location.pathname === '/callback') {
        // When the SDK uses getAuthCodeByIframe, it loads this page inside a
        // hidden iframe and reads the auth code directly from the iframe URL.
        // If we call getTokens() here we create nested iframes that prevent
        // the parent SDK from ever getting the code (causing the redirect loop).
        if (window !== window.top) {
          return;
        }

        if (callbackHandled) {
          console.log('Callback already handled, skipping');
          return;
        }
        callbackHandled = true;

        try {
          await TokenManager.getTokens({ login: 'redirect' } as any);

          const savedUserId = sessionStorage.getItem('cbo_user_id') ?? '';
          sessionStorage.removeItem('cbo_user_id');
          tokenAcquisitionInProgress = false;
          window.history.replaceState({}, '', '/dashboard');
          setUserId(savedUserId);
          setStage('dashboard');
        } catch (err) {
          console.error('Callback token exchange failed:', err);
          callbackHandled = false;
          tokenAcquisitionInProgress = false;
          sessionStorage.removeItem('cbo_user_id');
          window.history.replaceState({}, '', '/PrimaryAuth');
          setStage('login');
        }
        return;
      }

      // ─── Handle direct navigation to /dashboard ───────────────────────────
      if (window.location.pathname === '/dashboard') {
        // Read tokens directly from localStorage — no SDK call
        const stored = localStorage.getItem('FR-SDK-WebMerchantApp');
        if (stored) {
          try {
            const tokens = JSON.parse(stored);
            if (tokens?.accessToken) {
              const savedUserId = sessionStorage.getItem('cbo_user_id') ?? '';
              setUserId(savedUserId);
              setStage('dashboard');
              return;
            }
          } catch {
            // Invalid stored data
          }
        }
        window.history.replaceState({}, '', '/PrimaryAuth');
      }

      // ─── Normal startup ───────────────────────────────────────────────────
      const isOnline = await forgerockService.isSystemOnline();
      if (isOnline) {
        window.history.pushState({}, '', '/PrimaryAuth');
        setStage('login');
      } else {
        setStage('unavailable');
      }
    };
    checkSystem();
  }, []);

  const acquireTokens = async (id: string) => {
    callbackHandled = false;

    if (tokenAcquisitionInProgress) {
      console.warn('Token acquisition already in progress, skipping');
      return;
    }
    tokenAcquisitionInProgress = true;
    sessionStorage.setItem('cbo_user_id', id);

    try {
      await TokenManager.getTokens({ login: 'redirect' } as any);
      // Reaches here only when the SDK obtained tokens via its silent iframe
      // approach (getAuthCodeByIframe) — no page redirect occurred.
      const savedUserId = sessionStorage.getItem('cbo_user_id') ?? '';
      sessionStorage.removeItem('cbo_user_id');
      tokenAcquisitionInProgress = false;
      window.history.replaceState({}, '', '/dashboard');
      setUserId(savedUserId);
      setStage('dashboard');
    } catch (err) {
      console.warn('Token acquisition failed:', err);
      tokenAcquisitionInProgress = false;
      sessionStorage.removeItem('cbo_user_id');
      callbackHandled = false;
      setStage('login');
    }
  };

  const handleLoginSuccess = async (id: string, step?: FRStep) => {
    setUserId(id);
    if (step) {
      setAuthStep(step);
      setStage('2fa');
    } else {
      await acquireTokens(id);
    }
  };

  const handle2FASuccess = async () => {
    await acquireTokens(userId);
  };

  const handleAbsoluteTimeout = () => {
    forgerockService.logout();
    setExpiredReason('absolute');
    setStage('expired');
  };

  const handleIdleTimeout = () => {
    forgerockService.logout();
    setExpiredReason('idle');
    setStage('expired');
  };

  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lloyds-green/20 border-t-lloyds-green rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-medium">Connecting to Secure Services...</p>
        </div>
      </div>
    );
  }

  if (stage === 'unavailable') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-8">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Sorry, Commercial Banking Online is temporarily unavailable
          </h1>
          <p className="text-gray-600 mb-10 leading-relaxed text-lg">
            We're currently performing maintenance or experiencing technical difficulties.
            Please try again later or contact our telephony support team.
          </p>
          <div className="grid md:grid-cols-2 gap-6 w-full text-left mb-12">
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-4">
              <Phone className="text-lloyds-green shrink-0 mt-1" size={20} />
              <div>
                <p className="font-bold text-gray-800">0808 202 1390</p>
                <p className="text-sm text-gray-500">From UK locations</p>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-4">
              <Phone className="text-lloyds-green shrink-0 mt-1" size={20} />
              <div>
                <p className="font-bold text-gray-800">+44 1264 839 415</p>
                <p className="text-sm text-gray-500">From outside the UK</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-lloyds-green text-white font-bold rounded-lg hover:bg-lloyds-dark transition-colors"
          >
            Refresh Page
          </button>
        </main>
      </div>
    );
  }

  if (stage === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-xl shadow-xl max-w-sm w-full text-center border border-gray-100"
        >
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Expired</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {expiredReason === 'idle'
              ? 'Your session expired due to 10 minutes of inactivity. Please log in again to continue.'
              : 'Your 8-hour session has ended. Please log in again to continue.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-lloyds-green text-white font-bold rounded-lg hover:bg-lloyds-dark transition-colors"
          >
            Start New Session
          </button>
        </motion.div>
      </div>
    );
  }

  if (stage === 'dashboard') {
    return (
      <Dashboard
        userId={userId}
        onAbsoluteTimeout={handleAbsoluteTimeout}
        onIdleTimeout={handleIdleTimeout}
      />
    );
  }

  if (stage === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 bg-lloyds-gradient">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-12 rounded-2xl shadow-2xl max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-50 text-lloyds-green rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome Back</h2>
          <p className="text-gray-600 mb-8">
            You have successfully authenticated via Commercial Banking Online Secure.
          </p>
          <div className="bg-gray-50 p-4 rounded-xl mb-8 text-left border border-gray-100">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Authenticated User</p>
            <p className="text-lg font-bold text-gray-800">{userId}</p>
          </div>
          <button
            onClick={() => {
              window.history.pushState({}, '', '/dashboard');
              setStage('dashboard');
            }}
            className="w-full py-4 bg-lloyds-green text-white font-bold rounded-xl hover:bg-lloyds-dark transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Enter Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative overflow-hidden font-sans">
      
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-lloyds-green/5 blur-[120px] rounded-full -mr-24 -mt-24 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-lloyds-light/5 blur-[120px] rounded-full -ml-24 -mb-24 pointer-events-none" />

      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md mb-8 flex justify-between items-center">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-100">
            {stage === 'login' ? 'Authentication Step 1 of 2' : 'Security Check 2 of 2'}
          </div>
        </div>

        {stage === 'login' ? (
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        ) : (
          authStep && (
            <TwoFactorForm
              step={authStep}
              onSuccess={handle2FASuccess}
            />
          )
        )}
      </main>

      <footer className="w-full py-6 px-12 border-t border-gray-200 bg-white text-gray-500 text-xs flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-4">
          <a href="#" className="hover:text-lloyds-green transition-colors">Privacy</a>
          <a href="#" className="hover:text-lloyds-green transition-colors">Legal</a>
          <a href="#" className="hover:text-lloyds-green transition-colors">Security</a>
        </div>
        <div className="text-center md:text-right">
          © {new Date().getFullYear()} Lloyds Bank plc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}