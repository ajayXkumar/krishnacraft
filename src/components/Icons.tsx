interface IconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

const base = (size: number, strokeWidth: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
});

export const SearchIcon = ({ className, size = 18, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
);

export const HeartIcon = ({ className, size = 18, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const BagIcon = ({ className, size = 20, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M6 7h12l-1 13H7L6 7z" />
    <path d="M9 7V5a3 3 0 0 1 6 0v2" />
  </svg>
);

export const MenuIcon = ({ className, size = 22, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="14" y2="17" />
  </svg>
);

export const CloseIcon = ({ className, size = 20, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
);

export const ArrowRightIcon = ({ className, size = 16, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="13 6 19 12 13 18" />
  </svg>
);

export const StarIcon = ({ className, size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2l2.95 6.99 7.55.65-5.74 4.97 1.74 7.39L12 18.27l-6.5 3.73 1.74-7.39L1.5 9.64l7.55-.65L12 2z" />
  </svg>
);

export const LeafIcon = ({ className, size = 22, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M11 20A7 7 0 0 1 4 13c0-7 7-9 16-9-1 8-3 16-9 16z" />
    <path d="M2 22l8-8" />
  </svg>
);

export const HammerIcon = ({ className, size = 22, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" />
    <path d="M17 6l5 5-3 3-9-9 3-3 4 4z" />
  </svg>
);

export const ShieldIcon = ({ className, size = 22, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const TruckIcon = ({ className, size = 22, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <rect x="1" y="6" width="14" height="11" rx="1" />
    <path d="M15 9h4l3 4v4h-7" />
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="19" r="2" />
  </svg>
);

export const CheckIcon = ({ className, size = 16, strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <polyline points="5 12 10 17 19 7" />
  </svg>
);

export const PlusIcon = ({ className, size = 14, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const MinusIcon = ({ className, size = 14, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const InstagramIcon = ({ className, size = 14, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" />
  </svg>
);

export const FacebookIcon = ({ className, size = 14, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const PinterestIcon = ({ className, size = 14, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <circle cx="12" cy="12" r="10" />
    <line x1="11" y1="8" x2="9" y2="22" />
    <path d="M9 14a4 4 0 1 0 4-4" />
  </svg>
);

export const LayoutGridIcon = ({ className, size = 18, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

export const PackageIcon = ({ className, size = 18, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M16.5 9.4L7.55 4.24" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export const UserIcon = ({ className, size = 18, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const TagIcon = ({ className, size = 18, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const ImageIcon = ({ className, size = 18, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export const LogOutIcon = ({ className, size = 18, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const MessageSquareIcon = ({ className, size = 18, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const ChevronDownIcon = ({ className, size = 16, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const PlayIcon = ({ className, size = 20, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export const YoutubeIcon = ({ className, size = 20, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
  </svg>
);

export const XIcon = ({ className, size = 20, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const ArrowLeftIcon = ({ className, size = 16, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export const ExternalLinkIcon = ({ className, size = 14, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export const WhatsAppIcon = ({ className, size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
