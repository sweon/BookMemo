import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Toast } from './UI/Toast';
import { FiAlertTriangle } from 'react-icons/fi';

export const AndroidExitHandler: React.FC = () => {
    const location = useLocation();
    const [showExitToast, setShowExitToast] = useState(false);
    const lastPressTime = useRef<number>(0);

    // In HashRouter, the empty root is often exactly '/' or empty
    const isAtRoot = location.pathname === '/' || location.pathname === '';

    useEffect(() => {
        // Intercept back button at root
        if (!isAtRoot) return;

        // Push a dummy state so we can catch the popstate event
        window.history.pushState({ noExit: true }, '');

        const handlePopState = () => {
            const now = Date.now();
            const timeDiff = now - lastPressTime.current;

            if (timeDiff < 2000) {
                // Exit: allow browser history back (skips our dummy)
                window.history.back();
            } else {
                // First press: warn
                lastPressTime.current = now;
                setShowExitToast(true);
                // Keep intercepting
                window.history.pushState({ noExit: true }, '');
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isAtRoot]);

    if (!showExitToast) return null;

    return (
        <Toast
            variant="warning"
            icon={<FiAlertTriangle size={20} />}
            message="뒤로 가기 버튼을 한 번 더 누르면 종료됩니다."
            onClose={() => setShowExitToast(false)}
        />
    );
};
