import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea, Label } from 'recharts';
import { EconomicIndicator, INDICATORS_MAP, IndicatorKey } from '../types';

interface EconomicChartProps {
  data: EconomicIndicator[];
  selectedIndicators: IndicatorKey[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataType = payload[0].payload.type;
    return (
      <div className="p-4 bg-gray-800 bg-opacity-90 border border-gray-700 rounded-lg shadow-lg">
        <p className="label text-lg font-bold text-white">{`${label}`}</p>
        <p className="text-xs text-gray-400 mb-2">{dataType}</p>
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
  const forecastStartIndex = data.findIndex(d => d.type === 'Forecast');
  const hasForecast = forecastStartIndex > 0 && forecastStartIndex < data.length;

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
        {hasForecast && (
            <ReferenceArea
                x1={data[forecastStartIndex].month}
                x2={data[data.length - 1].month}
                stroke="transparent"
                fill="rgba(107, 114, 128, 0.2)"
                ifOverflow="visible"
            >
                <Label value="Forecast" position="insideTopRight" fill="#9ca3af" fontSize={12} offset={10} />
            </ReferenceArea>
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default EconomicChart;