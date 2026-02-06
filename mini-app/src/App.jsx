import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, BarChart3, LineChart, Sun, Moon } from 'lucide-react';
import MeteoraCalculator, { POOLS_DATA } from './components/MeteoraCalculator';
import ComparisonView from './components/ComparisonView';
import ChartDashboard from './components/charts/ChartDashboard';

const API_URL = 'https://meteora-calculator-api.infocyber001.workers.dev';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 bg-red-950 border border-red-700 rounded-xl text-center">
          <p className="text-red-400 font-bold mb-2">Error</p>
          <p className="text-gray-300 text-sm">{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
          >
            Coba Lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [pools, setPools] = useState(POOLS_DATA);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/pools/top/50`);
      const data = await res.json();

      if (data.success && data.data?.pools?.length > 0) {
        setPools(data.data.pools);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('Failed to fetch pools:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.scrollTo(0, 0);
  };

  const comparisonPools = pools.map(pool => ({
    address: pool.id,
    name: pool.pair,
    liquidity: pool.tvl,
    fee_24h: pool.fees_24h,
    trade_volume_24h: pool.volume_24h,
  }));

  const tabs = [
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'comparison', label: 'Compare', icon: BarChart3 },
    { id: 'charts', label: 'Charts', icon: LineChart },
  ];

  return (
    <div className="min-h-screen dark:bg-slate-900 bg-gray-50">
      {/* Top Tab Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-800 dark:bg-slate-800 bg-white border-b border-slate-600 dark:border-slate-600 border-gray-200">
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
                <span>{tab.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 mx-1 rounded-lg dark:text-yellow-400 text-slate-600 dark:hover:bg-slate-700 hover:bg-gray-100 transition-colors"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Content */}
      {activeTab === 'calculator' && (
        <MeteoraCalculator
          pools={pools}
          loading={loading}
          onRefresh={fetchPools}
          lastUpdated={lastUpdated}
        />
      )}

      {activeTab === 'comparison' && (
        <ErrorBoundary>
          <ComparisonView
            pools={comparisonPools}
            onBack={() => handleTabChange('calculator')}
          />
        </ErrorBoundary>
      )}

      {activeTab === 'charts' && (
        <ErrorBoundary>
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
    </div>
  );
}

export default App;
