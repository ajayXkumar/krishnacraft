import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-[#F5F0E8]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-ink flex flex-col min-h-screen sticky top-0 h-screen">
        <div className="px-6 py-7 border-b border-white/10">
          <div className="font-display text-cream text-lg leading-tight">Krishna Craft</div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-cream/40 mt-0.5">Admin Panel</div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-0.5">
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

        <div className="px-3 py-5 border-t border-white/10">
          <div className="px-4 py-2 text-xs text-cream/40 mb-2">
            {profile?.displayName || profile?.phone || 'Admin'}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm text-maroon/80 hover:text-maroon hover:bg-white/5 transition-colors"
          >
            <LogOutIcon size={16} strokeWidth={1.7} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
