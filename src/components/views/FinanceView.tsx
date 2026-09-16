import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  DollarSign,
  Search,
  Filter,
} from 'lucide-react';
import { FinancialTransaction, Student, ClassSettings } from '../../types';

interface FinanceViewProps {
  students: Student[];
  transactions: FinancialTransaction[];
  settings: ClassSettings;
  onAddTransaction: (tx: FinancialTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  students,
  transactions,
  settings,
  onAddTransaction,
  onDeleteTransaction,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'contributions'>('transactions');
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');

  // Form states
  const [date, setDate] = useState('2026-09-14');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState(500000);
  const [category, setCategory] = useState('Quỹ phụ huynh đầu năm');
  const [description, setDescription] = useState('');
  const [recordedBy, setRecordedBy] = useState('Thủ quỹ lớp');

  // Track who paid standard class fund (300,000 VND / student)
  const [paidStudentIds, setPaidStudentIds] = useState<Set<string>>(() => {
    // 28 students paid by default
    return new Set(students.slice(0, 28).map((s) => s.id));
  });

  const toggleStudentPaid = (id: string) => {
    setPaidStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) {
      onShowToast('Vui lòng nhập đầy đủ thông tin và số tiền hợp lệ', 'error');
      return;
    }
    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      date,
      type,
      amount: Number(amount),
      category,
      description,
      recordedBy,
    };
    onAddTransaction(newTx);
    onShowToast(`Đã ghi nhận khoản ${type === 'income' ? 'THU' : 'CHI'} thành công!`, 'success');
    setShowAddModal(false);
    setDescription('');
  };

  // Calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="finance-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Thu Chi Quỹ Lớp & Ban Đại Diện Cha Mẹ Học Sinh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý công khai, minh bạch từng khoản thu chi và tình hình đóng quỹ của học sinh
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'transactions'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Sổ Thu Chi
            </button>
            <button
              onClick={() => setActiveTab('contributions')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'contributions'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Danh Sách Đóng Quỹ
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm khoản thu/chi
          </button>
        </div>
      </div>

      {/* KPI Cards: Tồn quỹ, Tổng thu, Tổng chi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Balance */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-cyan-600 to-teal-700 text-white shadow-md shadow-cyan-900/10 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-cyan-100 uppercase tracking-wider">
              TỒN QUỸ HIỆN TẠI
            </div>
            <div className="text-2xl sm:text-3xl font-black font-display mt-1">
              {balance.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-cyan-100 mt-1">Sẵn sàng phục vụ hoạt động lớp</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Total Income */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownRight className="w-4 h-4" />
              TỔNG THU
            </div>
            <div className="text-2xl font-black font-display text-emerald-600 mt-1">
              +{totalIncome.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {transactions.filter((t) => t.type === 'income').length} khoản đã ghi nhận
            </div>
          </div>
        </div>

        {/* Total Expense */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              TỔNG CHI
            </div>
            <div className="text-2xl font-black font-display text-rose-500 mt-1">
              -{totalExpense.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {transactions.filter((t) => t.type === 'expense').length} khoản đã thanh toán
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'transactions' ? (
        /* Transactions list */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm khoản thu chi, danh mục..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Ngày ghi nhận</th>
                  <th className="py-3 px-4">Loại</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Nội dung chi tiết</th>
                  <th className="py-3 px-4">Người lập phiếu</th>
                  <th className="py-3 px-4 text-right">Số tiền</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-cyan-50/20 dark:hover:bg-cyan-950/10 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-500 font-mono">{tx.date}</td>
                    <td className="py-3 px-4">
                      {tx.type === 'income' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px]">
                          Thu
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px]">
                          Chi
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-200">
                      {tx.category}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {tx.description}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{tx.recordedBy}</td>
                    <td
                      className={`py-3 px-4 text-right font-black font-display text-sm ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {tx.amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Contributions status list */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tiến Độ Thu Quỹ Lớp Học Kỳ 1 (Định mức: 300.000 đ/học sinh)
              </h3>
              <p className="text-xs text-slate-500">
                Đã thu: <strong>{paidStudentIds.size}/{students.length}</strong> học sinh (
                {Math.round((paidStudentIds.size / students.length) * 100)}%)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {students.map((st) => {
              const isPaid = paidStudentIds.has(st.id);
              return (
                <div
                  key={st.id}
                  onClick={() => toggleStudentPaid(st.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isPaid
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {st.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400">Tổ {st.group}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Đã nộp
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Chưa nộp
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Thêm khoản thu chi */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Ghi Phiếu Thu / Chi Quỹ Lớp
            </h3>
            <form onSubmit={handleCreateTx} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Loại giao dịch
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                  >
                    <option value="income">Khoản THU (+)</option>
                    <option value="expense">Khoản CHI (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày ghi nhận
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Số tiền (VNĐ)
                </label>
                <input
                  type="number"
                  required
                  step="10000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-sm text-cyan-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Danh mục
                </label>
                <input
                  type="text"
                  placeholder="Quỹ phụ huynh, Photocopy tài liệu, Mua nước uống, Thăm hỏi..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung chi tiết
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi rõ mục đích chi tiêu hoặc nguồn thu..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Người thực hiện / Ban đại diện
                </label>
                <input
                  type="text"
                  value={recordedBy}
                  onChange={(e) => setRecordedBy(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer"
                >
                  Lưu giao dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
