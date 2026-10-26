export const DISCLAIMER_SHORT =
  'Predictions are estimates based on what you log. They are not medical advice, a diagnosis, or a form of contraception.';

export const PRIVACY_PROMISE = [
  'Everything you log stays on this phone, in an encrypted database.',
  'No account. No cloud sync. No ads. No analytics on your health data.',
  'You can export or delete all of it at any time.',
];

export const GOALS: { id: string; label: string }[] = [
  { id: 'know_when', label: 'Know when my period is coming' },
  { id: 'patterns', label: 'Understand my patterns' },
  { id: 'symptoms', label: 'Track PCOS symptoms' },
  { id: 'doctor', label: 'Prepare for doctor visits' },
  { id: 'mood', label: 'Notice mood changes' },
];

export const CONFIDENCE_COPY = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
} as const;

export const CONFIDENCE_HINT = {
  low: 'Log a few more cycles for a tighter estimate.',
  medium: 'Based on your recent cycles. Keep logging to refine it.',
  high: 'Your recent cycles have been consistent.',
} as const;
