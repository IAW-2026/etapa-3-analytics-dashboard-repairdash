import { SignOutButton } from '@clerk/nextjs';

export default function UnauthorizedPage() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="card" style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-grotesk)', fontSize: 20, fontWeight: 700 }}>Acceso restringido</span>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>
          Tu cuenta no tiene el rol <strong>super-admin</strong> necesario para entrar al Analytics Dashboard. Si creés que es un error, contactá a un administrador.
        </p>
        <SignOutButton redirectUrl="/sign-in">
          <button className="btn-primary">Cerrar sesión</button>
        </SignOutButton>
      </div>
    </div>
  );
}
