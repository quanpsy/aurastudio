import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from 'recharts';
import { getGoldenRatioPoints, calculateFibonacciSequence } from '../services/mathUtils';
import { PHI } from '../constants';

interface MathPanelProps {
  bpm: number;
}

export const MathPanel: React.FC<MathPanelProps> = ({ bpm }) => {
  const goldenData = useMemo(() => {
    const points = getGoldenRatioPoints(20);
    return points.map((val, idx) => ({ i: idx, val: val, golden: val * PHI }));
  }, []);

  const fibData = useMemo(() => {
    const seq = calculateFibonacciSequence(10);
    return seq.map((val, idx) => ({ i: idx, val }));
  }, []);

  return (
    <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-orange-200 h-full overflow-hidden flex flex-col">
      <h3 className="text-orange-900 font-bold mb-2 text-sm uppercase tracking-wider">Mathematics of Sound</h3>
      
      <div className="grid grid-cols-2 gap-4 h-32 mb-4">
        <div className="bg-cream-50 rounded p-2 border border-orange-100 relative">
          <span className="text-xs text-orange-400 absolute top-1 left-2">Golden Distribution (Φ)</span>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={goldenData}>
              <Line type="monotone" dataKey="val" stroke="#F97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-cream-50 rounded p-2 border border-orange-100 relative">
           <span className="text-xs text-orange-400 absolute top-1 left-2">Fibonacci Sequence</span>
           <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fibData}>
              <Line type="stepAfter" dataKey="val" stroke="#EA580C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-2 text-xs text-orange-800 font-mono">
        <div className="flex justify-between border-b border-orange-100 pb-1">
          <span>Golden Ratio (Φ):</span>
          <span>{PHI.toFixed(8)}</span>
        </div>
        <div className="flex justify-between border-b border-orange-100 pb-1">
          <span>BPM Cycle (ms):</span>
          <span>{(60000 / bpm).toFixed(2)}ms</span>
        </div>
        <div className="flex justify-between">
           <span>Harmonic Series:</span>
           <span>Σ 1/n</span>
        </div>
      </div>
    </div>
  );
};