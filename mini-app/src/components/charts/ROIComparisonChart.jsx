import React, { useEffect, useRef } from 'react';

const ROIComparisonChart = ({ comparisons }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!comparisons || comparisons.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Prepare data - group by pool and strategy
    const dataByPool = {};
    comparisons.forEach(comp => {
      if (!dataByPool[comp.poolName]) {
        dataByPool[comp.poolName] = {};
      }
      dataByPool[comp.poolName][comp.strategy] = comp.results.roi;
    });

    const pools = Object.keys(dataByPool);
    const strategies = ['Spot', 'Curve', 'Bid-Ask'];
    const colors = {
      'Spot': '#ef4444',
      'Curve': '#3b82f6', 
      'Bid-Ask': '#22c55e'
    };

    // Find min/max ROI
    const allROIs = comparisons.map(c => c.results.roi);
    const minROI = Math.min(...allROIs, 0);
    const maxROI = Math.max(...allROIs, 0);
    const roiRange = maxROI - minROI;

    // Padding
    const padding = { top: 60, right: 40, bottom: 80, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Bar dimensions
    const barWidth = chartWidth / (pools.length * 4); // 4 = 3 strategies + 1 gap
    const groupGap = barWidth;

    // Scale function for Y-axis
    const scaleY = (roi) => {
      return padding.top + chartHeight - ((roi - minROI) / roiRange) * chartHeight;
    };

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const roi = minROI + (roiRange / gridSteps) * i;
      const y = scaleY(roi);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${roi.toFixed(1)}%`, padding.left - 10, y + 4);
    }

    // Draw zero line if needed
    if (minROI < 0 && maxROI > 0) {
      const zeroY = scaleY(0);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding.left, zeroY);
      ctx.lineTo(width - padding.right, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw bars
    pools.forEach((pool, poolIndex) => {
      const groupX = padding.left + poolIndex * (barWidth * 4);

      strategies.forEach((strategy, strategyIndex) => {
        const roi = dataByPool[pool][strategy];
        if (roi === undefined) return;

        const x = groupX + strategyIndex * barWidth;
        const barHeight = Math.abs((roi / roiRange) * chartHeight);
        const y = roi >= 0 ? scaleY(roi) : scaleY(0);

        // Draw bar
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        const baseColor = colors[strategy];
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, baseColor + '99'); // Add transparency

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Bar border
        ctx.strokeStyle = colors[strategy];
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);

        // Value label on top of bar
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        const labelY = roi >= 0 ? y - 8 : y + barHeight + 16;
        ctx.fillText(`${roi.toFixed(1)}%`, x + barWidth / 2, labelY);

        // Highlight best performer
        const bestROI = Math.max(...Object.values(dataByPool[pool]));
        if (roi === bestROI && roi > 0) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = '16px sans-serif';
          ctx.fillText('🏆', x + barWidth / 2, y - 25);
        }
      });

      // Pool name label
      const groupCenterX = groupX + (barWidth * 3) / 2;
      ctx.fillStyle = '#111827';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(groupCenterX, height - padding.bottom + 20);
      ctx.rotate(-Math.PI / 6); // Slight angle for readability
      ctx.fillText(pool, 0, 0);
      ctx.restore();
    });

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px sans-serif';
    
    // X-axis label
    ctx.textAlign = 'center';
    ctx.fillText('Pools', width / 2, height - 10);

    // Y-axis label
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('ROI (%)', 0, 0);
    ctx.restore();

    // Title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Strategy ROI Comparison', width / 2, 25);

    // Legend
    const legendX = width / 2 - 150;
    const legendY = 40;
    
    strategies.forEach((strategy, i) => {
      const x = legendX + i * 100;
      
      // Color box
      ctx.fillStyle = colors[strategy];
      ctx.fillRect(x, legendY, 15, 15);
      ctx.strokeStyle = colors[strategy];
      ctx.lineWidth = 2;
      ctx.strokeRect(x, legendY, 15, 15);
      
      // Label
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(strategy, x + 20, legendY + 11);
    });

  }, [comparisons]);

  if (!comparisons || comparisons.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-600 font-medium">No comparison data available</p>
        <p className="text-sm text-gray-500 mt-2">Run a comparison to see the ROI chart</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <canvas
        ref={canvasRef}
        width={800}
        height={450}
        className="w-full h-auto"
      />
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-900">
            <p className="font-medium">Reading the Chart:</p>
            <ul className="mt-1 space-y-1 text-blue-800">
              <li>• Taller bars = Higher ROI (better performance)</li>
              <li>• 🏆 Trophy marks the best strategy for each pool</li>
              <li>• Compare strategies across different pools at a glance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROIComparisonChart;
