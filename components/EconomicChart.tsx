import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
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
           const originalKey = entry.dataKey as IndicatorKey;
           const metadata = INDICATORS_MAP[originalKey];
           if (!metadata || entry.value === null || entry.value === undefined) return null;
           
           const value = entry.value;
           const isPrefix = ['$', '₱'].includes(metadata.unit);
           const formattedValue = isPrefix
             ? `${metadata.unit}${value.toFixed(2)}`
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
  // --- Dual Y-Axis & Stacking Logic ---
  const units = [...new Set(selectedIndicators.map(key => INDICATORS_MAP[key].unit))];
  const yAxis1Unit = units[0];
  const yAxis2Unit = units.length > 1 ? units[1] : null;

  // Stack charts only if all selected indicators share the same unit.
  const isStackable = units.length <= 1;

  const getAxisId = (unit: string) => {
    if (unit === yAxis2Unit) return 'right';
    return 'left';
  };
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 10,
          bottom: 0,
        }}
      >
        <defs>
            {selectedIndicators.map(key => {
                const indicator = INDICATORS_MAP[key];
                return (
                  <linearGradient key={`grad-${key}`} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={indicator.color} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={indicator.color} stopOpacity={0.2}/>
                  </linearGradient>
                );
            })}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
        <XAxis dataKey="month" stroke="#d1d5db" />

        <YAxis 
          yAxisId="left" 
          stroke="#d1d5db" 
          unit={yAxis1Unit} 
          domain={['auto', 'auto']}
          tickFormatter={(tick) => `${tick}${yAxis1Unit}`}
        />
        {yAxis2Unit && (
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#d1d5db" 
            unit={yAxis2Unit} 
            domain={['auto', 'auto']}
            tickFormatter={(tick) => `${tick}${yAxis2Unit}`}
          />
        )}
        
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ color: '#d1d5db' }} />

        {/* --- ADDED REFERENCE LINES --- */}
        {selectedIndicators.map(key => {
            const indicator = INDICATORS_MAP[key];
            if (indicator.threshold === undefined) {
                return null;
            }
            const yAxisId = getAxisId(indicator.unit);
            const labelValue = `Target: ${indicator.threshold}${indicator.unit}`;

            return (
                <ReferenceLine 
                    key={`ref-${key}`}
                    y={indicator.threshold}
                    yAxisId={yAxisId}
                    stroke={indicator.color}
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    ifOverflow="extendDomain"
                >
                    <Label
                        value={labelValue}
                        position="right"
                        fill="#d1d5db"
                        fontSize="12"
                        style={{ transform: 'translateY(-10px)' }}
                    />
                </ReferenceLine>
            );
        })}

        {selectedIndicators.map(key => {
            const indicator = INDICATORS_MAP[key];
            const yAxisId = getAxisId(indicator.unit);
            
            return (
              <Area 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  name={indicator.name} 
                  stroke={indicator.color}
                  fillOpacity={1} 
                  fill={`url(#color-${key})`} 
                  yAxisId={yAxisId}
                  connectNulls
                  stackId={isStackable ? "1" : key}
              />
            );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default EconomicChart;