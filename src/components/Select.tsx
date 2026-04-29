import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from './Icons';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md';
}

export default function Select({
  value,
  onChange,
  options,
  className = '',
  disabled = false,
  placeholder,
  size = 'md',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);
  const label = selected?.label ?? placeholder ?? '';

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [open]);

  const padding = size === 'sm' ? 'px-3 py-2 text-[12px]' : 'px-4 py-2.5 text-sm';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 border border-line bg-white rounded-sm outline-none transition-colors cursor-pointer
          ${padding}
          ${open ? 'border-gold' : 'hover:border-walnut/40'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          text-walnut`}
      >
        <span className={selected ? 'text-walnut' : 'text-muted'}>{label}</span>
        <ChevronDownIcon
          size={14}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-line rounded-sm shadow-lg overflow-hidden">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                ${opt.value === value
                  ? 'bg-walnut text-cream'
                  : 'text-walnut hover:bg-cream-2'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
