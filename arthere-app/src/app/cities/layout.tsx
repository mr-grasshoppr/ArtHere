export default function CitiesLayout({ children }: { children: React.ReactNode }) {
  // The h-full wrapper keeps the full-viewport city grid's height chain
  // intact. Fonts (Nunito for `font-heading`) load once in the root layout.
  return <div className="h-full">{children}</div>;
}
