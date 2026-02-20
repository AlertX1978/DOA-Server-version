import { query } from '../config/database';

// ---------------------------------------------------------------------------
// Result interface
// ---------------------------------------------------------------------------

export interface GlossaryRow {
  id: number;
  code: string;
  name: string;
  description: string;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// Service function
// ---------------------------------------------------------------------------

/**
 * Get all glossary entries ordered by sort_order.
 */
export async function getGlossary(): Promise<GlossaryRow[]> {
  const result = await query<GlossaryRow>(
    `SELECT id, code, name, description, sort_order
     FROM glossary
     ORDER BY sort_order`
  );
  return result.rows;
}
