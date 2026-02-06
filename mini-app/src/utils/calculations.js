export function calculateIL(priceChange) {
  return (2 * Math.sqrt(priceChange) / (1 + priceChange) - 1) * 100;
}

export function calculateFees(tvl, dailyVolume, feeRate, userLiquidity, concentration = 1.5) {
  const poolFee = dailyVolume * (feeRate / 100);
  const userShare = (userLiquidity / tvl) * concentration;
  return poolFee * userShare;
}

export function calculateConcentration(strategy) {
  const factors = {
    'spot': 3.0,
    'curve': 2.0,
    'bid-ask': 1.0,
    'full': 0.5,
  };
  return factors[strategy] || 1.5;
}

export function calculateROI(capital, feeEarned, ilLoss) {
  const netProfit = feeEarned - Math.abs(ilLoss);
  return (netProfit / capital) * 100;
}
