import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { SyncService, type SyncStatus } from '../../services/SyncService';
import { FaTimes, FaSync } from 'react-icons/fa';

interface SyncModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContainer = styled.div`
    background-color: var(--bg-secondary);
    padding: 24px;
    border-radius: 12px;
    width: 450px;
    max-width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    color: var(--text-primary);
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
        margin: 0;
        font-size: 1.5rem;
        display: flex;
        align-items: center;
        gap: 10px;
    }
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 1.2rem;
    
    &:hover {
        color: var(--text-primary);
    }
`;

const Section = styled.div`
    margin-bottom: 24px;
`;

const Label = styled.label`
    display: block;
    margin-bottom: 8px;
    color: var(--text-secondary);
    font-size: 0.9rem;
`;

const InputGroup = styled.div`
    display: flex;
    gap: 10px;
`;

const Input = styled.input`
    flex: 1;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: 1rem;

    &:focus {
        outline: none;
        border-color: var(--primary-color);
    }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
    padding: 10px 16px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
    background-color: ${props => props.$variant === 'secondary' ? 'var(--bg-tertiary)' : 'var(--primary-color)'};
    color: ${props => props.$variant === 'secondary' ? 'var(--text-primary)' : '#fff'};

    &:hover {
        opacity: 0.9;
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const StatusBox = styled.div<{ $status: SyncStatus }>`
    padding: 12px;
    border-radius: 6px;
    background-color: var(--bg-tertiary);
    margin-top: 20px;
    text-align: center;
    font-size: 0.9rem;
    color: ${props => {
        if (props.$status === 'error') return '#ff6b6b';
        if (props.$status === 'completed') return '#51cf66';
        if (props.$status === 'connected') return '#339af0';
        return 'var(--text-secondary)';
    }};
    border: 1px solid ${props => {
        if (props.$status === 'error') return '#ff6b6b40';
        if (props.$status === 'completed') return '#51cf6640';
        if (props.$status === 'connected') return '#339af040';
        return 'transparent';
    }};
`;

const Divider = styled.div`
    height: 1px;
    background-color: var(--border-color);
    margin: 20px 0;
    position: relative;
    
    span {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: var(--bg-secondary);
        padding: 0 10px;
        color: var(--text-secondary);
        font-size: 0.8rem;
    }
`;

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
    const [roomId, setRoomId] = useState('');
    const [targetRoomId, setTargetRoomId] = useState('');
    const [status, setStatus] = useState<SyncStatus>('disconnected');
    const [statusMessage, setStatusMessage] = useState('');

    const syncService = useRef<SyncService | null>(null);

    useEffect(() => {
        if (!isOpen) {
            // Cleanup on close? Maybe keep connection? 
            // For now, let's cleanup to avoid zombie connections
            if (syncService.current) {
                syncService.current.destroy();
                syncService.current = null;
            }
            setStatus('disconnected');
            setStatusMessage('');
        }
    }, [isOpen]);

    const handleStatusChange = (newStatus: SyncStatus, msg?: string) => {
        setStatus(newStatus);
        if (msg) setStatusMessage(msg);
    };

    const getService = () => {
        if (!syncService.current) {
            syncService.current = new SyncService({
                onStatusChange: handleStatusChange,
                onDataReceived: () => {
                    // Refresh data? App might need context update.
                    // Ideally, we trigger a reload or context refresh.
                    // For now, user can just close modal and navigate.
                    window.location.reload(); // Brute force refresh for now to ensure DB updates are seen
                }
            });
        }
        return syncService.current;
    };

    const startHosting = async () => {
        if (!roomId.trim()) return;
        try {
            const svc = getService();
            await svc.initialize(roomId);
        } catch (e) {
            console.error(e);
        }
    };

    const connectToPeer = () => {
        if (!targetRoomId.trim()) return;
        const svc = getService();
        svc.connect(targetRoomId);
    };

    if (!isOpen) return null;

    return (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={e => e.stopPropagation()}>
                <Header>
                    <h2><FaSync /> Sync Data</h2>
                    <CloseButton onClick={onClose}><FaTimes /></CloseButton>
                </Header>

                <Section>
                    <Label>Your Room ID (Share this to let others join)</Label>
                    <InputGroup>
                        <Input
                            placeholder="e.g. my-secret-room"
                            value={roomId}
                            onChange={e => setRoomId(e.target.value)}
                        />
                        <Button onClick={startHosting} disabled={status === 'connected' || status === 'syncing'}>
                            Start Hosting
                        </Button>
                    </InputGroup>
                </Section>

                <Divider><span>OR</span></Divider>

                <Section>
                    <Label>Target Room ID (Enter ID to join)</Label>
                    <InputGroup>
                        <Input
                            placeholder="Enter Room ID to join"
                            value={targetRoomId}
                            onChange={e => setTargetRoomId(e.target.value)}
                        />
                        <Button onClick={connectToPeer} disabled={status === 'connected' || status === 'syncing'}>
                            Connect
                        </Button>
                    </InputGroup>
                </Section>

                {statusMessage && (
                    <StatusBox $status={status}>
                        {statusMessage}
                    </StatusBox>
                )}
            </ModalContainer>
        </Overlay>
    );
};
