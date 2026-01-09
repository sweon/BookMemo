import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Sidebar } from '../Sidebar/Sidebar';
import { Outlet } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';

const Container = styled.div<{ $isResizing: boolean }>`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  ${({ $isResizing }) => $isResizing && `
    cursor: col-resize;
    user-select: none;
    -webkit-user-select: none;
  `}
`;

const SidebarWrapper = styled.div<{ $isOpen: boolean; $width: number }>`
  width: ${({ $width }) => $width}px;
  min-width: ${({ $width }) => $width}px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, width 0.1s ease;
  position: relative;

  @media (max-width: 768px) {
    /* Use dynamic width on mobile too */
    width: ${({ $width }) => $width}px !important;
    min-width: ${({ $width }) => $width}px !important;
    max-width: 90vw;
    position: absolute;
    z-index: 10;
    height: 100%;
    transform: translateX(${({ $isOpen }) => ($isOpen ? '0' : '-100%')});
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
`;

const ResizeHandle = styled.div<{ $isResizing: boolean; $isVisible: boolean }>`
  width: 4px;
  cursor: col-resize;
  background: ${({ $isResizing, theme }) => $isResizing ? theme.colors.primary : 'transparent'};
  transition: background 0.2s;
  z-index: 15;
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  touch-action: none;
  display: ${({ $isVisible }) => ($isVisible ? 'block' : 'none')};

  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -10px;
    right: -10px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    opacity: 0.5;
  }

  @media (max-width: 768px) {
    z-index: 20;
  }
`;

const MobileHeader = styled.div`
  display: none;
  padding: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  display: none;
  @media (max-width: 768px) {
    display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 5;
  }
`;

const STORAGE_KEY = 'bookmemo-sidebar-width';
const DEFAULT_WIDTH = 300;
const MIN_WIDTH_DESKTOP = 340;
const MAX_WIDTH_DESKTOP = 600;
const MIN_WIDTH_MOBILE = 200;
const MAX_WIDTH_MOBILE = Math.min(400, window.innerWidth * 0.9);

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(() => /Android/i.test(navigator.userAgent));
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
    return Math.max(MIN_WIDTH_MOBILE, parsed);
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<any>(null);

  // Track mobile state
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startResizing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      // Long press logic for touch
      longPressTimer.current = setTimeout(() => {
        setIsResizing(true);
        if (navigator.vibrate) navigator.vibrate(50);
      }, 500);
    } else {
      e.preventDefault();
      setIsResizing(true);
    }
  }, []);

  const stopResizing = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsResizing(false);
    localStorage.setItem(STORAGE_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      const minW = isMobile ? MIN_WIDTH_MOBILE : MIN_WIDTH_DESKTOP;
      const maxW = isMobile ? Math.min(MAX_WIDTH_MOBILE, window.innerWidth * 0.9) : MAX_WIDTH_DESKTOP;
      if (newWidth >= minW && newWidth <= maxW) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing, isMobile]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isResizing) {
      e.preventDefault(); // Prevent scrolling while resizing
      const newWidth = e.touches[0].clientX;
      const minW = isMobile ? MIN_WIDTH_MOBILE : MIN_WIDTH_DESKTOP;
      const maxW = isMobile ? Math.min(MAX_WIDTH_MOBILE, window.innerWidth * 0.9) : MAX_WIDTH_DESKTOP;
      if (newWidth >= minW && newWidth <= maxW) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing, isMobile]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopResizing);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', stopResizing);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopResizing);
    };
  }, [isResizing, handleMouseMove, handleTouchMove, stopResizing]);

  // Resize handle is visible:
  // - Desktop: always visible
  // - Mobile: only when sidebar is open
  const isResizeHandleVisible = !isMobile || isSidebarOpen;

  return (
    <Container ref={containerRef} $isResizing={isResizing}>
      <Overlay $isOpen={isSidebarOpen} onClick={() => setSidebarOpen(false)} />
      <SidebarWrapper $isOpen={isSidebarOpen} $width={sidebarWidth}>
        <Sidebar onCloseMobile={() => setSidebarOpen(false)} />
        <ResizeHandle
          $isResizing={isResizing}
          $isVisible={isResizeHandleVisible}
          onMouseDown={startResizing}
          onTouchStart={startResizing}
          onTouchEnd={stopResizing}
        />
      </SidebarWrapper>
      <ContentWrapper>
        <MobileHeader>
          {!isSidebarOpen && <FiMenu size={24} onClick={() => setSidebarOpen(true)} />}
          <h3>BookMemo</h3>
        </MobileHeader>
        <Outlet />
      </ContentWrapper>
    </Container>
  );
};
