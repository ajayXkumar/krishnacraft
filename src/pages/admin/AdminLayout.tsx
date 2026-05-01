import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import {
  LayoutGridIcon,
  PackageIcon,
  HammerIcon,
  UserIcon,
  TagIcon,
  ImageIcon,
  LogOutIcon,
  StarIcon,
  YoutubeIcon,
  ShieldIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
} from '../../components/Icons';

const NAV = [
  { to: '/admin',           label: 'Dashboard',    Icon: LayoutGridIcon },
  { to: '/admin/orders',    label: 'Orders',        Icon: PackageIcon },
  { to: '/admin/products',  label: 'Products',      Icon: HammerIcon },
  { to: '/admin/customers', label: 'Customers',     Icon: UserIcon },
  { to: '/admin/coupons',   label: 'Coupons',       Icon: TagIcon },
  { to: '/admin/reviews',   label: 'Reviews',       Icon: StarIcon },
  { to: '/admin/videos',    label: 'Videos',        Icon: YoutubeIcon },
  { to: '/admin/settings',  label: 'Site Settings', Icon: ImageIcon },
  { to: '/admin/admins',    label: 'Admins',        Icon: ShieldIcon },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Derive page title from current route
  const currentNav = NAV.find(n =>
    n.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(n.to)
  );
  const pageTitle = currentNav?.label ?? 'Admin';

  return (
    <div className="flex min-h-screen bg-[#F5F0E8]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-ink flex flex-col min-h-screen sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="font-display text-cream text-lg leading-tight">Krishna Craft</div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-cream/40 mt-0.5">Admin Panel</div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm transition-colors ${
                  isActive
                    ? 'bg-walnut text-cream'
                    : 'text-cream/60 hover:text-cream hover:bg-white/5'
                }`
              }
            >
              <Icon size={16} strokeWidth={1.7} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: user + actions */}
        <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm text-cream/50 hover:text-cream hover:bg-white/5 transition-colors"
          >
            <ExternalLinkIcon size={15} strokeWidth={1.6} />
            View Site
          </Link>
          <div className="px-4 py-2 text-xs text-cream/30 truncate">
            {profile?.displayName || profile?.email || 'Admin'}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm text-maroon/70 hover:text-maroon hover:bg-white/5 transition-colors"
          >
            <LogOutIcon size={16} strokeWidth={1.7} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-4 px-8 py-4 bg-[#F5F0E8] border-b border-line">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-muted hover:text-walnut transition-colors"
          >
            <ArrowLeftIcon size={14} />
            Back
          </button>
          <span className="text-line">|</span>
          <span className="text-sm font-medium text-walnut">{pageTitle}</span>
          <div className="ml-auto">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-muted hover:text-walnut transition-colors"
            >
              <ExternalLinkIcon size={13} />
              View Site
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
