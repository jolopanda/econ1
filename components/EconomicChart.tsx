import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EconomicIndicator, INDICATORS_MAP, IndicatorKey } from '../types';

interface EconomicChartProps {
  data: EconomicIndicator[];
  selectedIndicators: IndicatorKey[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-gray-800 bg-opacity-90 border border-gray-700 rounded-lg shadow-lg">
        <p className="label text-lg font-bold text-white">{`${label}`}</p>
        {payload.map((entry: any) => {
           const key = entry.dataKey as IndicatorKey;
           const metadata = INDICATORS_MAP[key];
           if (!metadata) return null;
           
           const value = entry.value;
           const formattedValue = metadata.unit === '$' 
             ? `${metadata.unit}${value.toFixed(2)}` 
             : metadata.unit === ' T'
             ? `${value.toFixed(2)}${metadata.unit}`
             : `${value.toFixed(2)}${metadata.unit}`;

           return (
            <p key={entry.dataKey} style={{ color: metadata.color }} className="intro">
              {`${metadata.name}: ${formattedValue}`}
            </p>
           );
        })}
      </div>
    );
  }

  return null;
};

const EconomicChart: React.FC<EconomicChartProps> = ({ data, selectedIndicators }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
            {selectedIndicators.map(key => {
                const indicator = INDICATORS_MAP[key];
                return (
                    <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={indicator.color} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={indicator.color} stopOpacity={0}/>
                    </linearGradient>
                );
            })}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
        <XAxis dataKey="month" stroke="#d1d5db" />
        <YAxis stroke="#d1d5db" />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ color: '#d1d5db' }} />
        {selectedIndicators.map(key => {
            const indicator = INDICATORS_MAP[key];
            return (
                <Area 
                    key={key}
                    type="monotone" 
                    dataKey={key} 
                    name={indicator.name} 
                    stroke={indicator.color}
                    fillOpacity={1} 
                    fill={`url(#color${key})`} 
                />
            );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default EconomicChart;
