import React from 'react';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Bot,
  Menu,
  AlertCircle,
  Award,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { UserAccount } from '../../types';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMobileMenu: () => void;
  currentUser?: UserAccount;
  badgeCounts: {
    absentToday?: number;
    violationsCount?: number;
    urgentAttention?: number;
    pendingApprovals?: number;
  };
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobileMenu,
  currentUser,
  badgeCounts,
}) => {
  const isGVCN = !currentUser || currentUser.role === 'GVCN';

  const primaryTabs: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = React.useMemo(() => {
    if (!isGVCN && currentUser) {
      return [
        {
          id: 'attendance',
          label: currentUser.group ? `Điểm danh T${currentUser.group}` : 'Điểm danh',
          icon: CheckSquare,
          badge: badgeCounts.absentToday,
          badgeColor: 'bg-rose-500',
        },
        {
          id: 'violations',
          label: 'Nề nếp',
          icon: AlertCircle,
          badge: badgeCounts.violationsCount,
          badgeColor: 'bg-rose-500',
        },
        {
          id: 'approvals',
          label: 'Chờ duyệt',
          icon: Send,
          badge: badgeCounts.pendingApprovals,
          badgeColor: 'bg-amber-500',
        },
      ];
    }

    return [
      {
        id: 'dashboard',
        label: 'Tổng quan',
        icon: LayoutDashboard,
      },
      {
        id: 'approvals',
        label: 'Phê duyệt',
        icon: ShieldCheck,
        badge: badgeCounts.pendingApprovals,
        badgeColor: 'bg-amber-500',
      },
      {
        id: 'attendance',
        label: 'Điểm danh',
        icon: CheckSquare,
        badge: badgeCounts.absentToday,
        badgeColor: 'bg-rose-500',
      },
      {
        id: 'ai',
        label: 'Trợ lý AI',
        icon: Bot,
      },
    ];
  }, [isGVCN, currentUser, badgeCounts]);

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Thanh điều hướng di động"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 px-2 py-1 flex items-center justify-around shadow-lg select-none"
    >
      {primaryTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`mobile-nav-${tab.id}`}
            onClick={() => {
              onSelectTab(tab.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
              isActive
                ? 'text-cyan-600 dark:text-cyan-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive
                    ? 'bg-cyan-50 dark:bg-cyan-950/60 shadow-xs'
                    : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? 'text-cyan-600 dark:text-cyan-400 scale-110'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
              </div>

              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`absolute -top-1 -right-1 ${
                    tab.badgeColor || 'bg-rose-500'
                  } text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center leading-tight shadow-xs animate-pulse`}
                >
                  {tab.badge}
                </span>
              )}
            </div>

            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
              {tab.label}
            </span>

            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 absolute -bottom-0.5" />
            )}
          </button>
        );
      })}

      {/* Menu Drawer button for remaining tabs */}
      <button
        id="mobile-nav-more"
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center min-w-[60px] py-1 px-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
      >
        <div className="p-1 rounded-xl">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Tất cả mục</span>
      </button>
    </nav>
  );
};

