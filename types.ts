export interface EconomicIndicator {
  month: string;
  gdpGrowth: number;
  inflationRate: number;
  unemploymentRate: number;
  lendingRate: number;
  gdpConstant: number;
  gniGrowth: number;
  pesoDollarRate: number;
  underemploymentRate: number;
  wtiCrudeOil: number;
  reverseRepoRate: number;
  depositFacilityRate: number;
  lendingFacilityRate: number;
}

export type IndicatorKey = keyof Omit<EconomicIndicator, 'month'>;

export interface IndicatorMetadata {
  name: string;
  color: string;
  unit: string;
}

export const INDICATORS_MAP: Record<IndicatorKey, IndicatorMetadata> = {
  gdpGrowth: { name: 'GDP Growth', color: '#22c55e', unit: '%' },
  inflationRate: { name: 'Inflation Rate', color: '#ef4444', unit: '%' },
  unemploymentRate: { name: 'Unemployment Rate', color: '#3b82f6', unit: '%' },
  lendingRate: { name: 'Lending Rate', color: '#eab308', unit: '%' },
  gdpConstant: { name: 'GDP (Trillion PHP)', color: '#14b8a6', unit: ' T' },
  gniGrowth: { name: 'GNI Growth', color: '#8b5cf6', unit: '%' },
  pesoDollarRate: { name: 'PHP/USD Rate', color: '#f97316', unit: '' },
  underemploymentRate: { name: 'Underemployment Rate', color: '#0ea5e9', unit: '%' },
  wtiCrudeOil: { name: 'WTI Crude Oil', color: '#a855f7', unit: '$' },
  reverseRepoRate: { name: 'Reverse Repo Rate', color: '#d946ef', unit: '%' },
  depositFacilityRate: { name: 'Deposit Facility Rate', color: '#ec4899', unit: '%' },
  lendingFacilityRate: { name: 'Lending Facility Rate', color: '#64748b', unit: '%' },
};
