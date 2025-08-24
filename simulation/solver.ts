
import type { CircuitComponent, Connection } from '../types';
import { ComponentType } from '../types';

type SimulationResult = Record<string, { voltage: number; current: number }>;

// Helper function to solve Ax=b using Gaussian elimination with partial pivoting.
const solveLinearSystem = (A: number[][], b: number[]): number[] | null => {
    const n = A.length;
    const Ab = A.map((row, i) => [...row, b[i]]);

    for (let i = 0; i < n; i++) {
        // Find pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(Ab[k][i]) > Math.abs(Ab[maxRow][i])) {
                maxRow = k;
            }
        }

        // Swap rows
        [Ab[i], Ab[maxRow]] = [Ab[maxRow], Ab[i]];

        // Check for singular or near-singular matrix
        if (Math.abs(Ab[i][i]) < 1e-12) {
            console.error("Matrix is singular, circuit may be unsolvable (e.g., floating components or shorted voltage source).");
            return null;
        }

        // Make all rows below this one 0 in current column
        for (let k = i + 1; k < n; k++) {
            const factor = Ab[k][i] / Ab[i][i];
            for (let j = i; j < n + 1; j++) {
                Ab[k][j] -= factor * Ab[i][j];
            }
        }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) {
            sum += Ab[i][j] * x[j];
        }
        x[i] = (Ab[i][n] - sum) / Ab[i][i];
    }
    return x;
};

export const runSimulation = (
  components: CircuitComponent[],
  connections: Connection[]
): SimulationResult => {
    if (components.length === 0) return {};

    // 1. Find all distinct electrical nodes using a graph traversal (BFS).
    const terminalToNode = new Map<string, number>();
    const nodes: { componentId: string, terminalIndex: 0 | 1 }[][] = [];
    let nodeCounter = 0;
    
    const adj = new Map<string, { componentId: string, terminalIndex: 0 | 1 }[]>();
    connections.forEach(conn => {
        const startKey = `${conn.start.componentId}-${conn.start.terminalIndex}`;
        const endKey = `${conn.end.componentId}-${conn.end.terminalIndex}`;
        if (!adj.has(startKey)) adj.set(startKey, []);
        if (!adj.has(endKey)) adj.set(endKey, []);
        adj.get(startKey)!.push(conn.end);
        adj.get(endKey)!.push(conn.start);
    });

    for (const comp of components) {
      for (const terminalIndex of [0, 1] as const) {
        const key = `${comp.id}-${terminalIndex}`;
        if (terminalToNode.has(key)) continue;
        
        const newNode: { componentId: string, terminalIndex: 0 | 1 }[] = [];
        const q = [{ componentId: comp.id, terminalIndex }];
        terminalToNode.set(key, nodeCounter);
        newNode.push({ componentId: comp.id, terminalIndex });

        let head = 0;
        while(head < q.length) {
            const curr = q[head++];
            const currKey = `${curr.componentId}-${curr.terminalIndex}`;
            const neighbors = adj.get(currKey) || [];
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.componentId}-${neighbor.terminalIndex}`;
                if (!terminalToNode.has(neighborKey)) {
                    terminalToNode.set(neighborKey, nodeCounter);
                    newNode.push(neighbor);
                    q.push(neighbor);
                }
            }
        }
        nodes.push(newNode);
        nodeCounter++;
      }
    }
    
    const numNodes = nodes.length;
    if (numNodes === 0) return {};

    // 2. Select a ground node (reference voltage = 0).
    let groundNode = 0;
    const powerSources = components.filter(c => c.type === ComponentType.PowerSource);
    if (powerSources.length > 0) {
        // Prefer a node connected to a power source's negative terminal (terminal 0).
        const sourceGroundTerminal = `${powerSources[0].id}-0`;
        groundNode = terminalToNode.get(sourceGroundTerminal) ?? 0;
    } else {
        // If no power source, the circuit is passive. All voltages/currents are zero.
        const results: SimulationResult = {};
        components.forEach(comp => {
            results[comp.id] = { voltage: 0, current: 0 };
        });
        return results;
    }


    // 3. Build the Modified Nodal Analysis (MNA) system of equations.
    // Components that need a current variable: voltage sources, inductors (shorts in DC), and ~0-ohm resistors (shorts).
    const componentsWithCurrents = components.filter(
        c => c.type === ComponentType.PowerSource || c.type === ComponentType.Inductor || (c.type === ComponentType.Resistor && c.value < 1e-9)
    );
    const numVoltageVars = numNodes - 1;
    const numCurrentVars = componentsWithCurrents.length;
    const matrixSize = numVoltageVars + numCurrentVars;

    if (matrixSize === 0) { // Handle circuits with only non-zero resistors
         const results: SimulationResult = {};
         components.forEach(comp => {
            results[comp.id] = { voltage: 0, current: 0 };
         });
         return results;
    }

    const A = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0));
    const z = Array(matrixSize).fill(0);
    
    const nodeIndexMap = new Map<number, number>();
    let currentIndex = 0;
    for (let i = 0; i < numNodes; i++) {
        if (i !== groundNode) {
            nodeIndexMap.set(i, currentIndex++);
        }
    }
    
    // "Stamp" conductive components (normal resistors) into the matrix.
    components.forEach(comp => {
        if (comp.type === ComponentType.Resistor && comp.value >= 1e-9) {
            const g = 1 / comp.value;
            const n1 = terminalToNode.get(`${comp.id}-0`)!;
            const n2 = terminalToNode.get(`${comp.id}-1`)!;
            
            if (n1 !== groundNode) {
                const idx1 = nodeIndexMap.get(n1)!;
                A[idx1][idx1] += g;
            }
            if (n2 !== groundNode) {
                const idx2 = nodeIndexMap.get(n2)!;
                A[idx2][idx2] += g;
            }
            if (n1 !== groundNode && n2 !== groundNode) {
                const idx1 = nodeIndexMap.get(n1)!;
                const idx2 = nodeIndexMap.get(n2)!;
                A[idx1][idx2] -= g;
                A[idx2][idx1] -= g;
            }
        }
    });
    
    // "Stamp" components with current variables (voltage sources, inductors, shorts).
    componentsWithCurrents.forEach((comp, i) => {
        const currentVarIndex = numVoltageVars + i;
        // Assume terminal 0 is negative (-), terminal 1 is positive (+).
        const n1 = terminalToNode.get(`${comp.id}-0`)!;
        const n2 = terminalToNode.get(`${comp.id}-1`)!;
        
        // Voltage sources have their value, inductors and shorts are 0V.
        const value = comp.type === ComponentType.PowerSource ? comp.value : 0; 

        if (n2 !== groundNode) {
            const idx = nodeIndexMap.get(n2)!;
            A[idx][currentVarIndex] += 1;
            A[currentVarIndex][idx] += 1;
        }
        if (n1 !== groundNode) {
            const idx = nodeIndexMap.get(n1)!;
            A[idx][currentVarIndex] -= 1;
            A[currentVarIndex][idx] -= 1;
        }
        z[currentVarIndex] = value;
    });
    // Note: Capacitors are treated as open circuits in DC, so they aren't stamped.

    
    // 4. Solve the system for node voltages and source currents.
    const solution = solveLinearSystem(A, z);
    if (!solution) {
      console.error("Simulation failed: Could not solve linear system.");
      return {};
    }

    // 5. Calculate final voltage and current for each component.
    const results: SimulationResult = {};
    const nodeVoltages = new Map<number, number>();
    nodeVoltages.set(groundNode, 0);
    nodeIndexMap.forEach((matrixIdx, nodeId) => {
        nodeVoltages.set(nodeId, solution[matrixIdx]);
    });

    components.forEach(comp => {
        const n1_node = terminalToNode.get(`${comp.id}-0`);
        const n2_node = terminalToNode.get(`${comp.id}-1`);

        if (n1_node === undefined || n2_node === undefined) {
             results[comp.id] = { voltage: 0, current: 0 };
             return;
        }

        const v1 = nodeVoltages.get(n1_node) || 0;
        const v2 = nodeVoltages.get(n2_node) || 0;
        
        const voltage = Math.abs(v2 - v1);
        let current = 0;

        const withCurrentIndex = componentsWithCurrents.findIndex(c => c.id === comp.id);
        if (withCurrentIndex !== -1) {
            // Component has a solved current variable (V-source, inductor, short)
            current = Math.abs(solution[numVoltageVars + withCurrentIndex]);
        } else {
             switch (comp.type) {
                case ComponentType.Resistor:
                    // It's a normal resistor, use Ohm's law.
                    current = voltage / comp.value;
                    break;
                case ComponentType.Capacitor:
                    current = 0; // Open circuit in DC
                    break;
                default:
                    current = 0;
            }
        }
        results[comp.id] = { voltage, current };
    });

    return results;
};
