import React, { useState } from 'react';

const ComparisonTable = ({ comparisons }) => {
  const [sortBy, setSortBy] = useState('roi'); // roi, il, fee, net
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  if (!comparisons || comparisons.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-lg font-medium">No Comparisons Yet</p>
        <p className="text-sm mt-2">Select pools and strategies above to start comparing</p>
      </div>
    );
  }

  // Sort comparisons
  const sortedComparisons = [...comparisons].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'roi':
        aValue = a.results.roi;
        bValue = b.results.roi;
        break;
      case 'il':
        aValue = Math.abs(a.results.il);
        bValue = Math.abs(b.results.il);
        break;
      case 'fee':
        aValue = a.results.fees;
        bValue = b.results.fees;
        break;
      case 'net':
        aValue = a.results.netProfit;
        bValue = b.results.netProfit;
        break;
      default:
        aValue = a.results.roi;
        bValue = b.results.roi;
    }

    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'desc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  const getBestValue = (key) => {
    if (key === 'il') {
      // For IL, smallest absolute value is best
      return Math.min(...comparisons.map(c => Math.abs(c.results.il)));
    }
    // For others, highest is best
    return Math.max(...comparisons.map(c => c.results[key]));
  };

  const isBest = (comparison, key) => {
    const bestValue = getBestValue(key);
    if (key === 'il') {
      return Math.abs(comparison.results.il) === bestValue;
    }
    return comparison.results[key] === bestValue;
  };

  return (
    <div className="space-y-4">
      {/* Table Header with Sort */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Comparison Results ({comparisons.length})
        </h3>
        <div className="text-sm text-gray-600">
          Sorted by: <span className="font-medium capitalize">{sortBy}</span>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pool / Strategy
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('roi')}
              >
                <div className="flex items-center space-x-1">
                  <span>ROI</span>
                  <SortIcon column="roi" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('il')}
              >
                <div className="flex items-center space-x-1">
                  <span>IL</span>
                  <SortIcon column="il" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('fee')}
              >
                <div className="flex items-center space-x-1">
                  <span>Fees</span>
                  <SortIcon column="fee" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('net')}
              >
                <div className="flex items-center space-x-1">
                  <span>Net Profit</span>
                  <SortIcon column="net" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedComparisons.map((comparison, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {comparison.poolName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {comparison.strategy} • ${comparison.capital.toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                    isBest(comparison, 'roi') 
                      ? 'bg-green-100 text-green-800' 
                      : comparison.results.roi > 0 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {comparison.results.roi.toFixed(2)}%
                    {isBest(comparison, 'roi') && ' 🏆'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                    isBest(comparison, 'il')
                      ? 'bg-green-100 text-green-800'
                      : Math.abs(comparison.results.il) < 5
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {comparison.results.il.toFixed(2)}%
                    {isBest(comparison, 'il') && ' 🏆'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                    isBest(comparison, 'fees')
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    ${comparison.results.fees.toFixed(2)}
                    {isBest(comparison, 'fees') && ' 🏆'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                    isBest(comparison, 'netProfit')
                      ? 'bg-green-100 text-green-800'
                      : comparison.results.netProfit > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    ${comparison.results.netProfit.toFixed(2)}
                    {isBest(comparison, 'netProfit') && ' 🏆'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {sortedComparisons.map((comparison, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-medium text-gray-900">
                  {comparison.poolName}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {comparison.strategy} • ${comparison.capital.toLocaleString()}
                </div>
              </div>
              {(isBest(comparison, 'roi') || isBest(comparison, 'netProfit')) && (
                <span className="text-2xl">🏆</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 uppercase">ROI</div>
                <div className={`text-lg font-semibold ${
                  comparison.results.roi > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {comparison.results.roi.toFixed(2)}%
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 uppercase">IL</div>
                <div className={`text-lg font-semibold ${
                  Math.abs(comparison.results.il) < 5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {comparison.results.il.toFixed(2)}%
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 uppercase">Fees</div>
                <div className="text-lg font-semibold text-blue-600">
                  ${comparison.results.fees.toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 uppercase">Net Profit</div>
                <div className={`text-lg font-semibold ${
                  comparison.results.netProfit > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${comparison.results.netProfit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Best Overall */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-3xl mr-3">🏆</span>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Best Overall Strategy</div>
            <div className="text-sm text-gray-700 mt-1">
              {sortedComparisons[0].poolName} • {sortedComparisons[0].strategy}
              {' '}→ ROI: {sortedComparisons[0].results.roi.toFixed(2)}% | 
              Net: ${sortedComparisons[0].results.netProfit.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
