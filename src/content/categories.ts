import type { SymptomCategory } from './symptoms';

export const CATEGORY_LABEL: Record<SymptomCategory, string> = {
  physical: 'Physical',
  mood: 'Mind',
  skin_hair: 'Skin & hair',
  metabolic: 'Energy & appetite',
  other: 'Other',
};
export const CATEGORY_ORDER: SymptomCategory[] = [
  'physical',
  'mood',
  'skin_hair',
  'metabolic',
  'other',
];
