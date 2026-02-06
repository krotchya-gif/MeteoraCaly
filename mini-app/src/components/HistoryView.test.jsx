import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HistoryView from './HistoryView';

const mockEntry = {
  id: 'abc123',
  timestamp: Date.now(),
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
};

describe('HistoryView', () => {
  it('shows empty state when no history', () => {
    render(<HistoryView history={[]} onDelete={() => {}} onClear={() => {}} />);
    expect(screen.getByText('Belum ada riwayat')).toBeInTheDocument();
  });

  it('renders history entries', () => {
    render(<HistoryView history={[mockEntry]} onDelete={() => {}} onClear={() => {}} />);
    expect(screen.getByText('SOL/USDC')).toBeInTheDocument();
    expect(screen.getByText('DLMM')).toBeInTheDocument();
    expect(screen.getByText('+2.50%')).toBeInTheDocument();
  });

  it('shows entry count', () => {
    render(<HistoryView history={[mockEntry]} onDelete={() => {}} onClear={() => {}} />);
    expect(screen.getByText('1 hasil tersimpan')).toBeInTheDocument();
  });

  it('expands card to show details on click', () => {
    render(<HistoryView history={[mockEntry]} onDelete={() => {}} onClear={() => {}} />);
    fireEvent.click(screen.getByText('SOL/USDC'));
    expect(screen.getByText('$5.50')).toBeInTheDocument();
    expect(screen.getByText('$38.50')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<HistoryView history={[mockEntry]} onDelete={onDelete} onClear={() => {}} />);
    // Expand first
    fireEvent.click(screen.getByText('SOL/USDC'));
    fireEvent.click(screen.getByText('Hapus'));
    expect(onDelete).toHaveBeenCalledWith('abc123');
  });

  it('calls onClear when clear all clicked', () => {
    const onClear = vi.fn();
    render(<HistoryView history={[mockEntry]} onDelete={() => {}} onClear={onClear} />);
    fireEvent.click(screen.getByText('Hapus Semua'));
    expect(onClear).toHaveBeenCalled();
  });
});
