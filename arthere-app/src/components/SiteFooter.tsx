'use client';

interface Props {
  dark?: boolean;
}

export function SiteFooter({ dark = false }: Props) {
  if (dark) {
    return (
      <footer className="bg-[#1a1a1a] py-5">
        <div className="max-w-[900px] mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left text-[#555] text-[0.78rem] tracking-[0.05em]">
          <span>© 2026 Art Here</span>
          <span>A project of Art Experience Lab</span>
        </div>
        <div className="max-w-[900px] mx-auto px-6 sm:px-10 mt-2 text-center sm:text-left text-[#444] text-[0.72rem]">
          Having a tech issue?{' '}
          <a
            href="mailto:hello@artishere.org"
            className="text-[#555] underline underline-offset-2 hover:text-[#888] transition-colors"
          >
            Email us at hello@artishere.org
          </a>
        </div>
      </footer>
    );
  }

  return (
    <footer className="px-10 py-10 text-center text-[#bbb] text-[0.78rem] tracking-[0.05em] border-t border-[#f0f0f0]">
      <div>© 2026 Art Here · A project of Art Experience Lab</div>
      <div className="mt-1.5 text-[0.72rem] text-[#ccc]">
        Having a tech issue?{' '}
        <a
          href="mailto:hello@artishere.org"
          className="underline underline-offset-2 hover:text-[#999] transition-colors"
        >
          Email us at hello@artishere.org
        </a>
      </div>
    </footer>
  );
}
