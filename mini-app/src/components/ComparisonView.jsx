import React, { useState, useEffect } from 'react';
import ComparisonSelector from './ComparisonSelector';
import ComparisonTable from './ComparisonTable';

const ComparisonView = ({ pools, onBack }) => {
  const [selectedPools, setSelectedPools] = useState([]);
  const [selectedStrategies, setSelectedStrategies] = useState(['spot']);
  const [capital, setCapital] = useState(500);
  const [priceChange, setPriceChange] = useState(10);
  const [comparisons, setComparisons] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Calculation functions (imported from previous calculator logic)
  const calculateImpermanentLoss = (priceChange) => {
    const ratio = 1 + priceChange / 100;
    const il = (2 * Math.sqrt(ratio)) / (1 + ratio) - 1;
    return il * 100;
  };

  const calculateFees = (pool, capital, strategy) => {
    const baseAPR = (pool.fee_24h * 365) / pool.liquidity * 100;
    
    let multiplier = 1;
    if (strategy === 'spot') {
      multiplier = 1.5; // Concentrated liquidity earns more fees
    } else if (strategy === 'curve') {
      multiplier = 1.0; // Standard distribution
    } else if (strategy === 'bid-ask') {
      multiplier = 1.2; // Slightly better than curve
    }

    const adjustedAPR = baseAPR * multiplier;
    const monthlyRate = adjustedAPR / 12 / 100;
    const feesEarned = capital * monthlyRate;

    return {
      feesEarned,
      apr: adjustedAPR
    };
  };

  const calculateROI = (capital, ilPercent, feesEarned) => {
    const ilLoss = capital * (ilPercent / 100);
    const netProfit = feesEarned + ilLoss; // IL is negative, so this is subtraction
    const roi = (netProfit / capital) * 100;

    return {
      ilLoss,
      netProfit,
      roi
    };
  };

  const runComparison = () => {
    if (selectedPools.length === 0 || selectedStrategies.length === 0) {
      return;
    }

    setIsCalculating(true);
    
    // Simulate calculation delay for better UX
    setTimeout(() => {
      const results = [];

      selectedPools.forEach(poolAddress => {
        const pool = pools.find(p => p.address === poolAddress);
        if (!pool) return;

        selectedStrategies.forEach(strategy => {
          // Calculate IL
          const ilPercent = calculateImpermanentLoss(priceChange);

          // Calculate Fees
          const { feesEarned, apr } = calculateFees(pool, capital, strategy);

          // Calculate ROI
          const { ilLoss, netProfit, roi } = calculateROI(capital, ilPercent, feesEarned);

          results.push({
            poolAddress: pool.address,
            poolName: pool.name,
            strategy: strategy.charAt(0).toUpperCase() + strategy.slice(1),
            capital,
            priceChange,
            results: {
              il: ilPercent,
              ilLoss,
              fees: feesEarned,
              apr,
              netProfit,
              roi
            }
          });
        });
      });

      setComparisons(results);
      setShowResults(true);
      setIsCalculating(false);
    }, 500);
  };

  const resetComparison = () => {
    setShowResults(false);
    setComparisons([]);
  };

  const exportToCSV = () => {
    if (comparisons.length === 0) return;

    const headers = ['Pool', 'Strategy', 'Capital', 'Price Change %', 'IL %', 'IL Loss $', 'Fees $', 'APR %', 'Net Profit $', 'ROI %'];
    const rows = comparisons.map(c => [
      c.poolName,
      c.strategy,
      c.capital,
      c.priceChange,
      c.results.il.toFixed(2),
      c.results.ilLoss.toFixed(2),
      c.results.fees.toFixed(2),
      c.results.apr.toFixed(2),
      c.results.netProfit.toFixed(2),
      c.results.roi.toFixed(2)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meteora-comparison-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Strategy Comparison</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Compare multiple pools and strategies side-by-side
                </p>
              </div>
            </div>

            {showResults && (
              <div className="flex space-x-2">
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
                <button
                  onClick={resetComparison}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  New Comparison
                </button>
              </div>
            )}
          </div>
        </div>

        {!showResults ? (
          <>
            {/* Selection Panel */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-6">
              <ComparisonSelector
                pools={pools}
                selectedPools={selectedPools}
                onPoolSelect={setSelectedPools}
                selectedStrategies={selectedStrategies}
                onStrategySelect={setSelectedStrategies}
              />
            </div>

            {/* Parameters Panel */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Comparison Parameters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capital Amount ($)
                  </label>
                  <input
                    type="number"
                    value={capital}
                    onChange={(e) => setCapital(Number(e.target.value))}
                    min="100"
                    step="100"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Amount to invest in each strategy
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expected Price Change (%)
                  </label>
                  <input
                    type="number"
                    value={priceChange}
                    onChange={(e) => setPriceChange(Number(e.target.value))}
                    min="-50"
                    max="100"
                    step="5"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Affects impermanent loss calculation
                  </p>
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <div className="flex justify-center">
              <button
                onClick={runComparison}
                disabled={selectedPools.length === 0 || selectedStrategies.length === 0 || isCalculating}
                className={`px-8 py-3 rounded-lg font-medium text-white transition-all ${
                  selectedPools.length === 0 || selectedStrategies.length === 0
                    ? 'bg-gray-400 dark:bg-slate-600 cursor-not-allowed'
                    : isCalculating
                    ? 'bg-blue-400 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                }`}
              >
                {isCalculating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Calculating...
                  </span>
                ) : (
                  'Compare Strategies'
                )}
              </button>
            </div>
          </>
        ) : (
          /* Results Panel */
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <ComparisonTable comparisons={comparisons} />
          </div>
        )}

        {/* Info Footer */}
        {!showResults && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <p className="font-medium mb-1">How to use Comparison View:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-300">
                  <li>Select up to 3 pools to compare</li>
                  <li>Choose one or more strategies (Spot, Curve, Bid-Ask)</li>
                  <li>Set your capital and expected price movement</li>
                  <li>Results will show ROI, IL, fees, and net profit for each combination</li>
                  <li>Export to CSV for further analysis</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonView;
