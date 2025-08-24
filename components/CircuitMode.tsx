
import * as React from 'react';
import type { CircuitComponent, Connection, ConnectionPoint } from '../types';
import { ComponentType } from '../types';
import { ResistorIcon, CapacitorIcon, InductorIcon, PowerSourceIcon, OscilloscopeIcon } from './Icons';

const COMPONENT_WIDTH = 80;

// --- Helper Functions ---
const getUnit = (type: ComponentType): string => {
    switch (type) {
        case ComponentType.Resistor: return 'Ω';
        case ComponentType.Capacitor: return 'µF';
        case ComponentType.Inductor: return 'mH';
        case ComponentType.PowerSource: return 'V';
        default: return '';
    }
};

const formatValue = (value: number, type: ComponentType): string => {
    if (type === ComponentType.Oscilloscope) return '';
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}k`;
    return value.toString();
};

const getTerminalPosition = (component: CircuitComponent, terminalIndex: 0 | 1): { x: number; y: number } => {
    const offsetX = terminalIndex === 0 ? -COMPONENT_WIDTH / 2 : COMPONENT_WIDTH / 2;
    return {
        x: component.position.x + offsetX,
        y: component.position.y,
    };
};

// --- Sub-components ---

interface CircuitComponentViewProps {
  component: CircuitComponent;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onTerminalMouseDown: (e: React.MouseEvent, componentId: string, terminalIndex: 0 | 1) => void;
  onTerminalMouseUp: (e: React.MouseEvent, componentId: string, terminalIndex: 0 | 1) => void;
  onDoubleClick: (e: React.MouseEvent, componentId: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  connectedTerminals: Set<string>;
}

const CircuitComponentView: React.FC<CircuitComponentViewProps> = React.memo(({ component, onMouseDown, onTerminalMouseDown, onTerminalMouseUp, onDoubleClick, onContextMenu, connectedTerminals }) => {
    const componentIcons: Record<ComponentType, React.ReactNode> = {
        [ComponentType.Resistor]: <ResistorIcon className="w-20 h-8" />,
        [ComponentType.Capacitor]: <CapacitorIcon className="w-20 h-8" />,
        [ComponentType.Inductor]: <InductorIcon className="w-20 h-8" />,
        [ComponentType.PowerSource]: <PowerSourceIcon className="w-20 h-8" />,
        [ComponentType.Oscilloscope]: <OscilloscopeIcon className="w-20 h-8" />,
    };

    const handleTerminalMouseDown = (e: React.MouseEvent, terminalIndex: 0 | 1) => {
        e.stopPropagation();
        onTerminalMouseDown(e, component.id, terminalIndex);
    };

    const handleTerminalMouseUp = (e: React.MouseEvent, terminalIndex: 0 | 1) => {
        e.stopPropagation();
        onTerminalMouseUp(e, component.id, terminalIndex);
    };

    const isConnected = (index: 0 | 1) => connectedTerminals.has(`${component.id}-${index}`);

    return (
        <div
            id={component.id}
            className="absolute select-none cursor-grab active:cursor-grabbing group"
            style={{ left: component.position.x, top: component.position.y, transform: 'translate(-50%, -50%)' }}
            onMouseDown={(e) => onMouseDown(e, component.id)}
            onDoubleClick={(e) => onDoubleClick(e, component.id)}
            onContextMenu={(e) => onContextMenu(e, component.id)}
        >
            <div className="relative p-2 rounded-lg group-hover:bg-blue-500/10 transition-colors">
                {componentIcons[component.type]}
                {/* Terminals */}
                <div 
                    className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center cursor-crosshair"
                    onMouseDown={(e) => handleTerminalMouseDown(e, 0)}
                    onMouseUp={(e) => handleTerminalMouseUp(e, 0)}
                >
                    <div className={`w-3 h-3 ${isConnected(0) ? 'bg-blue-500' : 'bg-gray-400 group-hover:bg-blue-500'} rounded-full border-2 border-white dark:border-gray-800 transition-colors`} />
                </div>
                <div 
                    className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center cursor-crosshair"
                    onMouseDown={(e) => handleTerminalMouseDown(e, 1)}
                    onMouseUp={(e) => handleTerminalMouseUp(e, 1)}
                >
                    <div className={`w-3 h-3 ${isConnected(1) ? 'bg-blue-500' : 'bg-gray-400 group-hover:bg-blue-500'} rounded-full border-2 border-white dark:border-gray-800 transition-colors`} />
                </div>
            </div>
            <div className="text-center text-xs mt-1 text-gray-500 dark:text-gray-400 font-mono">
                {formatValue(component.value, component.type)} {getUnit(component.type)}
            </div>
             {typeof component.voltage === 'number' && typeof component.current === 'number' && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded text-xs text-green-700 dark:text-green-300 whitespace-nowrap font-mono shadow-md animate-fade-in">
                    {component.voltage.toFixed(2)}V | {(component.current * 1000).toFixed(2)}mA
                </div>
            )}
        </div>
    );
});

// --- Main Component ---

interface CircuitModeProps {
    components: CircuitComponent[];
    setComponents: React.Dispatch<React.SetStateAction<CircuitComponent[]>>;
    connections: Connection[];
    setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
    onComponentRightClick: (e: React.MouseEvent, componentId: string) => void;
}

const CircuitMode: React.FC<CircuitModeProps> = ({ components, setComponents, connections, setConnections, onComponentRightClick }) => {
    const [dragging, setDragging] = React.useState<{ id: string, offsetX: number, offsetY: number } | null>(null);
    const [wireDrawing, setWireDrawing] = React.useState<{ start: ConnectionPoint; mousePos: { x: number; y: number } } | null>(null);
    const [editingComponentId, setEditingComponentId] = React.useState<string | null>(null);
    const canvasRef = React.useRef<HTMLDivElement>(null);
    const editingInputRef = React.useRef<HTMLInputElement>(null);

    const componentsById = React.useMemo(() => 
        components.reduce((acc, comp) => {
            acc[comp.id] = comp;
            return acc;
        }, {} as Record<string, CircuitComponent>),
    [components]);
    
    const connectedTerminals = React.useMemo(() => {
        const terminalSet = new Set<string>();
        connections.forEach(conn => {
            terminalSet.add(`${conn.start.componentId}-${conn.start.terminalIndex}`);
            terminalSet.add(`${conn.end.componentId}-${conn.end.terminalIndex}`);
        });
        return terminalSet;
    }, [connections]);

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const componentType = e.dataTransfer.getData('componentType') as ComponentType;
        if (!componentType || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newComponent: CircuitComponent = {
            id: `comp_${Date.now()}`,
            type: componentType,
            position: { x, y },
            value: 1000, // Default value
        };
        setComponents(prev => [...prev, newComponent]);
    };
    
    const handleComponentMouseDown = (e: React.MouseEvent, id: string) => {
        if (e.button !== 0 || e.target instanceof HTMLInputElement) return;
        const component = components.find(c => c.id === id);
        if(component && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const offsetX = e.clientX - rect.left - component.position.x;
            const offsetY = e.clientY - rect.top - component.position.y;
            setDragging({ id, offsetX, offsetY });
        }
    };
    
    const handleTerminalMouseDown = (_e: React.MouseEvent, componentId: string, terminalIndex: 0 | 1) => {
        const startComponent = componentsById[componentId];
        if (!startComponent) return;
        const startPos = getTerminalPosition(startComponent, terminalIndex);
        setWireDrawing({ start: { componentId, terminalIndex }, mousePos: startPos });
    };

    const handleTerminalMouseUp = (_e: React.MouseEvent, componentId: string, terminalIndex: 0 | 1) => {
        if (!wireDrawing) return;
        if (wireDrawing.start.componentId === componentId) { // Avoid connecting to self
            setWireDrawing(null);
            return;
        }

        const newConnection: Connection = {
            id: `wire_${Date.now()}`,
            start: wireDrawing.start,
            end: { componentId, terminalIndex },
        };
        setConnections(prev => [...prev, newConnection]);
        setWireDrawing(null);
    };

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (dragging) {
            const x = mouseX - dragging.offsetX;
            const y = mouseY - dragging.offsetY;
            setComponents(prev => 
                prev.map(c => 
                    c.id === dragging.id ? { ...c, position: { x, y } } : c
                )
            );
        } else if (wireDrawing) {
            setWireDrawing(prev => prev ? { ...prev, mousePos: { x: mouseX, y: mouseY } } : null);
        }
    }, [dragging, wireDrawing, setComponents]);

    const handleMouseUp = React.useCallback(() => {
        setDragging(null);
        setWireDrawing(null);
    }, []);

    const handleDoubleClick = (_e: React.MouseEvent, componentId: string) => {
        const component = components.find(c => c.id === componentId);
        if (component?.type === ComponentType.Oscilloscope) return;
        setEditingComponentId(componentId);
        setTimeout(() => editingInputRef.current?.select(), 0);
    };
    
    const handleValueChange = () => {
        if (!editingComponentId || !editingInputRef.current) return;
        const newValue = parseFloat(editingInputRef.current.value);
        if (!isNaN(newValue)) {
            setComponents(prev => prev.map(c => c.id === editingComponentId ? { ...c, value: newValue } : c));
        }
        setEditingComponentId(null);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleValueChange();
        if (e.key === 'Escape') setEditingComponentId(null);
    }
    
    const editingComponent = React.useMemo(() => components.find(c => c.id === editingComponentId), [components, editingComponentId]);

    React.useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const Wire = ({ connection }: { connection: Connection }) => {
        const startComp = componentsById[connection.start.componentId];
        const endComp = componentsById[connection.end.componentId];
        if (!startComp || !endComp) return null;

        const startPos = getTerminalPosition(startComp, connection.start.terminalIndex);
        const endPos = getTerminalPosition(endComp, connection.end.terminalIndex);
        const controlOffset = Math.max(30, Math.abs(endPos.x - startPos.x) * 0.4);

        const path = `M ${startPos.x} ${startPos.y} C ${startPos.x + controlOffset} ${startPos.y}, ${endPos.x - controlOffset} ${endPos.y}, ${endPos.x} ${endPos.y}`;

        return <path id={connection.id} d={path} stroke="currentColor" strokeWidth="2" fill="none" className="stroke-gray-400 dark:stroke-gray-500 hover:stroke-blue-500 transition-all" />;
    };

    return (
        <div 
            ref={canvasRef}
            className="w-full h-full relative overflow-hidden" 
            onDragOver={handleDragOver} 
            onDrop={handleDrop}
        >
            {/* Grid background */}
            <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                    <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                        <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(128,128,128,0.1)" strokeWidth="0.5"/>
                    </pattern>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <rect width="40" height="40" fill="url(#smallGrid)"/>
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(128,128,128,0.2)" strokeWidth="1"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Wires */}
            <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none">
                <g className="pointer-events-auto">
                    {connections.map(conn => <Wire key={conn.id} connection={conn} />)}
                </g>
                {wireDrawing && componentsById[wireDrawing.start.componentId] && (
                    <path
                        d={`M ${getTerminalPosition(componentsById[wireDrawing.start.componentId], wireDrawing.start.terminalIndex).x} ${getTerminalPosition(componentsById[wireDrawing.start.componentId], wireDrawing.start.terminalIndex).y} L ${wireDrawing.mousePos.x} ${wireDrawing.mousePos.y}`}
                        stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" fill="none" className="stroke-blue-500"
                    />
                )}
            </svg>

            {/* Components */}
            {components.map(comp => (
                <CircuitComponentView
                    key={comp.id}
                    component={comp}
                    onMouseDown={handleComponentMouseDown}
                    onTerminalMouseDown={handleTerminalMouseDown}
                    onTerminalMouseUp={handleTerminalMouseUp}
                    onDoubleClick={handleDoubleClick}
                    onContextMenu={(e) => { e.stopPropagation(); onComponentRightClick(e, comp.id); }}
                    connectedTerminals={connectedTerminals}
                />
            ))}
            
            {/* Value Editor */}
            {editingComponent && (
                <div style={{ left: editingComponent.position.x, top: editingComponent.position.y + 30, transform: 'translateX(-50%)' }} className="absolute z-10">
                    <input
                        ref={editingInputRef}
                        type="number"
                        defaultValue={editingComponent.value}
                        onBlur={handleValueChange}
                        onKeyDown={handleEditKeyDown}
                        className="w-24 p-1.5 text-center bg-white dark:bg-gray-700 border border-blue-500 rounded-md shadow-lg outline-none text-sm"
                    />
                </div>
            )}

            {components.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-gray-400 dark:text-gray-500 text-lg">Drag components to start building</p>
                </div>
            )}
        </div>
    );
};

export default CircuitMode;
