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
    <main className="min-h-dvh relative overflow-hidden flex flex-col items-center justify-center bg-bg text-text p-6">
      {/* Decorative blobs */}
      <div aria-hidden className="absolute -top-32 -left-32 size-[420px] rounded-full opacity-25 blur-[120px] pointer-events-none bg-violet" />
      <div aria-hidden className="absolute -bottom-32 -right-32 size-[420px] rounded-full opacity-20 blur-[120px] pointer-events-none bg-pink" />

      <div className="relative z-10 w-full max-w-[1000px] flex flex-wrap items-center justify-center gap-[clamp(32px,5vw,72px)]">
        {/* LEFT — presentation */}
        <div className="flex-[1_1_360px] max-w-[460px] flex flex-col items-start gap-6 text-left">
          {/* Brand */}
          <div className="flex flex-col items-start gap-3">
            <div className="size-16 rounded-[18px] grid place-items-center text-white bg-gradient-to-br from-violet to-pink shadow-[0_10px_30px_rgba(157,107,255,.35)]">
              <BarChart3 size={30} strokeWidth={1.75} />
            </div>
            <h1 className="font-grotesk text-[42px] font-bold tracking-[-.02em] m-0">
              Analy<span className="text-violet">tics</span>
            </h1>
            <p className="m-0 text-[13px] font-medium text-text3 tracking-[.04em]">
              VISIÓN CONSOLIDADA DEL NEGOCIO
            </p>
          </div>

          {/* Context card */}
          <div className="w-full rounded-[18px] p-6 bg-surface border border-border2 flex flex-col items-start gap-3">
            <span className="inline-flex items-center gap-[7px] text-[11.5px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap bg-ok-soft text-ok">
              <span className="size-[7px] rounded-full bg-ok" />
              Acceso restringido
            </span>
            <h2 className="font-grotesk text-[19px] font-bold leading-[1.25] m-0">
              Iniciá sesión para analizar el sistema.
            </h2>
            <p className="m-0 text-[13.5px] text-text2 leading-[1.55]">
              Indicadores clave consolidados de RiderApp, DriverApp, FeedbackApp, PromotionsApp y PaymentsApp.
            </p>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11.5px] text-text3">
            <span className="inline-flex items-center gap-1.5">
              <BarChart3 size={14} strokeWidth={1.75} className="text-ok" /> Datos reales
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Activity size={14} strokeWidth={1.75} className="text-violet" /> Tiempo real
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={14} strokeWidth={1.75} className="text-pink" /> Solo super-admin
            </span>
          </div>
        </div>

        {/* RIGHT — sign-in */}
        <div className="flex-[0_1_400px] flex justify-center min-w-[320px]">
          <SignIn signUpUrl="/sign-in" appearance={clerkAppearance} />
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-[11px] text-text3">
        © 2026 Analytics Hub
      </div>
    </main>
  );
}
