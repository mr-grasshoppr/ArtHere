import { Suspense } from 'react';
import LinkErrorClient from './LinkErrorClient';

export default function LinkErrorPage() {
  return (
    <Suspense>
      <LinkErrorClient />
    </Suspense>
  );
}
