import type { FaqItem } from '@/lib/faq';

interface Props {
  items: FaqItem[];
  dark?: boolean;
  /** Prefixes element ids so the same item can appear twice on one page. */
  idPrefix?: string;
}

// Native <details>: works without JS and is keyboard/screen-reader accessible.
export function FaqAccordion({ items, dark = false, idPrefix = '' }: Props) {
  const border = dark ? 'border-[#2c2c2c]' : 'border-[#e5e2dc]';
  const qCls = dark ? 'text-white' : 'text-[#1a1a1a]';
  const aCls = dark ? 'text-[#bbb]' : 'text-[#555]';
  const iconCls = dark ? 'text-[#777]' : 'text-[#999]';
  return (
    <div className={`border-t ${border}`}>
      {items.map(item => (
        <details key={item.id} id={`${idPrefix}${item.id}`} className={`group border-b ${border} scroll-mt-[90px]`}>
          <summary className={`flex items-center justify-between gap-6 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden ${qCls}`}>
            <h3 className="font-heading text-[1.05rem] font-semibold leading-snug">{item.q}</h3>
            <span aria-hidden className={`shrink-0 text-[1.4rem] leading-none transition-transform group-open:rotate-45 ${iconCls}`}>+</span>
          </summary>
          <div className={`pb-5 pr-10 text-[0.95rem] font-light leading-[1.8] [&>p]:mb-3 ${aCls}`}>{item.a}</div>
        </details>
      ))}
    </div>
  );
}
