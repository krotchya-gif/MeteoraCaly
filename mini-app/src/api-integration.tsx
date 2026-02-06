import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, AlertCircle, Info, RefreshCw, Loader2, Wifi, WifiOff } from 'lucide-react';

// ============================================
// API CONFIGURATION
// ============================================

// In real project, this comes from .env file: process.env.VITE_API_URL
// For this demo, using placeholder URL
const API_CONFIG = {
  BASE_URL: 'https://meteora-calculator-api.your-account.workers.dev',
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// ============================================
// API CLIENT
// ============================================

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    for (let i = 0; i < API_CONFIG.RETRY_ATTEMPTS; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        if (i === API_CONFIG.RETRY_ATTEMPTS - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * (i + 1)));
      }
    }
  }

  async getPools() {
    const data = await this.request('/api/pools');
    return data.data || data;
  }

  async getPool(poolId) {
    const data = await this.request(`/api/pool/${poolId}`);
    return data.data || data;
  }

  async searchPools(query) {
    const data = await this.request(`/api/pools/search?q=${encodeURIComponent(query)}`);
    return data.data || data;
  }

  async getTopPools(n = 10) {
    const data = await this.request(`/api/pools/top/${n}`);
    return data.data || data;
  }

  async healthCheck() {
    return await this.request('/api/health');
  }
}

const api = new APIClient(API_CONFIG.BASE_URL);

// ============================================
// CACHE UTILITIES
// ============================================

const Cache = {
  get(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const { data, timestamp } = JSON.parse(item);
      const age = Date.now() - timestamp;
      
      if (age > API_CONFIG.CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  },

  set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Cache write failed:', error);
    }
  },

  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('pools_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }
};

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
// HOOKS
// ============================================

function usePoolsData() {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchPools = async (useCache = true) => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      if (useCache) {
        const cached = Cache.get('pools_all');
        if (cached) {
          setPools(cached.pools || []);
          setLastUpdated(cached.last_updated);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      const data = await api.getPools();
      setPools(data.pools || []);
      setLastUpdated(data.last_updated || new Date().toISOString());
      
      // Cache it
      Cache.set('pools_all', data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch pools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  return { pools, loading, error, lastUpdated, refresh: () => fetchPools(false) };
}

// ============================================
// COMPONENTS
// ============================================

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
      <p className="text-gray-400">Loading pools...</p>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 mb-4">
      <div className="flex items-start gap-3">
        <WifiOff className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-red-300 font-semibold mb-2">Connection Error</h3>
          <p className="text-red-200 text-sm mb-3">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

function PoolCard({ pool, onSelect, isSelected }) {
  const volumeToTvl = pool.tvl > 0 ? ((pool.volume_24h / pool.tvl) * 100).toFixed(0) : 0;
  const dailyYield = pool.tvl > 0 ? ((pool.fees_24h / pool.tvl) * 100).toFixed(2) : 0;
  
  return (
    <div
      onClick={() => onSelect(pool)}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-purple-500 bg-purple-500/10'
          : 'border-slate-600 bg-slate-700/50 hover:border-purple-400'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">{pool.pair}</h3>
          <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300">
            {pool.type}
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">TVL</div>
          <div className="text-white font-mono">${(pool.tvl / 1000).toFixed(0)}K</div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="text-gray-400">24h Vol</div>
          <div className="text-white font-mono">${(pool.volume_24h / 1000000).toFixed(1)}M</div>
        </div>
        <div>
          <div className="text-gray-400">24h Fees</div>
          <div className="text-green-400 font-mono">${(pool.fees_24h / 1000).toFixed(1)}K</div>
        </div>
        <div>
          <div className="text-gray-400">Daily Yield</div>
          <div className="text-purple-400 font-bold">{dailyYield}%</div>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-400">
        Vol/TVL: {volumeToTvl}x | APY: {pool.apy?.toFixed(1) || 0}%
      </div>
    </div>
  );
}

function CalculatorView({ pool, onBack }) {
  const [capital, setCapital] = useState(500);
  const [poolType, setPoolType] = useState(pool.type);
  const [strategy, setStrategy] = useState('curve');
  const [results, setResults] = useState(null);
  const [priceScenario, setPriceScenario] = useState('sideways');
  
  const strategies = poolType === 'DLMM' ? ['spot', 'curve', 'bid-ask'] : ['full'];
  
  const scenarios = {
    'sideways': { label: 'Sideways (±5%)', priceChange: 1.0, volumeMultiplier: 1.0 },
    'pump': { label: 'Pump (+30%)', priceChange: 1.3, volumeMultiplier: 1.3 },
    'dump': { label: 'Dump (-30%)', priceChange: 0.7, volumeMultiplier: 1.2 },
    'volatile': { label: 'Volatile (±15%)', priceChange: 1.0, volumeMultiplier: 1.5 }
  };
  
  useEffect(() => {
    calculateResults();
  }, [capital, poolType, strategy, priceScenario]);
  
  const calculateResults = () => {
    const scenario = scenarios[priceScenario];
    const concentration = calculations.calculateConcentration(strategy);
    
    const adjustedVolume = pool.volume_24h * scenario.volumeMultiplier;
    const dailyFee = calculations.calculateFees(
      pool.tvl,
      adjustedVolume,
      pool.total_trading_fee,
      capital,
      concentration
    );
    const weeklyFee = dailyFee * 7;
    
    const ilPercent = calculations.calculateIL(scenario.priceChange);
    const ilLoss = capital * (Math.abs(ilPercent) / 100);
    
    const weeklyROI = calculations.calculateROI(capital, weeklyFee, ilLoss);
    const monthlyROI = calculations.calculateROI(capital, weeklyFee * 4.33, ilLoss * 4.33);
    
    const breakEvenDays = ilLoss > 0 ? (ilLoss / dailyFee).toFixed(1) : 0;
    
    const token0Amount = capital / 2 / (pool.token0.price_usd || 1);
    const token1Amount = capital / 2 / (pool.token1.price_usd || 1);
    
    setResults({
      dailyFee,
      weeklyFee,
      ilPercent,
      ilLoss,
      weeklyROI,
      monthlyROI,
      breakEvenDays,
      token0Amount,
      token1Amount,
      netWeekly: weeklyFee - ilLoss
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-purple-400 hover:text-purple-300">
          ← Back
        </button>
        <div className="text-right">
          <h2 className="text-xl font-bold text-white">{pool.pair}</h2>
          <span className="text-sm text-gray-400">{pool.type}</span>
        </div>
      </div>
      
      <div className="bg-slate-700/50 p-4 rounded-xl">
        <label className="block text-sm text-gray-300 mb-2">Capital (USD)</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="number"
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
            className="w-full pl-10 pr-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:border-purple-500 outline-none"
            min="10"
            step="10"
          />
        </div>
      </div>
      
      <div className="bg-slate-700/50 p-4 rounded-xl">
        <label className="block text-sm text-gray-300 mb-2">Pool Type</label>
        <div className="flex gap-2">
          <button
            onClick={() => setPoolType('DLMM')}
            className={`flex-1 py-2 rounded-lg font-semibold transition ${
              poolType === 'DLMM' ? 'bg-purple-500 text-white' : 'bg-slate-600 text-gray-300 hover:bg-slate-500'
            }`}
          >
            DLMM
          </button>
          <button
            onClick={() => setPoolType('DAMM')}
            className={`flex-1 py-2 rounded-lg font-semibold transition ${
              poolType === 'DAMM' ? 'bg-purple-500 text-white' : 'bg-slate-600 text-gray-300 hover:bg-slate-500'
            }`}
          >
            DAMM
          </button>
        </div>
      </div>
      
      {poolType === 'DLMM' && (
        <div className="bg-slate-700/50 p-4 rounded-xl">
          <label className="block text-sm text-gray-300 mb-2">Strategy</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full p-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:border-purple-500 outline-none"
          >
            <option value="spot">Spot (Tight Range)</option>
            <option value="curve">Curve (Medium Range)</option>
            <option value="bid-ask">Bid-Ask (Wide Range)</option>
          </select>
        </div>
      )}
      
      <div className="bg-slate-700/50 p-4 rounded-xl">
        <label className="block text-sm text-gray-300 mb-2">Price Scenario</label>
        <select
          value={priceScenario}
          onChange={(e) => setPriceScenario(e.target.value)}
          className="w-full p-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:border-purple-500 outline-none"
        >
          {Object.entries(scenarios).map(([key, scenario]) => (
            <option key={key} value={key}>{scenario.label}</option>
          ))}
        </select>
      </div>
      
      {results && (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-blue-900/30 to-slate-800/50 p-4 rounded-xl border border-blue-500/30">
            <h3 className="text-sm font-semibold text-blue-300 mb-3">Your Position</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">{pool.token0?.symbol || 'Token0'}:</span>
                <span className="text-white font-mono">{results.token0Amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">{pool.token1?.symbol || 'Token1'}:</span>
                <span className="text-white font-mono">{results.token1Amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-900/30 to-slate-800/50 p-4 rounded-xl border border-green-500/30">
            <h3 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Fee Earnings
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Daily:</span>
                <span className="text-green-400 font-bold text-lg">${results.dailyFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Weekly:</span>
                <span className="text-green-400 font-bold text-xl">${results.weeklyFee.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-900/30 to-slate-800/50 p-4 rounded-xl border border-purple-500/30">
            <h3 className="text-sm font-semibold text-purple-300 mb-3">Performance</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Impermanent Loss:</span>
                <span className="text-yellow-400 font-mono">{results.ilPercent.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">IL Loss:</span>
                <span className="text-red-400 font-mono">-${results.ilLoss.toFixed(2)}</span>
              </div>
              <div className="border-t border-purple-500/30 my-2"></div>
              <div className="flex justify-between">
                <span className="text-gray-300">Net Weekly:</span>
                <span className={`font-bold text-lg ${results.netWeekly > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${results.netWeekly.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Weekly ROI:</span>
                <span className={`font-bold text-xl ${results.weeklyROI > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {results.weeklyROI > 0 ? '+' : ''}{results.weeklyROI.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          {results.breakEvenDays > 0 && (
            <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/30 flex items-start gap-2">
              <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-200">
                Break-even: <span className="font-bold">{results.breakEvenDays} days</span>
              </div>
            </div>
          )}
          
          <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/30 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-200">
              Projections assume constant volume. Not financial advice. DYOR!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================

export default function MeteoraCalculator() {
  const [view, setView] = useState('pools');
  const [selectedPool, setSelectedPool] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  
  const { pools, loading, error, lastUpdated, refresh } = usePoolsData();
  
  const filteredPools = pools.filter(pool => {
    const matchesSearch = pool.pair.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || pool.type === filterType;
    return matchesSearch && matchesType;
  });
  
  const handleSelectPool = (pool) => {
    setSelectedPool(pool);
    setView('calculator');
  };
  
  const handleRefresh = () => {
    Cache.clear();
    refresh();
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calculator className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Meteora Calculator</h1>
          </div>
          <p className="text-gray-400 text-sm">DLMM & DAMM Position Analysis</p>
          {lastUpdated && (
            <p className="text-gray-500 text-xs mt-1">
              Updated: {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}
        </div>
        
        {view === 'pools' ? (
          <div className="space-y-4">
            {error && <ErrorState error={error} onRetry={refresh} />}
            
            <div className="bg-slate-800/50 p-4 rounded-xl space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search pools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                />
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg transition"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="flex gap-2">
                {['ALL', 'DLMM', 'DAMM'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      filterType === type
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            {loading && <LoadingState />}
            
            {!loading && !error && (
              <div className="space-y-3">
                {filteredPools.map(pool => (
                  <PoolCard
                    key={pool.id}
                    pool={pool}
                    onSelect={handleSelectPool}
                    isSelected={false}
                  />
                ))}
              </div>
            )}
            
            {!loading && !error && filteredPools.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No pools found
              </div>
            )}
          </div>
        ) : (
          <CalculatorView
            pool={selectedPool}
            onBack={() => setView('pools')}
          />
        )}
        
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Data from Meteora API</p>
          <p className="mt-1">Not financial advice • DYOR</p>
        </div>
      </div>
    </div>
  );
}