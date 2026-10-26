import type { SymptomCategory } from '@/content/symptoms';
import type { Db } from '../types';

export interface Symptom {
  id: string;
  label: string;
  category: SymptomCategory;
  isCustom: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface SymptomRow {
  id: string;
  label: string;
  category: SymptomCategory;
  is_custom: 0 | 1;
  is_active: 0 | 1;
  sort_order: number;
}

const fromRow = (r: SymptomRow): Symptom => ({
  id: r.id,
  label: r.label,
  category: r.category,
  isCustom: r.is_custom === 1,
  isActive: r.is_active === 1,
  sortOrder: r.sort_order,
});

export function createSymptomsRepo(db: Db) {
  return {
    async listActive(): Promise<Symptom[]> {
      const rows = await db.getAllAsync<SymptomRow>(
        'SELECT * FROM symptoms WHERE is_active = 1 ORDER BY sort_order ASC, label ASC',
      );
      return rows.map(fromRow);
    },

    async listAll(): Promise<Symptom[]> {
      const rows = await db.getAllAsync<SymptomRow>(
        'SELECT * FROM symptoms ORDER BY sort_order ASC, label ASC',
      );
      return rows.map(fromRow);
    },

    async addCustom(label: string, category: SymptomCategory): Promise<Symptom> {
      const id = `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const max = await db.getFirstAsync<{ m: number | null }>(
        'SELECT MAX(sort_order) AS m FROM symptoms',
      );
      const sortOrder = (max?.m ?? 0) + 10;
      await db.runAsync(
        'INSERT INTO symptoms (id, label, category, is_custom, is_active, sort_order) VALUES (?, ?, ?, 1, 1, ?)',
        id,
        label.trim(),
        category,
        sortOrder,
      );
      return { id, label: label.trim(), category, isCustom: true, isActive: true, sortOrder };
    },

    async setActive(id: string, active: boolean): Promise<void> {
      await db.runAsync('UPDATE symptoms SET is_active = ? WHERE id = ?', active ? 1 : 0, id);
    },

    /** Custom symptoms can be deleted; built-ins can only be deactivated. */
    async deleteCustom(id: string): Promise<void> {
      await db.runAsync('DELETE FROM symptoms WHERE id = ? AND is_custom = 1', id);
    },
  };
}

export type SymptomsRepo = ReturnType<typeof createSymptomsRepo>;
