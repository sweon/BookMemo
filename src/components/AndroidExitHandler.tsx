import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Toast } from './UI/Toast';

export const AndroidExitHandler: React.FC = () => {
    const location = useLocation();
    const [showExitToast, setShowExitToast] = useState(false);
    const lastPressTime = useRef<number>(0);

    const isAtRoot = location.pathname === '/' || location.pathname === '';

    useEffect(() => {
        // Only run logic on Android/Touch devices for better behavior
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouchDevice) return;

        if (!isAtRoot) return;

        // Push a state so we can intercept the next back button
        // We use a specific state object to identify our dummy state
        window.history.pushState({ noExit: true }, '');

        const handlePopState = () => {
            // If the state we are popping to is NOT our dummy state, 
            // it means we just intercepted a back button.
            const now = Date.now();
            const timeDiff = now - lastPressTime.current;

            if (timeDiff < 2000) {
                // Second press: we allow the exit by not pushing state again
                // and calling back once more if needed, or just let it be.
                // To truly "exit", we go back one more time to skip the root entry
                window.history.back();
            } else {
                // First press: prevent exit and show warning
                lastPressTime.current = now;
                setShowExitToast(true);

                // Re-push the state to stay on the page and keep intercepting
                window.history.pushState({ noExit: true }, '');
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            // Clean up the dummy state if we navigate away from root
            // (though popstate handler usually handles this by being removed)
        };
    }, [isAtRoot]);

    if (!showExitToast) return null;

    return (
        <Toast
            message="뒤로 가기 버튼을 한 번 더 누르면 종료됩니다."
            onClose={() => setShowExitToast(false)}
        />
    );
};
