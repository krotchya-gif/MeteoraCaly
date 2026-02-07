import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Calculator, BarChart3, LineChart, Clock, BookOpen, Sun, Moon, RefreshCw } from 'lucide-react';
import MeteoraCalculator, { POOLS_DATA } from './components/MeteoraCalculator';
import useHistory from './hooks/useHistory';
import useToast, { getErrorMessage, retryWithBackoff } from './hooks/useToast';
import { ToastContainer } from './components/Toast';
import { SkeletonPoolList } from './components/Skeleton';
import { getCached, setCache, fetchWithCache } from './utils/cache';
import { getPoolsWithFallback, validateAPIResponse, extractPools } from './utils/validation';

// Direct import for small/critical components
import HistoryView from './components/HistoryView';

// Lazy load larger tab components
const ComparisonView = lazy(() => import('./components/ComparisonView'));
const ChartDashboard = lazy(() => import('./components/charts/ChartDashboard'));
const LearnView = lazy(() => import('./components/LearnView'));

const API_URL = 'https://meteora-calculator-api.infocyber001.workers.dev';
const CACHE_KEY_POOLS = 'pools_data';
const CACHE_TTL = 900000; // 15 minutes (sync with backend)
const AUTO_REFRESH_INTERVAL = 900000; // 15 minutes

function TabFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 bg-red-950 border border-red-700 rounded-xl text-center">
          <p className="text-red-400 font-bold mb-2">⚠️ Error</p>
          <p className="text-gray-300 text-sm">{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onRetry?.();
            }}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
          >
            🔄 Coba Lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [poolLimit, setPoolLimit] = useState(25);
  const [hasMore, setHasMore] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const { history, saveCalculation, deleteEntry, clearHistory } = useHistory();
  const toast = useToast();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  /**
   * Enhanced fetch pools with:
   * - Cache support
   * - Data validation
   * - Fallback data
   * - Toast notifications
   * - Retry with backoff
   */
  const fetchPools = useCallback(async (limit = 25, append = false, showToast = false) => {
    const loadingState = append ? setLoadingMore : setLoading;
    loadingState(true);

    try {
      // Try cache first (only for initial load)
      if (!append && !showToast) {
        const cached = getCached(CACHE_KEY_POOLS, CACHE_TTL);
        if (cached) {
          const validPools = extractPools(cached);
          if (validPools && validPools.length > 0) {
            setPools(validPools.slice(0, limit));
            setLastUpdated(new Date(cached.timestamp));
            setPoolLimit(limit);
            setHasMore(limit < 100 && validPools.length >= limit);
            loadingState(false);
            return;
          }
        }
      }

      // Fetch from API with retry
      const { data, fromCache } = await retryWithBackoff(
        () => fetchWithCache(
          `${API_URL}/api/pools/top/${limit}`,
          { headers: { 'Accept': 'application/json' } },
          CACHE_KEY_POOLS,
          CACHE_TTL
        ),
        3,
        1000
      );

      // Validate response
      if (!validateAPIResponse(data)) {
        throw new Error('Invalid API response format');
      }

      // Extract and validate pools
      const validPools = extractPools(data);

      if (!validPools || validPools.length === 0) {
        // Use fallback data
        const fallbackPools = getPoolsWithFallback(null, true);
        setPools(fallbackPools);
        setLastUpdated(new Date());

        toast.warning('Using demo data. API unavailable.', {
          duration: 5000,
          action: 'Retry',
          onAction: () => fetchPools(limit, false, true),
        });
      } else {
        // Success - use API data
        setPools(validPools);
        setLastUpdated(new Date(data.timestamp || Date.now()));
        setPoolLimit(limit);
        setHasMore(limit < 100 && validPools.length >= limit);

        if (showToast) {
          toast.success(`✅ ${validPools.length} pools loaded${fromCache ? ' (cached)' : ''}`, {
            duration: 2000,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch pools:', error);

      // Use fallback data on error
      const fallbackPools = getPoolsWithFallback(null, true);
      setPools(fallbackPools);

      toast.error(getErrorMessage(error), {
        duration: 6000,
        action: 'Retry',
        onAction: () => fetchPools(limit, false, true),
      });
    } finally {
      loadingState(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  const loadMore = useCallback(() => {
    const nextLimit = Math.min(poolLimit + 25, 100);
    fetchPools(nextLimit, true);
  }, [poolLimit, fetchPools]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPools(poolLimit, false, true);
  }, [poolLimit, fetchPools]);

  // Initial load
  useEffect(() => {
    fetchPools(25);
  }, [fetchPools]);

  // Auto-refresh every 3 minutes
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const intervalId = setInterval(() => {
      console.log('Auto-refreshing pools...');
      fetchPools(poolLimit, false, false);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, poolLimit, fetchPools]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    window.scrollTo(0, 0);
  }, []);

  const comparisonPools = useMemo(() => pools.map(pool => ({
    address: pool.id,
    name: pool.pair,
    liquidity: pool.tvl,
    fee_24h: pool.fees_24h,
    trade_volume_24h: pool.volume_24h,
  })), [pools]);

  const tabs = useMemo(() => [
    { id: 'calculator', label: 'Calc', icon: Calculator },
    { id: 'comparison', label: 'Compare', icon: BarChart3 },
    { id: 'charts', label: 'Charts', icon: LineChart },
    { id: 'history', label: 'History', icon: Clock, badge: history.length || null },
    { id: 'learn', label: 'Learn', icon: BookOpen },
  ], [history.length]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const handleError = useCallback((error) => {
    toast.error(`Error: ${error.message}`, {
      duration: 5000,
    });
  }, [toast]);

  return (
    <div className="min-h-screen dark:bg-slate-900 bg-gray-50">
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      {/* Top Tab Navigation */}
      <nav className="sticky top-0 z-50 dark:bg-slate-800 bg-white border-b dark:border-slate-600 border-gray-200">
        <div className="max-w-2xl mx-auto flex items-center">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-2 text-sm font-semibold transition-colors border-b-2 ${
                  isActive
                    ? 'text-white bg-purple-700 border-purple-400'
                    : 'dark:text-gray-300 text-gray-600 border-transparent dark:hover:bg-slate-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">{tab.label}</span>
                {tab.badge && (
                  <span className="min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-purple-500 text-white rounded-full px-1">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 mx-1 rounded-lg dark:text-gray-300 text-gray-600 dark:hover:bg-slate-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 mx-1 rounded-lg dark:text-yellow-400 text-slate-600 dark:hover:bg-slate-700 hover:bg-gray-100 transition-colors"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Content with Skeleton Loading */}
      {activeTab === 'calculator' && (
        loading && pools.length === 0 ? (
          <div className="p-4">
            <SkeletonPoolList count={5} />
          </div>
        ) : (
          <MeteoraCalculator
            pools={pools}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onRefresh={handleRefresh}
            onLoadMore={loadMore}
            lastUpdated={lastUpdated}
            onSave={saveCalculation}
          />
        )
      )}

      {activeTab === 'history' && (
        <ErrorBoundary onError={handleError} onRetry={() => setActiveTab('calculator')}>
          <HistoryView
            history={history}
            onDelete={deleteEntry}
            onClear={clearHistory}
          />
        </ErrorBoundary>
      )}

      <Suspense fallback={<TabFallback />}>
        {activeTab === 'comparison' && (
          <ErrorBoundary onError={handleError} onRetry={() => setActiveTab('calculator')}>
            <ComparisonView
              pools={comparisonPools}
              onBack={() => handleTabChange('calculator')}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'learn' && (
          <LearnView />
        )}

        {activeTab === 'charts' && (
          <ErrorBoundary onError={handleError} onRetry={() => setActiveTab('calculator')}>
            <div className="p-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold dark:text-white text-gray-900">Analytics Dashboard</h2>
                  <p className="dark:text-gray-400 text-gray-600 text-sm">Visualisasi IL, Fee & ROI</p>
                </div>
                <ChartDashboard />
              </div>
            </div>
          </ErrorBoundary>
        )}
      </Suspense>

      {/* Auto-refresh indicator */}
      {autoRefreshEnabled && lastUpdated && (
        <div className="fixed bottom-4 left-4 text-xs dark:text-gray-400 text-gray-600 bg-black bg-opacity-50 px-3 py-1.5 rounded-full">
          🔄 Last updated: {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

export default App;
