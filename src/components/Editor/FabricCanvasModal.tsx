import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import styled from 'styled-components';
import { fabric } from 'fabric';
import { FiX, FiCheck, FiTrash2, FiEdit2, FiRotateCcw, FiSquare, FiCircle, FiMinus, FiType } from 'react-icons/fi';
import { useLanguage } from '../../contexts/LanguageContext';

// Pixel Eraser Icon - looks like a classic eraser
const PixelEraserIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13L11 20H4L2 18C1.4 17.4 1.4 16.6 2 16L14 4L20 10L18 13Z" />
        <path d="M14 4L20 10" strokeWidth="2.5" />
        <rect x="2" y="20" width="20" height="2" fill="currentColor" stroke="none" rx="1" />
    </svg>
);

// Object Eraser Icon - eraser with target/pointer indicator
const ObjectEraserIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13L11 20H4L2 18C1.4 17.4 1.4 16.6 2 16L14 4L20 10L18 13Z" />
        <path d="M14 4L20 10" strokeWidth="2.5" />
        <circle cx="19" cy="5" r="4" fill="#f03e3e" stroke="#f03e3e" strokeWidth="1" />
        <path d="M19 3V7M17 5H21" stroke="white" strokeWidth="1.5" />
    </svg>
);

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  touch-action: none;
`;

const ModalContainer = styled.div`
  width: 95vw;
  height: 90vh;
  max-width: 1280px;
  max-height: 1000px;
  background: #ffffff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
`;

const Header = styled.div`
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  color: #333;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f1f3f5;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
  overflow-x: auto;
  
  /* Hide scrollbar for clean look */
  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }
`;

const ToolButton = styled.button<{ $active?: boolean }>`
  background: ${({ $active }) => $active ? '#e9ecef' : 'transparent'};
  border: 1px solid ${({ $active }) => $active ? '#adb5bd' : 'transparent'};
  color: #333;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  min-width: 40px;
  
  &:hover {
    background: #e9ecef;
  }
`;

const ToolGroup = styled.div`
  display: flex;
  gap: 2px;
  padding-right: 8px;
  border-right: 1px solid #dee2e6;
  margin-right: 8px;

  &:last-child {
      border: none;
  }
`;

const ColorButton = styled.div<{ $color: string; $selected?: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  border: 2px solid ${({ $selected }) => $selected ? '#333' : 'transparent'};
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
  &:hover {
    transform: scale(1.1);
  }
`;

const CanvasWrapper = styled.div`
  flex: 1;
  width: 100%;
  height: 100%;
  background: #ffffff;
  overflow: hidden; /* Important for preventing scroll during drag */
  position: relative;
  touch-action: none; 
`;

const FooterButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  background: ${({ $primary }) => ($primary ? '#333' : 'transparent')};
  color: ${({ $primary }) => ($primary ? 'white' : '#333')};
  border: 1px solid ${({ $primary }) => ($primary ? '#333' : '#ced4da')};

  &:hover {
    opacity: 0.9;
  }
`;

interface FabricCanvasModalProps {
    initialData?: string;
    onSave: (data: string) => void;
    onClose: () => void;
}

const COLORS = ['#000000', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#9c36b5'];
const BRUSH_SIZES = [2, 4, 8, 16];

type ToolType = 'pen' | 'eraser_pixel' | 'eraser_object' | 'line' | 'rect' | 'circle' | 'text';

export const FabricCanvasModal: React.FC<FabricCanvasModalProps> = ({ initialData, onSave, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const { t } = useLanguage();

    const [activeTool, setActiveTool] = useState<ToolType>('pen');
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(2);

    // Shape drawing refs
    const isDrawingRef = useRef(false);
    const startPointRef = useRef<{ x: number, y: number } | null>(null);
    const activeShapeRef = useRef<fabric.Object | null>(null);

    useLayoutEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        // Cleanup
        if (fabricCanvasRef.current) {
            fabricCanvasRef.current.dispose();
        }

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width,
            height,
            backgroundColor: '#ffffff',
            isDrawingMode: true, // Default to true as Pen is default
            selection: false, // Disable group selection by default for better drawing UX
        });

        // Set initial brush
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = brushSize;
        canvas.freeDrawingBrush.color = color;

        fabricCanvasRef.current = canvas;

        if (initialData) {
            try {
                const json = JSON.parse(initialData);
                canvas.loadFromJSON(json, () => {
                    canvas.renderAll();
                });
            } catch (e) {
                console.error("Failed to load fabric JSON", e);
            }
        }

        return () => {
            canvas.dispose();
            fabricCanvasRef.current = null;
        };
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const key = e.key.toLowerCase();

            // Tool shortcuts
            switch (key) {
                case 'p': // Pen
                case 'b': // Brush (alternative)
                    setActiveTool('pen');
                    break;
                case 'l': // Line
                    setActiveTool('line');
                    break;
                case 'r': // Rectangle
                    setActiveTool('rect');
                    break;
                case 'c': // Circle
                    setActiveTool('circle');
                    break;
                case 't': // Text
                    setActiveTool('text');
                    break;
                case 'e': // Eraser (pixel)
                    setActiveTool('eraser_pixel');
                    break;
                case 'd': // Delete eraser (object)
                case 'x': // Alternative for object eraser
                    setActiveTool('eraser_object');
                    break;
                case 'z': // Undo
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleUndo();
                    }
                    break;
                case 'escape': // Close modal
                    onClose();
                    break;
                case 'enter': // Save
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleSave();
                    }
                    break;
                case 'delete':
                case 'backspace':
                    // Delete selected object if any (for object eraser mode)
                    const canvas = fabricCanvasRef.current;
                    if (canvas) {
                        const active = canvas.getActiveObject();
                        if (active) {
                            canvas.remove(active);
                            canvas.requestRenderAll();
                        }
                    }
                    break;
                // Brush size shortcuts (1-4)
                case '1':
                    setBrushSize(BRUSH_SIZES[0]);
                    break;
                case '2':
                    setBrushSize(BRUSH_SIZES[1]);
                    break;
                case '3':
                    setBrushSize(BRUSH_SIZES[2]);
                    break;
                case '4':
                    setBrushSize(BRUSH_SIZES[3]);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Tool Switching Logic
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Reset behaviors
        canvas.isDrawingMode = false;
        canvas.selection = false;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'default';

        // Remove object erasing listener if present (we'll re-add if needed)
        canvas.off('mouse:down');
        canvas.off('mouse:move');
        canvas.off('mouse:up');

        // Re-attach standard listeners if needed (none strictly for now unless shape)

        switch (activeTool) {
            case 'pen':
                canvas.isDrawingMode = true;
                canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                canvas.freeDrawingBrush.color = color;
                canvas.freeDrawingBrush.width = brushSize;
                canvas.defaultCursor = 'crosshair';
                break;

            case 'eraser_pixel':
                canvas.isDrawingMode = true;
                canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                canvas.freeDrawingBrush.color = '#ffffff'; // Simple white eraser
                canvas.freeDrawingBrush.width = brushSize * 4; // Wider
                // canvas.defaultCursor = 'url("eraser_cursor")'; // if we had one
                break;

            case 'eraser_object':
                canvas.isDrawingMode = false;
                canvas.defaultCursor = 'pointer';
                canvas.hoverCursor = 'not-allowed';

                // Enable events on all objects so they can be clicked
                canvas.forEachObject((obj) => {
                    obj.set({
                        selectable: false,
                        evented: true,
                        hoverCursor: 'not-allowed'
                    });
                });
                canvas.requestRenderAll();

                canvas.on('mouse:down', (opt) => {
                    if (opt.target) {
                        canvas.remove(opt.target);
                        canvas.requestRenderAll();
                    }
                });
                break;

            case 'text':
                canvas.isDrawingMode = false;
                canvas.defaultCursor = 'text';
                canvas.on('mouse:down', (opt) => {
                    // Only add text if clicking on empty area
                    if (opt.target) return;

                    const pointer = canvas.getPointer(opt.e);
                    const text = new fabric.IText('Type here...', {
                        left: pointer.x,
                        top: pointer.y,
                        fontFamily: 'Arial, sans-serif',
                        fontSize: Math.max(16, brushSize * 4),
                        fill: color,
                        editable: true,
                        selectable: true,
                        evented: true,
                    });
                    canvas.add(text);
                    canvas.setActiveObject(text);
                    text.enterEditing();
                    text.selectAll();
                    canvas.requestRenderAll();
                });
                break;

            case 'line':
            case 'rect':
            case 'circle':
                canvas.defaultCursor = 'crosshair';
                // Attach shape drawing handlers
                canvas.on('mouse:down', handleShapeMouseDown);
                canvas.on('mouse:move', handleShapeMouseMove);
                canvas.on('mouse:up', handleShapeMouseUp);
                break;
        }

    }, [activeTool, color, brushSize]);

    // Shape Drawing Handlers
    const handleShapeMouseDown = (opt: fabric.IEvent) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const pointer = canvas.getPointer(opt.e);
        isDrawingRef.current = true;
        startPointRef.current = { x: pointer.x, y: pointer.y };

        let shape: fabric.Object | null = null;
        const commonProps = {
            stroke: color,
            strokeWidth: brushSize,
            fill: 'transparent',
            left: pointer.x,
            top: pointer.y,
            selectable: false, // Initially false while drawing
            evented: false,
        };

        if (activeTool === 'line') {
            shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                ...commonProps,
                strokeLineCap: 'round'
            });
        } else if (activeTool === 'rect') {
            shape = new fabric.Rect({
                ...commonProps,
                width: 0,
                height: 0,
            });
        } else if (activeTool === 'circle') {
            shape = new fabric.Circle({
                ...commonProps,
                radius: 0,
            });
        }

        if (shape) {
            activeShapeRef.current = shape;
            canvas.add(shape);
        }
    };

    const handleShapeMouseMove = (opt: fabric.IEvent) => {
        if (!isDrawingRef.current || !activeShapeRef.current || !startPointRef.current) return;
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const pointer = canvas.getPointer(opt.e);
        const start = startPointRef.current;
        const shape = activeShapeRef.current;

        if (activeTool === 'line') {
            (shape as fabric.Line).set({ x2: pointer.x, y2: pointer.y });
        } else if (activeTool === 'rect') {
            const width = Math.abs(pointer.x - start.x);
            const height = Math.abs(pointer.y - start.y);
            const left = Math.min(start.x, pointer.x);
            const top = Math.min(start.y, pointer.y);
            shape.set({ width, height, left, top });
        } else if (activeTool === 'circle') {
            // Radius is half distance roughly
            // Simple dist
            const dist = Math.sqrt(Math.pow(pointer.x - start.x, 2) + Math.pow(pointer.y - start.y, 2));
            // Let's do center-based radius or simple corner-to-corner diameter
            // Fabric Circle is top/left based.
            // Let's assume drag is diameter.
            (shape as fabric.Circle).set({
                radius: dist / 2,
                // Adjust position to center circle between start and current?
                // Or just start as center? 
                // Let's simply grow radius from start point for better UX (center start)
                // Left/Top needs updates?
                // Actually simple corner-drag expectation:
                // If I drag right-down, circle should form inside that box.
                // diameter = min(dx, dy) 
            });
            // Better circle UX: Center-based or bounding-box based?
            // Bounding box:
            // const width = Math.abs(pointer.x - start.x);
            // const height = Math.abs(pointer.y - start.y);
            // const radius = Math.max(width, height) / 2;
            // shape.set({ radius: radius });
            // But circle center moves.
            // Let's just do: Start point is enter. Radius is distance.
            (shape as fabric.Circle).set({ radius: dist });
            // And reset origin?
            // No, easier: Start point is top-left corner of bounding box.
        }

        canvas.requestRenderAll();
    };

    const handleShapeMouseUp = () => {
        isDrawingRef.current = false;
        if (activeShapeRef.current) {
            activeShapeRef.current.setCoords();
            activeShapeRef.current = null;
        }
    };

    const handleClear = () => {
        if (!fabricCanvasRef.current) return;
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.setBackgroundColor('#ffffff', () => {
            fabricCanvasRef.current?.renderAll();
        });
    };

    const handleUndo = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const objects = canvas.getObjects();
        if (objects.length > 0) {
            canvas.remove(objects[objects.length - 1]);
        }
    };

    const handleSave = () => {
        if (!fabricCanvasRef.current) return;
        const json = JSON.stringify(fabricCanvasRef.current.toJSON());
        onSave(json);
    };

    return (
        <ModalOverlay onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <ModalContainer>
                <Header>
                    <Title>{t.drawing?.title || 'Drawing'}</Title>
                    <FooterButtons>
                        <ActionButton onClick={onClose}>
                            <FiX /> {t.drawing?.cancel || 'Cancel'}
                        </ActionButton>
                        <ActionButton $primary onClick={handleSave}>
                            <FiCheck /> {t.drawing?.insert || 'Insert'}
                        </ActionButton>
                    </FooterButtons>
                </Header>

                <Toolbar>
                    <ToolGroup>
                        <ToolButton $active={activeTool === 'pen'} onClick={() => setActiveTool('pen')} title="Pen">
                            <FiEdit2 />
                        </ToolButton>
                        <ToolButton $active={activeTool === 'line'} onClick={() => setActiveTool('line')} title="Line">
                            <FiMinus style={{ transform: 'rotate(-45deg)' }} />
                        </ToolButton>
                        <ToolButton $active={activeTool === 'rect'} onClick={() => setActiveTool('rect')} title="Rectangle">
                            <FiSquare />
                        </ToolButton>
                        <ToolButton $active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} title="Circle">
                            <FiCircle />
                        </ToolButton>
                        <ToolButton $active={activeTool === 'text'} onClick={() => setActiveTool('text')} title="Text (T)">
                            <FiType />
                        </ToolButton>
                    </ToolGroup>

                    <ToolGroup>
                        <ToolButton $active={activeTool === 'eraser_pixel'} onClick={() => setActiveTool('eraser_pixel')} title="Eraser (Brush)">
                            <PixelEraserIcon />
                        </ToolButton>
                        <ToolButton $active={activeTool === 'eraser_object'} onClick={() => setActiveTool('eraser_object')} title="Eraser (Object Delete)">
                            <ObjectEraserIcon />
                        </ToolButton>
                    </ToolGroup>

                    <ToolGroup>
                        <ToolButton onClick={handleUndo} title="Undo">
                            <FiRotateCcw />
                        </ToolButton>
                        <ToolButton onClick={handleClear} title="Clear All">
                            <FiTrash2 />
                        </ToolButton>
                    </ToolGroup>

                    <ToolGroup>
                        {COLORS.map(c => (
                            <div key={c} style={{ padding: 4 }}>
                                <ColorButton
                                    $color={c}
                                    $selected={color === c && !activeTool.startsWith('eraser')}
                                    onClick={() => {
                                        setColor(c);
                                        // Auto switch to pen if using eraser or other shape?
                                        if (activeTool.startsWith('eraser')) {
                                            setActiveTool('pen');
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </ToolGroup>

                    <ToolGroup>
                        {BRUSH_SIZES.map(s => (
                            <ToolButton
                                key={s}
                                $active={brushSize === s}
                                onClick={() => setBrushSize(s)}
                                style={{ width: 30, fontSize: '0.8rem', padding: 0 }}
                                title={`Size: ${s}px`}
                            >
                                <div style={{
                                    width: Math.min(s, 20),
                                    height: Math.min(s, 20),
                                    borderRadius: '50%',
                                    background: '#333'
                                }} />
                            </ToolButton>
                        ))}
                    </ToolGroup>
                </Toolbar>

                <CanvasWrapper ref={containerRef}>
                    <canvas ref={canvasRef} />
                </CanvasWrapper>
            </ModalContainer>
        </ModalOverlay>
    );
};
