import { useState } from 'react';
import { Calculator, BarChart3, LineChart } from 'lucide-react';
import MeteoraCalculator, { POOLS_DATA } from './components/MeteoraCalculator';
import ComparisonView from './components/ComparisonView';
import ChartDashboard from './components/charts/ChartDashboard';

function App() {
  const [activeTab, setActiveTab] = useState('calculator');

  // Transform pool data format for ComparisonView
  // MeteoraCalculator uses: id, pair, tvl, fees_24h, volume_24h
  // ComparisonView expects: address, name, liquidity, fee_24h, trade_volume_24h
  const comparisonPools = POOLS_DATA.map(pool => ({
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
    <div>
      {/* Content area with bottom padding for nav bar */}
      <div className="pb-20">
        {activeTab === 'calculator' && (
          <MeteoraCalculator />
        )}

        {activeTab === 'comparison' && (
          <ComparisonView
            pools={comparisonPools}
            onBack={() => setActiveTab('calculator')}
          />
        )}

        {activeTab === 'charts' && (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white">Analytics Dashboard</h2>
                <p className="text-gray-400 text-sm">Visualisasi IL, Fee & ROI</p>
              </div>
              <ChartDashboard />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 z-50">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-3 px-2 transition-colors ${
                  isActive
                    ? 'text-purple-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;
