import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Moon,
  Sun,
  Bot,
  Menu,
  Sparkles,
  CalendarDays,
  X,
  Phone,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
  CornerDownLeft,
  ShieldCheck,
  KeyRound,
  LogOut,
  ChevronDown,
  User,
  Clock,
} from 'lucide-react';
import { ClassSettings, Student, UserAccount } from '../../types';

interface HeaderProps {
  settings: ClassSettings;
  onToggleSidebar: () => void;
  onToggleDarkMode: () => void;
  onOpenAI: () => void;
  onSelectStudent: (student: Student) => void;
  allStudents: Student[];
  currentUser?: UserAccount;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
  pendingApprovalsCount?: number;
  onOpenApprovals?: () => void;
  onOpenClassInitModal?: () => void;
  onOpenAdminDashboard?: () => void;
  onNavigateToStudents?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onToggleSidebar,
  onToggleDarkMode,
  onOpenAI,
  onSelectStudent,
  allStudents,
  currentUser,
  onOpenChangePassword,
  onLogout,
  pendingApprovalsCount = 0,
  onOpenApprovals,
  onOpenClassInitModal,
  onOpenAdminDashboard,
  onNavigateToStudents,
}) => {
  const [currentDate, setCurrentDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchModalOpen, setIsMobileSearchModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const displayedSchoolName =
    settings.schoolName && !settings.schoolName.includes('Lê Quý Đôn')
      ? settings.schoolName
      : 'THPT Nguyễn Trãi - BĐ';

  let displayedTeacherName = settings.teacherName;
  if (
    !displayedTeacherName ||
    displayedTeacherName === settings.className ||
    displayedTeacherName.includes('Giáo viên Chủ nhiệm') ||
    displayedTeacherName.toLowerCase() === 'gvcn'
  ) {
    if (settings.className === '10A1') {
      displayedTeacherName = 'Thầy Nguyễn Văn Thành';
    } else if (settings.className === '11A1') {
      displayedTeacherName = 'Cô Hoàng Mai Lan';
    } else {
      displayedTeacherName = currentUser?.displayName && !currentUser.displayName.includes('GVCN') && !currentUser.displayName.includes('10A1')
        ? currentUser.displayName
        : 'Thầy/Cô Chủ nhiệm';
    }
  }

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = days[now.getDay()];
      const formatted = `${dayName}, ${now.getDate().toString().padStart(2, '0')}/${(
        now.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}/${now.getFullYear()}`;
      setCurrentDate(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter students based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSelectedIndex(-1);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const filtered = allStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.studentPhone && s.studentPhone.includes(q)) ||
        (s.parentPhone && s.parentPhone.includes(q)) ||
        (s.roleInClass && s.roleInClass.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q))
    );
    setSearchResults(filtered.slice(0, 10));
    setSelectedIndex(-1);
  }, [searchQuery, allStudents]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (student: Student) => {
    onSelectStudent(student);
    setSearchQuery('');
    setIsSearchOpen(false);
    setIsMobileSearchModalOpen(false);
  };

  const displayedList = searchQuery.trim()
    ? searchResults
    : allStudents.slice(0, 6);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsSearchOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < displayedList.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : displayedList.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < displayedList.length) {
        handleSelect(displayedList[selectedIndex]);
      } else if (displayedList.length > 0) {
        handleSelect(displayedList[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  const isGVCN = !currentUser || currentUser.role === 'GVCN' || currentUser.role === 'ADMIN';

  return (
    <>
      <header
        id="main-header"
        className="sticky top-0 z-40 h-16 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 transition-colors"
      >
        {/* Left section: Menu toggle & Class branding */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <button
            id="sidebar-toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Mở menu quản lý"
            className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-500/20 text-xs sm:text-sm shrink-0">
              {settings.className}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-sm font-bold font-display text-slate-800 dark:text-slate-100 truncate max-w-[150px] sm:max-w-[220px] lg:max-w-[320px]">
                  {displayedSchoolName}
                </h1>
                <span className="hidden xs:inline-block text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 shrink-0">
                  {settings.academicYear}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[160px] sm:max-w-[220px] lg:max-w-[300px]">
                GVCN: {displayedTeacherName}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live date & Desktop/Tablet quick search */}
        <div ref={searchContainerRef} className="flex-1 max-w-md mx-2 lg:mx-4 relative hidden md:block min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              id="global-search-input"
              type="text"
              placeholder="Tìm nhanh học sinh, SĐT phụ huynh, mã số..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isSearchOpen) setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onClick={() => setIsSearchOpen(true)}
              onKeyDown={handleKeyDown}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-900 rounded-full text-slate-800 dark:text-slate-100 outline-hidden transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                id="clear-search-query-btn"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop/Tablet Search Dropdown Panel */}
          {isSearchOpen && (
            <div
              id="search-results-dropdown"
              className="absolute left-0 top-full mt-2.5 w-[380px] sm:w-[440px] md:w-[480px] lg:w-[520px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Header of dropdown */}
              <div className="px-3.5 py-2 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  {searchQuery.trim()
                    ? `KẾT QUẢ TÌM THẤY (${searchResults.length})`
                    : `DANH SÁCH HỌC SINH (${allStudents.length} EM)`}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {searchQuery.trim() ? 'Gợi ý khớp nhất' : 'Chọn nhanh hồ sơ'}
                </span>
              </div>

              {/* Body list */}
              <div className="max-h-80 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
                {searchQuery.trim() && searchResults.length === 0 ? (
                  <div className="py-6 px-4 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Không tìm thấy học sinh nào khớp với "{searchQuery}"
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Thử tìm theo Họ và Tên (có dấu/không dấu), Mã định danh, hoặc Số điện thoại phụ huynh.
                    </p>
                  </div>
                ) : (
                  displayedList.map((s, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <button
                        key={s.id}
                        id={`search-item-${s.id}`}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelect(s);
                        }}
                        onClick={() => handleSelect(s)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-900 dark:text-cyan-100'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate flex items-center gap-1.5">
                              <span className="truncate">{s.fullName}</span>
                              {s.roleInClass && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-semibold shrink-0">
                                  {s.roleInClass}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              Mã: <span className="font-mono">{s.code}</span> • Tổ {s.group} • {s.gender}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-end gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{s.parentPhone}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {s.address ? s.address.split(',')[0] : 'Lớp ' + settings.className}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer with tips */}
              <div className="px-3.5 py-1.5 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between text-[10px] text-slate-400">
                <span>Dùng phím ↑ ↓ để di chuyển</span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" /> Nhấn Enter để mở hồ sơ
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right controls: Mobile search button, Approvals badge, AI button, Dark mode, User profile menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0">
          {/* Mobile Search Trigger */}
          <button
            id="mobile-search-trigger-btn"
            onClick={() => setIsMobileSearchModalOpen(true)}
            aria-label="Tìm kiếm học sinh"
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Pending Approvals quick badge button */}
          {onOpenApprovals && (
            <button
              id="header-approvals-btn"
              type="button"
              onClick={onOpenApprovals}
              title={isGVCN ? 'Xem và phê duyệt đề xuất' : 'Xem lịch sử chờ duyệt'}
              className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                pendingApprovalsCount > 0
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              {isGVCN && pendingApprovalsCount > 0 && (
                <span className="hidden sm:inline text-xs font-bold text-amber-700 dark:text-amber-300">
                  {pendingApprovalsCount} chờ duyệt
                </span>
              )}
              {pendingApprovalsCount > 0 && (
                <span className="sm:hidden absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs animate-bounce">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          )}

          {/* Calendar badge (large desktop only) */}
          <div className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
            <CalendarDays className="w-3.5 h-3.5 text-cyan-500" />
            <span>{currentDate}</span>
          </div>

          {/* Admin Dashboard trigger (Admin only) */}
          {currentUser?.role === 'ADMIN' && onOpenAdminDashboard && (
            <button
              id="header-admin-portal-btn"
              onClick={onOpenAdminDashboard}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/25 transition-all cursor-pointer"
              title="Mở bảng điều khiển Quản trị toàn trường"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Quản Trị Admin</span>
            </button>
          )}

          {/* Quick Students & Cadres list button (GVCN only) */}
          {isGVCN && (
            <button
              id="header-students-btn"
              onClick={onNavigateToStudents}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
              title="Xem danh sách học sinh và phân công Ban cán sự lớp"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">DS Học Sinh & Cán Sự</span>
            </button>
          )}

          {/* AI Assistant trigger (GVCN only or all) */}
          {isGVCN && (
            <button
              id="header-ai-btn"
              onClick={onOpenAI}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs font-semibold shadow-md shadow-cyan-600/25 hover:shadow-cyan-600/40 transition-all cursor-pointer group"
            >
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
              <span className="hidden xl:inline">Trợ lý AI</span>
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse hidden xs:inline" />
            </button>
          )}

          {/* Dark Mode toggle */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleDarkMode}
            aria-label="Chuyển chế độ sáng/tối"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {settings.darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* User Account Profile Menu */}
          <div ref={userMenuRef} className="relative flex items-center gap-1.5">
            <button
              id="header-user-menu-btn"
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer"
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold flex items-center justify-center text-xs shadow-xs text-white ${
                  currentUser?.role === 'ADMIN'
                    ? 'bg-gradient-to-br from-amber-600 to-amber-800 shadow-amber-600/25 ring-2 ring-amber-400/50'
                    : isGVCN
                    ? 'bg-amber-600 shadow-amber-600/20'
                    : 'bg-indigo-600 shadow-indigo-600/20'
                }`}
              >
                {currentUser ? (currentUser.role === 'ADMIN' ? 'AD' : currentUser.username.slice(0, 2).toUpperCase()) : 'GV'}
              </div>

              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold leading-tight text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>{currentUser?.username || 'GVCN'}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${
                      currentUser?.role === 'ADMIN'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : isGVCN
                        ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}
                  >
                    {currentUser?.roleTitle || (currentUser?.role === 'ADMIN' ? 'Admin' : 'GVCN')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                  {currentUser?.displayName || settings.teacherName}
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Direct Header Logout Button */}
            {onLogout && (
              <button
                id="header-direct-logout-btn"
                onClick={onLogout}
                title="Đăng xuất tài khoản"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200/80 dark:border-rose-800 transition-all cursor-pointer shadow-2xs ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Đăng xuất</span>
              </button>
            )}

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-50 p-2 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
                {/* User Info Header */}
                <div className="p-2.5 mb-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{currentUser?.displayName || 'Thầy/Cô Giáo viên'}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 rounded font-bold">
                      {currentUser?.username}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Vai trò: <strong className="text-cyan-600 dark:text-cyan-400">{currentUser?.roleTitle}</strong>
                  </div>
                  {currentUser?.assignedClass && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-amber-500" />
                      <span>{currentUser.role === 'ADMIN' ? 'Admin kiêm nhiệm GVCN:' : 'Lớp:'} <strong>{currentUser.assignedClass}</strong></span>
                    </div>
                  )}
                  {currentUser?.group && (
                    <div className="text-[10px] text-indigo-500 font-semibold mt-0.5">
                      Phạm vi: Quản lý học sinh Tổ {currentUser.group}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="py-1 space-y-0.5">
                  {currentUser?.role === 'ADMIN' && onOpenAdminDashboard && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenAdminDashboard();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer font-semibold"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span>Bảng Quản Trị Hệ Thống (Admin)</span>
                    </button>
                  )}

                  {isGVCN && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onNavigateToStudents) onNavigateToStudents();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition-colors cursor-pointer font-semibold"
                    >
                      <Users className="w-4 h-4 text-cyan-500" />
                      <span>Danh Sách Học Sinh & Ban Cán Sự</span>
                    </button>
                  )}

                  {onOpenApprovals && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenApprovals();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-cyan-500" />
                        {isGVCN ? 'Phê duyệt đề xuất' : 'Lịch sử chờ duyệt'}
                      </span>
                      {pendingApprovalsCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                          {pendingApprovalsCount}
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenChangePassword && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenChangePassword();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-slate-400" />
                      <span>Đổi mật khẩu tài khoản</span>
                    </button>
                  )}
                </div>

                {/* Logout action */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất khỏi hệ thống</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Search Modal Dialog */}
      {isMobileSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900 md:hidden animate-fade-in p-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Nhập tên, mã số, SĐT phụ huynh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-cyan-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setIsMobileSearchModalOpen(false);
                setSearchQuery('');
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1 mb-1">
              <span>
                {searchQuery.trim()
                  ? `KẾT QUẢ TÌM THẤY (${searchResults.length})`
                  : `DANH SÁCH HỌC SINH (${allStudents.length})`}
              </span>
              <span>Lớp {settings.className}</span>
            </div>

            {searchQuery.trim() && searchResults.length === 0 && (
              <div className="text-center py-10 px-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Không tìm thấy học sinh nào phù hợp với "{searchQuery}"
                </p>
                <p className="text-xs text-slate-400">
                  Vui lòng thử lại với tên khác hoặc số điện thoại.
                </p>
              </div>
            )}

            {(searchQuery.trim() ? searchResults : allStudents).map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-left transition-colors cursor-pointer border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                      <span>{s.fullName}</span>
                      {s.roleInClass && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-semibold shrink-0">
                          {s.roleInClass}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {s.code} • Tổ {s.group} • {s.gender}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-end gap-1">
                    <Phone className="w-3 h-3" />
                    {s.parentPhone}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[100px]">
                    {s.address ? s.address.split(',')[0] : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

