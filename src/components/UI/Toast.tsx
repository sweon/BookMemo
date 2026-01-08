import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeInOut = keyframes`
  0% { opacity: 0; transform: translate(-50%, 30px) scale(0.9); }
  10% { opacity: 1; transform: translate(-50%, 0) scale(1.05); }
  15% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  85% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -20px) scale(0.9); }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0px rgba(245, 158, 11, 0); }
  50% { transform: scale(1.02); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2), 0 0 15px rgba(245, 158, 11, 0.4); }
  100% { transform: scale(1); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0px rgba(245, 158, 11, 0); }
`;

const ToastContainer = styled.div<{ $variant?: 'default' | 'warning' | 'danger'; $position?: 'bottom' | 'centered' | 'left-centered' }>`
  position: fixed;
  ${({ $position }) => {
    if ($position === 'centered') return `top: 50%; left: 50%; transform: translate(-50%, -50%);`;
    if ($position === 'left-centered') return `top: 50%; left: 16px; transform: translateY(-50%);`;
    return `bottom: 100px; left: 50%; transform: translateX(-50%);`;
  }}
  
  background: ${({ $variant }) =>
    $variant === 'warning' ? '#f59e0b' :
      $variant === 'danger' ? '#ef4444' :
        'rgba(0, 0, 0, 0.9)'};
  color: white;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 10000;
  pointer-events: none;
  text-align: center;
  white-space: pre-line;
  max-width: 80vw;
  animation: ${fadeInOut} 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards,
             ${({ $variant }) => $variant === 'warning' ? pulse : 'none'} 1.5s ease-in-out infinite;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 6px;
`;

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  variant?: 'default' | 'warning' | 'danger';
  icon?: React.ReactNode;
  position?: 'bottom' | 'centered' | 'left-centered';
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 2500, variant = 'default', icon, position = 'bottom' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <ToastContainer $variant={variant} $position={position}>
      {icon}
      {message}
    </ToastContainer>
  );
};
