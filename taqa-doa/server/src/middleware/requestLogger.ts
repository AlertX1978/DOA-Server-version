import morgan from 'morgan';

/**
 * HTTP request logger middleware.
 *
 * - Development:  coloured concise output (`:method :url :status :response-time ms`)
 * - Production:   Apache combined format for structured log ingestion
 */
export const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
);
