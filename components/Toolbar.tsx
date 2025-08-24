
import React from 'react';
import { AppMode, ComponentType } from '../types';
import { ResistorIcon, CapacitorIcon, InductorIcon, PowerSourceIcon, OscilloscopeIcon, CircuitIcon, SignalIcon, ResetIcon, PlayIcon } from './Icons';

interface ToolbarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  onReset: () => void;
  onSimulate: () => void;
}

const ToolButton: React.FC<{
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ label, isActive = false, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full p-2.5 rounded-xl transition-all duration-200 ${
            isActive ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title={label}
    >
        {children}
        <span className="ml-3 font-medium hidden md:inline">{label}</span>
    </button>
);

const DraggableComponent: React.FC<{
  type: ComponentType;
  children: React.ReactNode;
}> = ({ type, children }) => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('componentType', type);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="flex items-center w-full p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-grab active:cursor-grabbing transition-all duration-200"
            title={`Drag to add ${type.toLowerCase()}`}
        >
            {children}
            <span className="ml-3 font-medium hidden md:inline">{type.charAt(0) + type.slice(1).toLowerCase()}</span>
        </div>
    );
}

const Toolbar: React.FC<ToolbarProps> = ({ currentMode, setMode, onReset, onSimulate }) => {
  return (
    <aside className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto h-16 md:h-auto md:w-56 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-t md:border-t-0 md:border-r border-black/5 dark:border-white/5 z-20">
      <nav className="h-full p-2 md:p-4">
        <ul className="flex md:flex-col items-center justify-around md:justify-start md:items-stretch h-full space-x-2 md:space-x-0 md:space-y-2">
            <li>
                <h3 className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:block">Mode</h3>
            </li>
            <li>
                <ToolButton label="Circuit" isActive={currentMode === AppMode.Circuit} onClick={() => setMode(AppMode.Circuit)}>
                    <CircuitIcon className="w-6 h-6" />
                </ToolButton>
            </li>
            <li>
                <ToolButton label="Signal" isActive={currentMode === AppMode.Signal} onClick={() => setMode(AppMode.Signal)}>
                    <SignalIcon className="w-6 h-6" />
                </ToolButton>
            </li>
            {currentMode === AppMode.Circuit && (
              <>
                <li className="pt-2">
                    <h3 className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:block">Components</h3>
                </li>
                <li>
                    <DraggableComponent type={ComponentType.Resistor}><ResistorIcon className="w-10 h-6" /></DraggableComponent>
                </li>
                <li>
                    <DraggableComponent type={ComponentType.Capacitor}><CapacitorIcon className="w-10 h-6" /></DraggableComponent>
                </li>
                 <li>
                    <DraggableComponent type={ComponentType.Inductor}><InductorIcon className="w-10 h-6" /></DraggableComponent>
                </li>
                 <li>
                    <DraggableComponent type={ComponentType.PowerSource}><PowerSourceIcon className="w-10 h-6" /></DraggableComponent>
                </li>
                 <li>
                    <DraggableComponent type={ComponentType.Oscilloscope}><OscilloscopeIcon className="w-10 h-6" /></DraggableComponent>
                </li>
                 <li className="pt-2">
                    <h3 className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:block">Actions</h3>
                </li>
                <li>
                    <ToolButton label="Simulate" onClick={onSimulate}>
                        <PlayIcon className="w-6 h-6 text-green-500" />
                    </ToolButton>
                </li>
              </>
            )}

            <li className="md:mt-auto md:pt-4">
                <ToolButton label="Reset" onClick={onReset}>
                    <ResetIcon className="w-6 h-6" />
                </ToolButton>
            </li>
            <li className="hidden md:block pt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} Tanmay Galav
            </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Toolbar;