interface Props {
  dark?: boolean;
}

const INSTAGRAM_URL = 'https://www.instagram.com/arthereproject';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function SiteFooter({ dark = false }: Props) {
  if (dark) {
    return (
      <footer className="bg-[#1a1a1a] py-5">
        <div className="max-w-[900px] mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[#555] text-[0.78rem] tracking-[0.05em]">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
            <span>© 2026 Art Here</span>
            <span>A project of Art Experience Lab</span>
          </div>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Art Here on Instagram"
            className="text-[#555] hover:text-white transition-colors"
          >
            <InstagramIcon />
          </a>
        </div>
      </footer>
    );
  }

  return (
    <footer className="px-10 py-10 flex flex-col items-center gap-3 text-center text-[#bbb] text-[0.78rem] tracking-[0.05em] border-t border-[#f0f0f0]">
      <span>© 2026 Art Here · A project of Art Experience Lab</span>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Art Here on Instagram"
        className="text-[#bbb] hover:text-[#1a1a1a] transition-colors"
      >
        <InstagramIcon />
      </a>
    </footer>
  );
}
