import React, { useState } from 'react';
import ILChart from './ILChart';
import FeeProjectionChart from './FeeProjectionChart';
import ROIComparisonChart from './ROIComparisonChart';
import PriceRangeChart from './PriceRangeChart';

const ChartDashboard = ({
  calculatorData = null,
  comparisonData = null,
  poolData = null
}) => {
  const [activeTab, setActiveTab] = useState('il');

  // IL Chart controls
  const [priceChange, setPriceChange] = useState(calculatorData?.priceChange || 10);

  // Fee Projection controls
  const [monthsToProject, setMonthsToProject] = useState(12);
  const [feeCapital, setFeeCapital] = useState(calculatorData?.capital || 500);
  const [feeApr, setFeeApr] = useState(calculatorData?.results?.apr || 30);

  // Price Range controls
  const [rangeStrategy, setRangeStrategy] = useState(calculatorData?.strategy || 'curve');
  const [rangePercent, setRangePercent] = useState(20);

  const tabs = [
    { id: 'il', name: 'Impermanent Loss', icon: '📉', available: true },
    { id: 'fees', name: 'Fee Projection', icon: '💰', available: true },
    { id: 'comparison', name: 'ROI Comparison', icon: '📊', available: comparisonData && comparisonData.length > 0 },
    { id: 'range', name: 'Price Range', icon: '🎯', available: true }
  ];

  const renderChart = () => {
    switch (activeTab) {
      case 'il':
        return (
          <ILChart
            priceChangeRange={[-50, 100]}
            currentPriceChange={priceChange}
          />
        );

      case 'fees':
        return (
          <FeeProjectionChart
            capital={feeCapital}
            apr={feeApr}
            strategy={rangeStrategy}
            monthsToProject={monthsToProject}
          />
        );

      case 'comparison':
        return (
          <ROIComparisonChart
            comparisons={comparisonData}
          />
        );

      case 'range':
        return (
          <PriceRangeChart
            currentPrice={calculatorData?.currentPrice || poolData?.currentPrice || 100}
            strategy={rangeStrategy}
            priceRangePercent={rangePercent}
            showLiquidity={true}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-2">
        <div className="flex space-x-2 overflow-x-auto">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const isAvailable = tab.available !== false;

            return (
              <button
                key={tab.id}
                onClick={() => isAvailable && setActiveTab(tab.id)}
                disabled={!isAvailable}
                className={`
                  flex-1 min-w-[140px] px-4 py-3 rounded-lg font-medium text-sm transition-all
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : isAvailable
                      ? 'bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                      : 'bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Display */}
      <div className="transition-all duration-300">
        {renderChart()}
      </div>

      {/* IL Chart Controls */}
      {activeTab === 'il' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Chart Controls</h3>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Price Change: <span className="text-blue-600 font-bold">{priceChange > 0 ? '+' : ''}{priceChange}%</span>
            </label>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={priceChange}
              className="w-full"
              onChange={(e) => setPriceChange(Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>-50%</span>
              <span>0%</span>
              <span>+100%</span>
            </div>
          </div>
        </div>
      )}

      {/* Fee Projection Controls */}
      {activeTab === 'fees' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Projection Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Capital ($)
              </label>
              <input
                type="number"
                value={feeCapital}
                onChange={(e) => setFeeCapital(Math.max(10, Number(e.target.value)))}
                min="10"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                APR (%)
              </label>
              <input
                type="number"
                value={feeApr}
                onChange={(e) => setFeeApr(Math.max(1, Number(e.target.value)))}
                min="1"
                max="500"
                step="5"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Period
              </label>
              <select
                value={monthsToProject}
                onChange={(e) => setMonthsToProject(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
                <option value={24}>24 Months</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Price Range Controls */}
      {activeTab === 'range' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Range Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Strategy
              </label>
              <select
                value={rangeStrategy}
                onChange={(e) => setRangeStrategy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="spot">Spot (Tight Range)</option>
                <option value="curve">Curve (Medium Range)</option>
                <option value="bid-ask">Bid-Ask (Wide Range)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price Range: <span className="text-blue-600 font-bold">±{rangePercent}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={rangePercent}
                className="w-full"
                onChange={(e) => setRangePercent(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>±5%</span>
                <span>±50%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Information */}
      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {activeTab === 'il' && 'Understanding Impermanent Loss'}
              {activeTab === 'fees' && 'Fee Projection Assumptions'}
              {activeTab === 'comparison' && 'Interpreting ROI Comparisons'}
              {activeTab === 'range' && 'Understanding Price Range Distribution'}
            </p>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              {activeTab === 'il' && 'IL occurs when token prices diverge from your entry point. The curve shows maximum loss is capped around 5.7% at extreme price changes.'}
              {activeTab === 'fees' && 'Projections assume constant APR and no compounding. Actual fees may vary based on trading volume and market conditions.'}
              {activeTab === 'comparison' && 'Higher bars indicate better ROI. Trophy icon marks the best performer. Use this to identify optimal pool-strategy combinations.'}
              {activeTab === 'range' && 'Distribution shows how liquidity is allocated across price ranges. Taller bars mean more capital deployed at that price level.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartDashboard;
