import { useState, useCallback } from 'react';

const STORAGE_KEY = 'meteora_calc_history';
const MAX_ENTRIES = 50;

function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeHistory(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage might be unavailable in some mobile WebViews
  }
}

export default function useHistory() {
  const [history, setHistory] = useState(readHistory);

  const saveCalculation = useCallback((data) => {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      pool: data.pool,
      capital: data.capital,
      strategy: data.strategy,
      poolType: data.poolType,
      scenario: data.scenario,
      results: {
        dailyFee: data.results.dailyFee,
        weeklyFee: data.results.weeklyFee,
        ilPercent: data.results.ilPercent,
        weeklyROI: data.results.weeklyROI,
        monthlyROI: data.results.monthlyROI,
        netWeekly: data.results.netWeekly,
        breakEvenDays: data.results.breakEvenDays,
      },
    };

    const updated = [entry, ...readHistory()].slice(0, MAX_ENTRIES);
    writeHistory(updated);
    setHistory(updated);
    return entry;
  }, []);

  const deleteEntry = useCallback((id) => {
    const updated = readHistory().filter((e) => e.id !== id);
    writeHistory(updated);
    setHistory(updated);
  }, []);

  const clearHistory = useCallback(() => {
    writeHistory([]);
    setHistory([]);
  }, []);

  return { history, saveCalculation, deleteEntry, clearHistory };
}
