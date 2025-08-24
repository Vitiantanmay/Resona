
import type { CircuitComponent, Connection } from '../types';
import { ComponentType } from '../types';

type SimulationResult = Record<string, { voltage: number; current: number }>;

/**
 * A simple DC circuit solver for single-loop circuits.
 *
 * This function analyzes a given set of components and connections to calculate
 * voltage and current for each element. It currently supports simple, single-loop
 * circuits containing exactly one power source and any number of resistors.
 *
 * DC steady-state behavior is assumed:
 * - Capacitors are treated as open circuits (0 current).
 * - Inductors are treated as short circuits (0 voltage).
 *
 * @param components - An array of all circuit components on the canvas.
 * @param connections - An array of all connections (wires) between components.
 * @returns A dictionary mapping each component's ID to its calculated voltage and current.
 *          Returns an empty object if the circuit is invalid or cannot be solved.
 */
export const runSimulation = (
  components: CircuitComponent[],
  connections: Connection[]
): SimulationResult => {
  const powerSources = components.filter(c => c.type === ComponentType.PowerSource);

  // --- Validation: Ensure the circuit is a simple, solvable loop ---
  if (powerSources.length !== 1) {
    console.error(`Simulation requires exactly one power source, but found ${powerSources.length}.`);
    return {};
  }
  if (connections.length < components.length && components.length > 1) {
    console.error("Simulation failed: The circuit may not be a closed loop.");
    return {};
  }

  const source = powerSources[0];
  const adjacencyList = new Map<string, { componentId: string, terminalIndex: 0 | 1 }>();

  connections.forEach(conn => {
    const startKey = `${conn.start.componentId}-${conn.start.terminalIndex}`;
    const endKey = `${conn.end.componentId}-${conn.end.terminalIndex}`;
    adjacencyList.set(startKey, conn.end);
    adjacencyList.set(endKey, conn.start);
  });
  
  // --- Trace the circuit loop ---
  const loopComponents: CircuitComponent[] = [];
  const visited = new Set<string>();
  let currentComponent = source;
  let currentTerminalIndex: 0 | 1 = 1; // Start from the positive terminal
  
  for (let i = 0; i < components.length; i++) {
      if (!currentComponent || visited.has(currentComponent.id)) {
          console.error("Failed to trace a simple loop. The circuit might be open or have branches.");
          return {};
      }

      visited.add(currentComponent.id);
      loopComponents.push(currentComponent);

      const currentKey = `${currentComponent.id}-${currentTerminalIndex}`;
      const nextConnection = adjacencyList.get(currentKey);

      if (!nextConnection) {
        if (components.length > 1) { // An open circuit is fine if it's just one component
            console.error("Circuit is not a closed loop.");
            return {};
        } else {
            // It's a single component, not connected. This is not a loop.
            break;
        }
      }
      
      const nextComponent = components.find(c => c.id === nextConnection.componentId);
      if(!nextComponent) return {};
      
      const arrivalTerminal = nextConnection.terminalIndex;
      const departureTerminal = arrivalTerminal === 0 ? 1 : 0;

      currentComponent = nextComponent;
      
      // If we are back at the source, the loop is complete
      if (currentComponent.id === source.id) break;

      currentTerminalIndex = departureTerminal;
  }
  
  if(loopComponents.length !== components.length && components.length > 1) {
      console.error("All components must be part of a single loop.");
      return {};
  }


  // --- Calculate total resistance and current ---
  let totalResistance = 0;
  loopComponents.forEach(comp => {
    if (comp.type === ComponentType.Resistor) {
      totalResistance += comp.value;
    }
    // In DC, inductors act as short circuits (0 resistance), so we add nothing.
  });
  
  const hasCapacitor = loopComponents.some(c => c.type === ComponentType.Capacitor);
  
  // In DC, a capacitor in a series loop acts as an open circuit.
  const loopCurrent = hasCapacitor || totalResistance <= 0 ? 0 : source.value / totalResistance;

  // --- Calculate voltage and current for each component ---
  const results: SimulationResult = {};
  components.forEach(comp => {
    // Initialize all components, even those not in the loop (for open circuits)
    results[comp.id] = { voltage: 0, current: 0 };
  });

  loopComponents.forEach(comp => {
    switch (comp.type) {
      case ComponentType.PowerSource:
        results[comp.id] = { voltage: comp.value, current: loopCurrent };
        break;
      case ComponentType.Resistor:
        results[comp.id] = { voltage: loopCurrent * comp.value, current: loopCurrent };
        break;
      case ComponentType.Inductor:
        // Acts as a short circuit in DC
        results[comp.id] = { voltage: 0, current: loopCurrent };
        break;
      case ComponentType.Capacitor:
         // Acts as an open circuit in DC, all voltage drops across it if it's the only element besides the source
        const voltageDrop = loopCurrent > 0 ? 0 : source.value;
        results[comp.id] = { voltage: voltageDrop, current: 0 };
        break;
      default:
        results[comp.id] = { voltage: 0, current: 0 };
    }
  });

  return results;
};
