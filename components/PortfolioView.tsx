import React from 'react';
import { PortfolioPosition, StockData } from '../types';

interface PortfolioViewProps {
  portfolio: PortfolioPosition[];
  stocks: StockData[]; // Needed to get current price
  cash: number;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ portfolio, stocks, cash }) => {
  
  const getStockPrice = (symbol: string) => stocks.find(s => s.symbol === symbol)?.price || 0;

  const totalEquity = portfolio.reduce((sum, pos) => {
    return sum + (pos.quantity * getStockPrice(pos.symbol));
  }, 0);

  const totalValue = totalEquity + cash;

  return (
    <div className="flex flex-col animate-in fade-in duration-300">
      <div className="bg-black text-white p-6 border-b-4 border-white flex flex-col items-center">
        <span className="font-mono text-xs tracking-widest opacity-70 mb-2">NET LIQUIDATION VALUE</span>
        <span className="text-5xl font-black tracking-tighter">${totalValue.toFixed(2)}</span>
        <div className="flex space-x-4 mt-4 text-xs font-mono">
            <span>CASH: ${cash.toFixed(2)}</span>
            <span>EQTY: ${totalEquity.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-neutral-200 p-2 font-mono text-xs font-bold border-b-2 border-black flex">
        <span className="w-1/3">ASSET</span>
        <span className="w-1/3 text-center">QTY</span>
        <span className="w-1/3 text-right">P/L</span>
      </div>

      {portfolio.length === 0 ? (
        <div className="p-12 text-center font-mono font-bold opacity-40">
           NO POSITIONS DETECTED.<br/>
           MARKET IS OPEN.<br/>
           DEPLOY CAPITAL.
        </div>
      ) : (
        portfolio.map((pos) => {
          const currentPrice = getStockPrice(pos.symbol);
          const value = pos.quantity * currentPrice;
          const costBasis = pos.quantity * pos.averageEntryPrice;
          const pl = value - costBasis;
          const plPercent = (pl / costBasis) * 100;

          return (
            <div key={pos.symbol} className="border-b-2 border-black bg-white p-4 flex items-center justify-between">
              <div className="w-1/3">
                <div className="font-black text-xl">{pos.symbol}</div>
                <div className="text-xs font-mono opacity-60">${currentPrice.toFixed(2)}</div>
              </div>
              <div className="w-1/3 text-center font-bold font-mono text-lg">
                {pos.quantity}
              </div>
              <div className={`w-1/3 text-right font-mono font-bold flex flex-col items-end`}>
                 <span className={pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {pl >= 0 ? '+' : ''}{pl.toFixed(2)}
                 </span>
                 <span className={`text-xs text-white px-1 ${pl >= 0 ? 'bg-green-600' : 'bg-red-600'}`}>
                    {plPercent.toFixed(1)}%
                 </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};