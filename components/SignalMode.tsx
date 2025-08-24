
import * as React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { SignalParams } from '../types';
import { WaveformType } from '../types';

interface SignalModeProps {
    params: SignalParams;
    setParams: React.Dispatch<React.SetStateAction<SignalParams>>;
}

const WaveformChart: React.FC<{ params: SignalParams }> = ({ params }) => {
    const data = React.useMemo(() => {
        const points = [];
        const cycles = 3;
        const numPoints = 200;
        
        for (let i = 0; i <= numPoints; i++) {
            const x = (i / numPoints) * cycles;
            let y;
            const phaseRad = (params.phase * Math.PI) / 180;
            const angularFrequency = 2 * Math.PI * params.frequency;

            const t = x / params.frequency;

            switch (params.type) {
                case WaveformType.Sine:
                    y = params.amplitude * Math.sin(angularFrequency * t + phaseRad);
                    break;
                case WaveformType.Square:
                    y = params.amplitude * Math.sign(Math.sin(angularFrequency * t + phaseRad));
                    break;
                case WaveformType.Triangle:
                    y = (2 * params.amplitude / Math.PI) * Math.asin(Math.sin(angularFrequency * t + phaseRad));
                    break;
                default:
                    y = 0;
            }
            points.push({ name: x.toFixed(2), v: y });
        }
        return points;
    }, [params]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                <XAxis dataKey="name" stroke="rgba(128, 128, 128, 0.5)" tick={{ fill: 'currentColor' }} />
                <YAxis domain={[-params.amplitude * 1.2, params.amplitude * 1.2]} stroke="rgba(128, 128, 128, 0.5)" tick={{ fill: 'currentColor' }} />
                <Tooltip 
                    contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.75rem',
                    }}
                    labelStyle={{ color: '#cbd5e1' }}
                />
                <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </LineChart>
        </ResponsiveContainer>
    );
};

const SignalControls: React.FC<SignalModeProps> = ({ params, setParams }) => {
    
    const handleParamChange = (param: keyof SignalParams, value: string | number | WaveformType) => {
        setParams(prev => ({ ...prev, [param]: value }));
    };

    const WaveformButton: React.FC<{type: WaveformType}> = ({ type }) => (
        <button
            onClick={() => handleParamChange('type', type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${params.type === type ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
        >
            {type.charAt(0) + type.slice(1).toLowerCase()}
        </button>
    );

    const SliderControl: React.FC<{label: string, id: keyof SignalParams, min: number, max: number, step: number, unit: string}> = ({label, id, min, max, step, unit}) => (
        <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center text-sm">
                <label htmlFor={id} className="font-medium text-gray-700 dark:text-gray-300">{label}</label>
                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-md text-xs font-mono">{params[id]} {unit}</span>
            </div>
            <input
                id={id}
                type="range"
                min={min}
                max={max}
                step={step}
                value={params[id] as number}
                onChange={(e) => handleParamChange(id, parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
        </div>
    );
    
    return (
        <div className="absolute bottom-16 md:bottom-0 md:top-auto md:right-0 w-full md:w-72 p-4">
             <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-lg space-y-4">
                <div className="grid grid-cols-3 gap-2">
                    <WaveformButton type={WaveformType.Sine} />
                    <WaveformButton type={WaveformType.Square} />
                    <WaveformButton type={WaveformType.Triangle} />
                </div>
                <SliderControl label="Frequency" id="frequency" min={0.1} max={10} step={0.1} unit="Hz" />
                <SliderControl label="Amplitude" id="amplitude" min={1} max={10} step={0.5} unit="V" />
                <SliderControl label="Phase" id="phase" min={0} max={360} step={1} unit="°" />
             </div>
        </div>
    );
};


const SignalMode: React.FC<SignalModeProps> = ({ params, setParams }) => {
    return (
        <div className="w-full h-full relative">
            <div className="w-full h-full p-4 md:p-8">
                <WaveformChart params={params} />
            </div>
            <SignalControls params={params} setParams={setParams} />
        </div>
    );
};

export default SignalMode;
