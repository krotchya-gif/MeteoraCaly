import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useHistory from './useHistory';

describe('useHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty history', () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current.history).toEqual([]);
  });

  it('saves a calculation', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.saveCalculation({
        pool: 'SOL/USDC',
        capital: 1000,
        strategy: 'curve',
        poolType: 'DLMM',
        scenario: 'sideways',
        results: {
          dailyFee: 5.5,
          weeklyFee: 38.5,
          ilPercent: -1.2,
          weeklyROI: 2.5,
          monthlyROI: 10.8,
          netWeekly: 30.0,
          breakEvenDays: 3,
        },
      });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].pool).toBe('SOL/USDC');
    expect(result.current.history[0].capital).toBe(1000);
    expect(result.current.history[0].results.dailyFee).toBe(5.5);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.saveCalculation({
        pool: 'BTC/USDC',
        capital: 500,
        strategy: 'spot',
        poolType: 'DLMM',
        scenario: 'pump',
        results: {
          dailyFee: 10,
          weeklyFee: 70,
          ilPercent: -2,
          weeklyROI: 5,
          monthlyROI: 20,
          netWeekly: 50,
          breakEvenDays: 2,
        },
      });
    });

    const stored = JSON.parse(localStorage.getItem('meteora_calc_history'));
    expect(stored).toHaveLength(1);
    expect(stored[0].pool).toBe('BTC/USDC');
  });

  it('deletes an entry', () => {
    const { result } = renderHook(() => useHistory());

    let entryId;
    act(() => {
      const entry = result.current.saveCalculation({
        pool: 'A/B',
        capital: 100,
        strategy: 'curve',
        poolType: 'DLMM',
        scenario: 'sideways',
        results: { dailyFee: 1, weeklyFee: 7, ilPercent: 0, weeklyROI: 1, monthlyROI: 4, netWeekly: 7, breakEvenDays: 0 },
      });
      entryId = entry.id;
    });

    expect(result.current.history).toHaveLength(1);

    act(() => {
      result.current.deleteEntry(entryId);
    });

    expect(result.current.history).toHaveLength(0);
  });

  it('clears all history', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.saveCalculation({
        pool: 'A/B', capital: 100, strategy: 'curve', poolType: 'DLMM', scenario: 'sideways',
        results: { dailyFee: 1, weeklyFee: 7, ilPercent: 0, weeklyROI: 1, monthlyROI: 4, netWeekly: 7, breakEvenDays: 0 },
      });
      result.current.saveCalculation({
        pool: 'C/D', capital: 200, strategy: 'spot', poolType: 'DLMM', scenario: 'pump',
        results: { dailyFee: 2, weeklyFee: 14, ilPercent: -1, weeklyROI: 2, monthlyROI: 8, netWeekly: 12, breakEvenDays: 1 },
      });
    });

    expect(result.current.history).toHaveLength(2);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem('meteora_calc_history'))).toEqual([]);
  });

  it('newest entry is first (LIFO order)', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.saveCalculation({
        pool: 'FIRST', capital: 100, strategy: 'curve', poolType: 'DLMM', scenario: 'sideways',
        results: { dailyFee: 1, weeklyFee: 7, ilPercent: 0, weeklyROI: 1, monthlyROI: 4, netWeekly: 7, breakEvenDays: 0 },
      });
    });

    act(() => {
      result.current.saveCalculation({
        pool: 'SECOND', capital: 200, strategy: 'spot', poolType: 'DLMM', scenario: 'pump',
        results: { dailyFee: 2, weeklyFee: 14, ilPercent: -1, weeklyROI: 2, monthlyROI: 8, netWeekly: 12, breakEvenDays: 1 },
      });
    });

    expect(result.current.history[0].pool).toBe('SECOND');
    expect(result.current.history[1].pool).toBe('FIRST');
  });

  it('limits to 50 entries', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      for (let i = 0; i < 55; i++) {
        result.current.saveCalculation({
          pool: `POOL-${i}`, capital: 100, strategy: 'curve', poolType: 'DLMM', scenario: 'sideways',
          results: { dailyFee: 1, weeklyFee: 7, ilPercent: 0, weeklyROI: 1, monthlyROI: 4, netWeekly: 7, breakEvenDays: 0 },
        });
      }
    });

    expect(result.current.history).toHaveLength(50);
    expect(result.current.history[0].pool).toBe('POOL-54');
  });
});
