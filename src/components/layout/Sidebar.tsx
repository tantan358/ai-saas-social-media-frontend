import { LayoutDashboard, Users, FolderKanban, Settings, Mail } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { BRAND } from '@/lib/constants';

const Sidebar = () => {
  const { language, logout } = useApp();
  const t = useTranslation(language);

  const navItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' },
    { icon: Users, label: t('clients'), path: '/clients' },
    { icon: FolderKanban, label: t('campaigns'), path: '/campaigns' },
    { icon: Settings, label: t('settings'), path: '/settings' },
  ];

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-screen">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary">NERVIA</h1>
        <p className="text-xs text-muted-foreground mt-1">Marketing Automation</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors"
            activeClassName="bg-accent text-accent-foreground font-medium"
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t space-y-1">
        <a
          href={BRAND.supportMailto}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Mail className="w-5 h-5 shrink-0" />
          {t('contactSupport')}
        </a>
        <button
          type="button"
          className="w-full text-left px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={logout}
        >
          {t('logout')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
