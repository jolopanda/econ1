export interface EconomicIndicator {
  month: string;
  bankAverageLendingRate: number;
  gdpGrowth: number;
  inflationRate: number;
  pesoDollarRate: number;
  underemploymentRate: number;
  unemploymentRate: number;
  wtiCrudeOil: number;
  overnightRrpRate: number;
  overnightDepositFacilityRate: number;
  overnightLendingFacilityRate: number;
}

export type IndicatorKey = keyof Omit<EconomicIndicator, 'month'>;

export interface IndicatorMetadata {
  name: string;
  color: string;
  unit: string;
  threshold?: number;
  thresholdDescription?: string;
}

export interface Source {
  title: string;
  uri: string;
}

export const INDICATORS_MAP: Record<IndicatorKey, IndicatorMetadata> = {
  bankAverageLendingRate: { name: 'Bank Average Lending Rate', color: '#eab308', unit: '%' },
  gdpGrowth: { name: 'GDP Growth', color: '#22c55e', unit: '%', threshold: 6, thresholdDescription: 'An outlook threshold indicating robust and sustainable economic expansion, aligned with national goals.' },
  inflationRate: { name: 'Inflation Rate', color: '#ef4444', unit: '%', threshold: 3, thresholdDescription: 'The midpoint of the Bangko Sentral ng Pilipinas (BSP) outlook range (2-4%), aimed at maintaining price stability.' },
  pesoDollarRate: { name: 'Peso-Dollar (End of Period)', color: '#f97316', unit: '₱' },
  underemploymentRate: { name: 'Underemployment Rate', color: '#0ea5e9', unit: '%', threshold: 15, thresholdDescription: 'An outlook threshold reflecting a significant improvement in job quality and a reduction in workers seeking more hours.' },
  unemploymentRate: { name: 'Unemployment Rate', color: '#3b82f6', unit: '%', threshold: 5, thresholdDescription: 'An outlook threshold for achieving near full employment while accounting for natural job transitions.' },
  wtiCrudeOil: { name: 'WTI Crude Oil', color: '#a855f7', unit: '$' },
  overnightRrpRate: { name: 'Overnight RRP Rate', color: '#d946ef', unit: '%' },
  overnightDepositFacilityRate: { name: 'Overnight Deposit Facility Rate', color: '#ec4899', unit: '%' },
  overnightLendingFacilityRate: { name: 'Overnight Lending Facility Rate', color: '#64748b', unit: '%' },
};
