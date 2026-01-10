import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import styled from 'styled-components';
import { fabric } from 'fabric';
import { FiX, FiCheck, FiTrash2, FiEdit2, FiRotateCcw, FiRotateCw, FiSquare, FiCircle, FiMinus, FiType, FiArrowDown, FiTriangle } from 'react-icons/fi';
import { useLanguage } from '../../contexts/LanguageContext';

// Pixel Eraser Icon - 3D pink block eraser
const PixelEraserIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 14L14 3L22 7L13 18L5 14Z" fill="#ffc9c9" />
        <path d="M5 14L5 19L13 23L13 18" fill="#fa5252" />
        <path d="M13 23L22 12L22 7" fill="#e03131" />
    </svg>
);

// Object Eraser Icon - 3D blue block eraser with indicator
const ObjectEraserIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 14L14 3L22 7L13 18L5 14Z" fill="#e7f5ff" />
        <path d="M5 14L5 19L13 23L13 18" fill="#339af0" />
        <path d="M13 23L22 12L22 7" fill="#1c7ed6" />
        <circle cx="13" cy="11" r="2.5" fill="#f03e3e" stroke="#f03e3e" strokeWidth="1" />
    </svg>
);

const EllipseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="12" rx="9" ry="5" />
    </svg>
);

const DiamondIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 12L12 22L22 12L12 2Z" />
    </svg>
);

const BackgroundIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
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
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.35rem 0.5rem;
  background: #f1f3f5;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
`;

const ToolButton = styled.button<{ $active?: boolean }>`
  background: ${({ $active }) => $active ? '#e9ecef' : 'transparent'};
  border: 1px solid ${({ $active }) => $active ? '#adb5bd' : 'transparent'};
  color: #333;
  padding: 0.3rem;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  min-width: 28px;
  height: 28px;
  
  &:hover {
    background: #e9ecef;
  }
`;

const ToolGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1px;
  align-items: center;
`;

const ColorButton = styled.div<{ $color: string; $selected?: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  border: 2px solid ${({ $selected }) => $selected ? '#333' : 'transparent'};
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  
  &:hover {
    transform: scale(1.1);
  }
`;

const CanvasWrapper = styled.div`
  flex: 1;
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  overflow-y: auto; /* Allow vertical scrolling */
  overflow-x: hidden;
  position: relative;
  display: flex;
  justify-content: center;
  
  /* Fabric container centering */
  .canvas-container {
    margin: 0 auto;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
  }
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

type ToolType = 'pen' | 'eraser_pixel' | 'eraser_object' | 'line' | 'rect' | 'circle' | 'text' | 'triangle' | 'ellipse' | 'diamond';
type BackgroundType = 'none' | 'lines-xs' | 'lines-sm' | 'lines-md' | 'lines-lg' | 'lines-xl' | 'grid-xs' | 'grid-sm' | 'grid-md' | 'grid-lg' | 'grid-xl';

const createBackgroundPattern = (type: BackgroundType) => {
    if (type === 'none') return '#ffffff';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#ffffff';

    let size = 30;
    if (type.endsWith('xs')) size = 15;
    else if (type.endsWith('sm')) size = 25;
    else if (type.endsWith('md')) size = 35;
    else if (type.endsWith('lg')) size = 45;
    else if (type.endsWith('xl')) size = 55;

    canvas.width = size;
    canvas.height = size;

    ctx.strokeStyle = '#f0f0f0'; // Very faint color
    ctx.lineWidth = 1;

    if (type.startsWith('lines')) {
        ctx.beginPath();
        // Draw at half pixel for sharpness
        ctx.moveTo(0, size - 0.5);
        ctx.lineTo(size, size - 0.5);
        ctx.stroke();
    } else if (type.startsWith('grid')) {
        ctx.beginPath();
        ctx.moveTo(0, size - 0.5);
        ctx.lineTo(size, size - 0.5);
        ctx.moveTo(size - 0.5, 0);
        ctx.lineTo(size - 0.5, size);
        ctx.stroke();
    }

    return new fabric.Pattern({
        source: canvas as any,
        repeat: 'repeat'
    });
};

export const FabricCanvasModal: React.FC<FabricCanvasModalProps> = ({ initialData, onSave, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const { t } = useLanguage();

    const [activeTool, setActiveTool] = useState<ToolType>('pen');
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(2);
    const [background, setBackground] = useState<BackgroundType>('none');
    const [isBgPickerOpen, setIsBgPickerOpen] = useState(false);

    // Shape drawing refs
    const isDrawingRef = useRef(false);
    const startPointRef = useRef<{ x: number, y: number } | null>(null);
    const activeShapeRef = useRef<fabric.Object | null>(null);

    // History for undo/redo
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef(-1);
    const isUndoRedoRef = useRef(false); // Prevent saving during undo/redo

    const saveHistory = () => {
        if (isUndoRedoRef.current) return;
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const json = JSON.stringify(canvas.toJSON());

        // Remove any future history if we're not at the end
        if (historyIndexRef.current < historyRef.current.length - 1) {
            historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        }

        historyRef.current.push(json);
        historyIndexRef.current = historyRef.current.length - 1;

        // Limit history size
        if (historyRef.current.length > 50) {
            historyRef.current.shift();
            historyIndexRef.current--;
        }
    };

    useLayoutEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        // Cleanup
        if (fabricCanvasRef.current) {
            fabricCanvasRef.current.dispose();
        }

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: width - 20, // Leave some room for potential scrollbar
            height,
            backgroundColor: '#ffffff',
            isDrawingMode: true,
            selection: false,
        });

        // Set initial brush
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = brushSize;
        canvas.freeDrawingBrush.color = color;

        fabricCanvasRef.current = canvas;

        // Save initial state to history
        setTimeout(() => saveHistory(), 100);

        // Listen for changes to save history
        canvas.on('object:added', saveHistory);
        canvas.on('object:modified', saveHistory);
        canvas.on('object:removed', saveHistory);

        if (initialData) {
            try {
                const json = JSON.parse(initialData);
                if (json.height) {
                    canvas.setHeight(json.height);
                }
                canvas.loadFromJSON(json, () => {
                    canvas.renderAll();
                    saveHistory(); // Save loaded state
                });
            } catch (e) {
                console.error("Failed to load fabric JSON", e);
            }
        }

        return () => {
            canvas.off('object:added', saveHistory);
            canvas.off('object:modified', saveHistory);
            canvas.off('object:removed', saveHistory);
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
                case 'z': // Undo / Redo
                    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                        e.preventDefault();
                        handleRedo();
                    } else if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleUndo();
                    }
                    break;
                case 'y': // Alternative redo (Ctrl+Y)
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleRedo();
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

                // Enable events on all objects so they can be detected
                canvas.forEachObject((obj) => {
                    obj.set({
                        selectable: false,
                        evented: true,
                        hoverCursor: 'not-allowed'
                    });
                });
                canvas.requestRenderAll();

                let isErasingDragging = false;

                canvas.on('mouse:down', (opt) => {
                    isErasingDragging = true;
                    if (opt.target) {
                        canvas.remove(opt.target);
                        canvas.requestRenderAll();
                    }
                });

                canvas.on('mouse:move', (opt) => {
                    if (isErasingDragging && opt.target) {
                        canvas.remove(opt.target);
                        canvas.requestRenderAll();
                    }
                });

                canvas.on('mouse:up', () => {
                    isErasingDragging = false;
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
            case 'triangle':
            case 'ellipse':
            case 'diamond':
                canvas.defaultCursor = 'crosshair';
                // Attach shape drawing handlers
                canvas.on('mouse:down', handleShapeMouseDown);
                canvas.on('mouse:move', handleShapeMouseMove);
                canvas.on('mouse:up', handleShapeMouseUp);
                break;
        }

    }, [activeTool, color, brushSize]);

    // Handle background change
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const pattern = createBackgroundPattern(background);
        canvas.setBackgroundColor(pattern, () => {
            canvas.renderAll();
        });
    }, [background]);

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
        } else if (activeTool === 'triangle') {
            shape = new fabric.Triangle({
                ...commonProps,
                width: 0,
                height: 0,
            });
        } else if (activeTool === 'ellipse') {
            shape = new fabric.Ellipse({
                ...commonProps,
                rx: 0,
                ry: 0,
            });
        } else if (activeTool === 'diamond') {
            shape = new fabric.Polygon([
                new fabric.Point(0, 0),
                new fabric.Point(0, 0),
                new fabric.Point(0, 0),
                new fabric.Point(0, 0)
            ], {
                ...commonProps,
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
        } else if (activeTool === 'triangle') {
            const width = Math.abs(pointer.x - start.x);
            const height = Math.abs(pointer.y - start.y);
            const left = Math.min(start.x, pointer.x);
            const top = Math.min(start.y, pointer.y);
            shape.set({ width, height, left, top });
        } else if (activeTool === 'ellipse') {
            const rx = Math.abs(pointer.x - start.x) / 2;
            const ry = Math.abs(pointer.y - start.y) / 2;
            const left = Math.min(start.x, pointer.x);
            const top = Math.min(start.y, pointer.y);
            (shape as fabric.Ellipse).set({ rx, ry, left, top });
        } else if (activeTool === 'diamond') {
            const width = Math.abs(pointer.x - start.x);
            const height = Math.abs(pointer.y - start.y);
            const left = Math.min(start.x, pointer.x);
            const top = Math.min(start.y, pointer.y);

            // Points relative to the top-left (0,0) of the bounding box
            const points = [
                new fabric.Point(width / 2, 0),        // Top
                new fabric.Point(width, height / 2),   // Right
                new fabric.Point(width / 2, height),   // Bottom
                new fabric.Point(0, height / 2)        // Left
            ];

            // 1. Update points first
            (shape as fabric.Polygon).set({ points });

            // 2. Force recalculate dimensions and internal path offset
            (shape as any)._setPositionDimensions({});

            // 3. Position the bounding box exactly where the mouse drag area is
            shape.set({
                left: left,
                top: top,
                width: width,
                height: height
            });

            shape.setCoords();
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

        if (historyIndexRef.current > 0) {
            isUndoRedoRef.current = true;
            historyIndexRef.current--;
            const json = historyRef.current[historyIndexRef.current];
            canvas.loadFromJSON(JSON.parse(json), () => {
                canvas.renderAll();
                isUndoRedoRef.current = false;
            });
        }
    };

    const handleRedo = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        if (historyIndexRef.current < historyRef.current.length - 1) {
            isUndoRedoRef.current = true;
            historyIndexRef.current++;
            const json = historyRef.current[historyIndexRef.current];
            canvas.loadFromJSON(JSON.parse(json), () => {
                canvas.renderAll();
                isUndoRedoRef.current = false;
            });
        }
    };

    const handleExtendHeight = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const currentHeight = canvas.getHeight();
        const newHeight = currentHeight + 400; // Add 400px

        canvas.setHeight(newHeight);
        canvas.renderAll();
        saveHistory();
    };

    const handleSave = () => {
        if (!fabricCanvasRef.current) return;
        // Ensure dimensions are saved in JSON
        const canvas = fabricCanvasRef.current;
        const jsonObj = canvas.toJSON(['width', 'height']);
        const json = JSON.stringify(jsonObj);
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
                            <FiEdit2 size={18} />
                        </ToolButton>
                        <ToolButton $active={activeTool === 'line'} onClick={() => setActiveTool('line')} title="Line">
                            <FiMinus size={18} style={{ transform: 'rotate(-45deg)' }} />
                        </ToolButton>
                        <ToolButton $active={activeTool === 'rect'} onClick={() => setActiveTool('rect')} title="Rectangle">
                            <FiSquare size={18} />
                        </ToolButton>
                        <ToolButton $active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} title="Circle">
                            <FiCircle size={18} />
                        </ToolButton>
                        <ToolButton $active={activeTool === 'ellipse'} onClick={() => setActiveTool('ellipse')} title="Ellipse">
                            <EllipseIcon />
                        </ToolButton>
                        <ToolButton $active={activeTool === 'triangle'} onClick={() => setActiveTool('triangle')} title="Triangle">
                            <FiTriangle size={18} />
                        </ToolButton>
                        <ToolButton $active={activeTool === 'diamond'} onClick={() => setActiveTool('diamond')} title="Diamond">
                            <DiamondIcon />
                        </ToolButton>
                        <ToolButton $active={activeTool === 'text'} onClick={() => setActiveTool('text')} title="Text (T)">
                            <FiType size={18} />
                        </ToolButton>
                        <ToolButton $active={activeTool === 'eraser_pixel'} onClick={() => setActiveTool('eraser_pixel')} title="Eraser (Brush)">
                            <PixelEraserIcon />
                        </ToolButton>
                        <ToolButton $active={activeTool === 'eraser_object'} onClick={() => setActiveTool('eraser_object')} title="Eraser (Object Delete)">
                            <ObjectEraserIcon />
                        </ToolButton>

                        <ToolButton onClick={handleUndo} title="Undo (Ctrl+Z)">
                            <FiRotateCcw size={18} />
                        </ToolButton>
                        <ToolButton onClick={handleRedo} title="Redo (Ctrl+Y)">
                            <FiRotateCw size={18} />
                        </ToolButton>
                        <ToolButton onClick={() => {
                            if (window.confirm('Clear all?')) {
                                handleClear();
                            }
                        }} title="Clear All">
                            <FiTrash2 size={18} />
                        </ToolButton>
                        <ToolButton onClick={handleExtendHeight} title="Extend height">
                            <FiArrowDown size={18} />
                        </ToolButton>
                        <div style={{ position: 'relative', display: 'flex' }}>
                            <ToolButton
                                $active={background !== 'none' || isBgPickerOpen}
                                onClick={() => setIsBgPickerOpen(!isBgPickerOpen)}
                                title="Background"
                            >
                                <BackgroundIcon />
                            </ToolButton>

                            {isBgPickerOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    zIndex: 1000,
                                    background: 'white',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    padding: '4px',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(1, 1fr)',
                                    gap: '2px',
                                    minWidth: '120px'
                                }}>
                                    <button
                                        onClick={() => { setBackground('none'); setIsBgPickerOpen(false); }}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            textAlign: 'left',
                                            background: background === 'none' ? '#f1f3f5' : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: '2px'
                                        }}
                                    >
                                        None
                                    </button>
                                    <div style={{ borderTop: '1px solid #eee', margin: '2px 0' }}></div>
                                    <button
                                        onClick={() => { setBackground('lines-xs'); setIsBgPickerOpen(false); }}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            background: background === 'lines-xs' ? '#f1f3f5' : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: '2px'
                                        }}
                                    >
                                        Lines (XS)
                                    </button>
                                    <button
                                        onClick={() => { setBackground('lines-sm'); setIsBgPickerOpen(false); }}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            background: background === 'lines-sm' ? '#f1f3f5' : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: '2px'
                                        }}
                                    >
                                        Lines (Small)
                                    </button>
                                    <button
                                        onClick={() => { setBackground('lines-md'); setIsBgPickerOpen(false); }}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            background: background === 'lines-md' ? '#f1f3f5' : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: '2px'
                                        }}
                                    >
                                        Lines (Medium)
                                    </button>
                                    <button
                                        onClick={() => { setBackground('lines-lg'); setIsBgPickerOpen(false); }}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            background: background === 'lines-lg' ? '#f1f3f5' : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: '2px'
                                        }}
                                    >
                                        Lines (Large)
                                    </button>
                                    <button
                                        onClick={() => { setBackground('lines-xl'); setIsBgPickerOpen(false); }}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            background: background === 'lines-xl' ? '#f1f3f5' : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: '2px'
                                        }}
                                    >
                                        Lines (XL)
                                    </button>
                                    <div style={{ borderTop: '1px solid #eee', margin: '2px 0' }}></div>
                                    <button
                                        onClick={() => { setBackground('grid-xs'); setIsBgPickerOpen(false); }}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            background: background === 'grid-xs' ? '#f1f3f5' : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: '2px'
                                        }}
                                    >
                                        Grid (XS)
                                    </button>
                                    <button
                                        onClick={() => { setBackground('grid-sm'); setIsBgPickerOpen(false); }}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            background: background === 'grid-sm' ? '#f1f3f5' : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: '2px'
                                        }}
                                    >
                                        Grid (Small)
                                    </button>
                                    <button
                                        onClick={() => { setBackground('grid-md'); setIsBgPickerOpen(false); }}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            background: background === 'grid-md' ? '#f1f3f5' : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: '2px'
                                        }}
                                    >
                                        Grid (Medium)
                                    </button>
                                    <button
                                        onClick={() => { setBackground('grid-lg'); setIsBgPickerOpen(false); }}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            background: background === 'grid-lg' ? '#f1f3f5' : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: '2px'
                                        }}
                                    >
                                        Grid (Large)
                                    </button>
                                    <button
                                        onClick={() => { setBackground('grid-xl'); setIsBgPickerOpen(false); }}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            background: background === 'grid-xl' ? '#f1f3f5' : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: '2px'
                                        }}
                                    >
                                        Grid (XL)
                                    </button>
                                </div>
                            )}
                        </div>

                        {COLORS.map(c => (
                            <div key={c} style={{
                                padding: '0 4px',
                                display: 'flex',
                                alignItems: 'center',
                                height: '28px'
                            }}>
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
