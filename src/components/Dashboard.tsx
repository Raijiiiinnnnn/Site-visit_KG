import React from 'react';
import { AuditSession } from '../types';
import { 
  Building2, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  ArrowRight,
  Info
} from 'lucide-react';

interface DashboardProps {
  session: AuditSession;
  onNavigateToTab: (index: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ session, onNavigateToTab }) => {
  // Compute overall statistics
  const touchpointStats = session.touchpoints.map((tp, idx) => {
    let sum = 0;
    let counted = 0;
    tp.criteria.forEach((c) => {
      if (c.score > 0) {
        sum += c.score;
        counted++;
      }
    });
    const avg = counted > 0 ? sum / counted : 0;
    const progress = (counted / tp.criteria.length) * 100;
    return {
      index: idx,
      name: tp.name.split('. ')[1],
      fullName: tp.name,
      avg: parseFloat(avg.toFixed(1)),
      progress: Math.round(progress),
      counted,
      total: tp.criteria.length,
    };
  });

  let totalCriteria = 0;
  let evaluatedCount = 0;
  let sumAllScores = 0;
  const criticalCriterias: Array<{tpIndex: number; tpName: string; category: string; score: number; desc: string}> = [];

  session.touchpoints.forEach((tp, tpIdx) => {
    tp.criteria.forEach((c) => {
      totalCriteria++;
      if (c.score > 0) {
        evaluatedCount++;
        sumAllScores += c.score;
        if (c.score <= 3) {
          criticalCriterias.push({
            tpIndex: tpIdx,
            tpName: tp.name,
            category: c.category,
            score: c.score,
            desc: c.description
          });
        }
      }
    });
  });

  const overallAverage = evaluatedCount > 0 ? parseFloat((sumAllScores / evaluatedCount).toFixed(1)) : 0;
  const overallProgress = Math.round((evaluatedCount / totalCriteria) * 100);

  // SVG ring stroke sizing math
  const strokeRadius = 40;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = strokeCircumference - (overallProgress / 100) * strokeCircumference;

  // Rating label helper 
  const getRatingLabel = (score: number) => {
    if (score === 0) return { label: 'Chưa kiểm tra', color: 'text-gray-500' };
    if (score >= 4.5) return { label: 'Tuyệt hảo (5★)', color: 'text-brand-gold font-semibold' };
    if (score >= 4.0) return { label: 'Đạt yêu cầu (4★)', color: 'text-emerald-400 font-semibold' };
    if (score >= 3.0) return { label: 'Cần cải thiện (3★)', color: 'text-amber-400 font-semibold' };
    return { label: 'Dưới chuẩn (1-2★)', color: 'text-rose-400 font-semibold animate-pulse' };
  };

  return (
    <div className="space-y-6 text-gray-200" id="dashboard-tab-root animate-fade-in">
      {/* Top Banner and Quick State */}
      <div className="bg-brand-dark-light p-6 rounded-2xl border border-brand-border shadow-md flex flex-col md:flex-row items-center gap-6" id="dashboard-overview-card">
        {/* Dynamic progress wheel */}
        <div className="relative w-28 h-28 shrink-0 select-none animate-scale-in" id="dashboard-progress-ring">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r={strokeRadius}
              className="stroke-[#222] fill-transparent"
              strokeWidth="9"
            />
            <circle
              cx="56"
              cy="56"
              r={strokeRadius}
              className="stroke-brand-gold fill-transparent transition-all duration-500 ease-out"
              strokeWidth="9"
              strokeDasharray={strokeCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
            <span className="font-display font-bold text-lg text-brand-gold">{overallProgress}%</span>
            <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">Tiến độ</span>
          </div>
        </div>

        {/* Text information */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h2 className="font-serif italic font-normal text-brand-gold text-2xl">{session.centerName}</h2>
            <span className="inline-flex max-w-fit mx-auto md:mx-0 items-center bg-brand-dark-lighter text-brand-gold border border-brand-border text-[10px] px-2 py-0.5 rounded-full font-sans font-medium uppercase tracking-wider">
              <Building2 className="w-3 h-3 mr-1 text-brand-gold" /> Trạm Đánh Giá Thực Địa
            </span>
          </div>
          <p className="text-xs text-gray-400 font-sans max-w-2xl leading-relaxed">
            Hệ thống đang theo dõi tổng cộng 5 điểm chạm và <strong className="text-gray-300">22 danh mục con</strong>. 
            Vui lòng đi qua từng hạng mục, đo lường theo chuẩn chất lượng vận hành Trống Đồng Palace, 
            và đính kèm hình ảnh làm bằng chứng thực tiễn nếu đạt điểm thấp.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 font-sans font-medium text-[10px] text-gray-500">
            <div>Chuyên viên: <span className="text-gray-300 font-semibold">{session.evaluatorName}</span></div>
            <div className="hidden md:inline-block text-gray-700">•</div>
            <div>Ngày kiểm tra: <span className="text-gray-300 font-semibold">{session.date}</span></div>
            <div className="hidden md:inline-block text-gray-700">•</div>
            <div className="flex items-center text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Đã kiểm: <span className="font-bold ml-1">{evaluatedCount}/{totalCriteria}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid statistics metrics panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="dashboard-briefing-metrics">
        {/* Core Score Panel */}
        <div className="bg-brand-dark-light p-5 rounded-2xl border border-brand-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-500">Điểm Đánh Giá Trung Bính</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-3xl text-brand-gold">{overallAverage}</span>
              <span className="text-sm text-gray-500 font-semibold">/ 5.0</span>
            </div>
            <p className={`text-[11px] font-medium ${getRatingLabel(overallAverage).color}`}>
              {getRatingLabel(overallAverage).label}
            </p>
          </div>
          <div className="w-11 h-11 bg-brand-gold/10 rounded-xl flex items-center justify-center text-brand-gold border border-brand-gold/25">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Warnings Panel */}
        <div className="bg-brand-dark-light p-5 rounded-2xl border border-brand-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-500">Hạng mục lỗi dịch vụ</span>
            <div className="flex items-baseline gap-0.5">
              <span className={`font-display font-bold text-3xl ${criticalCriterias.length > 0 ? 'text-rose-450' : 'text-gray-200'}`}>
                {criticalCriterias.length}
              </span>
              <span className="text-xs text-gray-500 ml-1">Lỗi dưới chuẩn (&le;3★)</span>
            </div>
            <p className="text-[11px] text-gray-400 font-sans">
              {criticalCriterias.length > 0 ? 'Cần Khối Điều Hành chỉ đạo sửa đổi gấp' : 'Mọi hạng mục đều đạt chuẩn lý thuyết'}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
            criticalCriterias.length > 0 ? 'bg-rose-950/35 text-rose-400 border-rose-900/40 animate-pulse' : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/20'
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Complete Ratio Panel */}
        <div className="bg-brand-dark-light p-5 rounded-2xl border border-brand-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-500">Trạng Thái Đợt Đánh Giá</span>
            <h4 className="font-display font-semibold text-lg text-brand-gold pt-1">
              {session.status === 'Completed' ? 'Đã chốt biên bản' : 'Đang site visit...'}
            </h4>
            <p className="text-[11px] text-gray-400 font-sans">
              {session.status === 'Completed' ? 'Sẵn sàng export lưu trữ nội bộ' : 'Tiếp tục ghi nhận dữ liệu thực tế'}
            </p>
          </div>
          <div className="w-11 h-11 bg-blue-950/25 border border-blue-900/30 rounded-xl flex items-center justify-center text-blue-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual touchpoint charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-analytics-charts">
        {/* SVG charts Column Bars */}
        <div className="bg-brand-dark-light p-5 rounded-2xl border border-brand-border shadow-sm flex flex-col">
          <h3 className="font-serif italic font-normal text-brand-gold text-base mb-1.5 flex items-center gap-1.5">
            Phân Tích Điểm Điểm Chạm (1–5★)
          </h3>
          <p className="text-[11px] text-gray-500 font-sans mb-6">Biểu đồ so sánh điểm trung bình thực tế cho từng khu vực cụ thể</p>

          <div className="flex-1 space-y-5" id="touchpoint-bars-container">
            {touchpointStats.map((item) => (
              <div key={item.index} className="space-y-1 font-sans">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-300 font-medium truncate w-[160px] md:w-[220px]" title={item.fullName}>
                    {item.fullName}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500">({item.counted}/{item.total} tiêu chí)</span>
                    <strong className={`font-mono text-xs ${item.avg >= 4 ? 'text-emerald-450' : item.avg >= 3 ? 'text-brand-gold' : item.avg > 0 ? 'text-rose-450' : 'text-gray-600'}`}>
                      {item.avg > 0 ? `${item.avg}★` : '---'}
                    </strong>
                  </div>
                </div>

                {/* Score Column bar */}
                <div className="h-2 w-full bg-[#1b1b1b] rounded-full overflow-hidden relative border border-brand-border">
                  <div
                    style={{ width: `${item.avg > 0 ? (item.avg / 5) * 100 : 0}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.avg >= 4.0 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                        : item.avg >= 3.0 
                          ? 'bg-gradient-to-r from-brand-gold to-brand-gold-dark' 
                          : 'bg-gradient-to-r from-rose-500 to-rose-400'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completion Progress Cards */}
        <div className="bg-brand-dark-light p-5 rounded-2xl border border-brand-border shadow-sm flex flex-col">
          <h3 className="font-serif italic font-normal text-brand-gold text-base mb-1.5">
            Tiến độ Site Checklists
          </h3>
          <p className="text-[11px] text-gray-500 font-sans mb-6">Trạng thái hoàn thành kiểm tra và thu thập thông tin điểm chạm</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            {touchpointStats.map((item, idx) => (
              <div
                key={item.index}
                onClick={() => onNavigateToTab(item.index + 1)}
                 className="p-3.5 border border-brand-border hover:border-brand-gold/40 rounded-xl bg-brand-dark/40 hover:bg-brand-dark/95 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] text-gray-500 font-mono tracking-wider">ĐIỂM CHẠM 0{item.index + 1}</span>
                  <h4 className="font-sans font-semibold text-xs text-gray-200 line-clamp-1 mt-0.5">{item.name}</h4>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>Đã kiểm: <strong className="text-gray-200">{item.counted}/{item.total}</strong></span>
                    <span className="font-semibold text-brand-gold">{item.progress}%</span>
                  </div>
                  {/* Progress lines */}
                  <div className="h-1.5 w-full bg-[#1b1b1b] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.progress}%` }}
                      className="h-full bg-brand-gold rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Checklist Alarm Section */}
      {criticalCriterias.length > 0 && (
        <div className="bg-rose-950/20 border border-rose-900/30 p-5 rounded-2xl space-y-3" id="critical-warnings-radar">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <h3 className="font-display font-bold text-rose-400 text-sm">
                Cảnh Báo Thực Địa Cao ({criticalCriterias.length} Hạng Mục Lỗi)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-rose-400 bg-rose-950/65 border border-rose-900/40 px-2 py-0.5 rounded-full font-bold">
              CẦN XỬ LÝ GẤP
            </span>
          </div>

          <p className="text-[11px] text-rose-300/80 font-sans max-w-3xl leading-relaxed">
            Các hạng mục sau hoạt động dưới tiêu chuẩn và được chuyên viên đánh giá từ 1 đến 3 điểm. 
            Vui lòng nhấn vào từng hạng mục để di chuyển đến chi tiết, bổ sung ghi chú hoặc thu thập hình ảnh xử lý.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {criticalCriterias.map((item, index) => (
              <div
                key={index}
                onClick={() => onNavigateToTab(item.tpIndex + 1)}
                className="group p-3 border border-rose-900/30 hover:border-rose-500/50 bg-[#161212] hover:bg-[#1a1212] rounded-xl transition cursor-pointer flex items-start gap-3 shadow-2xs"
              >
                <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                  item.score <= 2 ? 'bg-red-950 text-red-400 border border-red-900/30' : 'bg-amber-950 text-brand-gold border border-amber-900/30'
                }`}>
                  {item.score}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-[11px] text-gray-200 capitalize">
                      {item.category}
                    </span>
                    <span className="text-[9px] text-brand-gold font-mono flex items-center opacity-0 group-hover:opacity-100 transition">
                      Khắc phục <ArrowRight className="w-2.5 h-2.5 ml-1 animate-pulse" />
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-1 italic font-sans">
                    Chuẩn: {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standard Operations Tip */}
      <div className="bg-brand-gold/5 border border-brand-gold/25 p-4 rounded-xl flex items-start gap-3">
        <Info className="w-4 h-4 text-brand-gold mt-0.5 shrink-0" />
        <div className="space-y-1 font-sans text-xs">
          <h5 className="font-semibold text-brand-gold">Mẹo site visit của Chuyên gia:</h5>
          <p className="text-gray-400 leading-relaxed text-[11px]">
            Đeo thẻ hành chính và bộ đàm Khối Điều hành trong lúc di chuyển.
            Tại mỗi điểm chạm, quan sát kỹ lưỡng và đưa ra đánh giá một cách minh bạch, công tâm nhất. 
            Mọi lỗi dưới tiêu chuẩn (3★, 2★, 1★) phải được chụp ảnh minh chứng khách quan ở thực địa.
          </p>
        </div>
      </div>
    </div>
  );
};
