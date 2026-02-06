import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { calculateIL, calculateFees, calculateConcentration, calculateROI } from '../utils/calculations';

// Sample pool data (in real app, this would be pools.json)
export const POOLS_DATA = [
  {
    id: 'bfs-sol-dlmm',
    pair: 'BFS/SOL',
    type: 'DLMM',
    tvl: 111657,
    volume_24h: 11075091,
    fees_24h: 44954,
    current_price: 0.001480,
    bin_step: 25,
    base_fee: 0.25,
    total_trading_fee: 0.7677,
    token0: { symbol: 'BFS', price_usd: 0.148 },
    token1: { symbol: 'SOL', price_usd: 100 }
  },
  {
    id: 'bfs-usdc-dlmm',
    pair: 'BFS/USDC',
    type: 'DLMM',
    tvl: 143512,
    volume_24h: 6090418,
    fees_24h: 41120,
    current_price: 0.1719,
    bin_step: 50,
    base_fee: 0.5,
    total_trading_fee: 0.8025,
    token0: { symbol: 'BFS', price_usd: 0.148 },
    token1: { symbol: 'USDC', price_usd: 1.0 }
  }
];

// Pool Card Component
const PoolCard = React.memo(function PoolCard({ pool, onSelect, isSelected }) {
  const volumeToTvl = ((pool.volume_24h / pool.tvl) * 100).toFixed(0);
  const dailyYield = ((pool.fees_24h / pool.tvl) * 100).toFixed(2);

  return (
    <div
      onClick={() => onSelect(pool)}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-purple-500 dark:bg-purple-900 bg-purple-50'
          : 'dark:border-slate-600 border-gray-200 dark:bg-slate-800 bg-white hover:border-purple-400'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold dark:text-white text-gray-900">{pool.pair}</h3>
          <span className="text-xs px-2 py-1 rounded dark:bg-blue-900 bg-blue-100 dark:text-blue-300 text-blue-700">
            {pool.type}
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm dark:text-gray-400 text-gray-500">TVL</div>
          <div className="dark:text-white text-gray-900 font-mono">${(pool.tvl / 1000).toFixed(0)}K</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="dark:text-gray-400 text-gray-500">24h Vol</div>
          <div className="dark:text-white text-gray-900 font-mono">${(pool.volume_24h / 1000000).toFixed(1)}M</div>
        </div>
        <div>
          <div className="dark:text-gray-400 text-gray-500">24h Fees</div>
          <div className="text-green-600 dark:text-green-400 font-mono">${(pool.fees_24h / 1000).toFixed(1)}K</div>
        </div>
        <div>
          <div className="dark:text-gray-400 text-gray-500">Daily Yield</div>
          <div className="text-purple-600 dark:text-purple-400 font-bold">{dailyYield}%</div>
        </div>
      </div>

      <div className="mt-2 text-xs dark:text-gray-400 text-gray-500">
        Vol/TVL: {volumeToTvl}x | Fee: {pool.total_trading_fee}%
      </div>
    </div>
  );
});

// Calculator Component
function CalculatorView({ pool, onBack, onSave }) {
  const [capital, setCapital] = useState(500);
  const [poolType, setPoolType] = useState(pool.type);
  const [strategy, setStrategy] = useState('curve');
  const [results, setResults] = useState(null);
  const [priceScenario, setPriceScenario] = useState('sideways');
  const [saved, setSaved] = useState(false);

  const strategies = poolType === 'DLMM'
    ? ['spot', 'curve', 'bid-ask']
    : ['full'];

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
    const concentration = calculateConcentration(strategy);

    const adjustedVolume = pool.volume_24h * scenario.volumeMultiplier;
    const dailyFee = calculateFees(
      pool.tvl,
      adjustedVolume,
      pool.total_trading_fee,
      capital,
      concentration
    );
    const weeklyFee = dailyFee * 7;

    const ilPercent = calculateIL(scenario.priceChange);
    const ilLoss = capital * (Math.abs(ilPercent) / 100);

    const weeklyROI = calculateROI(capital, weeklyFee, ilLoss);
    const monthlyROI = calculateROI(capital, weeklyFee * 4.33, ilLoss * 4.33);

    const breakEvenDays = ilLoss > 0 ? (ilLoss / dailyFee).toFixed(1) : 0;

    const t0Price = pool.token0?.price_usd || 0;
    const t1Price = pool.token1?.price_usd || 0;
    const token0Amount = t0Price > 0 ? capital / 2 / t0Price : 0;
    const token1Amount = t1Price > 0 ? capital / 2 / t1Price : 0;

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300"
        >
          ← Back
        </button>
        <div className="text-right">
          <h2 className="text-xl font-bold dark:text-white text-gray-900">{pool.pair}</h2>
          <span className="text-sm dark:text-gray-400 text-gray-500">{pool.type}</span>
        </div>
      </div>

      {/* Capital Input */}
      <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-gray-200 p-4 rounded-xl">
        <label className="block text-sm dark:text-gray-300 text-gray-700 mb-2">Capital (USD)</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 dark:text-gray-400 text-gray-500" />
          <input
            type="number"
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
            className="w-full pl-10 pr-4 py-3 dark:bg-slate-600 bg-gray-50 dark:text-white text-gray-900 rounded-lg border dark:border-slate-500 border-gray-300 focus:border-purple-500 outline-none"
            min="10"
            step="10"
          />
        </div>
      </div>

      {/* Type Toggle */}
      <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-gray-200 p-4 rounded-xl">
        <label className="block text-sm dark:text-gray-300 text-gray-700 mb-2">Pool Type</label>
        <div className="flex gap-2">
          <button
            onClick={() => setPoolType('DLMM')}
            className={`flex-1 py-2 rounded-lg font-semibold transition ${
              poolType === 'DLMM'
                ? 'bg-purple-500 text-white'
                : 'dark:bg-slate-600 bg-gray-100 dark:text-gray-300 text-gray-600 dark:hover:bg-slate-500 hover:bg-gray-200'
            }`}
          >
            DLMM
          </button>
          <button
            onClick={() => setPoolType('DAMM')}
            className={`flex-1 py-2 rounded-lg font-semibold transition ${
              poolType === 'DAMM'
                ? 'bg-purple-500 text-white'
                : 'dark:bg-slate-600 bg-gray-100 dark:text-gray-300 text-gray-600 dark:hover:bg-slate-500 hover:bg-gray-200'
            }`}
          >
            DAMM
          </button>
        </div>
      </div>

      {/* Strategy Selector (DLMM only) */}
      {poolType === 'DLMM' && (
        <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-gray-200 p-4 rounded-xl">
          <label className="block text-sm dark:text-gray-300 text-gray-700 mb-2">Strategy</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full p-3 dark:bg-slate-600 bg-gray-50 dark:text-white text-gray-900 rounded-lg border dark:border-slate-500 border-gray-300 focus:border-purple-500 outline-none"
          >
            <option value="spot">Spot (Tight Range)</option>
            <option value="curve">Curve (Medium Range)</option>
            <option value="bid-ask">Bid-Ask (Wide Range)</option>
          </select>
        </div>
      )}

      {/* Price Scenario */}
      <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-gray-200 p-4 rounded-xl">
        <label className="block text-sm dark:text-gray-300 text-gray-700 mb-2">Price Scenario</label>
        <select
          value={priceScenario}
          onChange={(e) => setPriceScenario(e.target.value)}
          className="w-full p-3 dark:bg-slate-600 bg-gray-50 dark:text-white text-gray-900 rounded-lg border dark:border-slate-500 border-gray-300 focus:border-purple-500 outline-none"
        >
          {Object.entries(scenarios).map(([key, scenario]) => (
            <option key={key} value={key}>{scenario.label}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-3">
          {/* Position Split */}
          <div className="dark:bg-slate-800 bg-white p-4 rounded-xl border dark:border-slate-600 border-gray-200">
            <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3">Your Position</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="dark:text-gray-300 text-gray-600">{pool.token0.symbol}:</span>
                <span className="dark:text-white text-gray-900 font-mono">{results.token0Amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="dark:text-gray-300 text-gray-600">{pool.token1.symbol}:</span>
                <span className="dark:text-white text-gray-900 font-mono">{results.token1Amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Fee Earnings */}
          <div className="dark:bg-slate-800 bg-white p-4 rounded-xl border dark:border-slate-600 border-gray-200">
            <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Fee Earnings
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="dark:text-gray-300 text-gray-600">Daily:</span>
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">${results.dailyFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="dark:text-gray-300 text-gray-600">Weekly:</span>
                <span className="text-green-600 dark:text-green-400 font-bold text-xl">${results.weeklyFee.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* IL & ROI */}
          <div className="dark:bg-slate-800 bg-white p-4 rounded-xl border dark:border-slate-600 border-gray-200">
            <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-3">Performance</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="dark:text-gray-300 text-gray-600">Impermanent Loss:</span>
                <span className="text-yellow-600 dark:text-yellow-400 font-mono">{results.ilPercent.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="dark:text-gray-300 text-gray-600">IL Loss:</span>
                <span className="text-red-600 dark:text-red-400 font-mono">-${results.ilLoss.toFixed(2)}</span>
              </div>
              <div className="border-t dark:border-slate-600 border-gray-200 my-2"></div>
              <div className="flex justify-between">
                <span className="dark:text-gray-300 text-gray-600">Net Weekly:</span>
                <span className={`font-bold text-lg ${results.netWeekly > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${results.netWeekly.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="dark:text-gray-300 text-gray-600">Weekly ROI:</span>
                <span className={`font-bold text-xl ${results.weeklyROI > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {results.weeklyROI > 0 ? '+' : ''}{results.weeklyROI.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="dark:text-gray-300 text-gray-600">Monthly ROI:</span>
                <span className={`font-mono ${results.monthlyROI > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {results.monthlyROI > 0 ? '+' : ''}{results.monthlyROI.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Break-even */}
          {results.breakEvenDays > 0 && (
            <div className="dark:bg-yellow-950 bg-yellow-50 p-3 rounded-lg border dark:border-yellow-700 border-yellow-300 flex items-start gap-2">
              <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm dark:text-yellow-200 text-yellow-800">
                Break-even: <span className="font-bold">{results.breakEvenDays} days</span> to cover IL with fees
              </div>
            </div>
          )}

          {/* Save Button */}
          {onSave && (
            <button
              onClick={() => {
                onSave({
                  pool: pool.pair,
                  capital,
                  strategy,
                  poolType,
                  scenario: priceScenario,
                  results,
                });
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
              disabled={saved}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {saved ? '✓ Tersimpan!' : 'Save ke History'}
            </button>
          )}

          {/* Disclaimer */}
          <div className="dark:bg-red-950 bg-red-50 p-3 rounded-lg border dark:border-red-700 border-red-300 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs dark:text-red-200 text-red-700">
              Projections assume constant volume. Not financial advice. DYOR!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App
export default function MeteoraCalculator({ pools = POOLS_DATA, loading = false, loadingMore = false, hasMore = false, onRefresh, onLoadMore, lastUpdated, onSave }) {
  const [view, setView] = useState('pools');
  const [selectedPool, setSelectedPool] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredPools = useMemo(() => pools.filter(pool => {
    const matchesSearch = pool.pair.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || pool.type === filterType;
    return matchesSearch && matchesType;
  }), [pools, searchTerm, filterType]);

  const handleSelectPool = useCallback((pool) => {
    setSelectedPool(pool);
    setView('calculator');
  }, []);

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calculator className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-2xl font-bold dark:text-white text-gray-900">Meteora Calculator</h1>
          </div>
          <p className="dark:text-gray-400 text-gray-500 text-sm">DLMM & DAMM Position Analysis</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="mt-2 inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Memuat...' : 'Refresh Data'}
            </button>
          )}
        </div>

        {/* Content */}
        {view === 'pools' ? (
          <div className="space-y-4">
            {/* Search & Filter */}
            <div className="dark:bg-slate-800 bg-white border dark:border-slate-700 border-gray-200 p-4 rounded-xl space-y-3">
              <input
                type="text"
                placeholder="Search pools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 dark:bg-slate-700 bg-gray-50 dark:text-white text-gray-900 rounded-lg border dark:border-slate-600 border-gray-300 focus:border-purple-500 outline-none placeholder:text-gray-400"
              />

              <div className="flex gap-2">
                {['ALL', 'DLMM', 'DAMM'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      filterType === type
                        ? 'bg-purple-500 text-white'
                        : 'dark:bg-slate-700 bg-gray-100 dark:text-gray-300 text-gray-600 dark:hover:bg-slate-600 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {loading && pools.length <= 2 && (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
                <p className="dark:text-gray-400 text-gray-500 text-sm">Memuat data pool dari Meteora API...</p>
              </div>
            )}

            {/* Pool Count */}
            {!loading && (
              <div className="text-xs dark:text-gray-500 text-gray-400 px-1">
                {filteredPools.length} pool ditemukan
              </div>
            )}

            {/* Pool List */}
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

            {/* Load More */}
            {!loading && hasMore && !searchTerm && filterType === 'ALL' && (
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all border-2 dark:border-slate-600 border-gray-300 dark:text-gray-300 text-gray-600 dark:hover:border-purple-500 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Memuat...
                  </span>
                ) : (
                  `Muat 25 pool lagi (${pools.length} ditampilkan)`
                )}
              </button>
            )}

            {!loading && filteredPools.length === 0 && (
              <div className="text-center py-12 dark:text-gray-400 text-gray-500">
                No pools found
              </div>
            )}
          </div>
        ) : (
          <CalculatorView
            pool={selectedPool}
            onBack={() => setView('pools')}
            onSave={onSave}
          />
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs dark:text-gray-500 text-gray-400">
          <p>
            {lastUpdated
              ? `Live data • Updated ${lastUpdated.toLocaleTimeString()}`
              : 'Static data • Fallback mode'
            }
          </p>
          <p className="mt-1">Not financial advice • DYOR</p>
        </div>
      </div>
    </div>
  );
}
