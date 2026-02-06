import React from 'react';

const ComparisonSelector = ({ 
  pools, 
  selectedPools, 
  onPoolSelect, 
  selectedStrategies,
  onStrategySelect,
  maxSelections = 3 
}) => {
  const strategies = [
    { id: 'spot', name: 'Spot', description: 'Concentrated liquidity at current price' },
    { id: 'curve', name: 'Curve', description: 'Distribution across price range' },
    { id: 'bid-ask', name: 'Bid-Ask', description: 'Separate buy/sell ranges' }
  ];

  const handlePoolToggle = (poolId) => {
    if (selectedPools.includes(poolId)) {
      onPoolSelect(selectedPools.filter(id => id !== poolId));
    } else {
      if (selectedPools.length < maxSelections) {
        onPoolSelect([...selectedPools, poolId]);
      }
    }
  };

  const handleStrategyToggle = (strategyId) => {
    if (selectedStrategies.includes(strategyId)) {
      onStrategySelect(selectedStrategies.filter(id => id !== strategyId));
    } else {
      onStrategySelect([...selectedStrategies, strategyId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pool Selection */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Pools to Compare
          </h3>
          <span className="text-sm text-gray-500">
            {selectedPools.length}/{maxSelections} selected
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {pools.map((pool) => {
            const isSelected = selectedPools.includes(pool.address);
            const isDisabled = !isSelected && selectedPools.length >= maxSelections;

            return (
              <button
                key={pool.address}
                onClick={() => handlePoolToggle(pool.address)}
                disabled={isDisabled}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {pool.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      TVL: ${(pool.liquidity / 1e6).toFixed(2)}M | 
                      Volume: ${(pool.trade_volume_24h / 1e6).toFixed(2)}M
                    </div>
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Strategy Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Select Strategies to Compare
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {strategies.map((strategy) => {
            const isSelected = selectedStrategies.includes(strategy.id);

            return (
              <button
                key={strategy.id}
                onClick={() => handleStrategyToggle(strategy.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">
                      {strategy.name}
                    </span>
                    {isSelected && (
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {strategy.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selection Summary */}
      {selectedPools.length > 0 && selectedStrategies.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Ready to Compare
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Comparing {selectedPools.length} pool(s) with {selectedStrategies.length} strategy(ies) = 
                {' '}{selectedPools.length * selectedStrategies.length} total combinations
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonSelector;
