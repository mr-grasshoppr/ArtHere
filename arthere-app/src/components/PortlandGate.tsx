'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const TOKEN = process.env.NEXT_PUBLIC_DEMO_TOKEN ?? 'J3xqN8vM';
const SESSION_KEY = 'portland_access';

function Gate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!pathname.startsWith('/cities/portland')) return;

    const keyFromUrl = searchParams.get('key');

    if (keyFromUrl === TOKEN) {
      // Valid key in URL — remember access for this session
      sessionStorage.setItem(SESSION_KEY, 'granted');
      return;
    }

    if (sessionStorage.getItem(SESSION_KEY) === 'granted') {
      // Already granted this session
      return;
    }

    router.replace('/');
  }, [pathname, searchParams, router]);

  return <>{children}</>;
}

export function PortlandGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}
