// API keys are read exclusively from server-only env vars (no NEXT_PUBLIC_*
// prefix): these credentials must never be bundled into the client. See
// .env.example for the canonical variable names.
export const ENV = {
  riderApp: {
    base: process.env.RIDERAPP_BASE_URL || '',
    key:  process.env.RIDERAPP_API_KEY || '',
  },
  driver: {
    base: process.env.DRIVERAPP_BASE_URL || '',
    key:  process.env.DRIVERAPP_API_KEY || '',
  },
  payments: {
    base: process.env.PAYMENTS_BASE_URL || '',
    key:  process.env.PAYMENTS_API_KEY || '',
  },
  feedback: {
    base: process.env.FEEDBACK_BASE_URL || '',
    key:  process.env.FEEDBACK_API_KEY || '',
  },
  promociones: {
    base: process.env.PROMOCIONES_BASE_URL || '',
    key:  process.env.PROMOCIONES_API_KEY || '',
  },
};

// Per-service auth headers (cada backend espera un nombre de header distinto).
export function raHeaders()         { return { 'x-api-key': ENV.riderApp.key }; }
export function drHeaders()         { return { 'x-control-plane-api-key': ENV.driver.key }; }
export function pmHeaders()         { return { 'x-control-plane-api-key': ENV.payments.key }; }
// Los endpoints /api/analytics/feedback/* autentican con header x-api-key.
export function fbAnalyticsHeaders(){ return { 'x-api-key': ENV.feedback.key }; }
export function promoHeaders()      { return { 'x-api-key': ENV.promociones.key }; }

export function configured(base: string): boolean {
  return !!base;
}
