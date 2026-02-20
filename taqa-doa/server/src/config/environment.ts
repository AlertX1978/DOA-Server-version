import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const envSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required'),

  // Server
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Azure AD / Entra ID (optional in development — required in production)
  AZURE_TENANT_ID: z.string().default('placeholder'),
  AZURE_CLIENT_ID: z.string().default('placeholder'),
  AZURE_CLIENT_SECRET: z.string().default('placeholder'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Admin seed
  ADMIN_SEED_EMAIL: z.string().email().optional(),
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.format();
    console.error('[config] Invalid environment variables:');

    for (const [key, value] of Object.entries(formatted)) {
      if (key === '_errors') continue;
      const errors = (value as { _errors?: string[] })?._errors;
      if (errors && errors.length > 0) {
        console.error(`  ${key}: ${errors.join(', ')}`);
      }
    }

    throw new Error('Missing or invalid environment variables. See above for details.');
  }

  return parsed.data;
}

// ---------------------------------------------------------------------------
// Export typed config
// ---------------------------------------------------------------------------

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
