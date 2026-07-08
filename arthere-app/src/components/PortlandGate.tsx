'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const TOKEN = process.env.NEXT_PUBLIC_DEMO_TOKEN ?? 'J3xqN8vM';

function Gate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (pathname.startsWith('/cities/portland') && searchParams.get('key') !== TOKEN) {
      router.replace('/');
    }
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
