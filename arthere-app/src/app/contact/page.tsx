import { Suspense } from 'react';
import { NavBar } from '@/components/NavBar';
import { ContactForm } from './ContactForm';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <NavBar theme="light" />
      <main className="max-w-[560px] mx-auto px-5 pt-28 pb-20">
        <Suspense>
          <ContactForm />
        </Suspense>
      </main>
    </div>
  );
}
