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
      </footer>
    );
  }

  return (
    <footer className="px-10 py-10 text-center text-[#bbb] text-[0.78rem] tracking-[0.05em] border-t border-[#f0f0f0]">
      © 2026 Art Here · A project of Art Experience Lab
    </footer>
  );
}
