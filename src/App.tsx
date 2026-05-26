import { useState, useEffect } from 'react';
import { AuditSession, INITIAL_TOUCHPOINTS, Touchpoint, Criterion, POPULAR_CENTERS, GOOGLE_SHEETS_SCRIPT_URL } from './types';
import { SessionSidebar } from './components/SessionSidebar';
import { Dashboard } from './components/Dashboard';
import { AuditForm } from './components/AuditForm';
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  LayoutDashboard, 
  FileCheck,
  Award,
  Settings,
  X
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'trong_dong_audit_sessions';

export default function App() {
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<number>(0); // 0 = Dashboard, 1-5 = Touchpoints, 6 = AI Report
  const [currentTime, setCurrentTime] = useState<string>('');
  const [hasAutoSynced, setHasAutoSynced] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Settings guidelines states
  const [showSetupHelp, setShowSetupHelp] = useState(false);
  const [isSettingsAuthenticated, setIsSettingsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Automatic startup background sync with Google Sheets (if URL configured)
  useEffect(() => {
    if (sessions.length === 0 || hasAutoSynced) return;
    
    const url = GOOGLE_SHEETS_SCRIPT_URL;
    if (!url || !url.startsWith('http') || url.includes('your_script_id_here')) return;

    // Run sync for each session loaded from localStorage
    sessions.forEach(async (sess) => {
      let totalCriteria = 0;
      let evaluatedCount = 0;
      let sumAllScores = 0;
      let criticalCount = 0;

      sess.touchpoints.forEach((tp) => {
        tp.criteria.forEach((c) => {
          totalCriteria++;
          if (c.score > 0) {
            evaluatedCount++;
            sumAllScores += c.score;
            if (c.score <= 3) {
              criticalCount++;
            }
          }
        });
      });

      const overallAverage = evaluatedCount > 0 ? parseFloat((sumAllScores / evaluatedCount).toFixed(1)) : 0;

      const payload = {
        id: sess.id,
        centerName: sess.centerName,
        evaluatorName: sess.evaluatorName,
        date: sess.date,
        status: sess.status,
        averageScore: overallAverage,
        errorCount: criticalCount,
        summaryNote: sess.summaryNote || 'Chưa ghi chú',
        aiReportSummary: 'Đã tắt tính năng phân tích AI'
      };

      try {
        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          }
        });
        console.log(`[Auto-Sync] Tự động gửi đợt kiểm tra ${sess.centerName} (${sess.id}) thành công.`);
      } catch (err) {
        console.error("[Auto-Sync] Lỗi tự động đồng bộ khi mở ứng dụng:", err);
      }
    });

    setHasAutoSynced(true);
  }, [sessions, hasAutoSynced]);


  // States for landing setup form
  const [landingCenter, setLandingCenter] = useState<string>('');
  const [landingCustomCenter, setLandingCustomCenter] = useState<string>('');
  const [landingEvaluator, setLandingEvaluator] = useState<string>('');
  const [landingDate, setLandingDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // 1. Local Vietnamese Clock sync
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setSelectedTimeFormat(now);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const setSelectedTimeFormat = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    setCurrentTime(`${hours}:${mins}:${secs} - ${day}/${month}/${year}`);
  };

  // 2. Load historic evaluations from localStorage on startup
  useEffect(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as AuditSession[];
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (err) {
        console.error("Lỗi khôi phục localStorage:", err);
      }
    } else {
      // Setup a default demo evaluation at launch to delight operations division
      const defaultSessionId = `session-${Date.now()}`;
      const defaultSession: AuditSession = {
        id: defaultSessionId,
        centerName: "Trống Đồng Palace Cảnh Hồ",
        evaluatorName: "Site Visit Khối Điều Hành",
        date: new Date().toLocaleDateString('vi-VN'),
        status: 'In_Progress',
        touchpoints: JSON.parse(JSON.stringify(INITIAL_TOUCHPOINTS)) as Touchpoint[], // deep clone template
        summaryNote: "Khảo sát thực tế sảnh đón và bãi đỗ xe chuẩn bị đón tiệc cưới buổi chiều.",
        aiReport: ""
      };
      setSessions([defaultSession]);
      setActiveSessionId(defaultSessionId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([defaultSession]));
    }
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  // 3. Persist session list back to caching
  const saveAllSessions = (updated: AuditSession[]) => {
    setSessions(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  // Handler to modify checklist scores, remarks, photo links
  const handleUpdateCriterion = (touchpointId: string, criterionId: string, updatedFields: Partial<Criterion>) => {
    if (!activeSession) return;

    const updatedTouchpoints = activeSession.touchpoints.map((tp) => {
      if (tp.id !== touchpointId) return tp;
      return {
        ...tp,
        criteria: tp.criteria.map((c) => {
          if (c.id !== criterionId) return c;
          return { ...c, ...updatedFields };
        })
      };
    });

    const isFinished = updatedTouchpoints.every(tp => tp.criteria.every(c => c.score > 0));

    const updatedSession: AuditSession = {
      ...activeSession,
      touchpoints: updatedTouchpoints,
      status: isFinished ? 'Completed' : 'In_Progress',
      // If score is updated, reset historic AI report so they regenerate updated parameters
      aiReport: updatedFields.score !== undefined ? "" : activeSession.aiReport
    };

    const newSessionsList = sessions.map(s => s.id === activeSession.id ? updatedSession : s);
    saveAllSessions(newSessionsList);
  };

  // Handle core session annotations updates
  const handleUpdateSummaryNote = (note: string) => {
    if (!activeSession) return;
    const updatedSession = { ...activeSession, summaryNote: note };
    const newSessionsList = sessions.map(s => s.id === activeSession.id ? updatedSession : s);
    saveAllSessions(newSessionsList);
  };

  const handleUpdateSessionReport = (report: string) => {
    if (!activeSession) return;
    const updatedSession = { ...activeSession, aiReport: report };
    const newSessionsList = sessions.map(s => s.id === activeSession.id ? updatedSession : s);
    saveAllSessions(newSessionsList);
  };

  // Create standard pristine wedding center checklist evaluation
  const handleCreateSession = (center: string, evaluator: string, customDate?: string) => {
    const newSessionId = `session-${Date.now()}`;

    let formattedDate = new Date().toLocaleDateString('vi-VN');
    if (customDate) {
      if (customDate.includes('-')) {
        const parts = customDate.split('-');
        if (parts.length === 3) {
          formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`; // YYYY-MM-DD -> DD/MM/YYYY
        } else {
          formattedDate = customDate;
        }
      } else {
        formattedDate = customDate;
      }
    }
    
    const newSession: AuditSession = {
      id: newSessionId,
      centerName: center,
      evaluatorName: evaluator,
      date: formattedDate,
      status: 'In_Progress',
      touchpoints: JSON.parse(JSON.stringify(INITIAL_TOUCHPOINTS)) as Touchpoint[],
      summaryNote: "",
      aiReport: ""
    };

    const updated = [newSession, ...sessions];
    setActiveSessionId(newSessionId);
    setSelectedTab(0); // focus on Dashboard analytic overview
    saveAllSessions(updated);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    saveAllSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleImportSessions = (imported: AuditSession[]) => {
    saveAllSessions(imported);
    if (imported.length > 0) {
      setActiveSessionId(imported[0].id);
      setSelectedTab(0);
    }
  };

  // Tab navigational helpers
  const handlePrevTab = () => {
    setSelectedTab(prev => Math.max(1, prev - 1));
  };

  const handleNextTab = () => {
    setSelectedTab(prev => Math.min(5, prev + 1));
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-brand-dark overflow-hidden font-sans text-gray-200" id="applet-master">
      {/* Session manager History Sidebar panel */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] transform 
        lg:relative lg:translate-x-0 lg:max-w-none transition-transform duration-350 ease-in-out h-full shrink-0
        ${mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `} id="session-sidebar-wrapper">
        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            setSelectedTab(0); // Reset focusing to Dashboard on swap
            setMobileSidebarOpen(false); // Auto close sidebar drawer on mobile!
          }}
          onCreateSession={handleCreateSession}
          onDeleteSession={handleDeleteSession}
          onImportSessions={handleImportSessions}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Mobile Drawer Backdrop overlay with active smooth click to close */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-30 lg:hidden cursor-pointer animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
          id="sidebar-mobile-backdrop"
        />
      )}

      {/* Primary Evaluation Canvas Area */}
      {activeSession ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-brand-dark" id="workspace-canvas">
          {/* Top Luxurious Custom Header */}
          <header className="bg-brand-dark-light border-b border-brand-border px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 no-print" id="workspace-header">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Mobile Sidebar Hamburger Toggle Button */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden flex items-center justify-center p-2.5 -ml-1 text-gray-400 hover:text-white bg-brand-dark hover:bg-brand-dark-lighter border border-brand-border rounded-xl cursor-pointer active:scale-95 transition"
                id="btn-mobile-sidebar-toggle"
                title="Mở Lịch sử Đánh giá"
                type="button"
              >
                <Building2 className="w-5 h-5 text-brand-gold" />
              </button>

              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse shrink-0" />
                  <span className="text-[9px] sm:text-[10px] tracking-widest font-mono font-bold text-gray-400 uppercase truncate">
                    SITE AUDIT ACTIVE SESSION
                  </span>
                </div>
                <h1 className="font-serif italic font-normal text-brand-gold text-sm sm:text-base md:text-lg tracking-wide uppercase truncate">
                  {activeSession.centerName}
                  <span className="hidden xs:inline text-gray-400 text-[11px] sm:text-xs font-normal font-sans not-italic capitalize ml-1.5">
                    ({activeSession.evaluatorName})
                  </span>
                </h1>
              </div>
            </div>

            {/* Local Synchronized clock & Settings Icon button */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-center">
              <div className="flex items-center gap-2 text-gray-400 bg-[#161616] border border-brand-border rounded-full px-3.5 py-1 text-[10px] font-mono shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-brand-gold" />
                <span>{currentTime || "00:00:00 - 26/05/2026"}</span>
              </div>
              <button
                onClick={() => setShowSetupHelp(true)}
                className="w-7 h-7 flex items-center justify-center bg-[#161616] hover:bg-brand-dark-lighter text-brand-gold border border-brand-border hover:border-brand-gold/50 rounded-full cursor-pointer active:scale-95 transition"
                title="Thiết lập hệ thống"
                type="button"
                id="btn-settings-header"
              >
                <Settings className="w-3.5 h-3.5 transition-transform duration-300 hover:rotate-45" />
              </button>
            </div>
          </header>

          {/* Touchpoint Tab Switcher Navigation bar */}
          <nav className="bg-brand-dark-light border-b border-brand-border flex items-center overflow-x-auto px-6 py-2 shrink-0 no-print gap-1 select-none scrollbar-none" id="touchpoint-tab-switcher">
            <button
              id="tab-dashboard"
              onClick={() => setSelectedTab(0)}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-sans font-semibold border transition shrink-0 cursor-pointer ${
                selectedTab === 0
                  ? 'bg-brand-gold border-brand-gold text-black shadow-xs'
                  : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Tổng Quan
            </button>

            {/* Checklist items dynamic tabs */}
            {activeSession.touchpoints.map((tp, idx) => {
              const tabIndex = idx + 1;
              const isSelected = selectedTab === tabIndex;
              const evaluatedNum = tp.criteria.filter(c => c.score > 0).length;
              const totalsNum = tp.criteria.length;
              const hasWarnings = tp.criteria.some(c => c.score > 0 && c.score <= 3);

              return (
                <button
                  id={`tab-touchpoint-${tabIndex}`}
                  key={tp.id}
                  onClick={() => setSelectedTab(tabIndex)}
                  className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-[11px] font-sans font-semibold border transition shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-brand-gold/15 border-brand-gold/30 text-brand-gold'
                      : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    evaluatedNum === totalsNum 
                      ? 'bg-emerald-500' 
                      : hasWarnings 
                        ? 'bg-brand-gold animate-pulse'
                        : 'bg-zinc-650'
                  }`} />
                  {tp.name.split('. ')[1]}
                  <span className="text-[9px] font-mono font-medium text-gray-500">({evaluatedNum}/{totalsNum})</span>
                </button>
              );
            })}

          </nav>

          {/* Dynamic Render Tabs Screen Container */}
          <main className="flex-1 overflow-y-auto p-6 bg-brand-dark" id="workspace-core-feed">
            {selectedTab === 0 && (
              <Dashboard
                session={activeSession}
                onNavigateToTab={(num) => setSelectedTab(num)}
              />
            )}

            {selectedTab >= 1 && selectedTab <= 5 && (
              <AuditForm
                session={activeSession}
                selectedTab={selectedTab}
                onUpdateCriterion={handleUpdateCriterion}
                onPrevTab={handlePrevTab}
                onNextTab={handleNextTab}
                onUpdateSummaryNote={handleUpdateSummaryNote}
                onShowSetupHelp={() => setShowSetupHelp(true)}
              />
            )}
          </main>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-brand-dark p-4 md:p-12 overflow-y-auto relative" id="workspace-error-fallback">
          <button
            onClick={() => setShowSetupHelp(true)}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-brand-dark-light hover:bg-[#1a1a19] text-brand-gold border border-brand-border hover:border-brand-gold/50 rounded-xl cursor-pointer active:scale-95 transition shadow-md"
            title="Thiết lập hệ thống"
            type="button"
            id="btn-settings-landing"
          >
            <Settings className="w-4 h-4 transition-transform duration-300 hover:rotate-45 text-brand-gold" />
          </button>
          <div className="w-full max-w-md bg-brand-dark-light border border-brand-border p-6 md:p-8 rounded-2xl shadow-2xl text-left space-y-6 animate-fade-in" id="landing-setup-card">
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-brand-gold flex items-center justify-center font-display font-black text-black text-lg tracking-wider mx-auto shadow-md">
                TĐ
              </div>
              <h2 className="font-serif italic font-normal text-brand-gold text-xl uppercase tracking-wider">
                Khởi tạo đợt Đánh giá mới
              </h2>
              <p className="text-[11px] text-gray-400 font-sans">
                Khối Điều Hành - Quy trình quản lý chất lượng thực địa SOP
              </p>
            </div>

            {/* Inline Setup Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!landingCenter) {
                alert('Vui lòng chọn hoặc nhập tên Trung tâm.');
                return;
              }
              if (!landingEvaluator.trim()) {
                alert('Vui lòng nhập tên người chấm.');
                return;
              }
              const finalLaunchCenter = landingCenter === 'custom' ? landingCustomCenter.trim() : landingCenter;
              handleCreateSession(
                finalLaunchCenter,
                landingEvaluator.trim(),
                landingDate
              );
              // Clean up inputs on success
              setLandingCenter('');
              setLandingCustomCenter('');
              setLandingEvaluator('');
            }} className="space-y-4 text-xs font-sans">
              
              {/* Evaluator input */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  Tên người chấm (Chuyên viên):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  value={landingEvaluator}
                  onChange={(e) => setLandingEvaluator(e.target.value)}
                  className="w-full border border-brand-border bg-[#0a0a0a] p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-200 placeholder-gray-600 font-sans"
                />
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  Ngày chấm:
                </label>
                <input
                  type="date"
                  required
                  value={landingDate}
                  onChange={(e) => setLandingDate(e.target.value)}
                  className="w-full border border-brand-border bg-[#0a0a0a] p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-200 placeholder-gray-600 cursor-pointer font-sans"
                />
              </div>

              {/* Center Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  Chọn Trung tâm trong Hệ Thống:
                </label>
                <select
                  required
                  value={landingCenter}
                  onChange={(e) => setLandingCenter(e.target.value)}
                  className="w-full border border-brand-border bg-[#0a0a0a] p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-200 cursor-pointer font-sans"
                >
                  <option value="" disabled>-- Chọn trung tâm chấm --</option>
                  {POPULAR_CENTERS.map((center) => (
                    <option key={center} value={`Trống Đồng Palace ${center}`}>
                      Trống Đồng Palace {center}
                    </option>
                  ))}
                  <option value="custom" className="text-brand-gold font-bold">-- Nhập tên cơ sở khác --</option>
                </select>
              </div>

              {landingCenter === 'custom' && (
                <div className="space-y-1.5 animate-scale-in">
                  <label className="block text-gray-400 font-semibold tracking-wider text-[9px]">
                    Tên cơ sở tùy chỉnh:
                  </label>
                  <input
                    type="text"
                    required={landingCenter === 'custom'}
                    placeholder="Nhập tên trung tâm khác..."
                    value={landingCustomCenter}
                    onChange={(e) => setLandingCustomCenter(e.target.value)}
                    className="w-full border border-brand-gold bg-[#0a0a0a] p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-200 placeholder-gray-650 animate-fade-in font-sans"
                  />
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-brand-gold hover:bg-brand-gold-dark text-black py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition duration-150 shadow-md cursor-pointer block mt-2 text-center"
              >
                ✓ Bắt đầu đánh giá thực địa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settings Instructions / Authentication Modal */}
      {showSetupHelp && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" id="modal-global-settings">
          <div className="bg-[#141414] border border-brand-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl duration-200 text-gray-200 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-4 shrink-0">
              <h3 className="font-serif italic text-brand-gold text-base flex items-center gap-2">
                ⚙️ {isSettingsAuthenticated ? 'Hướng dẫn tích hợp Google Sheets & Drive' : 'Xác thực truy cập thiết lập'}
              </h3>
              <button 
                onClick={() => {
                  setShowSetupHelp(false);
                  setIsSettingsAuthenticated(false);
                  setPasscodeInput('');
                  setPasscodeError('');
                }} 
                className="text-gray-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isSettingsAuthenticated ? (
              // Passcode Input UI
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (passcodeInput === '123123') {
                    setIsSettingsAuthenticated(true);
                    setPasscodeError('');
                  } else {
                    setPasscodeError('Mật khẩu không chính xác. Vui lòng thử lại!');
                  }
                }}
                className="py-8 px-4 flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto text-center font-sans text-xs"
              >
                <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/30">
                  <span className="text-xl">🔒</span>
                </div>
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-gray-200 text-sm">Yêu cầu mật khẩu truy cập</h4>
                  <p className="text-[11px] text-gray-400">Vui lòng nhập mật mã thiết lập để tiếp tục cài đặt cấu hình.</p>
                </div>

                <div className="w-full space-y-2">
                  <input
                    type="password"
                    placeholder="Mật khẩu (1*****)"
                    value={passcodeInput}
                    onChange={(e) => {
                      setPasscodeInput(e.target.value);
                      if (passcodeError) setPasscodeError('');
                    }}
                    className={`w-full text-center border p-3 rounded-xl focus:outline-none focus:ring-1 text-sm bg-[#0a0a0a] ${
                      passcodeError 
                        ? 'border-red-500/50 focus:ring-red-500' 
                        : 'border-brand-border focus:border-brand-gold focus:ring-brand-gold'
                    }`}
                    autoFocus
                  />
                  {passcodeError && (
                    <p className="text-[11px] text-red-400 font-sans">{passcodeError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-gold hover:bg-brand-gold-dark text-black py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition duration-150 shadow-md cursor-pointer"
                >
                  Xác nhận
                </button>
              </form>
            ) : (
              // Setup details
              <div className="space-y-4 font-sans text-xs text-gray-300 leading-relaxed overflow-y-auto">
                <p>
                  Để kích hoạt nút <strong className="text-brand-gold">Gửi checklist</strong> và tự động lưu trữ hình ảnh thực địa vào thư mục Google Drive riêng biệt được phân loại theo từng chi nhánh và ngày chấm, bạn hãy thực hiện theo hướng dẫn sau:
                </p>

                <div className="bg-[#0c0a0a] border border-brand-border/40 p-4 rounded-xl space-y-2">
                  <p className="font-bold text-gray-200">BƯỚC 1: Truy cập file mã nguồn hệ thống:</p>
                  <p className="text-gray-400">
                    Mở tệp tin <code className="bg-brand-dark text-brand-gold px-1.5 py-0.5 rounded font-mono">/src/types.ts</code> trong thư mục dự án này. Thay thế giá trị của hằng số <code className="text-emerald-400">GOOGLE_SHEETS_SCRIPT_URL</code> bằng đường dẫn ứng dụng Web Apps Script thực tế của bạn.
                  </p>
                </div>

                <div className="bg-[#0c0a0a] border border-brand-border/40 p-4 rounded-xl space-y-3">
                  <p className="font-bold text-gray-200">BƯỚC 2: Triển khai Google Apps Script:</p>
                  <p className="text-gray-400">
                    Tạo một Google Sheet mới, mở mục <strong>Tiện ích mở rộng &gt; Apps Script</strong>, dán đoạn mã lập trình tự động sau vào để xử lý lưu hàng đợi ảnh vào Google Drive:
                  </p>
                  
                  <pre className="bg-brand-dark p-3 rounded-lg overflow-x-auto text-[10px] font-mono text-gray-400 max-h-48 border border-white/5 whitespace-pre select-all">
{`function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Mã Đợt", "Tên Trung Tâm", "Người Chấm", "Ngày Chấm", 
        "Trạng Thái", "Điểm TB", "Số Lỗi", "Ghi Chú", "Link Google Drive", "Thời Gian"
      ]);
    }
    
    // ID thư mục mẹ được chỉ định từ yêu cầu của bạn:
    var parentFolderId = "1PoATupKlpVJJOTBcMERfZVyfLhaOYAfs";
    var parentFolder = DriveApp.getFolderById(parentFolderId);
    
    // Tạo thư mục con riêng đặt theo Tên trung tâm và ngày chấm
    var folderName = data.centerName + " - " + data.date.toString().split("/").join("-");
    var subFolders = parentFolder.getFoldersByName(folderName);
    var targetFolder = subFolders.hasNext() ? subFolders.next() : parentFolder.createFolder(folderName);
    
    // Giải mã và lưu toàn bộ file ảnh đính kèm từ checklist
    var photoCount = 0;
    if (data.touchpoints) {
      data.touchpoints.forEach(function(tp) {
        tp.criteria.forEach(function(c) {
          if (c.images && c.images.length > 0) {
            c.images.forEach(function(base64Data, idx) {
              try {
                // Tách phần đầu data:image/png;base64, nếu có
                var base64Parts = base64Data.split(",");
                if (base64Parts.length > 1) {
                  var meta = base64Parts[0];
                  var base64Clean = base64Parts[1];
                  
                  var contentTypeMatch = meta.match(/data:([^;]+);base64/);
                  var contentType = contentTypeMatch ? contentTypeMatch[1] : "image/jpeg";
                  var extension = contentType.split("/")[1] || "jpg";
                  
                  var base64Decoded = Utilities.base64Decode(base64Clean);
                  var blob = Utilities.newBlob(base64Decoded, contentType, tp.name.split(".")[0] + "_" + c.category + "_0" + (idx + 1) + "." + extension);
                  targetFolder.createFile(blob);
                  photoCount++;
                }
              } catch(imgErr) {}
            });
          }
        });
      });
    }
    
    sheet.appendRow([
      data.id, data.centerName, data.evaluatorName, data.date, 
      "Đã hoàn thành", data.averageScore + "★", data.errorCount, 
      data.summaryNote, targetFolder.getUrl(), new Date().toLocaleString("vi-VN")
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", folderUrl: targetFolder.getUrl() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                  </pre>
                </div>

                <div className="flex justify-end pt-2 border-t border-brand-border shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSetupHelp(false);
                      setIsSettingsAuthenticated(false);
                      setPasscodeInput('');
                      setPasscodeError('');
                    }}
                    className="bg-brand-gold hover:bg-brand-gold-dark text-black px-4 py-2 rounded-xl font-bold transition cursor-pointer"
                  >
                    Tôi đã hiểu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
