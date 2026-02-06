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

  const tabs = [
    { id: 'il', name: 'Impermanent Loss', icon: '📉', available: true },
    { id: 'fees', name: 'Fee Projection', icon: '💰', available: calculatorData || comparisonData },
    { id: 'comparison', name: 'ROI Comparison', icon: '📊', available: comparisonData && comparisonData.length > 0 },
    { id: 'range', name: 'Price Range', icon: '🎯', available: calculatorData || poolData }
  ];

  // Get data for fee projection chart
  const getFeeProjectionData = () => {
    if (calculatorData) {
      return {
        capital: calculatorData.capital,
        apr: calculatorData.results?.apr || 30,
        strategy: calculatorData.strategy || 'curve'
      };
    }
    if (comparisonData && comparisonData.length > 0) {
      const best = comparisonData[0];
      return {
        capital: best.capital,
        apr: best.results.apr,
        strategy: best.strategy.toLowerCase()
      };
    }
    return { capital: 500, apr: 30, strategy: 'curve' };
  };

  // Get data for price range chart
  const getPriceRangeData = () => {
    if (calculatorData) {
      return {
        currentPrice: calculatorData.currentPrice || 100,
        strategy: calculatorData.strategy || 'curve',
        priceRangePercent: 20
      };
    }
    if (poolData) {
      return {
        currentPrice: poolData.currentPrice || 100,
        strategy: poolData.strategy || 'curve',
        priceRangePercent: 20
      };
    }
    return { currentPrice: 100, strategy: 'curve', priceRangePercent: 20 };
  };

  const renderChart = () => {
    switch (activeTab) {
      case 'il':
        return (
          <ILChart 
            priceChangeRange={[-50, 100]}
            currentPriceChange={calculatorData?.priceChange || 10}
          />
        );
      
      case 'fees':
        const feeData = getFeeProjectionData();
        return (
          <FeeProjectionChart
            capital={feeData.capital}
            apr={feeData.apr}
            strategy={feeData.strategy}
            monthsToProject={12}
          />
        );
      
      case 'comparison':
        return (
          <ROIComparisonChart 
            comparisons={comparisonData}
          />
        );
      
      case 'range':
        const rangeData = getPriceRangeData();
        return (
          <PriceRangeChart
            currentPrice={rangeData.currentPrice}
            strategy={rangeData.strategy}
            priceRangePercent={rangeData.priceRangePercent}
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
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
                      ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
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

      {/* Chart Controls */}
      {activeTab === 'il' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Chart Controls</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Current Price Change
              </label>
              <input
                type="range"
                min="-50"
                max="100"
                step="5"
                defaultValue={calculatorData?.priceChange || 10}
                className="w-full"
                onChange={(e) => {
                  // This would update the chart in a real implementation
                  console.log('Price change:', e.target.value);
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-50%</span>
                <span>{calculatorData?.priceChange || 10}%</span>
                <span>+100%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fees' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Projection Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12" selected>12 Months</option>
                <option value="24">24 Months</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Compounding
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="none" selected>No Compounding</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                IL Adjustment
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="none" selected>Not Included</option>
                <option value="conservative">Conservative (-2%)</option>
                <option value="moderate">Moderate (-5%)</option>
                <option value="aggressive">Aggressive (-10%)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Chart Information */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {activeTab === 'il' && 'Understanding Impermanent Loss'}
              {activeTab === 'fees' && 'Fee Projection Assumptions'}
              {activeTab === 'comparison' && 'Interpreting ROI Comparisons'}
              {activeTab === 'range' && 'Understanding Price Range Distribution'}
            </p>
            <p className="text-xs text-gray-700">
              {activeTab === 'il' && 'IL occurs when token prices diverge from your entry point. The curve shows maximum loss is capped around 5.7% at extreme price changes.'}
              {activeTab === 'fees' && 'Projections assume constant APR and no compounding. Actual fees may vary based on trading volume and market conditions.'}
              {activeTab === 'comparison' && 'Higher bars indicate better ROI. Trophy icon marks the best performer. Use this to identify optimal pool-strategy combinations.'}
              {activeTab === 'range' && 'Distribution shows how liquidity is allocated across price ranges. Taller bars mean more capital deployed at that price level.'}
            </p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex justify-end space-x-3">
        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Save as PNG
        </button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Chart
        </button>
      </div>
    </div>
  );
};

export default ChartDashboard;
