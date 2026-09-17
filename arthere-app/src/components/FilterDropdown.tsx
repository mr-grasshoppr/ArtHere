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

export const MENU_THEME: Record<FilterTheme, { menu: string; item: string; itemOn: string; itemOff: string; empty: string; heading: string }> = {
  light: {
    menu: 'bg-white border border-[#ddd] rounded-lg overflow-hidden min-w-[180px] z-[100] shadow-[0_4px_16px_rgba(0,0,0,0.1)]',
    item: 'block w-full text-left px-[18px] py-2.5 text-[0.85rem] border-b border-[#f5f5f5] last:border-b-0 transition-colors hover:bg-[#fafafa] hover:text-[#1a1a1a]',
    itemOn: 'text-[#1a1a1a] font-medium',
    itemOff: 'text-[#666]',
    empty: 'px-[18px] py-2.5 text-[0.85rem] text-[#bbb] italic',
    heading: 'px-[18px] pt-2.5 pb-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-[#999]',
  },
  dark: {
    menu: 'bg-[#1a1a1a] border border-[#333] rounded-md overflow-hidden min-w-[170px] z-[100] shadow-[0_4px_16px_rgba(0,0,0,0.5)]',
    item: 'block w-full text-left px-4 py-2.5 text-[0.82rem] border-b border-[#222] last:border-b-0 transition-colors hover:bg-[#222] hover:text-white',
    itemOn: 'text-white',
    itemOff: 'text-[#888]',
    empty: 'px-4 py-2.5 text-[0.82rem] text-[#555] italic',
    heading: 'px-4 pt-2.5 pb-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-[#666]',
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
  /**
   * Optional grouping for the menu (e.g. places under their Portland area).
   * Headings are labels only — a single-select can't pick a whole group.
   * `options` stays the flat source of truth for what is selectable.
   */
  optionGroups?: OptionGroup[];
  /** Open the menu above the button instead of below — for a bar pinned to the bottom edge. */
  openUp?: boolean;
}

/** Menu placement relative to its button. */
function menuPosition(openUp: boolean | undefined): string {
  return openUp ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]';
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
  optionGroups,
  openUp,
}: Props) {
  const t = MENU_THEME[theme];
  const buttonLabel = value ? `${value} ▾` : `${label} ▾`;

  const option = (opt: string, indent: boolean) => (
    <button
      key={opt}
      type="button"
      onClick={e => { e.stopPropagation(); onChange(opt); }}
      className={`${t.item} ${value === opt ? t.itemOn : t.itemOff}${indent ? ' pl-[26px]' : ''}`}
    >
      {opt}
    </button>
  );

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
        <div className={`absolute ${menuPosition(openUp)} left-0 ${t.menu}`}>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className={`${t.item} ${value === '' ? t.itemOn : t.itemOff}`}
          >
            All {pluralLabel}
          </button>
          {options.length === 0 && <div className={t.empty}>Nothing tagged yet</div>}
          {optionGroups
            ? optionGroups.map((group, gi) =>
                group.label ? (
                  <div key={group.label}>
                    <div className={t.heading}>{group.label}</div>
                    {group.options.map(opt => option(opt, true))}
                  </div>
                ) : (
                  <div key={`group-${gi}`}>{group.options.map(opt => option(opt, false))}</div>
                )
              )
            : options.map(opt => option(opt, false))}
        </div>
      )}
    </div>
  );
}

export interface OptionGroup {
  /** Heading shown above the group. Null renders the options with no heading. */
  label: string | null;
  options: string[];
}

interface MultiProps {
  label: string;
  pluralLabel: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  theme?: FilterTheme;
  /**
   * Optional grouping for the menu (e.g. neighborhoods under their Portland
   * area). When given, `options` is still the flat source of truth for what
   * is selectable; this only controls how the menu is laid out.
   */
  optionGroups?: OptionGroup[];
  /** Open the menu above the button instead of below — for a bar pinned to the bottom edge. */
  openUp?: boolean;
}

/**
 * Same look as FilterDropdown, but lets several options be selected at once
 * (an entity matches if it has ANY of the selected values). Used for the
 * Neighborhood filter, where a place/artist can have more than one
 * neighborhood — see parseNeighborhoodList in lib/neighborhoods.ts.
 */
export function MultiFilterDropdown({
  label,
  pluralLabel,
  options,
  value,
  onChange,
  isOpen,
  onToggle,
  theme = 'light',
  optionGroups,
  openUp,
}: MultiProps) {
  const t = MENU_THEME[theme];
  const buttonLabel =
    value.length === 0 ? `${label} ▾`
    : value.length === 1 ? `${value[0]} ▾`
    : `${value.length} ${pluralLabel} ▾`;

  function toggleOption(opt: string) {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onToggle(); }}
        className={pillClass(theme, value.length > 0)}
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div className={`absolute ${menuPosition(openUp)} left-0 ${t.menu}`}>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange([]); }}
            className={`${t.item} ${value.length === 0 ? t.itemOn : t.itemOff}`}
          >
            All {pluralLabel}
          </button>
          {options.length === 0 && <div className={t.empty}>Nothing tagged yet</div>}
          {(optionGroups ?? [{ label: null, options }]).map((group, gi) => {
            // An area whose only option is itself ("Beaverton" → ["Beaverton"])
            // has nothing to group, so it renders as one top-level row rather
            // than a heading over a single child. An area that does have
            // sub-neighborhoods renders its heading as a checkbox: ticking it
            // selects every neighborhood in the area (the area's own name
            // included, when that is itself a tag), so "SW Portland" means all
            // of SW, and the area name is not repeated as a child underneath.
            const children = group.label ? group.options.filter(o => o !== group.label) : group.options;
            const whole = group.options;
            const allOn = whole.length > 0 && whole.every(o => value.includes(o));
            const someOn = !allOn && whole.some(o => value.includes(o));

            const toggleWhole = () => {
              onChange(allOn ? value.filter(v => !whole.includes(v)) : [...new Set([...value, ...whole])]);
            };

            const row = (label: string, on: boolean, partial: boolean, onClick: () => void, indent: boolean, heading: boolean) => (
              <button
                key={`${group.label ?? 'g'}:${label}`}
                type="button"
                onClick={e => { e.stopPropagation(); onClick(); }}
                className={`${t.item} ${on ? t.itemOn : t.itemOff} flex items-center gap-2${indent ? ' pl-[26px]' : ''}${
                  heading ? ' font-semibold' : ''
                }`}
              >
                <span
                  className={`inline-block w-3 h-3 rounded-sm border flex-shrink-0 ${
                    on ? 'bg-current border-current' : partial ? 'border-current' : 'border-current opacity-40'
                  }`}
                  style={partial ? { backgroundImage: 'linear-gradient(currentColor, currentColor)', backgroundSize: '50% 2px', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' } : undefined}
                />
                {label}
              </button>
            );

            if (!group.label) {
              return <div key={`group-${gi}`}>{group.options.map(opt => row(opt, value.includes(opt), false, () => toggleOption(opt), false, false))}</div>;
            }
            if (children.length === 0) {
              return <div key={group.label}>{row(group.label, allOn, false, toggleWhole, false, false)}</div>;
            }
            return (
              <div key={group.label}>
                {row(group.label, allOn, someOn, toggleWhole, false, true)}
                {children.map(opt => row(opt, value.includes(opt), false, () => toggleOption(opt), true, false))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
