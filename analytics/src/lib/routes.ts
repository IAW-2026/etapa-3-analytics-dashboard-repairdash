export type Route = 'overview' | 'riderapp' | 'driver' | 'payments' | 'feedback' | 'promociones';

export const ROUTE_PATH: Record<Route, string> = {
  overview: '/',
  riderapp: '/riderapp',
  driver: '/driver',
  payments: '/payments',
  feedback: '/feedback',
  promociones: '/promociones',
};

export const ROUTE_META: Record<Route, { title: string; group: string; dot: string }> = {
  overview:    { title: 'Visión consolidada', group: 'Análisis',   dot: 'var(--violet)' },
  riderapp:    { title: 'RiderApp',            group: 'Servicios',  dot: 'var(--pink)' },
  driver:      { title: 'DriverApp',           group: 'Servicios',  dot: 'var(--violet)' },
  payments:    { title: 'Payments',            group: 'Servicios',  dot: 'var(--mag)' },
  feedback:    { title: 'Feedback',            group: 'Servicios',  dot: 'var(--pink)' },
  promociones: { title: 'Promociones',         group: 'Servicios',  dot: 'var(--ok)' },
};

const PATH_ROUTE: Record<string, Route> = Object.fromEntries(
  (Object.entries(ROUTE_PATH) as [Route, string][]).map(([r, p]) => [p, r]),
) as Record<string, Route>;

export function routeFromPath(pathname: string): Route {
  return PATH_ROUTE[pathname] ?? 'overview';
}
