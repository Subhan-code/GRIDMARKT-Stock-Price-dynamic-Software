import React from 'react';
import { StockData } from '../types';

interface TickerItemProps {
  stock: StockData;
  onClick: (stock: StockData) => void;
}

export const TickerItem: React.FC<TickerItemProps> = ({ stock, onClick }) => {
  const isPositive = stock.change >= 0;
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
  const indicator = isPositive ? '▲' : '▼';

  return (
    <div 
      onClick={() => onClick(stock)}
      className="group flex items-stretch justify-between border-b-2 border-black bg-white hover:bg-neutral-100 cursor-pointer transition-colors"
    >
      <div className="p-4 flex-1 border-r-2 border-black group-hover:bg-black group-hover:text-white transition-colors">
        <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{stock.symbol}</h3>
        <span className="text-xs font-mono uppercase tracking-widest opacity-60 group-hover:opacity-100">
          {stock.name}
        </span>
      </div>
      
      <div className="p-4 flex flex-col items-end justify-center w-32 bg-neutral-50 group-hover:bg-neutral-200 transition-colors">
        <span className="text-xl font-bold font-mono tracking-tight">
          {stock.price.toFixed(2)}
        </span>
        <span className={`text-sm font-bold font-mono ${colorClass}`}>
          {indicator} {Math.abs(stock.change).toFixed(2)}
        </span>
      </div>
    </div>
  );
};
