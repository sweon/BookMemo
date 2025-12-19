import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { SyncService, type SyncStatus } from '../../services/SyncService';
import { FaTimes, FaSync, FaRegCopy, FaRedo } from 'react-icons/fa';

const generateShortId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

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
    background-color: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContainer = styled.div`
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 450px;
    max-width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    color: var(--text-primary);
    overflow: hidden;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);

    h2 {
        margin: 0;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        gap: 10px;
    }
`;

const TabContainer = styled.div`
    display: flex;
    background-color: var(--bg-tertiary);
    border-bottom: 1px solid var(--border-color);
`;

const Tab = styled.button<{ $active: boolean }>`
    flex: 1;
    padding: 16px;
    background: ${props => props.$active ? 'var(--bg-secondary)' : 'transparent'};
    border: none;
    border-right: 1px solid var(--border-color);
    border-bottom: 2px solid ${props => props.$active ? 'var(--primary-color)' : 'transparent'};
    color: ${props => props.$active ? 'var(--primary-color)' : 'var(--text-secondary)'};
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:last-child {
        border-right: none;
    }

    &:hover {
        background: var(--bg-secondary);
        color: ${props => props.$active ? 'var(--primary-color)' : 'var(--text-primary)'};
    }
`;

const Content = styled.div`
    padding: 24px;
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

const Label = styled.label`
    display: block;
    margin-bottom: 8px;
    color: var(--text-secondary);
    font-size: 0.9rem;
`;

const InputGroup = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
`;

const Input = styled.input`
    flex: 1;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: 1rem;
    font-family: monospace;

    &:focus {
        outline: none;
        border-color: var(--primary-color);
    }
    
    &:disabled {
        background-color: var(--bg-tertiary);
        color: var(--text-secondary);
    }
`;

const IconButton = styled.button`
    padding: 12px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
        background-color: var(--bg-tertiary);
        color: var(--text-primary);
        border-color: var(--text-secondary);
    }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary'; $fullWidth?: boolean }>`
    padding: 12px 16px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
    background-color: ${props => props.$variant === 'secondary' ? 'var(--bg-tertiary)' : 'var(--primary-color)'};
    color: ${props => props.$variant === 'secondary' ? 'var(--text-primary)' : '#fff'};
    width: ${props => props.$fullWidth ? '100%' : 'auto'};

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


export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'host' | 'join'>('host');
    const [roomId, setRoomId] = useState('');
    const [targetRoomId, setTargetRoomId] = useState('');
    const [status, setStatus] = useState<SyncStatus>('disconnected');
    const [statusMessage, setStatusMessage] = useState('');

    const syncService = useRef<SyncService | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Auto generate ID if empty
            if (!roomId) {
                setRoomId(generateShortId());
            }
        } else {
            // Cleanup
            if (syncService.current) {
                syncService.current.destroy();
                syncService.current = null;
            }
            setStatus('disconnected');
            setStatusMessage('');
        }
    }, [isOpen, roomId]);

    const handleStatusChange = (newStatus: SyncStatus, msg?: string) => {
        setStatus(newStatus);
        if (msg) setStatusMessage(msg);
    };

    const getService = () => {
        if (!syncService.current) {
            syncService.current = new SyncService({
                onStatusChange: handleStatusChange,
                onDataReceived: () => {
                    window.location.reload();
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

    const copyToClipboard = () => {
        navigator.clipboard.writeText(roomId);
        // Could show toast
    };

    const regenerateId = () => {
        if (status !== 'disconnected' && status !== 'error' && status !== 'completed') return;
        setRoomId(generateShortId());
    };

    if (!isOpen) return null;

    return (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={e => e.stopPropagation()}>
                <Header>
                    <h2><FaSync /> Sync Data</h2>
                    <CloseButton onClick={onClose}><FaTimes /></CloseButton>
                </Header>

                <TabContainer>
                    <Tab
                        $active={activeTab === 'host'}
                        onClick={() => setActiveTab('host')}
                        disabled={status === 'connected' || status === 'syncing'}
                    >
                        Host Session
                    </Tab>
                    <Tab
                        $active={activeTab === 'join'}
                        onClick={() => setActiveTab('join')}
                        disabled={status === 'connected' || status === 'syncing'}
                    >
                        Join Session
                    </Tab>
                </TabContainer>

                <Content>
                    {activeTab === 'host' ? (
                        <>
                            <Label>Your Room ID</Label>
                            <InputGroup>
                                <Input
                                    value={roomId}
                                    onChange={e => setRoomId(e.target.value)}
                                    disabled={status === 'connected'}
                                    placeholder="Enter your custom ID"
                                />
                                <IconButton onClick={copyToClipboard} title="Copy ID">
                                    <FaRegCopy />
                                </IconButton>
                                <IconButton onClick={regenerateId} disabled={status === 'connected'} title="Regenerate ID">
                                    <FaRedo />
                                </IconButton>
                            </InputGroup>
                            <Button
                                $fullWidth
                                onClick={startHosting}
                                disabled={status === 'connected' || status === 'syncing'}
                            >
                                {status === 'connected' ? 'Hosting...' : 'Start Hosting'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Label>Target Room ID</Label>
                            <InputGroup>
                                <Input
                                    placeholder="Paste Room ID here"
                                    value={targetRoomId}
                                    onChange={e => setTargetRoomId(e.target.value)}
                                    disabled={status === 'connected'}
                                />
                            </InputGroup>
                            <Button
                                $fullWidth
                                onClick={connectToPeer}
                                disabled={!targetRoomId || status === 'connected' || status === 'syncing'}
                            >
                                {status === 'connected' ? 'Connected' : 'Connect'}
                            </Button>
                        </>
                    )}

                    {statusMessage && (
                        <StatusBox $status={status}>
                            {statusMessage}
                        </StatusBox>
                    )}
                </Content>
            </ModalContainer>
        </Overlay>
    );
};
