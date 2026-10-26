import type { Migration } from '../migrate';
import { m001Initial } from './001_initial';
import { m002SeedSymptoms } from './002_seed_symptoms';

/** Append only. Never edit a shipped migration; add a new one. */
export const MIGRATIONS: readonly Migration[] = [m001Initial, m002SeedSymptoms];
