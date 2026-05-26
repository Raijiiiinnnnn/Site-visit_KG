import React, { useState } from 'react';
import { AuditSession, POPULAR_CENTERS } from '../types';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Building2, 
  FileText, 
  Download, 
  Upload, 
  Clock,
  Sparkles,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface SessionSidebarProps {
  sessions: AuditSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: (center: string, evaluator: string, date: string) => void;
  onDeleteSession: (id: string) => void;
  onImportSessions: (imported: AuditSession[]) => void;
  onCloseMobile?: () => void;
}


export const SessionSidebar: React.FC<SessionSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onImportSessions,
  onCloseMobile
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [centerName, setCenterName] = useState('');
  const [isCustomCenter, setIsCustomCenter] = useState(false);
  const [customCenterInput, setCustomCenterInput] = useState('');
  const [evaluatorName, setEvaluatorName] = useState('');
  const [evalDate, setEvalDate] = useState(() => {
    // Return today formatted for input[type="date"] (YYYY-MM-DD)
    return new Date().toISOString().split('T')[0];
  });
  const [error, setError] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCenter = isCustomCenter ? customCenterInput.trim() : centerName;
    if (!finalCenter) {
      setError('Vui lòng chọn hoặc nhập tên Trung tâm.');
      return;
    }
    if (!evaluatorName.trim()) {
      setError('Vui lòng nhập tên Người chấm.');
      return;
    }
    onCreateSession(finalCenter, evaluatorName.trim(), evalDate);
    setShowCreateModal(false);
    setCenterName('');
    setCustomCenterInput('');
    setIsCustomCenter(false);
    setEvaluatorName('');
    setError('');
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `checklist_van_hanh_trong_dong_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].touchpoints) {
            onImportSessions(parsed);
            alert("Đã nhập dữ liệu lưu trữ thành công!");
          } else {
            alert("File không đúng cấu trúc dữ liệu đánh giá.");
          }
        } catch (err) {
          alert("Lỗi đọc file JSON.");
        }
      };
    }
  };

  const getSessionStats = (session: AuditSession) => {
    let evaluated = 0;
    let total = 0;
    let sum = 0;
    let lowCount = 0;

    session.touchpoints.forEach((tp) => {
      tp.criteria.forEach((c) => {
        total++;
        if (c.score > 0) {
          evaluated++;
          sum += c.score;
          if (c.score <= 3) {
            lowCount++;
          }
        }
      });
    });

    const average = evaluated > 0 ? (sum / evaluated).toFixed(1) : '0.0';
    return { evaluated, total, average, lowCount };
  };

  return (
    <div className="w-full lg:w-80 bg-brand-dark-light border-r border-brand-border flex flex-col h-full shrink-0 shadow-sm text-gray-200" id="session-sidebar-root">
      {/* Brand Header */}
      <div className="p-5 border-b border-brand-border bg-[#0d0c0b] text-white animate-fade-in flex items-center justify-between" id="sidebar-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-gold flex items-center justify-center font-display font-black text-black text-base tracking-wider shadow">
            TĐ
          </div>
          <div>
            <h1 className="font-serif italic font-normal text-sm tracking-wide uppercase text-brand-gold">
              Trống Đồng Palace
            </h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest">OPERATIONAL AUDIT</p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden px-2 py-1 text-gray-400 hover:text-white bg-brand-dark hover:bg-brand-dark-black border border-brand-border rounded-lg cursor-pointer active:scale-95 transition text-[10px] font-sans font-bold flex items-center justify-center gap-1"
            title="Đóng"
            type="button"
          >
            ✕ Đóng
          </button>
        )}
      </div>

      {/* Action panel */}
      <div className="p-4 border-b border-brand-border flex items-center justify-between gap-2" id="sidebar-actions">
        <button
          id="btn-new-audit"
          onClick={() => setShowCreateModal(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-black py-2 px-3 rounded-lg font-sans text-xs font-bold transition shadow-sm cursor-pointer uppercase tracking-wider"
        >
          <Plus className="w-4 h-4 text-black stroke-[3]" />
          Kiểm tra mới
        </button>

        <div className="flex gap-1 animate-fade-in">
          <button
            id="btn-export-backup"
            onClick={handleExport}
            title="Xuất sao lưu toàn bộ dữ liệu"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 bg-brand-dark hover:bg-brand-dark-lighter border border-brand-border cursor-pointer transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <label
            title="Nhập dữ liệu sao lưu"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 bg-brand-dark hover:bg-brand-dark-lighter border border-brand-border cursor-pointer transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <input type="file" onChange={handleImportClick} accept=".json" className="hidden" />
          </label>
        </div>
      </div>

      {/* Stored Sessions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" id="sidebar-session-list">
        <h3 className="font-display font-semibold text-[11px] uppercase tracking-widest text-[#6b7280] flex items-center justify-between">
          <span>Lịch sử đánh giá ({sessions.length})</span>
          <span className="font-mono text-[9px] text-[#8d6e2e]">LOCAL DISK</span>
        </h3>

        {sessions.length === 0 ? (
          <div className="text-center py-8 px-2 border border-dashed border-brand-border rounded-xl bg-brand-dark" id="no-session-placeholder">
            <HelpCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-sans">Chưa có bản ghi kiểm tra nào.</p>
            <p className="text-[10px] text-gray-500 font-sans mt-1">Ấn &apos;Kiểm tra mới&apos; để bắt đầu site visit.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const { evaluated, total, average, lowCount } = getSessionStats(session);
              const isActive = session.id === activeSessionId;
              
              return (
                <div
                  id={`session-card-${session.id}`}
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left relative ${
                    isActive 
                      ? 'border-brand-gold bg-brand-dark-lighter shadow-md ring-1 ring-brand-gold/15' 
                      : 'border-brand-border bg-brand-dark hover:bg-brand-dark-lighter/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className={`font-sans font-semibold text-xs line-clamp-1 flex-1 ${isActive ? 'text-brand-gold' : 'text-gray-200'}`}>
                      {session.centerName}
                    </span>
                    <button
                      id={`btn-delete-session-${session.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirmId(session.id);
                        setDeletePassword('');
                        setDeleteError('');
                      }}
                      className="text-gray-550 hover:text-red-450 p-0.5 rounded transition opacity-70 hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-y-1.5 text-[10px] text-gray-400 mb-2 font-sans mt-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-500 shrink-0" />
                      <span className="truncate">{session.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-gray-500 shrink-0" />
                      <span className="truncate">{session.evaluatorName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-gray-500 shrink-0" />
                      <span>{evaluated}/{total} Tiêu chí</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {session.status === 'Completed' ? (
                        <span className="inline-flex items-center text-emerald-400 font-medium">
                          <CheckCircle className="w-3 h-3 mr-1" /> Hoàn thành
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-brand-gold font-medium">
                          <Clock className="w-3 h-3 mr-1" /> Đang cập nhật
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary Badges on Card */}
                  <div className="flex items-center justify-between pt-2 border-t border-brand-border/60 font-sans mt-2">
                    <span className="text-[10px] text-gray-500">Điểm trung bình:</span>
                    <div className="flex items-center gap-2">
                      {lowCount > 0 && (
                        <span className="bg-red-950/40 text-red-400 font-semibold px-1.5 py-0.5 rounded-md text-[9px] border border-red-900/30">
                          {lowCount} Lỗi
                        </span>
                      )}
                      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-lg border ${
                        parseFloat(average) >= 4.0 ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30' :
                        parseFloat(average) >= 3.0 ? 'bg-amber-950/30 text-brand-gold border-amber-900/30' :
                        parseFloat(average) > 0.0 ? 'bg-red-950/30 text-red-400 border-red-900/30' : 'bg-brand-dark text-gray-500 border-brand-border'
                      }`}>
                        {average}★
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Creating Session */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" id="modal-create-session">
          <div className="bg-[#141414] border border-brand-border rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-gray-200">
            <h3 className="font-serif italic text-lg text-brand-gold mb-2 border-b border-brand-border pb-3">
              Bắt đầu đợt đánh giá Site Visit mới
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4 font-sans text-xs">
              {error && (
                <div className="p-3 bg-red-950/40 border border-red-900 text-red-400 rounded-lg text-xs" id="create-session-error">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-gray-400 font-medium mb-1.5 uppercase tracking-wider text-[10px]">
                  Người chấm (Chuyên viên):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên người chấm..."
                  value={evaluatorName}
                  onChange={(e) => setEvaluatorName(e.target.value)}
                  className="w-full border border-brand-border bg-[#0a0a0a] p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-200 placeholder-gray-600 mb-3"
                />

                <label className="block text-gray-400 font-medium mb-[5px] uppercase tracking-wider text-[10px]">
                  Ngày chấm:
                </label>
                <input
                  type="date"
                  required
                  value={evalDate}
                  onChange={(e) => setEvalDate(e.target.value)}
                  className="w-full border border-brand-border bg-[#0a0a0a] p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-200 placeholder-gray-650 cursor-pointer mb-3"
                />

                <label className="block text-gray-400 font-medium mb-1.5 uppercase tracking-wider text-[10px]">
                  Trung tâm Trống Đồng Palace:
                </label>
                <select
                  value={isCustomCenter ? "custom" : centerName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setIsCustomCenter(true);
                    } else {
                      setIsCustomCenter(false);
                      setCenterName(val);
                    }
                  }}
                  className="w-full border border-brand-border bg-[#0a0a0a] p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-200 mb-2 cursor-pointer font-sans"
                >
                  <option value="" disabled>-- Click chọn Trung tâm chấm --</option>
                  {POPULAR_CENTERS.map((center) => (
                    <option key={center} value={`Trống Đồng Palace ${center}`}>
                      Trống Đồng Palace {center}
                    </option>
                  ))}
                  <option value="custom" className="text-brand-gold font-bold">-- Nhập tên cơ sở khác --</option>
                </select>

                {isCustomCenter && (
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên trung tâm khác..."
                    value={customCenterInput}
                    onChange={(e) => setCustomCenterInput(e.target.value)}
                    className="w-full border border-brand-gold bg-[#0a0a0a] p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-200 placeholder-gray-600 animate-fade-in mt-1"
                  />
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  id="btn-cancel-create"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                  }}
                  className="flex-1 bg-brand-dark hover:bg-brand-dark-lighter border border-brand-border text-gray-400 font-semibold py-2.5 rounded-lg transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  id="btn-confirm-create"
                  className="flex-1 bg-brand-gold hover:bg-brand-gold-dark text-black font-bold py-2.5 rounded-lg transition shadow-sm"
                >
                  Xác nhận khởi tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification password to delete */}
      {showDeleteConfirmId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" id="modal-delete-session-pw">
          <div className="bg-[#141414] border border-brand-border rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-gray-200">
            <h3 className="font-serif italic text-base text-red-400 mb-2 border-b border-brand-border pb-3 flex items-center gap-1.5">
              ⚠️ Xác thực quyền xóa bản ghi
            </h3>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
              Bạn đang yêu cầu xóa vĩnh viễn dữ liệu đánh giá của trung tâm này. Vui lòng nhập mật mã quản trị viên Khối Điều hành để tiếp tục.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (deletePassword === 'trongdong123') {
                onDeleteSession(showDeleteConfirmId);
                setShowDeleteConfirmId(null);
                setDeletePassword('');
                setDeleteError('');
              } else {
                setDeleteError('Mật khẩu không chính xác!');
              }
            }} className="space-y-4 font-sans text-xs">
              {deleteError && (
                <div className="p-2.5 bg-red-950/40 border border-red-900 text-red-400 rounded-lg text-xs" id="delete-session-error">
                  {deleteError}
                </div>
              )}

              <div>
                <label className="block text-gray-400 font-medium mb-1.5 uppercase tracking-wider text-[9px]">
                  Mật mã xác thực xóa:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mã xác thực..."
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full border border-brand-border bg-[#0a0a0a] p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-200 placeholder-gray-600 font-mono text-center tracking-widest"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirmId(null);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="flex-1 bg-brand-dark hover:bg-brand-dark-lighter border border-brand-border text-gray-400 font-semibold py-2 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-650 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition shadow-sm"
                >
                  Xác nhận xóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
