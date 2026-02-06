import React, { useEffect, useRef } from 'react';

const ILChart = ({ priceChangeRange = [-50, 100], currentPriceChange = 10 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Detect dark mode
    const isDark = document.documentElement.classList.contains('dark');
    const colors = {
      grid: isDark ? '#475569' : '#e5e7eb',
      axis: isDark ? '#cbd5e1' : '#374151',
      label: isDark ? '#94a3b8' : '#6b7280',
      title: isDark ? '#e2e8f0' : '#111827',
      bg: isDark ? '#1e293b' : '#ffffff',
      zero: isDark ? '#64748b' : '#9ca3af',
    };

    // Clear canvas
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // Calculate IL for range
    const calculateIL = (priceChange) => {
      const ratio = 1 + priceChange / 100;
      const il = (2 * Math.sqrt(ratio)) / (1 + ratio) - 1;
      return il * 100;
    };

    // Generate data points
    const points = [];
    const step = 2;
    for (let pc = priceChangeRange[0]; pc <= priceChangeRange[1]; pc += step) {
      const il = calculateIL(pc);
      points.push({ priceChange: pc, il });
    }

    // Find min/max for scaling
    const minIL = Math.min(...points.map(p => p.il));
    const maxIL = Math.max(...points.map(p => p.il));
    const minPC = priceChangeRange[0];
    const maxPC = priceChangeRange[1];

    // Padding
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Scale functions
    const scaleX = (pc) => padding.left + ((pc - minPC) / (maxPC - minPC)) * chartWidth;
    const scaleY = (il) => padding.top + chartHeight - ((il - minIL) / (maxIL - minIL)) * chartHeight;

    // Draw grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;

    for (let il = Math.ceil(minIL / 10) * 10; il <= Math.floor(maxIL / 10) * 10; il += 10) {
      const y = scaleY(il);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillStyle = colors.label;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${il.toFixed(0)}%`, padding.left - 10, y + 4);
    }

    for (let pc = Math.ceil(minPC / 20) * 20; pc <= Math.floor(maxPC / 20) * 20; pc += 20) {
      const x = scaleX(pc);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
      ctx.fillStyle = colors.label;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pc > 0 ? '+' : ''}${pc}%`, x, height - padding.bottom + 20);
    }

    // Draw zero line
    const zeroY = scaleY(0);
    ctx.strokeStyle = colors.zero;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, zeroY);
    ctx.lineTo(width - padding.right, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw IL curve
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((point, i) => {
      const x = scaleX(point.priceChange);
      const y = scaleY(point.il);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area under curve
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.beginPath();
    ctx.moveTo(scaleX(points[0].priceChange), scaleY(0));
    points.forEach(point => ctx.lineTo(scaleX(point.priceChange), scaleY(point.il)));
    ctx.lineTo(scaleX(points[points.length - 1].priceChange), scaleY(0));
    ctx.closePath();
    ctx.fill();

    // Draw current price change marker
    if (currentPriceChange >= minPC && currentPriceChange <= maxPC) {
      const currentIL = calculateIL(currentPriceChange);
      const x = scaleX(currentPriceChange);
      const y = scaleY(currentIL);

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = colors.bg;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = colors.bg;
      ctx.fillRect(x - 50, y - 30, 100, 24);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 50, y - 30, 100, 24);
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${currentIL.toFixed(2)}%`, x, y - 12);
    }

    // Draw axes
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = colors.title;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Price Change (%)', width / 2, height - 10);
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Impermanent Loss (%)', 0, 0);
    ctx.restore();

    // Title
    ctx.fillStyle = colors.title;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Impermanent Loss Curve', width / 2, 25);

  }, [priceChangeRange, currentPriceChange]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
      <canvas ref={canvasRef} width={800} height={400} className="w-full h-auto" />
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-red-500"></div>
          <span className="text-gray-700 dark:text-gray-300">IL Curve</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-blue-500 border-dashed border-2 border-blue-500"></div>
          <span className="text-gray-700 dark:text-gray-300">Current Position</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-gray-400 border-dashed border-2 border-gray-400"></div>
          <span className="text-gray-700 dark:text-gray-300">Break-even (0%)</span>
        </div>
      </div>
      <div className="mt-3 text-center text-xs text-gray-600 dark:text-gray-400">
        <p>
          IL increases as price moves away from entry point in either direction.
          Maximum loss approaches 5.7% at extreme price changes.
        </p>
      </div>
    </div>
  );
};

export default ILChart;
