import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import styled from 'styled-components';
import { fabric } from 'fabric';
import { FiX, FiCheck, FiTrash2, FiEdit2, FiRotateCcw, FiRotateCw, FiSquare, FiCircle, FiMinus, FiType, FiArrowDown, FiTriangle, FiMousePointer } from 'react-icons/fi';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
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
  touch-action: manipulation;
  
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
  touch-action: manipulation;
  
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

const DashPreview = styled.div<{ $dash: number[] | null }>`
  width: 100%;
  height: 2px;
  background: transparent;
  border-top: 2px ${({ $dash }) => $dash ? 'dashed' : 'solid'} #333;
  ${({ $dash }) => $dash && `border-image: repeating-linear-gradient(to right, #333, #333 ${$dash[0]}px, transparent ${$dash[0]}px, transparent ${$dash[0] + $dash[1]}px) 1;`}
  /* Simple fallback for complex dashes */
  ${({ $dash }) => $dash && $dash.length > 2 && `border-top: 2px dashed #333;`}
`;

const DashOption = styled.button<{ $active: boolean }>`
  width: 100%;
  height: 24px;
  padding: 4px 8px;
  border: 1px solid ${({ $active }) => $active ? '#333' : '#e0e0e0'};
  background: ${({ $active }) => $active ? '#f1f3f5' : 'white'};
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const Backdrop = styled.div<{ $centered?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 10000;
  display: flex;
  align-items: ${({ $centered = true }) => $centered ? 'center' : 'flex-start'};
  justify-content: ${({ $centered = true }) => $centered ? 'center' : 'flex-start'};
`;

const CompactModal = styled.div<{ $anchor?: { top: number, left: number } }>`
  background: white;
  padding: 0.4rem;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 65px;

  ${({ $anchor }) => $anchor && `
    position: fixed;
    top: ${$anchor.top}px;
    left: ${$anchor.left}px;
    z-index: 10001;
  `}
`;

const CompactModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.25rem;
`;

const CompactModalButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.2rem 0.35rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #dee2e6;
  background: ${({ $variant }) => $variant === 'primary' ? '#333' : 'white'};
  color: ${({ $variant }) => $variant === 'primary' ? 'white' : '#495057'};

  &:hover {
    background: ${({ $variant }) => $variant === 'primary' ? '#222' : '#f8f9fa'};
  }
`;

const ColorInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const CustomColorInput = styled.input`
  width: 100%;
  height: 38px;
  border: none;
  cursor: pointer;
  background: none;
  padding: 0;
`;

const CustomRangeInput = styled.input<{ $size: number; $opacityValue?: number }>`
  appearance: none;
  width: 100%;
  margin: 1rem 0;
  cursor: pointer;
  background: transparent;

  &::-webkit-slider-runnable-track {
    width: 100%;
    height: ${({ $size }) => Math.min($size, 100)}px;
    background: ${({ $opacityValue }) => $opacityValue !== undefined
        ? 'linear-gradient(to right, #eee, #333)'
        : '#dee2e6'};
    border-radius: ${({ $size }) => Math.min($size, 100) / 2}px;
  }

  &::-webkit-slider-thumb {
    appearance: none;
    height: ${({ $size }) => Math.max(Math.min($size, 100) + 10, 24)}px;
    width: ${({ $size }) => Math.max(Math.min($size, 100) + 10, 24)}px;
    border-radius: 50%;
    background: #333;
    opacity: ${({ $opacityValue }) => $opacityValue !== undefined ? Math.max($opacityValue / 100, 0.1) : 1};
    cursor: pointer;
    margin-top: ${({ $size }) => (Math.min($size, 100) / 2) - (Math.max(Math.min($size, 100) + 10, 24) / 2)}px;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  &::-moz-range-track {
    width: 100%;
    height: ${({ $size }) => Math.min($size, 100)}px;
    background: ${({ $opacityValue }) => $opacityValue !== undefined
        ? 'linear-gradient(to right, #eee, #333)'
        : '#dee2e6'};
    border-radius: ${({ $size }) => Math.min($size, 100) / 2}px;
  }

  &::-moz-range-thumb {
    height: ${({ $size }) => Math.max(Math.min($size, 100) + 10, 24)}px;
    width: ${({ $size }) => Math.max(Math.min($size, 100) + 10, 24)}px;
    border-radius: 50%;
    background: #333;
    opacity: ${({ $opacityValue }) => $opacityValue !== undefined ? Math.max($opacityValue / 100, 0.1) : 1};
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  &:focus {
    outline: none;
  }
`;

const CustomNumberInput = styled.input`
  width: 45px;
  padding: 0.2rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
  outline: none;

  &:focus {
    border-color: #333;
  }
`;

interface FabricCanvasModalProps {
    initialData?: string;
    onSave: (data: string) => void;
    onClose: () => void;
}

const INITIAL_COLORS = ['#000000', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#9c36b5'];
const INITIAL_BRUSH_SIZES = [2, 4, 8, 16];
const DASH_OPTIONS: (number[] | undefined)[] = [
    undefined,
    [5, 5],
    [10, 5],
    [2, 2],
    [15, 5, 5, 5],
    [20, 10],
    [5, 10]
];
const INITIAL_SHAPE_OPACITY = 100;
const INITIAL_SHAPE_DASH = 0; // Index in DASH_OPTIONS

type ShapeStyle = {
    dashArray: number[] | undefined;
    opacity: number;
};

const DEFAULT_SHAPE_STYLE: ShapeStyle = {
    dashArray: DASH_OPTIONS[INITIAL_SHAPE_DASH],
    opacity: INITIAL_SHAPE_OPACITY
};

type ToolbarItem = {
    id: string;
    type: 'tool' | 'action' | 'color' | 'size';
    toolId?: ToolType;
    actionId?: string;
    colorIndex?: number;
    sizeIndex?: number;
};

const INITIAL_TOOLBAR_ITEMS: ToolbarItem[] = [
    { id: 'select', type: 'tool', toolId: 'select' },
    { id: 'pen', type: 'tool', toolId: 'pen' },
    { id: 'line', type: 'tool', toolId: 'line' },
    { id: 'rect', type: 'tool', toolId: 'rect' },
    { id: 'circle', type: 'tool', toolId: 'circle' },
    { id: 'ellipse', type: 'tool', toolId: 'ellipse' },
    { id: 'triangle', type: 'tool', toolId: 'triangle' },
    { id: 'diamond', type: 'tool', toolId: 'diamond' },
    { id: 'text', type: 'tool', toolId: 'text' },
    { id: 'eraser_pixel', type: 'tool', toolId: 'eraser_pixel' },
    { id: 'eraser_object', type: 'tool', toolId: 'eraser_object' },
    { id: 'undo', type: 'action', actionId: 'undo' },
    { id: 'redo', type: 'action', actionId: 'redo' },
    { id: 'clear', type: 'action', actionId: 'clear' },
    { id: 'extend_height', type: 'action', actionId: 'extend_height' },
    { id: 'background', type: 'action', actionId: 'background' },
    { id: 'color-0', type: 'color', colorIndex: 0 },
    { id: 'color-1', type: 'color', colorIndex: 1 },
    { id: 'color-2', type: 'color', colorIndex: 2 },
    { id: 'color-3', type: 'color', colorIndex: 3 },
    { id: 'color-4', type: 'color', colorIndex: 4 },
    { id: 'color-5', type: 'color', colorIndex: 5 },
    { id: 'size-0', type: 'size', sizeIndex: 0 },
    { id: 'size-1', type: 'size', sizeIndex: 1 },
    { id: 'size-2', type: 'size', sizeIndex: 2 },
    { id: 'size-3', type: 'size', sizeIndex: 3 },
];

type ToolType = 'select' | 'pen' | 'eraser_pixel' | 'eraser_object' | 'line' | 'rect' | 'circle' | 'text' | 'triangle' | 'ellipse' | 'diamond';
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        source: canvas as any,
        repeat: 'repeat'
    });
};

export const FabricCanvasModal: React.FC<FabricCanvasModalProps> = ({ initialData, onSave, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const { t } = useLanguage();

    const [availableColors, setAvailableColors] = useState<string[]>(() => {
        const saved = localStorage.getItem('fabric_colors');
        return saved ? JSON.parse(saved) : INITIAL_COLORS;
    });
    const [availableBrushSizes, setAvailableBrushSizes] = useState<number[]>(() => {
        const saved = localStorage.getItem('fabric_brush_sizes');
        return saved ? JSON.parse(saved) : INITIAL_BRUSH_SIZES;
    });
    const [toolbarItems, setToolbarItems] = useState<ToolbarItem[]>(() => {
        const saved = localStorage.getItem('fabric_toolbar_order');
        if (!saved) return INITIAL_TOOLBAR_ITEMS;

        const parsed: ToolbarItem[] = JSON.parse(saved);
        // Check if all tools from INITIAL_TOOLBAR_ITEMS are present (specifically the new 'select' tool)
        const missingItems = INITIAL_TOOLBAR_ITEMS.filter(initialItem =>
            !parsed.some(parsedItem => parsedItem.id === initialItem.id)
        );

        if (missingItems.length > 0) {
            // Add missing items to the front
            return [...missingItems, ...parsed];
        }
        return parsed;
    });
    const [activeTool, setActiveTool] = useState<ToolType>('pen');
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(2);
    const [background, setBackground] = useState<BackgroundType>('none');
    const [isBgPickerOpen, setIsBgPickerOpen] = useState(false);

    const [isColorEditOpen, setIsColorEditOpen] = useState(false);
    const [tempColor, setTempColor] = useState('#000000');
    const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);

    const [isSizeEditOpen, setIsSizeEditOpen] = useState(false);
    const [tempSize, setTempSize] = useState(2);
    const [editingSizeIndex, setEditingSizeIndex] = useState<number | null>(null);

    const [shapeStyles, setShapeStyles] = useState<Record<string, ShapeStyle>>(() => {
        const saved = localStorage.getItem('fabric_shape_styles');
        return saved ? JSON.parse(saved) : {};
    });
    const [isShapeSettingsOpen, setIsShapeSettingsOpen] = useState(false);
    const [tempDashIndex, setTempDashIndex] = useState(0);
    const [tempShapeOpacity, setTempShapeOpacity] = useState(100);

    // Save customized settings
    useEffect(() => {
        localStorage.setItem('fabric_colors', JSON.stringify(availableColors));
    }, [availableColors]);

    useEffect(() => {
        localStorage.setItem('fabric_brush_sizes', JSON.stringify(availableBrushSizes));
    }, [availableBrushSizes]);

    useEffect(() => {
        localStorage.setItem('fabric_toolbar_order', JSON.stringify(toolbarItems));
    }, [toolbarItems]);

    useEffect(() => {
        localStorage.setItem('fabric_shape_styles', JSON.stringify(shapeStyles));
    }, [shapeStyles]);

    // Shape drawing refs
    const isDrawingRef = useRef(false);
    const startPointRef = useRef<{ x: number, y: number } | null>(null);
    const activeShapeRef = useRef<fabric.Object | null>(null);

    // History for undo/redo
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef(-1);
    const isUndoRedoRef = useRef(false); // Prevent saving during undo/redo

    const lastTapMapRef = useRef<{ [key: string]: number }>({});
    const openedTimeRef = useRef<number>(0);
    const [settingsAnchor, setSettingsAnchor] = useState<{ top: number, left: number } | null>(null);

    const handleDoubleTap = (e: React.TouchEvent, id: string, callback: (e: React.TouchEvent | React.MouseEvent) => void) => {
        const now = Date.now();
        const lastTap = lastTapMapRef.current[id] || 0;
        const diff = now - lastTap;
        if (diff > 0 && diff < 400) {
            if (e.cancelable) e.preventDefault();
            openedTimeRef.current = now; // Record open time for ghost click prevention
            callback(e);
            lastTapMapRef.current[id] = 0;
        } else {
            lastTapMapRef.current[id] = now;
        }
    };

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
        // Removed unnecessary deps to only run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const handleColorDoubleClick = (e: React.MouseEvent | React.TouchEvent, index: number) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setSettingsAnchor({
            top: rect.bottom + 5,
            left: Math.max(10, Math.min(rect.left, window.innerWidth - 130))
        });
        setEditingColorIndex(index);
        setTempColor(availableColors[index]);
        openedTimeRef.current = Date.now();
        setIsColorEditOpen(true);
    };

    const handleColorOk = () => {
        setSettingsAnchor(null);
        if (editingColorIndex !== null) {
            const newColors = [...availableColors];
            newColors[editingColorIndex] = tempColor;
            setAvailableColors(newColors);
            setColor(tempColor);
            setIsColorEditOpen(false);
            setEditingColorIndex(null);
        }
    };

    const handleColorReset = () => {
        if (editingColorIndex !== null) {
            setTempColor(INITIAL_COLORS[editingColorIndex]);
        }
    };

    const handleColorCancel = () => {
        setSettingsAnchor(null);
        setIsColorEditOpen(false);
        setEditingColorIndex(null);
    };

    const handleBrushSizeDoubleClick = (e: React.MouseEvent | React.TouchEvent, index: number) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setSettingsAnchor({
            top: rect.bottom + 5,
            left: Math.max(10, Math.min(rect.left, window.innerWidth - 130))
        });
        setEditingSizeIndex(index);
        setTempSize(availableBrushSizes[index]);
        openedTimeRef.current = Date.now();
        setIsSizeEditOpen(true);
    };

    const handleSizeOk = () => {
        setSettingsAnchor(null);
        if (editingSizeIndex !== null) {
            const newSizes = [...availableBrushSizes];
            newSizes[editingSizeIndex] = tempSize;
            setAvailableBrushSizes(newSizes);
            setBrushSize(tempSize);
            setIsSizeEditOpen(false);
            setEditingSizeIndex(null);
        }
    };

    const handleSizeReset = () => {
        if (editingSizeIndex !== null) {
            setTempSize(INITIAL_BRUSH_SIZES[editingSizeIndex]);
        }
    };

    const handleSizeCancel = () => {
        setSettingsAnchor(null);
        setIsSizeEditOpen(false);
        setEditingSizeIndex(null);
    };

    const handleShapeToolDoubleClick = (e: React.MouseEvent | React.TouchEvent, toolId: string) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setSettingsAnchor({
            top: rect.bottom + 5,
            left: Math.max(10, Math.min(rect.left, window.innerWidth - 180)) // Shape modal is wider
        });
        const style = shapeStyles[toolId] || DEFAULT_SHAPE_STYLE;
        const currentIndex = DASH_OPTIONS.findIndex(d => JSON.stringify(d) === JSON.stringify(style.dashArray));
        setTempDashIndex(currentIndex === -1 ? 0 : currentIndex);
        setTempShapeOpacity(style.opacity);
        setIsShapeSettingsOpen(true);
    };

    const handleShapeSettingsOk = () => {
        setSettingsAnchor(null);
        if (activeTool) {
            setShapeStyles(prev => ({
                ...prev,
                [activeTool]: {
                    dashArray: DASH_OPTIONS[tempDashIndex],
                    opacity: tempShapeOpacity
                }
            }));
        }
        setIsShapeSettingsOpen(false);
    };

    const handleShapeSettingsReset = () => {
        setTempDashIndex(0);
        setTempShapeOpacity(100);
    };

    const handleShapeSettingsCancel = () => {
        setSettingsAnchor(null);
        setIsShapeSettingsOpen(false);
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const newItems = Array.from(toolbarItems);
        const [reorderedItem] = newItems.splice(result.source.index, 1);
        newItems.splice(result.destination.index, 0, reorderedItem);

        setToolbarItems(newItems);
    };

    const renderToolbarItem = (item: ToolbarItem, index: number) => {
        return (
            <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                            ...provided.draggableProps.style,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {item.type === 'tool' && (
                            <ToolButton
                                $active={activeTool === item.toolId}
                                onClick={() => setActiveTool(item.toolId!)}
                                onDoubleClick={(e) => {
                                    if (['line', 'rect', 'circle', 'ellipse', 'triangle', 'diamond'].includes(item.toolId!)) {
                                        handleShapeToolDoubleClick(e, item.toolId!);
                                    }
                                }}
                                onTouchStart={(e) => {
                                    if (['line', 'rect', 'circle', 'ellipse', 'triangle', 'diamond'].includes(item.toolId!)) {
                                        handleDoubleTap(e, `tool-${item.toolId}`, (ev) => handleShapeToolDoubleClick(ev, item.toolId!));
                                    }
                                }}
                                title={(item.toolId ?? '').charAt(0).toUpperCase() + (item.toolId ?? '').slice(1)}
                            >
                                {item.toolId === 'select' && <FiMousePointer size={18} />}
                                {item.toolId === 'pen' && <FiEdit2 size={18} />}
                                {item.toolId === 'line' && <FiMinus size={18} style={{ transform: 'rotate(-45deg)' }} />}
                                {item.toolId === 'rect' && <FiSquare size={18} />}
                                {item.toolId === 'circle' && <FiCircle size={18} />}
                                {item.toolId === 'ellipse' && <EllipseIcon />}
                                {item.toolId === 'triangle' && <FiTriangle size={18} />}
                                {item.toolId === 'diamond' && <DiamondIcon />}
                                {item.toolId === 'text' && <FiType size={18} />}
                                {item.toolId === 'eraser_pixel' && <PixelEraserIcon />}
                                {item.toolId === 'eraser_object' && <ObjectEraserIcon />}
                            </ToolButton>
                        )}

                        {item.type === 'action' && (
                            <>
                                {item.actionId === 'undo' && (
                                    <ToolButton onClick={handleUndo} title="Undo (Ctrl+Z)">
                                        <FiRotateCcw size={18} />
                                    </ToolButton>
                                )}
                                {item.actionId === 'redo' && (
                                    <ToolButton onClick={handleRedo} title="Redo (Ctrl+Y)">
                                        <FiRotateCw size={18} />
                                    </ToolButton>
                                )}
                                {item.actionId === 'clear' && (
                                    <ToolButton onClick={() => {
                                        if (window.confirm('Clear all?')) {
                                            handleClear();
                                        }
                                    }} title="Clear All">
                                        <FiTrash2 size={18} />
                                    </ToolButton>
                                )}
                                {item.actionId === 'extend_height' && (
                                    <ToolButton onClick={handleExtendHeight} title="Extend height">
                                        <FiArrowDown size={18} />
                                    </ToolButton>
                                )}
                                {item.actionId === 'background' && (
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
                                )}
                            </>
                        )}

                        {item.type === 'color' && (
                            <div style={{
                                padding: '0 4px',
                                display: 'flex',
                                alignItems: 'center',
                                height: '28px'
                            }}>
                                <ColorButton
                                    $color={availableColors[item.colorIndex!]}
                                    $selected={color === availableColors[item.colorIndex!] && !activeTool.startsWith('eraser')}
                                    onClick={() => {
                                        const c = availableColors[item.colorIndex!];
                                        setColor(c);
                                        if (activeTool.startsWith('eraser')) {
                                            setActiveTool('pen');
                                        }
                                    }}
                                    onDoubleClick={(e) => handleColorDoubleClick(e, item.colorIndex!)}
                                    onTouchStart={(e) => handleDoubleTap(e, `color-${item.colorIndex}`, (ev) => handleColorDoubleClick(ev, item.colorIndex!))}
                                    title="Double-click to change color"
                                />
                            </div>
                        )}

                        {item.type === 'size' && (
                            <ToolButton
                                $active={brushSize === availableBrushSizes[item.sizeIndex!]}
                                onClick={() => setBrushSize(availableBrushSizes[item.sizeIndex!])}
                                onDoubleClick={(e) => handleBrushSizeDoubleClick(e, item.sizeIndex!)}
                                onTouchStart={(e) => handleDoubleTap(e, `size-${item.sizeIndex}`, (ev) => handleBrushSizeDoubleClick(ev, item.sizeIndex!))}
                                style={{ width: 30, fontSize: '0.8rem', padding: 0 }}
                                title={`Size: ${availableBrushSizes[item.sizeIndex!]}px (Double-click to change)`}
                            >
                                <div style={{
                                    width: Math.min(availableBrushSizes[item.sizeIndex!], 20),
                                    height: Math.min(availableBrushSizes[item.sizeIndex!], 20),
                                    borderRadius: '50%',
                                    background: '#333'
                                }} />
                            </ToolButton>
                        )}
                    </div>
                )}
            </Draggable>
        );
    };

    // Shape Drawing Handlers
    const handleShapeMouseDown = React.useCallback((opt: fabric.IEvent) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const pointer = canvas.getPointer(opt.e);
        isDrawingRef.current = true;
        startPointRef.current = { x: pointer.x, y: pointer.y };

        let shape: fabric.Object | null = null;
        const currentStyle = shapeStyles[activeTool] || DEFAULT_SHAPE_STYLE;
        const commonProps = {
            stroke: color,
            strokeWidth: brushSize,
            strokeDashArray: currentStyle.dashArray,
            opacity: currentStyle.opacity / 100,
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
    }, [activeTool, color, brushSize, shapeStyles]);

    const handleShapeMouseMove = React.useCallback((opt: fabric.IEvent) => {
        if (!isDrawingRef.current || !activeShapeRef.current || !startPointRef.current) return;
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const pointer = canvas.getPointer(opt.e);
        const start = startPointRef.current;
        const shape = activeShapeRef.current;

        const left = Math.min(start.x, pointer.x);
        const top = Math.min(start.y, pointer.y);
        const width = Math.abs(pointer.x - start.x);
        const height = Math.abs(pointer.y - start.y);

        if (activeTool === 'line') {
            (shape as fabric.Line).set({ x2: pointer.x, y2: pointer.y });
        } else if (activeTool === 'rect') {
            shape.set({ left, top, width, height });
        } else if (activeTool === 'circle') {
            const radius = Math.max(width, height) / 2;
            const circleLeft = start.x + (pointer.x < start.x ? -radius * 2 : 0);
            const circleTop = start.y + (pointer.y < start.y ? -radius * 2 : 0);
            (shape as fabric.Circle).set({
                radius,
                left: circleLeft,
                top: circleTop
            });
        } else if (activeTool === 'triangle') {
            shape.set({ left, top, width, height });
        } else if (activeTool === 'ellipse') {
            (shape as fabric.Ellipse).set({
                rx: width / 2,
                ry: height / 2,
                left,
                top
            });
        } else if (activeTool === 'diamond') {
            const points = [
                new fabric.Point(width / 2, 0),        // Top
                new fabric.Point(width, height / 2),   // Right
                new fabric.Point(width / 2, height),   // Bottom
                new fabric.Point(0, height / 2)        // Left
            ];

            (shape as fabric.Polygon).set({
                points,
                left,
                top,
                width,
                height
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (shape as any)._setPositionDimensions({});
        }

        shape.setCoords();
        canvas.requestRenderAll();
    }, [activeTool]);

    const handleShapeMouseUp = React.useCallback(() => {
        isDrawingRef.current = false;
        if (activeShapeRef.current) {
            activeShapeRef.current.setCoords();
            activeShapeRef.current = null;
        }
    }, []);

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
                case 'backspace': {
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
                }
                // Brush size shortcuts (1-4)
                case '1':
                    setBrushSize(availableBrushSizes[0]);
                    break;
                case '2':
                    setBrushSize(availableBrushSizes[1]);
                    break;
                case '3':
                    setBrushSize(availableBrushSizes[2]);
                    break;
                case '4':
                    setBrushSize(availableBrushSizes[3]);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, availableBrushSizes]);

    // Tool Switching Logic
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Reset default states
        canvas.isDrawingMode = false;
        canvas.selection = false;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'default';

        // Disable selection on all objects by default
        canvas.forEachObject((obj) => {
            obj.set({
                selectable: false,
                evented: true,
                hoverCursor: 'default'
            });
        });

        // Remove object erasing listener if present (we'll re-add if needed)
        canvas.off('mouse:down');
        canvas.off('mouse:move');
        canvas.off('mouse:up');

        // Re-attach standard listeners if needed (none strictly for now unless shape)

        switch (activeTool) {
            case 'select':
                canvas.isDrawingMode = false;
                canvas.selection = true;
                canvas.defaultCursor = 'default';
                canvas.forEachObject((obj) => {
                    obj.set({
                        selectable: true,
                        evented: true,
                        hoverCursor: 'move'
                    });
                });
                canvas.requestRenderAll();
                break;

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

            case 'eraser_object': {
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
            }

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

    }, [activeTool, color, brushSize, shapeStyles, handleShapeMouseDown, handleShapeMouseMove, handleShapeMouseUp]);

    // Handle background change
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const pattern = createBackgroundPattern(background);
        canvas.setBackgroundColor(pattern, () => {
            canvas.renderAll();
        });
    }, [background]);

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
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="toolbar" direction="horizontal">
                            {(provided) => (
                                <ToolGroup
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                >
                                    {toolbarItems.map((item, index) => renderToolbarItem(item, index))}
                                    {provided.placeholder}
                                </ToolGroup>
                            )}
                        </Droppable>
                    </DragDropContext>
                </Toolbar>
                {isColorEditOpen && (
                    <Backdrop
                        $centered={!settingsAnchor}
                        onClick={(e) => {
                            const now = Date.now();
                            if (now - openedTimeRef.current < 400) return; // Ignore ghost clicks
                            if (e.target === e.currentTarget) handleColorCancel();
                        }}>
                        <CompactModal
                            $anchor={settingsAnchor || undefined}
                            onClick={e => e.stopPropagation()}
                        >
                            <ColorInputWrapper>
                                <CustomColorInput
                                    type="color"
                                    value={tempColor}
                                    onChange={(e) => setTempColor(e.target.value)}
                                />
                                <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>{tempColor.toUpperCase()}</div>
                            </ColorInputWrapper>
                            <CompactModalFooter>
                                <CompactModalButton onClick={handleColorReset}>
                                    {t.drawing?.reset || 'Reset'}
                                </CompactModalButton>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <CompactModalButton onClick={handleColorCancel}>
                                        {t.drawing?.cancel || 'Cancel'}
                                    </CompactModalButton>
                                    <CompactModalButton onClick={handleColorOk} $variant="primary">
                                        {t.drawing?.ok || 'OK'}
                                    </CompactModalButton>
                                </div>
                            </CompactModalFooter>
                        </CompactModal>
                    </Backdrop>
                )}

                {isSizeEditOpen && (
                    <Backdrop
                        $centered={!settingsAnchor}
                        onClick={(e) => {
                            const now = Date.now();
                            if (now - openedTimeRef.current < 400) return; // Ignore ghost clicks
                            if (e.target === e.currentTarget) handleSizeCancel();
                        }}>
                        <CompactModal
                            $anchor={settingsAnchor || undefined}
                            onClick={e => e.stopPropagation()}
                        >
                            <ColorInputWrapper>
                                <CustomRangeInput
                                    type="range"
                                    min="1"
                                    max="100"
                                    $size={tempSize}
                                    value={tempSize}
                                    onChange={(e) => setTempSize(parseInt(e.target.value))}
                                />
                                <CustomNumberInput
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={tempSize}
                                    onChange={(e) => setTempSize(parseInt(e.target.value) || 1)}
                                />
                            </ColorInputWrapper>
                            <CompactModalFooter>
                                <CompactModalButton onClick={handleSizeReset}>
                                    {t.drawing?.reset || 'Reset'}
                                </CompactModalButton>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <CompactModalButton onClick={handleSizeCancel}>
                                        {t.drawing?.cancel || 'Cancel'}
                                    </CompactModalButton>
                                    <CompactModalButton onClick={handleSizeOk} $variant="primary">
                                        {t.drawing?.ok || 'OK'}
                                    </CompactModalButton>
                                </div>
                            </CompactModalFooter>
                        </CompactModal>
                    </Backdrop>
                )}
                {isShapeSettingsOpen && (
                    <Backdrop
                        $centered={!settingsAnchor}
                        onClick={(e) => {
                            const now = Date.now();
                            if (now - openedTimeRef.current < 400) return; // Ignore ghost clicks
                            if (e.target === e.currentTarget) handleShapeSettingsCancel();
                        }}>
                        <CompactModal
                            $anchor={settingsAnchor || undefined}
                            onClick={e => e.stopPropagation()}
                            style={{ minWidth: '160px' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {DASH_OPTIONS.map((dash, index) => (
                                    <DashOption
                                        key={index}
                                        $active={tempDashIndex === index}
                                        onClick={() => setTempDashIndex(index)}
                                    >
                                        <DashPreview $dash={dash || null} />
                                    </DashOption>
                                ))}
                            </div>
                            <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }}></div>
                            <ColorInputWrapper>
                                <CustomRangeInput
                                    type="range"
                                    min="10"
                                    max="100"
                                    $size={10}
                                    $opacityValue={tempShapeOpacity}
                                    value={tempShapeOpacity}
                                    onChange={(e) => setTempShapeOpacity(parseInt(e.target.value))}
                                />
                                <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 500 }}>
                                    {tempShapeOpacity}%
                                </div>
                            </ColorInputWrapper>
                            <CompactModalFooter>
                                <CompactModalButton onClick={handleShapeSettingsReset}>
                                    {t.drawing?.reset || 'Reset'}
                                </CompactModalButton>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <CompactModalButton onClick={handleShapeSettingsCancel}>
                                        {t.drawing?.cancel || 'Cancel'}
                                    </CompactModalButton>
                                    <CompactModalButton onClick={handleShapeSettingsOk} $variant="primary">
                                        {t.drawing?.ok || 'OK'}
                                    </CompactModalButton>
                                </div>
                            </CompactModalFooter>
                        </CompactModal>
                    </Backdrop>
                )}

                <CanvasWrapper ref={containerRef}>
                    <canvas ref={canvasRef} />
                </CanvasWrapper>
            </ModalContainer>
        </ModalOverlay>
    );
};
