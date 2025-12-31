import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

export const SpectrumAnalyzer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      if (!audioEngine.analyser) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const bufferLength = audioEngine.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      audioEngine.analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Create gradient
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#fdba74'); // Orange 300
      gradient.addColorStop(1, '#c2410c'); // Orange 700

      ctx.fillStyle = gradient;

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;

        // Draw rounded bars
        ctx.beginPath();
        ctx.roundRect(x, height - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();

        x += barWidth + 1;
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="w-full h-24 bg-cream-50 rounded-lg overflow-hidden border border-orange-100 relative">
       <div className="absolute top-1 left-2 text-[9px] text-orange-400 font-mono tracking-widest uppercase z-10">Freq Analysis</div>
       <canvas ref={canvasRef} width={600} height={100} className="w-full h-full opacity-80" />
    </div>
  );
};