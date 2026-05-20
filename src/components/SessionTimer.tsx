import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SessionTimerProps {
    absoluteMinutes?: number;    // 8 hours = 480 minutes
    idleMinutes?: number;        // 10 minutes
    onAbsoluteTimeout: () => void;   // Called after 8 hours
    onIdleTimeout: () => void;       // Called after 10 mins idle
}

export const SessionTimer: React.FC<SessionTimerProps> = ({
    absoluteMinutes = 480,   // 8 hours default
    idleMinutes = 10,        // 10 minutes default
    onAbsoluteTimeout,
    onIdleTimeout,
}) => {
    const [idleTimeLeft, setIdleTimeLeft] = useState(idleMinutes * 60);
    const [absoluteTimeLeft, setAbsoluteTimeLeft] = useState(absoluteMinutes * 60);
    const idleTimerRef = useRef<NodeJS.Timeout>();

    // Reset idle timer on user activity
    const resetIdleTimer = useCallback(() => {
        setIdleTimeLeft(idleMinutes * 60);
    }, [idleMinutes]);

    // Listen for user activity — resets idle timer only
    useEffect(() => {
        const events = [
            'mousedown', 
            'mousemove', 
            'keypress', 
            'scroll', 
            'touchstart', 
            'click'
        ];

        events.forEach(event => {
            window.addEventListener(event, resetIdleTimer, { passive: true });
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetIdleTimer);
            });
        };
    }, [resetIdleTimer]);

    // Idle countdown — resets on activity
    useEffect(() => {
        if (idleTimeLeft <= 0) {
            onIdleTimeout();
            return;
        }

        idleTimerRef.current = setInterval(() => {
            setIdleTimeLeft(prev => prev - 1);
        }, 1000);

        return () => {
            if (idleTimerRef.current) {
                clearInterval(idleTimerRef.current);
            }
        };
    }, [idleTimeLeft, onIdleTimeout]);

    // Absolute countdown — never resets
    useEffect(() => {
        if (absoluteTimeLeft <= 0) {
            onAbsoluteTimeout();
            return;
        }

        const timer = setInterval(() => {
            setAbsoluteTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [absoluteTimeLeft, onAbsoluteTimeout]);

    // Format time display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Only show warning when idle timer is low
    const showIdleWarning = idleTimeLeft <= 60; // Last minute

    return (
        <div className="flex flex-col items-end gap-1">
            {showIdleWarning && (
                <div className="text-xs text-amber-600 font-semibold animate-pulse">
                    Inactive: {formatTime(idleTimeLeft)}
                </div>
            )}
            <div className="text-xs text-gray-400">
                Session: {formatTime(absoluteTimeLeft)}
            </div>
        </div>
    );
};