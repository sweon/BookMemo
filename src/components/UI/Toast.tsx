import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeInOut = keyframes`
  0% { opacity: 0; transform: translate(-50%, 20px); }
  15% { opacity: 1; transform: translate(-50%, 0); }
  85% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -20px); }
`;

const ToastContainer = styled.div<{ $variant?: 'default' | 'warning' | 'danger' }>`
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ $variant, theme }) =>
    $variant === 'warning' ? 'rgba(245, 158, 11, 0.95)' :
      $variant === 'danger' ? 'rgba(239, 68, 68, 0.95)' :
        'rgba(0, 0, 0, 0.85)'};
  color: white;
  padding: 14px 28px;
  border-radius: 30px;
  font-size: 0.95rem;
  font-weight: 500;
  z-index: 10000;
  pointer-events: none;
  white-space: nowrap;
  animation: ${fadeInOut} 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2), 
              0 0 20px ${({ $variant }) => $variant === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'transparent'};
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 10px;
`;

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  variant?: 'default' | 'warning' | 'danger';
  icon?: React.ReactNode;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 2500, variant = 'default', icon }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <ToastContainer $variant={variant}>
      {icon}
      {message}
    </ToastContainer>
  );
};
