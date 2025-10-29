
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import { EconomicIndicator, INDICATORS_MAP, IndicatorKey } from '../types';

interface EconomicChartProps {
  data: EconomicIndicator[];
  displayedIndicators: IndicatorKey[];
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

const EconomicChart: React.FC<EconomicChartProps> = ({ data, displayedIndicators }) => {
  // --- Dual Y-Axis Logic ---
  const units = [...new Set(displayedIndicators.map(key => INDICATORS_MAP[key].unit))];
  const yAxis1Unit = units[0];
  const yAxis2Unit = units.length > 1 ? units[1] : null;

  const getAxisId = (unit: string) => {
    if (unit === yAxis2Unit) return 'right';
    return 'left';
  };
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 10,
          bottom: 0,
        }}
      >
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
        {displayedIndicators.map(key => {
            const indicator = INDICATORS_MAP[key];
            if (indicator.threshold === undefined) {
                return null;
            }
            const yAxisId = getAxisId(indicator.unit);
            const labelValue = `Outlook Threshold: ${indicator.threshold}${indicator.unit}`;

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

        {displayedIndicators.map(key => {
            const indicator = INDICATORS_MAP[key];
            const yAxisId = getAxisId(indicator.unit);
            
            return (
              <Line 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  name={indicator.name} 
                  stroke={indicator.color}
                  strokeWidth={2}
                  yAxisId={yAxisId}
                  connectNulls
                  dot={{ r: 3, fill: indicator.color, stroke: '#1f2937', strokeWidth: 2 }}
                  activeDot={{ r: 8, strokeWidth: 2, fill: indicator.color, stroke: '#f9fafb' }}
              />
            );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default EconomicChart;
