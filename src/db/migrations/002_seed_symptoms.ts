import { ALL_SEED_SYMPTOMS } from '@/content/symptoms';
import type { Migration } from '../migrate';

export const m002SeedSymptoms: Migration = {
  version: 2,
  name: '002_seed_symptoms',
  async up(db) {
    let order = 0;
    for (const s of ALL_SEED_SYMPTOMS) {
      await db.runAsync(
        'INSERT INTO symptoms (id, label, category, is_custom, is_active, sort_order) VALUES (?, ?, ?, 0, 1, ?)',
        s.id,
        s.label,
        s.category,
        order,
      );
      order += 10;
    }
  },
};
