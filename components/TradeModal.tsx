import React, { useState } from 'react';
import { StockData } from '../types';
import { BrutalButton } from './BrutalButton';

interface TradeModalProps {
  stock: StockData;
  type: 'BUY' | 'SELL';
  maxQuantity?: number; // For selling
  cashAvailable?: number; // For buying
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({ 
  stock, 
  type, 
  maxQuantity = 999999,
  cashAvailable = 999999,
  onConfirm, 
  onCancel 
}) => {
  const [quantity, setQuantity] = useState<string>('1');

  const qty = parseInt(quantity) || 0;
  const total = qty * stock.price;
  const canExecute = qty > 0 && 
                     (type === 'BUY' ? total <= cashAvailable : qty <= maxQuantity);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white border-4 border-black w-full max-w-sm p-6 shadow-[8px_8px_0px_0px_#fff]">
        <div className="bg-black text-white p-2 font-mono font-bold text-center mb-6">
          EXECUTE ORDER // {type}
        </div>

        <div className="flex justify-between items-end mb-2">
          <span className="font-black text-4xl">{stock.symbol}</span>
          <span className="font-mono text-xl">${stock.price.toFixed(2)}</span>
        </div>

        <div className="border-t-2 border-black my-4"></div>

        <label className="block font-mono text-xs font-bold mb-2">QUANTITY</label>
        <input 
          type="number" 
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full border-2 border-black p-4 text-3xl font-black text-right focus:outline-none focus:bg-neutral-100"
        />

        <div className="flex justify-between mt-4 font-mono text-sm font-bold">
          <span>TOTAL</span>
          <span>${total.toFixed(2)}</span>
        </div>

        {type === 'BUY' && (
             <div className="text-right text-xs font-mono mt-1 text-neutral-500">
                 CASH: ${cashAvailable.toFixed(2)}
             </div>
        )}
         {type === 'SELL' && (
             <div className="text-right text-xs font-mono mt-1 text-neutral-500">
                 OWNED: {maxQuantity}
             </div>
        )}


        <div className="grid grid-cols-2 gap-4 mt-8">
          <BrutalButton 
            onClick={onCancel}
            className="bg-neutral-200 hover:bg-neutral-300"
          >
            CANCEL
          </BrutalButton>
          <BrutalButton 
            variant={type === 'BUY' ? 'success' : 'danger'}
            disabled={!canExecute}
            className={!canExecute ? 'opacity-50 cursor-not-allowed' : ''}
            onClick={() => onConfirm(qty)}
          >
            CONFIRM
          </BrutalButton>
        </div>
      </div>
    </div>
  );
};