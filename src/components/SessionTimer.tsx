import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface SessionTimerProps {
  initialMinutes: number;
  onTimeout: () => void;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ initialMinutes, onTimeout }) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeout]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isLow = timeLeft < 60;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      isLow ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-gray-600 border border-gray-100'
    }`}>
      <Clock size={14} className={isLow ? 'animate-pulse' : ''} />
      <span>Session timeout: </span>
      <span className="font-bold tabular-nums">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
      {isLow && <AlertCircle size={12} />}
    </div>
  );
};
