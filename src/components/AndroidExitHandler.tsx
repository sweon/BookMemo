import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Toast } from './UI/Toast';
import { FiAlertTriangle } from 'react-icons/fi';

export const AndroidExitHandler: React.FC = () => {
    const location = useLocation();
    const [showExitToast, setShowExitToast] = useState(false);
    const lastPressTime = useRef<number>(0);

    const isAtRoot = location.pathname === '/' || location.pathname === '';

    useEffect(() => {
        // Function to ensure we have an interceptor state at the root
        const ensureDummyState = () => {
            if (isAtRoot && (!window.history.state || !window.history.state.noExit)) {
                window.history.pushState({ noExit: true }, '');
            }
        };

        ensureDummyState();

        const handlePopState = (event: PopStateEvent) => {
            if (isAtRoot) {
                // If the state we popped TO does not have our flag, it means we intercepted a "back" 
                // that tried to leave the root.
                if (!event.state || !event.state.noExit) {
                    const now = Date.now();
                    const timeDiff = now - lastPressTime.current;

                    if (timeDiff < 2000) {
                        // Real exit: go back once more to skip our initial entry
                        window.history.back();
                    } else {
                        // First press: warn, show toast, and re-push the dummy
                        lastPressTime.current = now;
                        setShowExitToast(true);
                        window.history.pushState({ noExit: true }, '');
                    }
                }
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
            position="left-centered"
            icon={<FiAlertTriangle size={14} />}
            message={"뒤로 가기 버튼을\n한 번 더 누르면 종료됩니다."}
            onClose={() => setShowExitToast(false)}
        />
    );
};
