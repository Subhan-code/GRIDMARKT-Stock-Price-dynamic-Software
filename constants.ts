import { StockData } from './types';

export const generateHistory = (basePrice: number) => {
  const history = [];
  // Simulate an open price roughly near the current price
  let currentPrice = basePrice * (1 + (Math.random() * 0.04 - 0.02)); 
  
  for (let i = 9; i < 16; i++) {
    for (let j = 0; j < 60; j += 15) {
      // Random walk
      const change = (Math.random() - 0.5) * (basePrice * 0.015);
      currentPrice += change;
      history.push({
        time: `${i}:${j === 0 ? '00' : j}`,
        price: parseFloat(currentPrice.toFixed(2)),
      });
    }
  }
  // Ensure the graph ends near the actual current price for visual consistency
  history.push({ time: '16:00', price: basePrice });
  return history;
};

export const INITIAL_STOCKS: StockData[] = [
  {
    symbol: 'SPY',
    name: 'S&P 500 ETF',
    price: 512.00,
    change: 1.50,
    changePercent: 0.29,
    volume: '85.2M',
    history: generateHistory(512.00),
    description: "Standard & Poor's 500 Index ETF.",
  },
  {
    symbol: 'QQQ',
    name: 'NASDAQ 100 ETF',
    price: 440.50,
    change: 2.10,
    changePercent: 0.48,
    volume: '42.1M',
    history: generateHistory(440.50),
    description: "Nasdaq-100 Index Tracking Stock.",
  },
  {
    symbol: 'DIA',
    name: 'DOW JONES ETF',
    price: 390.20,
    change: -0.80,
    changePercent: -0.20,
    volume: '12.4M',
    history: generateHistory(390.20),
    description: "Dow Jones Industrial Average ETF.",
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA CORP',
    price: 875.24,
    change: 12.45,
    changePercent: 1.44,
    volume: '45.2M',
    history: generateHistory(875.24),
    description: "Technology company known for GPUs.",
  },
  {
    symbol: 'BTC',
    name: 'BITCOIN USD',
    price: 69420.00,
    change: 1200.50,
    changePercent: 1.76,
    volume: '28.4B',
    history: generateHistory(69420.00),
    description: "Decentralized digital currency.",
  },
];