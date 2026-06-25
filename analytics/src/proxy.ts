import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Next.js 16 renamed the `middleware` file convention to `proxy`. Clerk hooks
// in here. Only signed-in users whose Clerk publicMetadata.role === 'super-admin'
// may reach the dashboard or the /api/an/* routes.

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/unauthorized']);
const isApiRoute = createRouteMatcher(['/api/(.*)']);
const isSignUpRoute = createRouteMatcher(['/sign-up(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Sign-up is disabled entirely: any attempt to register is bounced to sign-in.
  if (isSignUpRoute(req)) {
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (isPublicRoute(req)) return;

  const { userId, redirectToSignIn } = await auth();

  // Not signed in.
  if (!userId) {
    if (isApiRoute(req)) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    return redirectToSignIn();
  }

  // Signed in: read the role from the live Clerk user (public metadata).
  const user = await (await clerkClient()).users.getUser(userId);
  const role = (user.publicMetadata as UserPublicMetadata).role;

  if (role !== 'super-admin') {
    if (isApiRoute(req)) {
      return NextResponse.json({ error: 'No autorizado: se requiere rol super-admin' }, { status: 403 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/unauthorized';
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static files, unless found in search params.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes.
    '/(api|trpc)(.*)',
  ],
};
