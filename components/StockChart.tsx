import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { StockData } from '../types';

interface StockChartProps {
  data: StockData['history'];
  color: string;
}

export const StockChart: React.FC<StockChartProps> = ({ data, color }) => {
  return (
    <div className="h-64 w-full border-2 border-black bg-white p-2 relative">
      <div className="absolute top-0 left-0 bg-black text-white text-xs px-1 font-mono z-10">
        CHART_VISUALIZER_V1.0
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#e5e5e5" strokeDasharray="0" vertical={true} horizontal={true} />
          <XAxis 
            dataKey="time" 
            hide={true} 
          />
          <YAxis 
            domain={['auto', 'auto']} 
            hide={true} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '2px solid #000', 
              borderRadius: '0px',
              boxShadow: '4px 4px 0px 0px #000',
              fontFamily: 'monospace',
              fontWeight: 'bold'
            }}
            itemStyle={{ color: '#000' }}
            cursor={{ stroke: '#000', strokeWidth: 2 }}
          />
          <Line 
            type="linear" // Hard edges
            dataKey="price" 
            stroke={color} 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6, stroke: '#000', strokeWidth: 2, fill: '#fff' }}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
