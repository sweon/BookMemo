import React, { useState } from 'react';
import styled from 'styled-components';
import { Sidebar } from '../Sidebar/Sidebar';
import { Outlet } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';

const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

const SidebarWrapper = styled.div<{ $isOpen: boolean }>`
  width: 300px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;

  @media (max-width: 768px) {
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

export const MainLayout: React.FC = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <Container>
            <Overlay $isOpen={isSidebarOpen} onClick={() => setSidebarOpen(false)} />
            <SidebarWrapper $isOpen={isSidebarOpen}>
                <Sidebar onCloseMobile={() => setSidebarOpen(false)} />
            </SidebarWrapper>
            <ContentWrapper>
                <MobileHeader>
                    <FiMenu size={24} onClick={() => setSidebarOpen(true)} />
                    <h3>LLM Logger</h3>
                </MobileHeader>
                <Outlet />
            </ContentWrapper>
        </Container>
    );
};
