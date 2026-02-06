import React, { useEffect, useRef } from 'react';

const PriceRangeChart = ({
  currentPrice = 100,
  strategy = 'curve',
  priceRangePercent = 20,
  showLiquidity = true
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const isDark = document.documentElement.classList.contains('dark');
    const colors = {
      grid: isDark ? '#475569' : '#e5e7eb',
      axis: isDark ? '#cbd5e1' : '#374151',
      label: isDark ? '#94a3b8' : '#6b7280',
      title: isDark ? '#e2e8f0' : '#111827',
      bg: isDark ? '#1e293b' : '#ffffff',
    };

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    const priceMin = currentPrice * (1 - priceRangePercent / 100);
    const priceMax = currentPrice * (1 + priceRangePercent / 100);
    const priceRange = priceMax - priceMin;

    const padding = { top: 60, right: 40, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const scaleX = (price) => padding.left + ((price - priceMin) / priceRange) * chartWidth;
    const scaleY = (liquidity) => padding.top + chartHeight - liquidity * chartHeight;

    const numBins = 15;
    const binWidth = priceRange / numBins;
    const bins = [];

    for (let i = 0; i < numBins; i++) {
      const binMin = priceMin + i * binWidth;
      const binMax = binMin + binWidth;
      const binCenter = (binMin + binMax) / 2;
      let liquidity = 0;
      const distanceFromCurrent = Math.abs(binCenter - currentPrice) / priceRange;

      if (strategy === 'spot') {
        liquidity = Math.exp(-distanceFromCurrent * 50);
      } else if (strategy === 'curve') {
        liquidity = Math.exp(-Math.pow(distanceFromCurrent * 3, 2));
      } else if (strategy === 'bid-ask') {
        const leftPeak = Math.exp(-Math.pow((binCenter - priceMin - priceRange * 0.25) / (priceRange * 0.1), 2));
        const rightPeak = Math.exp(-Math.pow((binCenter - priceMin - priceRange * 0.75) / (priceRange * 0.1), 2));
        liquidity = Math.max(leftPeak, rightPeak);
      }

      bins.push({ min: binMin, max: binMax, center: binCenter, liquidity });
    }

    const maxLiquidity = Math.max(...bins.map(b => b.liquidity));

    // Grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      if (showLiquidity) {
        const liquidityValue = (1 - i / 4) * 100;
        ctx.fillStyle = colors.label;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${liquidityValue.toFixed(0)}%`, padding.left - 10, y + 4);
      }
    }

    const priceSteps = 5;
    for (let i = 0; i <= priceSteps; i++) {
      const price = priceMin + (priceRange / priceSteps) * i;
      const x = scaleX(price);
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
      ctx.fillStyle = colors.label;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`$${price.toFixed(1)}`, x, height - padding.bottom + 20);
    }

    // Current price line
    const currentX = scaleX(currentPrice);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(currentX, padding.top);
    ctx.lineTo(currentX, height - padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = colors.bg;
    ctx.fillRect(currentX - 40, padding.top + 10, 80, 24);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(currentX - 40, padding.top + 10, 80, 24);
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Current', currentX, padding.top + 22);
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`$${currentPrice.toFixed(2)}`, currentX, padding.top + 34);

    // Liquidity bins
    bins.forEach(bin => {
      const x1 = scaleX(bin.min);
      const x2 = scaleX(bin.max);
      const binPixelWidth = x2 - x1;
      const normalizedLiquidity = bin.liquidity / maxLiquidity;
      const barHeight = normalizedLiquidity * chartHeight;
      const y = scaleY(normalizedLiquidity);
      const distanceFromCurrent = Math.abs(bin.center - currentPrice) / priceRange;
      let color;
      if (distanceFromCurrent < 0.1) color = '#22c55e';
      else if (distanceFromCurrent < 0.3) color = '#3b82f6';
      else color = '#a855f7';

      const gradient = ctx.createLinearGradient(0, y, 0, height - padding.bottom);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '66');
      ctx.fillStyle = gradient;
      ctx.fillRect(x1 + 1, y, binPixelWidth - 2, barHeight);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x1 + 1, y, binPixelWidth - 2, barHeight);
    });

    // Axes
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
    if (showLiquidity) {
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, height - padding.bottom);
      ctx.stroke();
    }

    ctx.fillStyle = colors.title;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Price ($)', width / 2, height - 10);
    if (showLiquidity) {
      ctx.save();
      ctx.translate(15, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Liquidity Distribution (%)', 0, 0);
      ctx.restore();
    }

    ctx.fillStyle = colors.title;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    const strategyName = strategy.charAt(0).toUpperCase() + strategy.slice(1);
    ctx.fillText(`${strategyName} Strategy - Price Range Distribution`, width / 2, 25);

    ctx.fillStyle = colors.label;
    ctx.font = '12px sans-serif';
    ctx.fillText(`Range: $${priceMin.toFixed(2)} - $${priceMax.toFixed(2)} (±${priceRangePercent}%)`, width / 2, 42);

  }, [currentPrice, strategy, priceRangePercent, showLiquidity]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
      <canvas ref={canvasRef} width={800} height={400} className="w-full h-auto" />
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300">Near Current Price</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300">Moderate Distance</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300">Far from Current</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-blue-500 border-dashed border-2 border-blue-500"></div>
          <span className="text-gray-700 dark:text-gray-300">Current Price</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-4 text-center">
        <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3">
          <div className="text-xs text-purple-600">Lower Bound</div>
          <div className="text-lg font-semibold text-purple-600">
            ${(currentPrice * (1 - priceRangePercent / 100)).toFixed(2)}
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
          <div className="text-xs text-blue-600">Current Price</div>
          <div className="text-lg font-semibold text-blue-600">
            ${currentPrice.toFixed(2)}
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3">
          <div className="text-xs text-purple-600">Upper Bound</div>
          <div className="text-lg font-semibold text-purple-600">
            ${(currentPrice * (1 + priceRangePercent / 100)).toFixed(2)}
          </div>
        </div>
      </div>
      <div className="mt-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <div className="text-sm text-yellow-900 dark:text-yellow-200">
          <p className="font-medium">Strategy Explanation:</p>
          <p className="mt-1 text-yellow-800 dark:text-yellow-300">
            {strategy === 'spot' && 'Spot: Maximum liquidity concentrated at current price for highest fee capture'}
            {strategy === 'curve' && 'Curve: Balanced distribution across price range for moderate risk'}
            {strategy === 'bid-ask' && 'Bid-Ask: Liquidity split between buy and sell zones for market making'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceRangeChart;
