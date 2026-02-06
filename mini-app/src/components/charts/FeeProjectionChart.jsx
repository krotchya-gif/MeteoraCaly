import React, { useEffect, useRef } from 'react';

const FeeProjectionChart = ({
  capital = 500,
  apr = 30,
  strategy = 'curve',
  monthsToProject = 12
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
      zero: isDark ? '#64748b' : '#9ca3af',
    };

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    const calculateFees = (months) => {
      const monthlyRate = apr / 12 / 100;
      let cumulativeFees = 0;
      const data = [];
      for (let m = 0; m <= months; m++) {
        if (m > 0) cumulativeFees += capital * monthlyRate;
        data.push({ month: m, fees: cumulativeFees, total: capital + cumulativeFees });
      }
      return data;
    };

    const data = calculateFees(monthsToProject);
    const maxTotal = Math.max(...data.map(d => d.total));

    const padding = { top: 40, right: 80, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const scaleX = (month) => padding.left + (month / monthsToProject) * chartWidth;
    const scaleY = (value) => padding.top + chartHeight - (value / maxTotal) * chartHeight;

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;

    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const value = (maxTotal / gridSteps) * i;
      const y = scaleY(value);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillStyle = colors.label;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${value.toFixed(0)}`, padding.left - 10, y + 4);
    }

    const monthStep = Math.max(1, Math.floor(monthsToProject / 6));
    for (let m = 0; m <= monthsToProject; m += monthStep) {
      const x = scaleX(m);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
      ctx.fillStyle = colors.label;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${m}`, x, height - padding.bottom + 20);
    }

    // Capital baseline
    const baselineY = scaleY(capital);
    ctx.strokeStyle = colors.zero;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, baselineY);
    ctx.lineTo(width - padding.right, baselineY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = colors.label;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Initial Capital', width - padding.right + 10, baselineY + 4);

    // Area under total value curve
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.2)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0.05)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(scaleX(0), scaleY(0));
    data.forEach(point => ctx.lineTo(scaleX(point.month), scaleY(point.total)));
    ctx.lineTo(scaleX(monthsToProject), scaleY(0));
    ctx.closePath();
    ctx.fill();

    // Total value line
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.forEach((point, i) => {
      const x = scaleX(point.month);
      const y = scaleY(point.total);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fees line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    data.forEach((point, i) => {
      const x = scaleX(point.month);
      const y = scaleY(point.fees);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Data points
    data.forEach((point, i) => {
      if (i % 3 === 0 || i === data.length - 1) {
        const x = scaleX(point.month);
        const y = scaleY(point.total);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = colors.bg;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    // End value label
    const lastPoint = data[data.length - 1];
    const endX = scaleX(lastPoint.month);
    const endY = scaleY(lastPoint.total);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(endX - 70, endY - 35, 140, 28);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.strokeRect(endX - 70, endY - 35, 140, 28);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`$${lastPoint.total.toFixed(2)}`, endX, endY - 17);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = colors.label;
    ctx.fillText(`(+$${lastPoint.fees.toFixed(2)} fees)`, endX, endY - 5);

    // Axes
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

    ctx.fillStyle = colors.title;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Months', width / 2, height - 10);
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Portfolio Value ($)', 0, 0);
    ctx.restore();

    ctx.fillStyle = colors.title;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Fee Projection - ${strategy.charAt(0).toUpperCase() + strategy.slice(1)} Strategy (${apr}% APR)`, width / 2, 25);

  }, [capital, apr, strategy, monthsToProject]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
      <canvas ref={canvasRef} width={800} height={400} className="w-full h-auto" />
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-green-500"></div>
          <span className="text-gray-700 dark:text-gray-300">Total Value</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-blue-500 border-dashed border-2 border-blue-500"></div>
          <span className="text-gray-700 dark:text-gray-300">Fees Earned</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-gray-400 border-dashed border-2 border-gray-400"></div>
          <span className="text-gray-700 dark:text-gray-300">Initial Capital</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400">Initial Capital</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">${capital.toFixed(2)}</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
          <div className="text-xs text-blue-600">Total Fees ({monthsToProject}m)</div>
          <div className="text-lg font-semibold text-blue-600">
            ${((capital * (apr / 100) * (monthsToProject / 12))).toFixed(2)}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
          <div className="text-xs text-green-600">Final Value ({monthsToProject}m)</div>
          <div className="text-lg font-semibold text-green-600">
            ${(capital + (capital * (apr / 100) * (monthsToProject / 12))).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeProjectionChart;
