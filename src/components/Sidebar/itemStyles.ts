import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const LogItemLink = styled(Link) <{ $isActive: boolean; $inThread?: boolean; $isThreadStart?: boolean; $isThreadEnd?: boolean }>`
  display: block;
  padding: 0.5rem 0.75rem;
  padding-left: ${({ $inThread }) => ($inThread ? '1.5rem' : '0.75rem')};
  border-radius: 6px;
  margin-bottom: 0.125rem;
  text-decoration: none;
  background: ${({ $isActive, theme }) => ($isActive ? theme.colors.border : 'transparent')};
  color: ${({ theme }) => theme.colors.text};
  position: relative;
  
  /* Connector for child logs */
  ${({ $inThread, theme }) => $inThread && `
    &::before {
      content: '';
      position: absolute;
      left: 0.75rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background-color: ${theme.colors.border};
    }
  `}

  &:hover {
    background: ${({ theme, $isActive }) => ($isActive ? theme.colors.border : theme.colors.surface)};
    text-decoration: none;
  }
`;

export const LogTitle = styled.div`
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.95rem;
`;

export const LogDate = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 0.1rem;
`;

export const ThreadContainer = styled.div`
    border-left: 2px solid ${({ theme }) => theme.colors.border};
    margin-left: 0.75rem;
    padding-left: 0.5rem;
    margin-bottom: 0.5rem;
`;

export const ThreadHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.85rem;
    font-weight: 500;
    
    &:hover {
        color: ${({ theme }) => theme.colors.text};
    }
`;

export const ThreadToggleBtn = styled.button`
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem 0.25rem 0.25rem;
    margin-left: 0.5rem;
    margin-top: -0.25rem;
    margin-bottom: 0.25rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.8rem;
    border-radius: 4px;
    
    &:hover {
        color: ${({ theme }) => theme.colors.text};
        background: ${({ theme }) => theme.colors.surface};
    }
`;
