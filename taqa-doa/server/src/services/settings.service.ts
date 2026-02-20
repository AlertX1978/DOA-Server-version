import { query } from '../config/database';

// ---------------------------------------------------------------------------
// Result interfaces
// ---------------------------------------------------------------------------

export interface AppSettingRow {
  id: number;
  key: string;
  value: unknown;
  updated_by: string | null;
  updated_at: string;
}

export interface CountryRow {
  id: number;
  name: string;
  risk_level: string;
}

// ---------------------------------------------------------------------------
// Settings service functions
// ---------------------------------------------------------------------------

/**
 * Get all application settings.
 */
export async function getAllSettings(): Promise<AppSettingRow[]> {
  const result = await query<AppSettingRow>(
    `SELECT id, key, value, updated_by, updated_at
     FROM app_settings
     ORDER BY key`
  );
  return result.rows;
}

/**
 * Get a single application setting by key.
 */
export async function getSetting(key: string): Promise<AppSettingRow | null> {
  const result = await query<AppSettingRow>(
    `SELECT id, key, value, updated_by, updated_at
     FROM app_settings
     WHERE key = $1`,
    [key]
  );
  return result.rows[0] || null;
}

/**
 * Update (or insert) a setting by key.
 * Logs an audit trail entry when userId is provided.
 */
export async function updateSetting(
  key: string,
  value: unknown,
  userId?: string
): Promise<AppSettingRow> {
  // Fetch old value for audit
  const oldResult = await query<{ value: unknown }>(
    `SELECT value FROM app_settings WHERE key = $1`,
    [key]
  );
  const oldValue = oldResult.rows[0]?.value ?? null;

  // Upsert the setting
  const result = await query<AppSettingRow>(
    `INSERT INTO app_settings (key, value, updated_by, updated_at)
     VALUES ($1, $2::jsonb, $3, NOW())
     ON CONFLICT (key) DO UPDATE SET
       value = $2::jsonb,
       updated_by = $3,
       updated_at = NOW()
     RETURNING id, key, value, updated_by, updated_at`,
    [key, JSON.stringify(value), userId || null]
  );

  // Write audit log if userId is available
  if (userId) {
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_value, new_value)
       VALUES ($1, 'update', 'app_settings', $2, $3::jsonb, $4::jsonb)`,
      [userId, key, JSON.stringify(oldValue), JSON.stringify(value)]
    );
  }

  return result.rows[0];
}

// ---------------------------------------------------------------------------
// Aggregated settings (client-friendly format)
// ---------------------------------------------------------------------------

export interface AggregatedSettings {
  countXWithoutNumber: boolean;
  safeCountries: string[];
  specialCountries: string[];
  allCountries: { name: string; risk_level: string }[];
}

/**
 * Build the aggregated settings object that the client frontend expects.
 */
export async function getAggregatedSettings(): Promise<AggregatedSettings> {
  const [settingResult, countriesResult] = await Promise.all([
    query<{ value: unknown }>(`SELECT value FROM app_settings WHERE key = $1`, ['count_x_without_number']),
    query<CountryRow>(`SELECT id, name, risk_level FROM countries ORDER BY name`),
  ]);

  const countXValue = settingResult.rows[0]?.value as { enabled?: boolean } | undefined;
  const countXWithoutNumber = countXValue?.enabled ?? false;

  const countries = countriesResult.rows;
  const safeCountries = countries.filter((c) => c.risk_level === 'safe').map((c) => c.name);
  const specialCountries = countries.filter((c) => c.risk_level === 'special').map((c) => c.name);
  const allCountries = countries.map((c) => ({ name: c.name, risk_level: c.risk_level }));

  return { countXWithoutNumber, safeCountries, specialCountries, allCountries };
}

// ---------------------------------------------------------------------------
// Country service functions
// ---------------------------------------------------------------------------

/**
 * Get all countries with their risk levels.
 */
export async function getCountries(): Promise<CountryRow[]> {
  const result = await query<CountryRow>(
    `SELECT id, name, risk_level
     FROM countries
     ORDER BY name`
  );
  return result.rows;
}

/**
 * Update a country's risk level.
 * Logs an audit trail entry when userId is provided.
 */
export async function updateCountryRiskLevel(
  id: number,
  riskLevel: string,
  userId?: string
): Promise<CountryRow> {
  // Fetch old value for audit
  const oldResult = await query<CountryRow>(
    `SELECT id, name, risk_level FROM countries WHERE id = $1`,
    [id]
  );
  const oldCountry = oldResult.rows[0];

  const result = await query<CountryRow>(
    `UPDATE countries
     SET risk_level = $2
     WHERE id = $1
     RETURNING id, name, risk_level`,
    [id, riskLevel]
  );

  // Write audit log if userId is available
  if (userId && oldCountry) {
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_value, new_value)
       VALUES ($1, 'update', 'country', $2, $3::jsonb, $4::jsonb)`,
      [
        userId,
        String(id),
        JSON.stringify({ risk_level: oldCountry.risk_level }),
        JSON.stringify({ risk_level: riskLevel }),
      ]
    );
  }

  return result.rows[0];
}
