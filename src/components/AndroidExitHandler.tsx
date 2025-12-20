import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Toast } from './UI/Toast';

export const AndroidExitHandler: React.FC = () => {
    const location = useLocation();
    const [showToast, setShowToast] = useState(false);
    const lastPressTime = useRef<number>(0);
    const isAtRoot = location.pathname === '/' || location.pathname === '';

    useEffect(() => {
        // We only care about the back button at the root of the app
        if (!isAtRoot) return;

        // Push a dummy state to history so we can intercept the next back button
        window.history.pushState({ noExit: true }, '');

        const handlePopState = (_event: PopStateEvent) => {
            const now = Date.now();
            const timeDiff = now - lastPressTime.current;

            if (timeDiff < 2000) {
                // Secondary press: allow exit
                // Note: We can't actually close the browser/PWA window from JS in most cases
                // but we can let the history pop happen. 
                // To actually "exit" an installed PWA on Android, we just stop preventing default.
                console.log('Exiting app...');
            } else {
                // First press: prevent exit and show warning
                lastPressTime.current = now;
                setShowToast(true);

                // Re-push the dummy state to keep the user on the current page
                window.history.pushState({ noExit: true }, '');
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isAtRoot]);

    if (!showToast) return null;

    return (
        <Toast
            message="뒤로 가기 버튼을 한 번 더 누르면 종료됩니다."
            onClose={() => setShowToast(false)}
        />
    );
};
