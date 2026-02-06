import React, { useState } from 'react';
import { Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react';

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function HistoryCard({ entry, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const r = entry.results;
  const isProfit = r.netWeekly > 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white">{entry.pool}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
              {entry.poolType}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {r.weeklyROI > 0 ? '+' : ''}{r.weeklyROI.toFixed(2)}%
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>${entry.capital}</span>
          <span className="capitalize">{entry.strategy}</span>
          <span className="ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(entry.timestamp)}
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-slate-700 pt-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Daily Fee</span>
              <p className="text-green-600 dark:text-green-400 font-mono font-semibold">
                ${r.dailyFee.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Weekly Fee</span>
              <p className="text-green-600 dark:text-green-400 font-mono font-semibold">
                ${r.weeklyFee.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">IL</span>
              <p className="text-yellow-600 dark:text-yellow-400 font-mono">
                {r.ilPercent.toFixed(2)}%
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Net Weekly</span>
              <p className={`font-mono font-semibold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${r.netWeekly.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Monthly ROI</span>
              <p className={`font-mono ${r.monthlyROI > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {r.monthlyROI > 0 ? '+' : ''}{r.monthlyROI.toFixed(2)}%
              </p>
            </div>
            {r.breakEvenDays > 0 && (
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-xs">Break-even</span>
                <p className="text-gray-900 dark:text-white font-mono">{r.breakEvenDays} hari</p>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(entry.id);
            }}
            className="mt-3 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}

export default function HistoryView({ history, onDelete, onClear }) {
  if (history.length === 0) {
    return (
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold dark:text-white text-gray-900">Riwayat Kalkulasi</h2>
            <p className="dark:text-gray-400 text-gray-600 text-sm">Simpan hasil perhitungan kamu</p>
          </div>

          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Belum ada riwayat</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Buka Calculator, pilih pool, dan klik "Save" untuk menyimpan hasil.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold dark:text-white text-gray-900">Riwayat Kalkulasi</h2>
            <p className="dark:text-gray-400 text-gray-600 text-sm">{history.length} hasil tersimpan</p>
          </div>
          <button
            onClick={onClear}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            Hapus Semua
          </button>
        </div>

        {/* History List */}
        <div className="space-y-3">
          {history.map((entry) => (
            <HistoryCard key={entry.id} entry={entry} onDelete={onDelete} />
          ))}
        </div>

        <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          Maksimal 50 riwayat tersimpan di perangkat ini
        </div>
      </div>
    </div>
  );
}
