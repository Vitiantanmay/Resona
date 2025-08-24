export enum AppMode {
  Circuit = 'CIRCUIT',
  Signal = 'SIGNAL',
}

export enum ComponentType {
  Resistor = 'RESISTOR',
  Capacitor = 'CAPACITOR',
  Inductor = 'INDUCTOR',
  PowerSource = 'POWER_SOURCE',
  Oscilloscope = 'OSCILLOSCOPE',
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  position: { x: number; y: number };
  value: number; 
  voltage?: number;
  current?: number;
}

export interface ConnectionPoint {
  componentId: string;
  terminalIndex: 0 | 1; // 0 for left, 1 for right
}

export interface Connection {
  id: string;
  start: ConnectionPoint;
  end: ConnectionPoint;
}

export enum WaveformType {
  Sine = 'SINE',
  Square = 'SQUARE',
  Triangle = 'TRIANGLE',
}

export interface SignalParams {
  type: WaveformType;
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface ContextMenuData {
  visible: boolean;
  x: number;
  y: number;
  targetId: string | null;
  targetType: 'component' | 'canvas' | 'wire' | null;
}
