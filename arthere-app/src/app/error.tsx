'use client';

import Link from 'next/link';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-[2rem] font-bold tracking-[-0.02em] mb-4">
          Something went wrong.
        </h1>
        <p className="text-[#666] font-light leading-[1.8] mb-8">
          Sorry about that — please try again, or head back to the home page.
          If it keeps happening, let us know at{' '}
          <a href="mailto:hello@artishere.org" className="underline underline-offset-[3px]">
            hello@artishere.org
          </a>.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="px-7 py-3 rounded-full bg-[#1a1a1a] text-white text-[0.9rem] font-medium hover:opacity-80 transition-opacity cursor-pointer"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-7 py-3 rounded-full border border-[#1a1a1a] text-[0.9rem] font-medium text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors"
          >
            Back to Art Here
          </Link>
        </div>
      </div>
    </div>
  );
}
