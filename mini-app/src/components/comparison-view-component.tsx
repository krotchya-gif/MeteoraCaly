import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Zap, Shield, Target, Activity } from 'lucide-react';

// ============================================
// CALCULATION UTILITIES
// ============================================

const calculations = {
  calculateIL: (priceChange) => {
    return (2 * Math.sqrt(priceChange) / (1 + priceChange) - 1) * 100;
  },
  
  calculateFees: (tvl, dailyVolume, feeRate, userLiquidity, concentration = 1.5) => {
    const poolFee = dailyVolume * (feeRate / 100);
    const userShare = (userLiquidity / tvl) * concentration;
    return poolFee * userShare;
  },
  
  calculateConcentration: (strategy) => {
    const factors = { 'spot': 3.0, 'curve': 2.0, 'bid-ask': 1.0, 'full': 0.5 };
    return factors[strategy] || 1.5;
  },
  
  calculateROI: (capital, feeEarned, ilLoss) => {
    const netProfit = feeEarned - Math.abs(ilLoss);
    return (netProfit / capital) * 100;
  }
};

// ============================================
// SAMPLE POOL DATA
// ============================================

const SAMPLE_POOL = {
  id: 'bfs-sol',
  pair: 'BFS/SOL',
  type: 'DLMM',
  tvl: 111657,
  volume_24h: 11075091,
  fees_24h: 44954,
  current_price: 0.001480,
  total_trading_fee: 0.7677,
  token0: { symbol: 'BFS', price_usd: 0.148 },
  token1: { symbol: 'SOL', price_usd: 100 }
};

// ============================================
// COMPARISON VIEW COMPONENT
// ============================================

export default function ComparisonView() {
  const [capital, setCapital] = useState(500);
  const [pool] = useState(SAMPLE_POOL);
  const [scenario, setScenario] = useState('sideways');
  
  // Strategy configurations
  const strategies = {
    dlmm_spot: {
      name: 'DLMM - Spot',
      type: 'DLMM',
      strategy: 'spot',
      description: 'Tight range, high fees, active management',
      concentration: 3.0,
      icon: Target,
      color: 'purple'
    },
    dlmm_curve: {
      name: 'DLMM - Curve',
      type: 'DLMM',
      strategy: 'curve',
      description: 'Medium range, balanced approach',
      concentration: 2.0,
      icon: Activity,
      color: 'blue'
    },
    dlmm_bidask: {
      name: 'DLMM - Bid-Ask',
      type: 'DLMM',
      strategy: 'bid-ask',
      description: 'Wide range, lower fees, passive',
      concentration: 1.0,
      icon: Shield,
      color: 'green'
    },
    damm_full: {
      name: 'DAMM - Full Range',
      type: 'DAMM',
      strategy: 'full',
      description: 'Always active, auto-adjust, safe',
      concentration: 0.5,
      icon: Zap,
      color: 'orange'
    }
  };
  
  const scenarios = {
    'sideways': { label: 'Sideways (±5%)', priceChange: 1.0, volumeMultiplier: 1.0 },
    'pump': { label: 'Pump (+30%)', priceChange: 1.3, volumeMultiplier: 1.3 },
    'dump': { label: 'Dump (-30%)', priceChange: 0.7, volumeMultiplier: 1.2 },
    'volatile': { label: 'Volatile (±15%)', priceChange: 1.0, volumeMultiplier: 1.5 }
  };
  
  const [selectedStrategies, setSelectedStrategies] = useState(['dlmm_curve', 'damm_full']);
  const [results, setResults] = useState({});
  
  useEffect(() => {
    calculateAll();
  }, [capital, scenario, selectedStrategies]);
  
  const calculateAll = () => {
    const scenarioData = scenarios[scenario];
    const newResults = {};
    
    selectedStrategies.forEach(strategyKey => {
      const strategyConfig = strategies[strategyKey];
      
      // Calculate fees
      const adjustedVolume = pool.volume_24h * scenarioData.volumeMultiplier;
      const dailyFee = calculations.calculateFees(
        pool.tvl,
        adjustedVolume,
        pool.total_trading_fee,
        capital,
        strategyConfig.concentration
      );
      const weeklyFee = dailyFee * 7;
      
      // Calculate IL
      const ilPercent = calculations.calculateIL(scenarioData.priceChange);
      const ilLoss = capital * (Math.abs(ilPercent) / 100);
      
      // Calculate ROI
      const weeklyROI = calculations.calculateROI(capital, weeklyFee, ilLoss);
      const netWeekly = weeklyFee - ilLoss;
      
      // Risk score (0-10, lower is better)
      const riskScore = Math.min(10, (Math.abs(ilPercent) / 5) + (strategyConfig.concentration > 2 ? 3 : 1));
      
      // Effort level (1-5, higher is more effort)
      const effortLevel = strategyConfig.concentration >= 2.5 ? 5 : 
                          strategyConfig.concentration >= 1.5 ? 3 : 1;
      
      newResults[strategyKey] = {
        dailyFee,
        weeklyFee,
        ilPercent,
        ilLoss,
        weeklyROI,
        netWeekly,
        riskScore,
        effortLevel,
        breakEven: ilLoss > 0 ? (ilLoss / dailyFee).toFixed(1) : 0
      };
    });
    
    setResults(newResults);
  };
  
  const toggleStrategy = (key) => {
    if (selectedStrategies.includes(key)) {
      if (selectedStrategies.length > 1) {
        setSelectedStrategies(selectedStrategies.filter(k => k !== key));
      }
    } else {
      if (selectedStrategies.length < 4) {
        setSelectedStrategies([...selectedStrategies, key]);
      }
    }
  };
  
  const getBestStrategy = (metric) => {
    if (Object.keys(results).length === 0) return null;
    
    const sortedByMetric = Object.entries(results).sort((a, b) => {
      if (metric === 'riskScore' || metric === 'effortLevel') {
        return a[1][metric] - b[1][metric]; // Lower is better
      }
      return b[1][metric] - a[1][metric]; // Higher is better
    });
    
    return sortedByMetric[0][0];
  };
  
  const getColorClass = (color) => {
    const colors = {
      purple: 'border-purple-500 bg-purple-500/10',
      blue: 'border-blue-500 bg-blue-500/10',
      green: 'border-green-500 bg-green-500/10',
      orange: 'border-orange-500 bg-orange-500/10'
    };
    return colors[color] || colors.blue;
  };
  
  const getComparisonColor = (value, best, worst) => {
    if (value === best) return 'text-green-400';
    if (value === worst) return 'text-red-400';
    return 'text-gray-300';
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Strategy Comparison</h1>
          <p className="text-gray-400">Compare DLMM & DAMM strategies side-by-side</p>
          <p className="text-purple-400 text-sm mt-1">Pool: {pool.pair}</p>
        </div>
        
        {/* Controls */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 space-y-4">
          {/* Capital Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Capital (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 text-white text-lg font-bold rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                min="10"
                step="10"
              />
            </div>
          </div>
          
          {/* Scenario Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Price Scenario
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(scenarios).map(([key, s]) => (
                <button
                  key={key}
                  onClick={() => setScenario(key)}
                  className={`p-3 rounded-lg font-semibold text-sm transition ${
                    scenario === key
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Strategy Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Select Strategies to Compare (Max 4)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(strategies).map(([key, s]) => {
                const Icon = s.icon;
                const isSelected = selectedStrategies.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleStrategy(key)}
                    disabled={!isSelected && selectedStrategies.length >= 4}
                    className={`p-3 rounded-lg font-semibold text-sm transition border-2 ${
                      isSelected
                        ? getColorClass(s.color)
                        : 'border-slate-600 bg-slate-700 text-gray-400 hover:border-slate-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {selectedStrategies.map(strategyKey => {
            const strategy = strategies[strategyKey];
            const result = results[strategyKey];
            const Icon = strategy.icon;
            
            if (!result) return null;
            
            const bestWeeklyROI = getBestStrategy('weeklyROI');
            const bestDailyFee = getBestStrategy('dailyFee');
            
            return (
              <div
                key={strategyKey}
                className={`rounded-xl border-2 p-5 ${getColorClass(strategy.color)}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-5 h-5" />
                      <h3 className="font-bold text-white">{strategy.name}</h3>
                    </div>
                    <p className="text-xs text-gray-400">{strategy.description}</p>
                  </div>
                </div>
                
                {/* Key Metrics */}
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Weekly ROI</div>
                    <div className={`text-2xl font-bold ${
                      strategyKey === bestWeeklyROI ? 'text-green-400' : 'text-white'
                    }`}>
                      {result.weeklyROI > 0 ? '+' : ''}{result.weeklyROI.toFixed(1)}%
                    </div>
                    {strategyKey === bestWeeklyROI && (
                      <div className="text-xs text-green-400 mt-1">🏆 Best ROI</div>
                    )}
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Daily Fee</div>
                    <div className={`text-lg font-bold ${
                      strategyKey === bestDailyFee ? 'text-green-400' : 'text-white'
                    }`}>
                      ${result.dailyFee.toFixed(2)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Net Weekly</div>
                    <div className={`text-lg font-bold ${
                      result.netWeekly > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${result.netWeekly.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                {/* Additional Stats */}
                <div className="border-t border-slate-700 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">IL:</span>
                    <span className="text-yellow-400 font-mono">
                      {result.ilPercent.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk:</span>
                    <div className="flex gap-1">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-3 rounded ${
                            i < result.riskScore
                              ? result.riskScore > 6
                                ? 'bg-red-500'
                                : result.riskScore > 4
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Effort:</span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded ${
                            i < result.effortLevel ? 'bg-purple-500' : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {result.breakEven > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Break-even:</span>
                      <span className="text-white font-mono">{result.breakEven}d</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Comparison Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 overflow-x-auto">
          <h3 className="text-xl font-bold text-white mb-4">Detailed Comparison</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-gray-400 font-semibold">Metric</th>
                {selectedStrategies.map(key => (
                  <th key={key} className="text-right py-3 text-gray-400 font-semibold">
                    {strategies[key].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Daily Fee', key: 'dailyFee', format: (v) => `$${v.toFixed(2)}`, higherIsBetter: true },
                { label: 'Weekly Fee', key: 'weeklyFee', format: (v) => `$${v.toFixed(2)}`, higherIsBetter: true },
                { label: 'IL Loss', key: 'ilLoss', format: (v) => `$${v.toFixed(2)}`, higherIsBetter: false },
                { label: 'Net Weekly', key: 'netWeekly', format: (v) => `$${v.toFixed(2)}`, higherIsBetter: true },
                { label: 'Weekly ROI', key: 'weeklyROI', format: (v) => `${v.toFixed(1)}%`, higherIsBetter: true },
                { label: 'Risk Score', key: 'riskScore', format: (v) => `${v.toFixed(1)}/10`, higherIsBetter: false },
                { label: 'Effort Level', key: 'effortLevel', format: (v) => `${v}/5`, higherIsBetter: false }
              ].map(metric => {
                const values = selectedStrategies.map(key => results[key]?.[metric.key] || 0);
                const best = metric.higherIsBetter ? Math.max(...values) : Math.min(...values);
                const worst = metric.higherIsBetter ? Math.min(...values) : Math.max(...values);
                
                return (
                  <tr key={metric.key} className="border-b border-slate-700/50">
                    <td className="py-3 text-gray-300">{metric.label}</td>
                    {selectedStrategies.map(key => {
                      const value = results[key]?.[metric.key] || 0;
                      return (
                        <td key={key} className={`py-3 text-right font-mono font-semibold ${
                          getComparisonColor(value, best, worst)
                        }`}>
                          {metric.format(value)}
                          {value === best && ' 🏆'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Recommendations */}
        <div className="bg-gradient-to-br from-blue-900/30 to-slate-800/50 rounded-xl p-6 border border-blue-500/30">
          <h3 className="text-lg font-bold text-blue-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Strategy Recommendations
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Best for Maximum Returns</h4>
              <p className="text-green-400 font-bold text-lg mb-2">
                {strategies[getBestStrategy('weeklyROI')]?.name}
              </p>
              <p className="text-sm text-gray-400">
                Highest ROI: {results[getBestStrategy('weeklyROI')]?.weeklyROI.toFixed(1)}% weekly
              </p>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Best for Low Risk</h4>
              <p className="text-green-400 font-bold text-lg mb-2">
                {strategies[getBestStrategy('riskScore')]?.name}
              </p>
              <p className="text-sm text-gray-400">
                Risk Score: {results[getBestStrategy('riskScore')]?.riskScore.toFixed(1)}/10
              </p>
            </div>
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200">
            <p className="font-semibold mb-1">Disclaimer:</p>
            <p>These are projections based on current pool metrics. Actual results will vary with market conditions, volume changes, and IL. Not financial advice. DYOR!</p>
          </div>
        </div>
      </div>
    </div>
  );
}