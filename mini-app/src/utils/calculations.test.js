import { describe, it, expect } from 'vitest';
import { calculateIL, calculateFees, calculateConcentration, calculateROI } from './calculations';

describe('calculateIL', () => {
  it('returns 0 when price unchanged (ratio = 1)', () => {
    const il = calculateIL(1.0);
    expect(il).toBeCloseTo(0, 5);
  });

  it('returns negative value when price increases (2x)', () => {
    const il = calculateIL(2.0);
    // IL at 2x = (2*sqrt(2)/3 - 1)*100 ≈ -5.72%
    expect(il).toBeCloseTo(-5.72, 1);
  });

  it('returns negative value when price decreases (0.5x)', () => {
    const il = calculateIL(0.5);
    // IL at 0.5x ≈ -5.72%
    expect(il).toBeCloseTo(-5.72, 1);
  });

  it('IL is symmetric for inverse price changes', () => {
    const il2x = calculateIL(2.0);
    const il05x = calculateIL(0.5);
    expect(il2x).toBeCloseTo(il05x, 2);
  });

  it('IL increases with larger price changes', () => {
    const il130 = Math.abs(calculateIL(1.3));
    const il200 = Math.abs(calculateIL(2.0));
    const il500 = Math.abs(calculateIL(5.0));
    expect(il130).toBeLessThan(il200);
    expect(il200).toBeLessThan(il500);
  });
});

describe('calculateFees', () => {
  it('calculates fee correctly with default concentration', () => {
    // TVL: 100K, Volume: 1M, Fee rate: 0.5%, User: 1K, Conc: 1.5
    const fee = calculateFees(100000, 1000000, 0.5, 1000, 1.5);
    // poolFee = 1M * 0.005 = 5000
    // userShare = (1000/100000) * 1.5 = 0.015
    // fee = 5000 * 0.015 = 75
    expect(fee).toBeCloseTo(75, 2);
  });

  it('fee scales linearly with user capital', () => {
    const fee500 = calculateFees(100000, 1000000, 0.5, 500, 1.5);
    const fee1000 = calculateFees(100000, 1000000, 0.5, 1000, 1.5);
    expect(fee1000).toBeCloseTo(fee500 * 2, 2);
  });

  it('fee increases with higher concentration', () => {
    const feeSpot = calculateFees(100000, 1000000, 0.5, 1000, 3.0);
    const feeCurve = calculateFees(100000, 1000000, 0.5, 1000, 2.0);
    const feeBidAsk = calculateFees(100000, 1000000, 0.5, 1000, 1.0);
    expect(feeSpot).toBeGreaterThan(feeCurve);
    expect(feeCurve).toBeGreaterThan(feeBidAsk);
  });

  it('returns 0 when volume is 0', () => {
    const fee = calculateFees(100000, 0, 0.5, 1000);
    expect(fee).toBe(0);
  });
});

describe('calculateConcentration', () => {
  it('returns correct factor for spot', () => {
    expect(calculateConcentration('spot')).toBe(3.0);
  });

  it('returns correct factor for curve', () => {
    expect(calculateConcentration('curve')).toBe(2.0);
  });

  it('returns correct factor for bid-ask', () => {
    expect(calculateConcentration('bid-ask')).toBe(1.0);
  });

  it('returns correct factor for full (DAMM)', () => {
    expect(calculateConcentration('full')).toBe(0.5);
  });

  it('returns default 1.5 for unknown strategy', () => {
    expect(calculateConcentration('unknown')).toBe(1.5);
  });
});

describe('calculateROI', () => {
  it('returns positive ROI when fee > IL', () => {
    // Capital: 1000, Fee: 50, IL: 20
    const roi = calculateROI(1000, 50, 20);
    // net = 50 - 20 = 30, ROI = 3%
    expect(roi).toBeCloseTo(3.0, 2);
  });

  it('returns negative ROI when IL > fee', () => {
    const roi = calculateROI(1000, 10, 30);
    // net = 10 - 30 = -20, ROI = -2%
    expect(roi).toBeCloseTo(-2.0, 2);
  });

  it('returns 0 ROI when fee equals IL', () => {
    const roi = calculateROI(1000, 25, 25);
    expect(roi).toBeCloseTo(0, 5);
  });

  it('handles negative ilLoss values (absolute)', () => {
    // IL is sometimes passed as negative
    const roi = calculateROI(1000, 50, -20);
    // Math.abs(-20) = 20, net = 50 - 20 = 30
    expect(roi).toBeCloseTo(3.0, 2);
  });
});
