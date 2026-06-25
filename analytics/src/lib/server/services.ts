import 'server-only';

// Stable compatibility facade used by the app routes. Implementation lives in
// domain services, external clients, mappers, and the observable HTTP layer.
export { getDriver } from './domain/driver.service';
export { getFeedback } from './domain/feedback.service';
export { getOverview } from './domain/overview.service';
export { getPayments } from './domain/payments.service';
export { getPromociones } from './domain/promotions.service';
export { getRiderApp } from './domain/riderapp.service';
