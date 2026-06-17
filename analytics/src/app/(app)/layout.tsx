import { AppShell } from '@/components/AppShell';

// Layout del panel autenticado: renderiza el chrome persistente (sidebar +
// header con el selector de período). Las páginas de auth (/sign-in,
// /unauthorized) viven fuera de este route group.
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
