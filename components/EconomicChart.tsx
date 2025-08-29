import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea, Label, ReferenceLine } from 'recharts';
import { EconomicIndicator, INDICATORS_MAP, IndicatorKey } from '../types';

interface EconomicChartProps {
  data: EconomicIndicator[];
  selectedIndicators: IndicatorKey[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    if (!dataPoint) return null;

    const dataType = dataPoint.type;
    return (
      <div className="p-4 bg-gray-800 bg-opacity-90 border border-gray-700 rounded-lg shadow-lg">
        <p className="label text-lg font-bold text-white">{`${label}`}</p>
        <p className="text-xs text-gray-400 mb-2">{dataType}</p>
        {payload.map((entry: any) => {
           const key = entry.dataKey as IndicatorKey;
           const metadata = INDICATORS_MAP[key];
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
  const forecastStartIndex = data.findIndex(d => d.type === 'Forecast');
  const hasForecast = forecastStartIndex !== -1;

  // --- Dual Y-Axis Logic ---
  const units = [...new Set(selectedIndicators.map(key => INDICATORS_MAP[key].unit))];
  const yAxis1Unit = units[0];
  const yAxis2Unit = units.length > 1 ? units[1] : null;

  const getAxisId = (unit: string) => {
    if (unit === yAxis2Unit) return 'right';
    return 'left';
  };
  
  const yAxisDomain = (dataMin: number, dataMax: number) => {
    const absMax = Math.max(Math.abs(dataMin), Math.abs(dataMax));
    const padding = absMax * 0.1 || 1; // Add padding, ensure it's not 0
    return [Math.floor(dataMin - padding), Math.ceil(dataMax + padding)];
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 10,
          bottom: 0,
        }}
      >
        <defs>
            {selectedIndicators.map(key => {
                const indicator = INDICATORS_MAP[key];
                return (
                  <React.Fragment key={`grad-${key}`}>
                    <linearGradient id={`color-hist-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={indicator.color} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={indicator.color} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id={`color-fore-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={indicator.color} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={indicator.color} stopOpacity={0}/>
                    </linearGradient>
                  </React.Fragment>
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

        {selectedIndicators.map(key => {
            const indicator = INDICATORS_MAP[key];
            const yAxisId = getAxisId(indicator.unit);
            
            return (
              <React.Fragment key={key}>
                {/* Historical Data Area */}
                <Area 
                    type="monotone" 
                    dataKey={key} 
                    data={data.map((d, i) => i >= forecastStartIndex && hasForecast ? { ...d, [key]: null } : d)}
                    name={indicator.name} 
                    stroke={indicator.color}
                    fillOpacity={1} 
                    fill={`url(#color-hist-${key})`} 
                    yAxisId={yAxisId}
                    connectNulls
                />
                {/* Forecast Data Area */}
                {hasForecast && (
                  <Area 
                      type="monotone" 
                      dataKey={key} 
                      data={data.map((d, i) => i < forecastStartIndex -1 ? { ...d, [key]: null } : d)}
                      name={indicator.name} 
                      stroke={indicator.color}
                      strokeDasharray="5 5"
                      fillOpacity={1} 
                      fill={`url(#color-fore-${key})`} 
                      yAxisId={yAxisId}
                      legendType="none"
                      connectNulls
                  />
                )}
              </React.Fragment>
            );
        })}
        
        {hasForecast && forecastStartIndex > 0 && (
            <ReferenceLine
                x={data[forecastStartIndex].month}
                stroke="#e5e7eb"
                strokeDasharray="3 3"
                strokeWidth={2}
            >
                <Label value="Forecast Begins" position="insideTopLeft" fill="#9ca3af" fontSize={12} angle={-90} offset={10}/>
            </ReferenceLine>
        )}

        {hasForecast && (
            <ReferenceArea
                x1={data[forecastStartIndex].month}
                stroke="transparent"
                fill="rgba(107, 114, 128, 0.3)"
                ifOverflow="visible"
            >
                <Label value="Forecast" position="insideTop" fill="#9ca3af" fontSize={12} />
            </ReferenceArea>
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default EconomicChart;
