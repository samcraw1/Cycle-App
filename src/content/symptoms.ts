/**
 * Built-in symptom catalog. Niche: PCOS / irregular cycles.
 * ids are stable; labels may be edited freely.
 */
export type SymptomCategory = 'physical' | 'mood' | 'skin_hair' | 'metabolic' | 'other';

export interface SymptomSeed {
  id: string;
  label: string;
  category: SymptomCategory;
}

export const CORE_SYMPTOMS: readonly SymptomSeed[] = [
  { id: 'cramps', label: 'Cramps', category: 'physical' },
  { id: 'headache', label: 'Headache', category: 'physical' },
  { id: 'bloating', label: 'Bloating', category: 'physical' },
  { id: 'breast_tenderness', label: 'Breast tenderness', category: 'physical' },
  { id: 'back_pain', label: 'Back pain', category: 'physical' },
  { id: 'fatigue', label: 'Fatigue', category: 'physical' },
  { id: 'nausea', label: 'Nausea', category: 'physical' },
  { id: 'spotting', label: 'Spotting', category: 'physical' },
  { id: 'discharge', label: 'Discharge', category: 'physical' },
  { id: 'cravings', label: 'Cravings', category: 'metabolic' },
  { id: 'insomnia', label: 'Trouble sleeping', category: 'other' },
  { id: 'low_libido', label: 'Low libido', category: 'other' },
  { id: 'high_libido', label: 'High libido', category: 'other' },
];

export const NICHE_SYMPTOMS: readonly SymptomSeed[] = [
  { id: 'acne', label: 'Acne', category: 'skin_hair' },
  { id: 'oily_skin', label: 'Oily skin', category: 'skin_hair' },
  { id: 'hair_growth', label: 'Excess hair growth', category: 'skin_hair' },
  { id: 'hair_thinning', label: 'Hair thinning', category: 'skin_hair' },
  { id: 'pelvic_pain', label: 'Pelvic pain', category: 'physical' },
  { id: 'ovulation_pain', label: 'Ovulation pain', category: 'physical' },
  { id: 'blood_sugar_dips', label: 'Blood sugar dips', category: 'metabolic' },
  { id: 'weight_change', label: 'Weight change', category: 'metabolic' },
  { id: 'brain_fog', label: 'Brain fog', category: 'mood' },
  { id: 'anxiety', label: 'Anxiety', category: 'mood' },
  { id: 'low_mood', label: 'Low mood', category: 'mood' },
  { id: 'irritability', label: 'Irritability', category: 'mood' },
];

export const ALL_SEED_SYMPTOMS: readonly SymptomSeed[] = [...CORE_SYMPTOMS, ...NICHE_SYMPTOMS];
