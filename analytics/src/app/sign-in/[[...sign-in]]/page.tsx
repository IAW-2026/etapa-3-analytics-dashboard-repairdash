import { SignIn } from '@clerk/nextjs';
import { BarChart3, Activity, CheckCircle2 } from 'lucide-react';

// Sign-in deshabilita el sign-up: el link apunta a /sign-in y el footer se oculta.
// El control definitivo es la Restriction "Sign-ups" en el dashboard de Clerk.
const clerkAppearance = {
  variables: {
    colorPrimary: '#9D6BFF',
    colorBackground: '#151020',
    colorText: '#F3EEFA',
    colorTextSecondary: '#AC9FC6',
    colorInputBackground: '#1E1730',
    colorInputText: '#F3EEFA',
    colorNeutral: '#F3EEFA',
    borderRadius: '12px',
  },
  elements: {
    rootBox: { width: '100%' },
    cardBox: { width: '100%', boxShadow: 'var(--shadow)' },
    card: { background: 'var(--surface)', border: '1px solid var(--border2)' },
    footerAction: { display: 'none' },
  },
} as const;

export default function SignInPage() {
  return (
    <main
      style={{
        minHeight: '100dvh', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--text)', padding: 24,
      }}
    >
      {/* Decorative blobs */}
      <div aria-hidden style={{ position: 'absolute', top: -128, left: -128, width: 420, height: 420, borderRadius: '50%', opacity: 0.25, filter: 'blur(120px)', pointerEvents: 'none', background: 'var(--violet)' }} />
      <div aria-hidden style={{ position: 'absolute', bottom: -128, right: -128, width: 420, height: 420, borderRadius: '50%', opacity: 0.2, filter: 'blur(120px)', pointerEvents: 'none', background: 'var(--pink)' }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 1000, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 'clamp(32px, 5vw, 72px)' }}>
        {/* LEFT — presentation */}
        <div style={{ flex: '1 1 360px', maxWidth: 460, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 24, textAlign: 'left' }}>
          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, display: 'grid', placeItems: 'center', color: '#FFF', background: 'linear-gradient(135deg, var(--violet), var(--pink))', boxShadow: '0 10px 30px rgba(157,107,255,.35)' }}>
              <BarChart3 size={30} strokeWidth={1.75} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-grotesk)', fontSize: 42, fontWeight: 700, letterSpacing: '-.02em', margin: 0 }}>
              Analy<span style={{ color: 'var(--violet)' }}>tics</span>
            </h1>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text3)', letterSpacing: '.04em' }}>
              VISIÓN CONSOLIDADA DEL NEGOCIO
            </p>
          </div>

          {/* Context card */}
          <div style={{ width: '100%', borderRadius: 18, padding: 24, background: 'var(--surface)', border: '1px solid var(--border2)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
            <span className="badge" style={{ background: 'var(--ok-soft)', color: 'var(--ok)', gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ok)' }} />
              Acceso restringido
            </span>
            <h2 style={{ fontFamily: 'var(--font-grotesk)', fontSize: 19, fontWeight: 700, lineHeight: 1.25, margin: 0 }}>
              Iniciá sesión para analizar el sistema.
            </h2>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.55 }}>
              Indicadores clave consolidados de RiderApp, DriverApp, FeedbackApp, PromotionsApp y PaymentsApp.
            </p>
          </div>

          {/* Trust row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 24, rowGap: 8, fontSize: 11.5, color: 'var(--text3)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={14} strokeWidth={1.75} style={{ color: 'var(--ok)' }} /> Datos reales
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Activity size={14} strokeWidth={1.75} style={{ color: 'var(--violet)' }} /> Tiempo real
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} strokeWidth={1.75} style={{ color: 'var(--pink)' }} /> Solo super-admin
            </span>
          </div>
        </div>

        {/* RIGHT — sign-in */}
        <div style={{ flex: '0 1 400px', display: 'flex', justifyContent: 'center', minWidth: 320 }}>
          <SignIn signUpUrl="/sign-in" appearance={clerkAppearance} />
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>
        © 2026 Analytics Hub
      </div>
    </main>
  );
}
