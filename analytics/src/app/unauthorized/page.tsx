import { SignOutButton } from '@clerk/nextjs';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-bg text-text">
      <div className="bg-surface border border-border rounded-2xl p-5 max-w-[440px] flex flex-col gap-3.5 text-center items-center">
        <span className="font-grotesk text-xl font-bold">Acceso restringido</span>
        <p className="m-0 text-sm text-text2 leading-normal">
          Tu cuenta no tiene el rol <strong>super-admin</strong> necesario para entrar al Analytics Dashboard. Si creés que es un error, contactá a un administrador.
        </p>
        <SignOutButton redirectUrl="/sign-in">
          <button className="btn-primary">Cerrar sesión</button>
        </SignOutButton>
      </div>
    </div>
  );
}
