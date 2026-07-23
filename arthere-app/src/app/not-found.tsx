import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] flex flex-col">
      <NavBar theme="light" />
      <main className="flex-1 flex items-center justify-center px-5 pt-14">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-[2rem] font-bold tracking-[-0.02em] mb-4">
            This page isn&rsquo;t here.
          </h1>
          <p className="text-[#666] font-light leading-[1.8] mb-8">
            The page you&rsquo;re looking for may have moved or never existed.
          </p>
          <Link
            href="/"
            className="inline-block px-7 py-3 rounded-full border border-[#1a1a1a] text-[0.9rem] font-medium text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors"
          >
            Back to Art Here
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
