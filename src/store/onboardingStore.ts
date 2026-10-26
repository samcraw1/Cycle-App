import { create } from 'zustand';

import type { IsoDate } from '@/domain/dates';

export interface OnboardingDraft {
  disclaimerAccepted: boolean;
  lastPeriodStart: IsoDate | null;
  cycleLength: number;
  periodLength: number;
  irregular: boolean;
  goals: string[];
  appLock: boolean;
  periodReminder: boolean;
  dailyReminder: boolean;
}

interface OnboardingState extends OnboardingDraft {
  patch(partial: Partial<OnboardingDraft>): void;
  toggleGoal(id: string): void;
  reset(): void;
}

export const ONBOARDING_DEFAULTS: OnboardingDraft = {
  disclaimerAccepted: false,
  lastPeriodStart: null,
  cycleLength: 28,
  periodLength: 5,
  irregular: false,
  goals: [],
  appLock: false,
  periodReminder: true,
  dailyReminder: false,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...ONBOARDING_DEFAULTS,
  patch: (partial) => set(partial),
  toggleGoal: (id) => {
    const goals = get().goals;
    set({ goals: goals.includes(id) ? goals.filter((g) => g !== id) : [...goals, id] });
  },
  reset: () => set(ONBOARDING_DEFAULTS),
}));
