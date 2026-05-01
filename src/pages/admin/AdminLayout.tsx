import { useState } from 'react';
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
  MenuIcon,
  CloseIcon,
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

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
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
            onClick={onNav}
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

      {/* Bottom */}
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
    </>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentNav = NAV.find(n =>
    n.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(n.to)
  );
  const pageTitle = currentNav?.label ?? 'Admin';

  return (
    <div className="flex min-h-screen bg-[#F5F0E8]">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-ink flex-col min-h-screen sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[70] bg-ink/60 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile drawer panel ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-ink z-[71] flex flex-col transition-transform duration-300 lg:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 text-cream/50 hover:text-cream"
          aria-label="Close menu"
        >
          <CloseIcon size={20} />
        </button>
        <SidebarContent onNav={() => setDrawerOpen(false)} />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4 lg:px-8 py-3 lg:py-4 bg-[#F5F0E8] border-b border-line">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden text-walnut flex-shrink-0"
            aria-label="Open menu"
          >
            <MenuIcon size={22} />
          </button>

          <button
            onClick={() => navigate(-1)}
            className="hidden sm:flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-muted hover:text-walnut transition-colors flex-shrink-0"
          >
            <ArrowLeftIcon size={14} />
            Back
          </button>

          <span className="hidden sm:block text-line">|</span>

          <span className="text-sm font-medium text-walnut truncate">{pageTitle}</span>

          <div className="ml-auto flex items-center gap-3 flex-shrink-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-muted hover:text-walnut transition-colors"
            >
              <ExternalLinkIcon size={13} />
              <span className="hidden sm:inline">View Site</span>
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
