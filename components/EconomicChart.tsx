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
           const originalKey = entry.dataKey.replace(/_hist$|_fore$/, '') as IndicatorKey;
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
  const { chartData, hasForecast, forecastStartIndex } = React.useMemo(() => {
    const forecastIndex = data.findIndex(d => d.type === 'Forecast');
    const hasForecastData = forecastIndex !== -1;

    if (!hasForecastData) {
        return { chartData: data, hasForecast: false, forecastStartIndex: -1 };
    }

    const transformedData = data.map((d, i) => {
        const newPoint: any = { month: d.month, type: d.type };
        // Transform all possible indicators to keep data structure consistent
        for (const key of Object.keys(INDICATORS_MAP) as IndicatorKey[]) {
            const value = d[key];
            if (value !== undefined) {
                if (i < forecastIndex) {
                    newPoint[`${key}_hist`] = value;
                } else {
                    newPoint[`${key}_fore`] = value;
                }
                // To connect the lines, the transition point needs a value in both series
                if (i === forecastIndex - 1) {
                    newPoint[`${key}_fore`] = value;
                }
            }
        }
        return newPoint;
    });

    return { chartData: transformedData, hasForecast: true, forecastStartIndex: forecastIndex };
  }, [data]);

  // --- Dual Y-Axis Logic ---
  const units = [...new Set(selectedIndicators.map(key => INDICATORS_MAP[key].unit))];
  const yAxis1Unit = units[0];
  const yAxis2Unit = units.length > 1 ? units[1] : null;

  const getAxisId = (unit: string) => {
    if (unit === yAxis2Unit) return 'right';
    return 'left';
  };
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={chartData}
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
                    dataKey={hasForecast ? `${key}_hist` : key} 
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
                      dataKey={`${key}_fore`}
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

        {hasForecast && forecastStartIndex > 0 && (
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