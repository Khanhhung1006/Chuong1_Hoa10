import React from 'react';
import {
  LayoutDashboard,
  Users,
  Grid2X2,
  CheckSquare,
  AlertCircle,
  Award,
  Trophy,
  GraduationCap,
  HeartHandshake,
  PhoneCall,
  Calendar,
  Wallet,
  FileSpreadsheet,
  FolderArchive,
  BookOpen,
  Bot,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  GraduationCap as SchoolIcon,
  ShieldCheck,
  Clock,
  Send,
  LogOut,
  Smartphone,
} from 'lucide-react';
import { UserAccount } from '../../types';

export type NavTab =
  | 'admin'
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'phones'
  | 'uniformCheck'
  | 'violations'
  | 'rewards'
  | 'emulation'
  | 'academics'
  | 'conduct'
  | 'parents'
  | 'calendar'
  | 'reports'
  | 'documents'
  | 'diary'
  | 'ai'
  | 'analytics'
  | 'settings'
  | 'approvals'
  | 'audit_logs';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  currentUser?: UserAccount;
  onLogout?: () => void;
  badgeCounts: {
    absentToday?: number;
    violationsCount?: number;
    urgentAttention?: number;
    pendingApprovals?: number;
  };
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile = false,
  onCloseMobile,
  currentUser,
  onLogout,
  badgeCounts,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isGVCN = !currentUser || currentUser.role === 'GVCN';

  // Role-based NavGroups definition
  const navGroups: NavGroup[] = React.useMemo(() => {
    if (isAdmin) {
      return [
        {
          groupTitle: 'QUẢN TRỊ TOÀN TRƯỜNG (ADMIN)',
          items: [
            { id: 'admin', label: 'Quản trị GVCN & Tài khoản', icon: ShieldCheck },
            { id: 'analytics', label: 'Thống kê toàn trường', icon: BarChart3 },
            { id: 'audit_logs', label: 'Nhật ký hệ thống', icon: Clock },
            { id: 'settings', label: 'Cấu hình & Sao lưu', icon: Settings },
          ],
        },
      ];
    }

    if (!isGVCN && currentUser) {
      // Student cadre specific navigation based on exact role
      const roleUpper = (currentUser.role || '').toUpperCase();
      const roleTitleLower = (currentUser.roleTitle || '').toLowerCase();

      const isLopTruong = roleUpper === 'LT' || roleTitleLower.includes('lớp trưởng');
      const isThuKi = roleUpper === 'TK' || roleTitleLower.includes('thư ký') || roleTitleLower.includes('thư kí');
      const isToTruong = roleUpper.startsWith('TT') || roleTitleLower.includes('tổ trưởng');

      let items: any[] = [];
      let groupName = currentUser.group ? `TỔ ${currentUser.group}` : 'CÁN SỰ';

      if (isLopTruong) {
        groupName = 'LỚP TRƯỞNG';
        items = [
          {
            id: 'attendance',
            label: 'Điểm danh toàn lớp',
            icon: CheckSquare,
            badge: badgeCounts.absentToday,
            badgeColor: 'bg-rose-500',
          },
        ];
      } else if (isThuKi) {
        groupName = 'THƯ KÍ';
        items = [
          {
            id: 'violations',
            label: 'Nề nếp & Khen thưởng lớp',
            icon: AlertCircle,
            badge: badgeCounts.violationsCount,
            badgeColor: 'bg-rose-500',
          },
        ];
      } else if (isToTruong || currentUser.group) {
        const groupLbl = currentUser.group ? `Tổ ${currentUser.group}` : '';
        items = [
          {
            id: 'phones',
            label: groupLbl ? `Quản lý nộp điện thoại ${groupLbl}` : 'Quản lý nộp điện thoại',
            icon: Smartphone,
          },
          {
            id: 'uniformCheck',
            label: groupLbl ? `Kiểm tra đồng phục ${groupLbl}` : 'Kiểm tra đồng phục',
            icon: ShieldCheck,
          },
        ];
      } else {
        items = [
          {
            id: 'attendance',
            label: 'Điểm danh lớp',
            icon: CheckSquare,
          },
        ];
      }

      return [
        {
          groupTitle: `CHỨC NĂNG (${groupName})`,
          items,
        },
      ];
    }

    // Teacher (GVCN) navigation
    return [
      {
        groupTitle: 'TỔNG QUAN & PHÊ DUYỆT',
        items: [
          { id: 'dashboard', label: 'Bàn làm việc', icon: LayoutDashboard },
          {
            id: 'approvals',
            label: 'Phê duyệt đề xuất',
            icon: ShieldCheck,
            badge: badgeCounts.pendingApprovals,
            badgeColor: 'bg-amber-500',
          },
          {
            id: 'students',
            label: 'Hồ sơ học sinh',
            icon: Users,
            badge: badgeCounts.urgentAttention,
            badgeColor: 'bg-amber-500',
          },
        ],
      },
      {
        groupTitle: 'NỀ NẾP & THI ĐUA',
        items: [
          {
            id: 'attendance',
            label: 'Điểm danh hàng ngày',
            icon: CheckSquare,
            badge: badgeCounts.absentToday,
            badgeColor: 'bg-rose-500',
          },
          {
            id: 'phones',
            label: 'Quản lý nộp điện thoại',
            icon: Smartphone,
          },
          {
            id: 'uniformCheck',
            label: 'Kiểm tra đồng phục',
            icon: ShieldCheck,
          },
          {
            id: 'violations',
            label: 'Nề nếp & Khen thưởng',
            icon: AlertCircle,
            badge: badgeCounts.violationsCount,
            badgeColor: 'bg-rose-500',
          },
          { id: 'emulation', label: 'Thi đua 4 Tổ', icon: Trophy },
        ],
      },
      {
        groupTitle: 'HỌC TẬP & ĐÁNH GIÁ',
        items: [
          { id: 'academics', label: 'Sổ điểm & Học lực', icon: GraduationCap },
          { id: 'conduct', label: 'Xếp loại hạnh kiểm', icon: HeartHandshake },
        ],
      },
      {
        groupTitle: 'GIAO TIẾP & QUẢN LÝ',
        items: [
          { id: 'parents', label: 'Liên lạc phụ huynh', icon: PhoneCall },
          { id: 'calendar', label: 'Lịch công tác & Sự kiện', icon: Calendar },
          { id: 'diary', label: 'Nhật ký chủ nhiệm', icon: BookOpen },
        ],
      },
      {
        groupTitle: 'CÔNG CỤ & HỆ THỐNG',
        items: [
          { id: 'ai', label: 'Trợ lý AI Chủ nhiệm', icon: Bot, badgeColor: 'bg-cyan-500' },
          { id: 'reports', label: 'Báo cáo & Xuất file', icon: FileSpreadsheet },
          { id: 'documents', label: 'Kho tài liệu biểu mẫu', icon: FolderArchive },
          { id: 'analytics', label: 'Thống kê chuyên sâu', icon: BarChart3 },
          { id: 'settings', label: 'Cài đặt lớp học', icon: Settings },
        ],
      },
    ];
  }, [isGVCN, currentUser, badgeCounts]);


  const handleItemClick = (id: NavTab) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          id="mobile-sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar (Drawer on mobile, Sticky sidebar on desktop) */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 lg:top-16 bottom-0 left-0 z-50 lg:z-20 h-full lg:h-[calc(100vh-4rem)] border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col shrink-0 select-none shadow-2xl lg:shadow-none ${
          // Mobile state
          isOpenMobile
            ? 'translate-x-0 w-72 max-w-[85vw]'
            : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop state
          isCollapsed ? 'lg:w-18' : 'lg:w-64'
        }`}
      >
        {/* Mobile-only Header with Close Button */}
        <div className="lg:hidden p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <img
              src="/school_logo.jpg"
              alt="School Logo"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover shadow-xs border border-slate-200/50 dark:border-slate-700/50"
            />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Menu Quản Lý Lớp
              </div>
              <div className="text-[10px] text-slate-500">THPT Nguyễn Trãi, BĐ</div>
            </div>
          </div>

          <button
            id="close-mobile-sidebar-btn"
            onClick={onCloseMobile}
            aria-label="Đóng menu"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable nav items */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {(!isCollapsed || isOpenMobile) && (
                <div className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  {group.groupTitle}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => handleItemClick(item.id)}
                    title={isCollapsed && !isOpenMobile ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative group ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold dark:bg-cyan-500/15'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    } ${isCollapsed && !isOpenMobile ? 'justify-center px-0' : ''}`}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyan-500 rounded-r-full" />
                    )}

                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />

                    {(!isCollapsed || isOpenMobile) && (
                      <span className="truncate text-left flex-1">{item.label}</span>
                    )}

                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`${
                          item.badgeColor || 'bg-cyan-500'
                        } text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center shrink-0 ${
                          isCollapsed && !isOpenMobile ? 'absolute -top-1 -right-1' : ''
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

        </div>

        {/* User Account & Logout section in Sidebar */}
        <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
          {(!isCollapsed || isOpenMobile) ? (
            <div className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {currentUser ? (currentUser.role === 'ADMIN' ? 'AD' : currentUser.username.slice(0, 2).toUpperCase()) : 'GV'}
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {currentUser?.username || 'GVCN'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser?.roleTitle || 'Giáo viên'}
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  id="sidebar-logout-btn"
                  onClick={onLogout}
                  title="Đăng xuất khỏi hệ thống"
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1 transition-all border border-rose-200 dark:border-rose-800 shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="text-[11px]">Thoát</span>
                </button>
              )}
            </div>
          ) : (
            onLogout && (
              <button
                id="sidebar-collapsed-logout-btn"
                onClick={onLogout}
                title="Đăng xuất tài khoản"
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-all border border-rose-200 dark:border-rose-800 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </button>
            )
          )}
        </div>

        {/* Footer toggle button (Desktop only) */}
        <div className="hidden lg:flex p-2.5 border-t border-slate-100 dark:border-slate-800 items-center justify-between">
          {!isCollapsed && (
            <span className="text-[11px] text-slate-400 font-medium truncate">THPT Nguyễn Trãi, BĐ</span>
          )}
          <button
            id="collapse-sidebar-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mx-auto cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
