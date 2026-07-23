'use client';

// Shared filter-pill dropdown used by the artists, artwork, and community
// browsers. Render a fixed click-outside catcher yourself when open:
//   {openDropdown && <div className="fixed inset-0 z-40" onClick={close} aria-hidden />}

export type FilterTheme = 'light' | 'dark';

export const PILL_BASE =
  'px-4 py-[7px] rounded-full border text-[0.82rem] transition-colors whitespace-nowrap cursor-pointer';

const PILL_THEME: Record<FilterTheme, { inactive: string; active: string }> = {
  light: {
    inactive: 'border-[#ddd] text-[#888] bg-transparent hover:border-[#999] hover:text-[#444]',
    active: 'bg-[#1a1a1a] border-[#1a1a1a] text-white',
  },
  dark: {
    inactive: 'border-[#444] text-[#888] bg-transparent hover:border-[#888] hover:text-[#ccc]',
    active: 'bg-white border-white text-black',
  },
};

export function pillClass(theme: FilterTheme, active: boolean): string {
  return `${PILL_BASE} ${active ? PILL_THEME[theme].active : PILL_THEME[theme].inactive}`;
}

const MENU_THEME: Record<FilterTheme, { menu: string; item: string; itemOn: string; itemOff: string; empty: string }> = {
  light: {
    menu: 'bg-white border border-[#ddd] rounded-lg overflow-hidden min-w-[180px] z-[100] shadow-[0_4px_16px_rgba(0,0,0,0.1)]',
    item: 'block w-full text-left px-[18px] py-2.5 text-[0.85rem] border-b border-[#f5f5f5] last:border-b-0 transition-colors hover:bg-[#fafafa] hover:text-[#1a1a1a]',
    itemOn: 'text-[#1a1a1a] font-medium',
    itemOff: 'text-[#666]',
    empty: 'px-[18px] py-2.5 text-[0.85rem] text-[#bbb] italic',
  },
  dark: {
    menu: 'bg-[#1a1a1a] border border-[#333] rounded-md overflow-hidden min-w-[170px] z-[100] shadow-[0_4px_16px_rgba(0,0,0,0.5)]',
    item: 'block w-full text-left px-4 py-2.5 text-[0.82rem] border-b border-[#222] last:border-b-0 transition-colors hover:bg-[#222] hover:text-white',
    itemOn: 'text-white',
    itemOff: 'text-[#888]',
    empty: 'px-4 py-2.5 text-[0.82rem] text-[#555] italic',
  },
};

interface Props {
  label: string;
  pluralLabel: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  theme?: FilterTheme;
}

export function FilterDropdown({
  label,
  pluralLabel,
  options,
  value,
  onChange,
  isOpen,
  onToggle,
  theme = 'light',
}: Props) {
  const t = MENU_THEME[theme];
  const buttonLabel = value ? `${value} ▾` : `${label} ▾`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onToggle(); }}
        className={pillClass(theme, !!value)}
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div className={`absolute top-[calc(100%+6px)] left-0 ${t.menu}`}>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className={`${t.item} ${value === '' ? t.itemOn : t.itemOff}`}
          >
            All {pluralLabel}
          </button>
          {options.length === 0 && <div className={t.empty}>Nothing tagged yet</div>}
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={e => { e.stopPropagation(); onChange(opt); }}
              className={`${t.item} ${value === opt ? t.itemOn : t.itemOff}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
