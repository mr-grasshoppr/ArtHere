/**
 * Wrap a generateStaticParams body so an unreachable database (CI builds,
 * preview environments without secrets) degrades to zero prerendered
 * paths — pages then render dynamically — instead of failing the build.
 * Production builds have DB access, so prerendering is unaffected there.
 */
export async function safeStaticParams<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch (err) {
    console.warn("generateStaticParams: database unavailable, skipping prerender.", err instanceof Error ? err.message : err);
    return [];
  }
}
