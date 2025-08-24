import * as React from 'react';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import CircuitMode from './components/CircuitMode';
import SignalMode from './components/SignalMode';
import ContextMenu from './components/ContextMenu';
import type { CircuitComponent, SignalParams, ContextMenuData, Connection } from './types';
import { AppMode, WaveformType, ComponentType } from './types';
import { runSimulation } from './simulation/solver';

const App: React.FC = () => {
    const [mode, setMode] = React.useState<AppMode>(AppMode.Circuit);
    const [components, setComponents] = React.useState<CircuitComponent[]>([]);
    const [connections, setConnections] = React.useState<Connection[]>([]);
    const [signalParams, setSignalParams] = React.useState<SignalParams>({
        type: WaveformType.Sine,
        frequency: 1,
        amplitude: 5,
        phase: 0,
    });
    const [contextMenu, setContextMenu] = React.useState<ContextMenuData>({
        visible: false,
        x: 0,
        y: 0,
        targetId: null,
        targetType: null,
    });
    const [editingComponentId, setEditingComponentId] = React.useState<string | null>(null);
    
    const handleReset = () => {
        if (mode === AppMode.Circuit) {
            setComponents([]);
            setConnections([]);
        } else {
             setComponents(prev => prev.map(c => {
                const { voltage, current, ...rest } = c;
                return rest;
            }));
            setSignalParams({
                type: WaveformType.Sine,
                frequency: 1,
                amplitude: 5,
                phase: 0,
            });
        }
    };

    const closeContextMenu = React.useCallback(() => {
        setContextMenu(prev => ({ ...prev, visible: false }));
    }, []);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const target = e.target as HTMLElement;
        const componentElement = target.closest('[id^="comp_"]');
        const wireElement = target.closest('[id^="wire_"]');
        
        if (componentElement) {
             // This is handled by the component's onContextMenu prop
        } else if (wireElement) {
            setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                targetId: wireElement.id,
                targetType: 'wire',
            });
        }
        else {
            setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                targetId: null,
                targetType: 'canvas',
            });
        }
    };

    const handleComponentRightClick = (e: React.MouseEvent, componentId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            targetId: componentId,
            targetType: 'component',
        });
    };

    const handleDelete = (id: string, type: 'component' | 'wire') => {
        if (type === 'component') {
            setComponents(prev => prev.filter(c => c.id !== id));
            setConnections(prev => prev.filter(conn => conn.start.componentId !== id && conn.end.componentId !== id));
        } else if (type === 'wire') {
            setConnections(prev => prev.filter(conn => conn.id !== id));
        }
    };
    
    const handleDuplicate = (id: string) => {
        const componentToDuplicate = components.find(c => c.id === id);
        if (!componentToDuplicate) return;

        const newComponent: CircuitComponent = {
            ...componentToDuplicate,
            id: `comp_${Date.now()}`,
            position: {
                x: componentToDuplicate.position.x + 20,
                y: componentToDuplicate.position.y + 20,
            },
            voltage: undefined,
            current: undefined,
        };

        setComponents(prev => [...prev, newComponent]);
    };

    const handleShowProperties = (id: string) => {
        const component = components.find(c => c.id === id);
        if (component?.type === ComponentType.Oscilloscope) return;
        setEditingComponentId(id);
    };

    const handleSimulate = () => {
        if (mode !== AppMode.Circuit) return;

        const simulationResults = runSimulation(components, connections);
        
        if (Object.keys(simulationResults).length === 0) {
            // TODO: Add a user-facing notification for simulation failure
            console.error("Simulation failed or circuit is invalid.");
            return;
        }

        setComponents(prevComponents =>
            prevComponents.map(comp => {
                const result = simulationResults[comp.id];
                if (result) {
                    return { ...comp, voltage: result.voltage, current: result.current };
                }
                return comp;
            })
        );
    };

    React.useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Close if not clicking on context menu itself
            if (contextMenu.visible && !target.closest('.fixed.z-50')) {
                closeContextMenu();
            }
        };

        if (contextMenu.visible) {
            window.addEventListener('click', handleClick);
        }
        return () => {
            window.removeEventListener('click', handleClick);
        };
    }, [contextMenu.visible, closeContextMenu]);


    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden">
            <Header />
            <div className="flex flex-1 pt-12">
                <Toolbar 
                    currentMode={mode} 
                    setMode={setMode} 
                    onReset={handleReset} 
                    onSimulate={handleSimulate} 
                />
                <main className="flex-1 h-full" onContextMenu={handleContextMenu}>
                    {mode === AppMode.Circuit ? (
                        <CircuitMode 
                            components={components} 
                            setComponents={setComponents}
                            connections={connections}
                            setConnections={setConnections}
                            onComponentRightClick={handleComponentRightClick} 
                            editingComponentId={editingComponentId}
                            setEditingComponentId={setEditingComponentId}
                        />
                    ) : (
                        <SignalMode params={signalParams} setParams={setSignalParams} />
                    )}
                </main>
            </div>
            <ContextMenu 
                menuData={contextMenu} 
                onClose={closeContextMenu} 
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onShowProperties={handleShowProperties}
            />
        </div>
    );
};

export default App;
