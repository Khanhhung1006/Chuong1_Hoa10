import React, { useState } from 'react';
import { RolePermissionConfig } from '../../types';
import { storageService } from '../../services/storageService';
import { Shield, Check, X, Plus, Save, Lock, AlertCircle } from 'lucide-react';

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
}

export const RolePermissionsModal: React.FC<RolePermissionsModalProps> = ({ isOpen, onClose, showToast }) => {
  const [roleConfigs, setRoleConfigs] = useState<RolePermissionConfig[]>(() => storageService.getRolePermissions());
  const [activeRole, setActiveRole] = useState<string>(roleConfigs[0]?.role || 'GVCN');
  
  // State for adding new role
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleTitle, setNewRoleTitle] = useState('');

  if (!isOpen) return null;

  const currentConfig = roleConfigs.find((r) => r.role === activeRole) || roleConfigs[0];

  const handlePermissionChange = (moduleKey: keyof RolePermissionConfig['permissions'], subKey?: string, value?: boolean) => {
    const updated = roleConfigs.map((cfg) => {
      if (cfg.role === activeRole) {
        const perms = { ...cfg.permissions };
        if (subKey && typeof perms[moduleKey] === 'object' && perms[moduleKey] !== null) {
          (perms[moduleKey] as any)[subKey] = value;
        } else {
          (perms as any)[moduleKey] = value;
        }
        return { ...cfg, permissions: perms };
      }
      return cfg;
    });
    setRoleConfigs(updated);
  };

  const handleSave = () => {
    storageService.saveRolePermissions(roleConfigs);
    storageService.addAuditLog({
      username: 'GVCN',
      displayName: 'Giáo viên Chủ nhiệm',
      role: 'GVCN',
      roleTitle: 'Giáo viên Chủ nhiệm',
      action: 'CONFIG',
      module: 'Hệ thống RBAC',
      details: `Cập nhật cấu hình phân quyền vai trò cho [${activeRole}]`,
    });
    showToast('Đã lưu cấu hình phân quyền RBAC thành công!', 'success');
    onClose();
  };

  const handleAddNewRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleCode.trim() || !newRoleTitle.trim()) {
      showToast('Vui lòng nhập đầy đủ mã và tên vai trò mới.', 'error');
      return;
    }
    const code = newRoleCode.trim().toUpperCase();
    if (roleConfigs.some((r) => r.role === code)) {
      showToast('Mã vai trò đã tồn tại trên hệ thống.', 'error');
      return;
    }

    const newConfig: RolePermissionConfig = {
      role: code,
      roleTitle: newRoleTitle.trim(),
      isCustom: true,
      permissions: {
        dashboard: true,
        students: { view: true, add: false, edit: false, delete: false },
        attendance: { view: true, editAll: false, editGroup: false },
        violations: { view: true, add: false, editAll: false, editGroup: false, approve: false },
        academics: { view: true, edit: false },
        conduct: { view: true, edit: false },
        finance: { view: false, add: false, edit: false },
        documents: { view: true, add: false },
        diary: { view: false, add: false },
        calendar: { view: true, add: false },
        settings: false,
        auditLogs: false,
      },
    };

    const updated = [...roleConfigs, newConfig];
    setRoleConfigs(updated);
    storageService.saveRolePermissions(updated);
    storageService.addAuditLog({
      username: 'GVCN',
      displayName: 'Giáo viên Chủ nhiệm',
      role: 'GVCN',
      roleTitle: 'Giáo viên Chủ nhiệm',
      action: 'CREATE',
      module: 'Hệ thống RBAC',
      details: `Thêm vai trò mới: ${newRoleTitle} (${code})`,
    });
    showToast(`Đã thêm vai trò ${newRoleTitle} thành công!`, 'success');
    setActiveRole(code);
    setNewRoleCode('');
    setNewRoleTitle('');
    setShowAddRoleModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cấu Hình Phân Quyền RBAC & Vai Trò</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tùy chỉnh quyền hạn chi tiết cho từng vai trò và thêm vai trò mới động.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Roles Sidebar */}
          <div className="w-full md:w-72 border-r border-slate-200 dark:border-slate-800 p-4 bg-slate-50/30 dark:bg-slate-900/50 overflow-y-auto space-y-2">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Danh sách vai trò</span>
              <button
                onClick={() => setShowAddRoleModal(true)}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm vai trò
              </button>
            </div>
            {roleConfigs.map((cfg) => (
              <button
                key={cfg.role}
                onClick={() => setActiveRole(cfg.role)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                  activeRole === cfg.role
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20 font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <div>
                  <div className="text-sm font-medium">{cfg.roleTitle}</div>
                  <div className={`text-xs opacity-80 ${activeRole === cfg.role ? 'text-cyan-100' : 'text-slate-400'}`}>
                    Mã: {cfg.role} {cfg.isCustom && '(Tùy chỉnh)'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Permissions Editor */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {currentConfig && (
              <div>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Đang cấu hình: <span className="text-cyan-600 dark:text-cyan-400">{currentConfig.roleTitle}</span> ({currentConfig.role})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Tích chọn các quyền truy cập và thao tác cho phân hệ tương ứng.</p>
                  </div>
                  {currentConfig.role === 'GVCN' && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-3 py-1.5 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                      <Lock className="w-3.5 h-3.5" /> Giáo viên chủ nhiệm luôn có toàn quyền.
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Dashboard */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Tổng quan Dashboard</div>
                      <div className="text-xs text-slate-500">Xem biểu đồ, thống kê sĩ số và hoạt động lớp học.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!currentConfig.permissions.dashboard}
                        onChange={(e) => handlePermissionChange('dashboard', undefined, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>

                  {/* Students */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Quản lý Hồ sơ Học sinh</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentConfig.permissions.students?.view}
                          onChange={(e) => handlePermissionChange('students', 'view', e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                        Xem danh sách
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentConfig.permissions.students?.add}
                          onChange={(e) => handlePermissionChange('students', 'add', e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                        Thêm mới HS
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentConfig.permissions.students?.edit}
                          onChange={(e) => handlePermissionChange('students', 'edit', e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                        Sửa hồ sơ
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentConfig.permissions.students?.delete}
                          onChange={(e) => handlePermissionChange('students', 'delete', e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                        Xóa hồ sơ
                      </label>
                    </div>
                  </div>

                  {/* Attendance */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Điểm danh & Chuyên cần</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentConfig.permissions.attendance?.view}
                          onChange={(e) => handlePermissionChange('attendance', 'view', e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                        Xem điểm danh
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentConfig.permissions.attendance?.editGroup}
                          onChange={(e) => handlePermissionChange('attendance', 'editGroup', e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                        Nhập điểm danh theo Tổ
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentConfig.permissions.attendance?.editAll}
                          onChange={(e) => handlePermissionChange('attendance', 'editAll', e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                        Điểm danh toàn lớp
                      </label>
                    </div>
                  </div>

                  {/* Violations & Rewards */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Vi phạm & Khen thưởng</div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentConfig.permissions.violations?.view}
                          onChange={(e) => handlePermissionChange('violations', 'view', e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                        Xem
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentConfig.permissions.violations?.add}
                          onChange={(e) => handlePermissionChange('violations', 'add', e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                        Báo cáo / Thêm
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentConfig.permissions.violations?.editGroup}
                          onChange={(e) => handlePermissionChange('violations', 'editGroup', e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                        Sửa trong tổ
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentConfig.permissions.violations?.editAll}
                          onChange={(e) => handlePermissionChange('violations', 'editAll', e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                        Sửa toàn lớp
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentConfig.permissions.violations?.approve}
                          onChange={(e) => handlePermissionChange('violations', 'approve', e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                        Duyệt cuối cùng
                      </label>
                    </div>
                  </div>

                  {/* Academics & Conduct & Finance */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Học tập & Điểm số</div>
                      <div className="flex items-center gap-4 pt-1">
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentConfig.permissions.academics?.view}
                            onChange={(e) => handlePermissionChange('academics', 'view', e.target.checked)}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                          />
                          Xem
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentConfig.permissions.academics?.edit}
                            onChange={(e) => handlePermissionChange('academics', 'edit', e.target.checked)}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                          />
                          Nhập/Sửa điểm
                        </label>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Hạnh kiểm & Đánh giá</div>
                      <div className="flex items-center gap-4 pt-1">
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentConfig.permissions.conduct?.view}
                            onChange={(e) => handlePermissionChange('conduct', 'view', e.target.checked)}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                          />
                          Xem
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentConfig.permissions.conduct?.edit}
                            onChange={(e) => handlePermissionChange('conduct', 'edit', e.target.checked)}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                          />
                          Đánh giá
                        </label>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Quỹ lớp & Tài chính</div>
                      <div className="flex items-center gap-3 pt-1">
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentConfig.permissions.finance?.view}
                            onChange={(e) => handlePermissionChange('finance', 'view', e.target.checked)}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                          />
                          Xem
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentConfig.permissions.finance?.add}
                            onChange={(e) => handlePermissionChange('finance', 'add', e.target.checked)}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                          />
                          Thu/Chi
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* System & Audit Logs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Nhật ký hoạt động (Audit Logs)</div>
                        <div className="text-xs text-slate-500">Xem lịch sử thao tác toàn hệ thống.</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!currentConfig.permissions.auditLogs}
                          onChange={(e) => handlePermissionChange('auditLogs', undefined, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Cài đặt hệ thống lớp</div>
                        <div className="text-xs text-slate-500">Truy cập trang cài đặt & phân quyền.</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!currentConfig.permissions.settings}
                          onChange={(e) => handlePermissionChange('settings', undefined, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" /> Lưu cấu hình
          </button>
        </div>
      </div>

      {/* Add Role Sub-Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-600" /> Thêm vai trò mới (Dynamic Role)
            </h3>
            <p className="text-xs text-slate-500">Mở rộng thêm vai trò mới trong tương lai mà không cần thay đổi cấu trúc cơ sở dữ liệu.</p>
            <form onSubmit={handleAddNewRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã vai trò (viết hoa, không dấu)</label>
                <input
                  type="text"
                  placeholder="VD: THUQY, LPHOC"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên hiển thị vai trò</label>
                <input
                  type="text"
                  placeholder="VD: Thủ quỹ lớp"
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value.toLowerCase())}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Tạo vai trò
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
