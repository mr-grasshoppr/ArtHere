import { NavBar } from '@/components/NavBar';
import Link from 'next/link';
import { MyArtHereForm } from './MyArtHereForm';

export default function MyArtHerePage() {
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <NavBar theme="light" />
      <main className="max-w-[480px] mx-auto px-5 pt-28 pb-20">
        <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#bbb] mb-4">
          My Art Here
        </div>
        <MyArtHereForm />
      </main>
      <footer className="text-center pb-10 text-[#bbb] text-[0.78rem]">
        <Link href="/" className="hover:text-[#555] transition-colors no-underline text-[#bbb]">
          ← Back to Art Here
        </Link>
      </footer>
    </div>
  );
}
