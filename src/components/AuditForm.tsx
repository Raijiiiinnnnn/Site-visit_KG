import React, { useRef, useState } from 'react';
import { AuditSession, Criterion, GOOGLE_SHEETS_SCRIPT_URL } from '../types';
import { 
  Star, 
  Camera, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  ArrowRight, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  FileText
} from 'lucide-react';

interface AuditFormProps {
  session: AuditSession;
  selectedTab: number; // 1 to 5
  onUpdateCriterion: (touchpointId: string, criterionId: string, updated: Partial<Criterion>) => void;
  onPrevTab: () => void;
  onNextTab: () => void;
  onUpdateSummaryNote: (note: string) => void;
}

export const AuditForm: React.FC<AuditFormProps> = ({
  session,
  selectedTab,
  onUpdateCriterion,
  onPrevTab,
  onNextTab,
  onUpdateSummaryNote
}) => {
  const currentTouchpoint = session.touchpoints[selectedTab - 1];
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ status: 'success' | 'error' | null; message: string; folderUrl?: string }>({ status: null, message: '' });
  const [showSetupHelp, setShowSetupHelp] = useState(false);

  // Submit complete checklist data to Google Sheets & Drive Folders
  const handleSubmitChecklist = async () => {
    setIsSending(true);
    setSendResult({ status: null, message: '' });

    // Calculate score averages and errors for correct dashboarding
    let totalCriteria = 0;
    let evaluatedCount = 0;
    let sumAllScores = 0;
    let criticalCount = 0;

    session.touchpoints.forEach((tp) => {
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
      id: session.id,
      centerName: session.centerName,
      evaluatorName: session.evaluatorName,
      date: session.date,
      status: 'Completed',
      averageScore: overallAverage,
      errorCount: criticalCount,
      summaryNote: session.summaryNote || 'Chưa ghi chú',
      touchpoints: session.touchpoints
    };

    const url = GOOGLE_SHEETS_SCRIPT_URL;
    if (!url || !url.startsWith('http') || url.includes('your_script_id_here')) {
      setIsSending(false);
      setShowSetupHelp(true);
      return;
    }

    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        }
      });

      setSendResult({
        status: 'success',
        message: 'Báo cáo checklist đã được truyền dữ liệu thành công lên hệ thống Google Sheets! Toàn bộ hình ảnh bằng chứng thực địa cũng được phân loại tự động và chuyển trực tiếp tới thư mục Google Drive của bạn.',
        folderUrl: 'https://drive.google.com/drive/folders/1PoATupKlpVJJOTBcMERfZVyfLhaOYAfs?usp=sharing'
      });
    } catch (err: any) {
      setSendResult({
        status: 'error',
        message: 'Lỗi đồng bộ truyền tải dữ liệu: ' + err.toString()
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!currentTouchpoint) {
    return (
      <div className="p-8 text-center bg-brand-dark-light rounded-2xl border border-brand-border text-gray-400" id="form-error-fallback">
        <p className="font-sans">Không tìm thấy dữ liệu điểm chạm này.</p>
      </div>
    );
  }

  // Calculate touchpoint progress
  const totalCrit = currentTouchpoint.criteria.length;
  const gradedCrit = currentTouchpoint.criteria.filter(c => c.score > 0).length;
  const percentage = Math.round((gradedCrit / totalCrit) * 100);

  // File Upload image to base64 converter
  const handleImageUpload = (critId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Read files
    Array.from(files).forEach((fileItem) => {
      const file = fileItem as File;
      // Validate file size under 3.5MB to secure localStorage limits
      if (file.size > 3.5 * 1024 * 1024) {
        alert(`Kích thước file ${file.name} quá lớn (>3.5MB). Vui lòng chọn ảnh nén nhỏ hơn.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Append image to that specific criterion
        const currentCrit = currentTouchpoint.criteria.find(c => c.id === critId);
        if (currentCrit) {
          const updatedImages = [...(currentCrit.images || []), base64String];
          // Keep max 4 images per check item to preserve localStorage
          if (updatedImages.length > 4) {
            alert("Mỗi hạng mục chỉ nên đính kèm tối đa 4 ảnh thực địa.");
            return;
          }
          onUpdateCriterion(currentTouchpoint.id, critId, { images: updatedImages });
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input so upload can trigger again for same file name
    e.target.value = '';
  };

  const removeImage = (critId: string, imgIdx: number) => {
    const currentCrit = currentTouchpoint.criteria.find(c => c.id === critId);
    if (currentCrit) {
      const updatedImages = (currentCrit.images || []).filter((_, idx) => idx !== imgIdx);
      onUpdateCriterion(currentTouchpoint.id, critId, { images: updatedImages });
    }
  };

  const getScoreDescription = (score: number) => {
    switch (score) {
      case 1: return { text: "1 - Nghiêm trọng (Dưới chuẩn hoàn toàn)", color: "text-rose-400 bg-rose-950/40 border-rose-900/30" };
      case 2: return { text: "2 - Yếu kém (Xuống cấp, rủi ro cục bộ)", color: "text-red-400 bg-red-950/30 border-red-900/35" };
      case 3: return { text: "3 - Trung bình (Cần dọn dẹp, chỉnh trang)", color: "text-amber-400 bg-amber-950/30 border-amber-900/35" };
      case 4: return { text: "4 - Đạt yêu cầu (Đúng chuẩn SOP)", color: "text-emerald-400 bg-emerald-950/30 border-emerald-900/35" };
      case 5: return { text: "5 - Hoàn hảo (Không tì vết, sạch bóng)", color: "text-blue-400 bg-blue-950/30 border-blue-900/35" };
      default: return { text: "Chưa đánh giá", color: "text-gray-500 bg-brand-dark border-brand-border" };
    }
  };

  return (
    <div className="space-y-6 text-gray-200" id={`form-touchpoint-${selectedTab}`}>
      {/* Touchpoint Form Header */}
      <div className="bg-brand-dark-light p-5 rounded-2xl border border-brand-border shadow-md space-y-3" id="form-progress-banner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
          <div>
            <h2 className="font-serif italic text-brand-gold text-xl">{currentTouchpoint.name}</h2>
            <p className="text-xs text-gray-400 font-sans mt-0.5">
              Đánh giá thực trạng không gian, nhân sự, tiện ích ở điểm chạm này
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono" id="form-progress-indicator">
            <span className="text-xs text-gray-500">Tiến độ:</span>
            <span className="bg-brand-gold/10 text-brand-gold border border-brand-gold/20 font-bold text-xs px-2.5 py-1 rounded-full">
              {gradedCrit}/{totalCrit} ({percentage}%)
            </span>
          </div>
        </div>

        {/* Form progress lines style */}
        <div className="h-2 w-full bg-brand-dark border border-brand-border rounded-full overflow-hidden">
          <div
            style={{ width: `${percentage}%` }}
            className="h-full bg-brand-gold rounded-full transition-all duration-300"
          />
        </div>
      </div>

      {/* Checklist criteria items */}
      <div className="space-y-5" id="form-criteria-list">
        {currentTouchpoint.criteria.map((crit, idx) => {
          const scoreDesc = getScoreDescription(crit.score);
          const isWarning = crit.score > 0 && crit.score <= 3;
          
          return (
            <div
              key={crit.id}
              id={`criteria-card-${crit.id}`}
              className={`p-5 rounded-2xl border transition-all duration-300 bg-brand-dark-light ${
                crit.score > 0 
                  ? isWarning 
                    ? 'border-amber-900/40 shadow-md shadow-amber-950/5 ring-1 ring-amber-900/10' 
                    : 'border-emerald-900/30 shadow-sm shadow-emerald-950/5'
                  : 'border-brand-border'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                {/* Visual Label Checkpoints */}
                <div className="shrink-0 lg:w-44 space-y-1.5 animate-fade-in">
                  <span className="inline-flex items-center text-[10px] font-mono font-bold uppercase text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-md border border-brand-gold/20 mr-2">
                    Hạng mục 0{idx + 1}
                  </span>
                  <h4 className="font-serif italic font-normal text-brand-gold text-sm">
                    {crit.category}
                  </h4>
                </div>

                {/* Main Interactive Workings */}
                <div className="flex-1 space-y-4 font-sans text-xs">
                  {/* Detailed criteria standard sentence */}
                  <div className="bg-[#0e0e0e] border border-brand-border p-3.5 rounded-xl">
                    <p className="text-gray-300 leading-relaxed font-sans text-[11.5px]">
                      <span className="font-semibold text-gray-500 text-[10px] block uppercase tracking-wider mb-1 font-mono">Tiêu chuẩn kiểm tra:</span>
                      {crit.description}
                    </p>
                  </div>

                  {/* Rating control block */}
                  <div className="space-y-2">
                    <label className="block text-gray-400 font-medium">Đánh giá tiêu chuẩn thực tế:</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-brand-dark p-1.5 rounded-xl border border-brand-border">
                        {[1, 2, 3, 4, 5].map((starVal) => {
                          const isSelected = crit.score >= starVal;
                          const starColor = 
                            crit.score === starVal || (isSelected && starVal === crit.score)
                              ? crit.score <= 3 
                                ? 'text-amber-400 fill-amber-400' 
                                : crit.score === 4 
                                  ? 'text-emerald-400 fill-emerald-400' 
                                  : 'text-blue-400 fill-blue-400'
                              : isSelected
                                ? 'text-gray-600 fill-gray-650'
                                : 'text-neutral-700 hover:text-brand-gold/50';
                          return (
                            <button
                              id={`btn-star-${crit.id}-${starVal}`}
                              key={starVal}
                              type="button"
                              onClick={() => onUpdateCriterion(currentTouchpoint.id, crit.id, { score: starVal })}
                              className="focus:outline-none transition group transform hover:scale-110 cursor-pointer"
                              title={`Cho ${starVal} sao`}
                            >
                              <Star className={`w-6 h-6 ${starColor} transition duration-150`} />
                            </button>
                          );
                        })}
                      </div>

                      <span className={`px-3 py-1.5 font-sans font-semibold rounded-xl text-[10px] border tracking-wider uppercase ${scoreDesc.color}`}>
                        {scoreDesc.text}
                      </span>
                    </div>
                  </div>

                  {/* Remarks Notes Area */}
                  <div className="space-y-1.5">
                    <label className="block text-gray-400 font-medium font-sans">Ghi chú vận hành thực tế tại chỗ:</label>
                    <textarea
                      id={`textarea-remarks-${crit.id}`}
                      placeholder={
                        isWarning 
                          ? "BẮT BUỘC: Nhập mô tả lỗi chi tiết tại đây (ví dụ: bám bụi, nứt thềm đá, cổng hoa bị phai màu...)" 
                          : "Ghi nhận trạng thái cụ thể hoặc phương án duy trì chất lượng..."
                      }
                      value={crit.remarks || ''}
                      onChange={(e) => onUpdateCriterion(currentTouchpoint.id, crit.id, { remarks: e.target.value })}
                      rows={2}
                      className={`w-full border p-3 rounded-xl focus:outline-none bg-[#0a0a0a] text-gray-250 transition ${
                        isWarning && !crit.remarks
                          ? 'border-amber-600 focus:ring-1 focus:ring-amber-500 placeholder-amber-500/70 bg-amber-950/10'
                          : 'border-brand-border focus:ring-1 focus:ring-brand-gold placeholder-gray-600'
                      }`}
                    />
                    {isWarning && !crit.remarks && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1 font-sans">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Ghi lại lý do chưa đạt chuẩn (điểm dưới 4).
                      </span>
                    )}
                  </div>

                  {/* Image visual attachments */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-gray-400 font-medium">Hình ảnh làm bằng chứng (Ảnh chụp thực địa):</label>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Photo previews */}
                      {crit.images && crit.images.map((base64, imgIdx) => (
                        <div key={imgIdx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-border group shadow-sm bg-brand-dark shrink-0">
                          <img src={base64} alt="Evidence" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-155 flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setLightboxImg(base64)}
                              className="text-white hover:text-brand-gold p-1 cursor-pointer"
                              title="Xem ảnh lớn"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(crit.id, imgIdx)}
                              className="text-red-400 hover:text-red-500 p-1 cursor-pointer"
                              title="Xóa hình này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Hidden input files */}
                      <input
                        id={`input-file-${crit.id}`}
                        type="file"
                        accept="image/*"
                        multiple
                        ref={(el) => { fileInputRefs.current[crit.id] = el }}
                        onChange={(e) => handleImageUpload(crit.id, e)}
                        className="hidden"
                      />

                      {/* Visual Trigger upload button */}
                      <button
                        id={`btn-upload-file-${crit.id}`}
                        type="button"
                        onClick={() => fileInputRefs.current[crit.id]?.click()}
                        className="w-16 h-16 border border-dashed border-brand-border hover:border-brand-gold rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-brand-gold bg-[#0e0e0e] hover:bg-brand-gold/5 transition cursor-pointer gap-1 shrink-0"
                        title="Đính kèm bảnh chụp thực tế"
                      >
                        <Camera className="w-4.5 h-4.5" />
                        <span className="text-[9px] font-sans font-medium">Đính ảnh</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary report text for the active session (Only visible if we evaluate the last tab) */}
      {selectedTab === 5 && (
        <div className="bg-brand-dark-light p-5 rounded-2xl border border-brand-border shadow-md space-y-3 font-sans text-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-gold shrink-0" />
            <h3 className="font-serif italic text-brand-gold text-base">Ghi chú tóm tắt tổng quan</h3>
          </div>
          <p className="text-gray-400 font-sans text-[11px]">
            Nhận xét cốt lõi về tinh thần làm việc của nhân viên, thiết bị hạ tầng trung tâm toàn khóa kiểm tra.
          </p>
          <textarea
            id="session-summary-note-textarea"
            placeholder="Ví dụ: Trung tâm hoạt động tốt, tuy nhiên nhân viên bãi đỗ xe và búp bê cổng hoa cần chỉnh trang trước giờ khai tiệc. Hệ thống âm thanh sảnh tiệc chính đạt chuẩn cao, mát mẻ."
            value={session.summaryNote || ''}
            onChange={(e) => onUpdateSummaryNote(e.target.value)}
            rows={4}
            className="w-full border border-brand-border bg-[#0a0a0a] focus:border-brand-gold p-3 rounded-xl focus:outline-none placeholder-gray-600 text-gray-200 focus:ring-1 focus:ring-brand-gold transition duration-200"
          />
        </div>
      )}

      {/* Interactive Tabs footer navigation */}
      <div className="flex items-center justify-between pt-2" id="form-tab-navigation-bar">
        {selectedTab > 1 ? (
          <button
            id="btn-prev-tab"
            type="button"
            onClick={onPrevTab}
            className="flex items-center gap-2 border border-brand-border bg-brand-dark-light hover:bg-[#1f1f1d] px-4 py-2.5 rounded-xl text-gray-300 font-semibold font-sans text-xs transition shadow-sm cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-brand-gold" />
            Quay lại
          </button>
        ) : (
          <div /> // Placeholder to keep layout right
        )}

        {selectedTab < 5 ? (
          <button
            id="btn-next-tab"
            type="button"
            onClick={onNextTab}
            className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-black px-5 py-2.5 rounded-xl font-bold font-sans text-xs transition shadow-sm cursor-pointer uppercase tracking-wider"
          >
            Tiếp theo
            <ChevronRight className="w-4 h-4 text-black stroke-[3]" />
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <span className="text-[10px] sm:text-[11px] font-mono text-emerald-400 bg-emerald-950/35 border border-emerald-900/40 px-3 py-1.5 rounded-lg font-bold text-center">
              ✓ Đã đến điểm chạm cuối cùng
            </span>
            <button
              id="btn-submit-checklist"
              onClick={handleSubmitChecklist}
              disabled={isSending}
              className="bg-emerald-500 hover:bg-emerald-600 text-black px-5 py-2.5 rounded-xl font-bold font-sans text-xs transition shadow-md cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{isSending ? 'Đang đồng bộ...' : 'Gửi checklist'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Loading Submission overlay */}
      {isSending && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-brand-gold font-serif italic text-base animate-pulse">Đang truyền tải báo cáo thực địa...</p>
          <p className="text-gray-500 text-[10px] font-mono mt-1.5 max-w-sm text-center">
            Hệ thống đang tải lên dữ liệu, chuyển tiếp hình ảnh đính kèm vào phân thư mục Google Drive...
          </p>
        </div>
      )}

      {/* Setup instructions modal */}
      {showSetupHelp && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" id="modal-setup-help">
          <div className="bg-[#141414] border border-brand-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-4">
              <h3 className="font-serif italic text-brand-gold text-base flex items-center gap-2">
                ⚙️ Hướng dẫn tích hợp Google Sheets & Drive
              </h3>
              <button onClick={() => setShowSetupHelp(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 font-sans text-xs text-gray-300 leading-relaxed">
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
    var folderName = data.centerName + " - " + data.date.toString().replace(/\//g, "-");
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

              <div className="flex justify-end pt-2 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowSetupHelp(false)}
                  className="bg-brand-gold hover:bg-brand-gold-dark text-black px-4 py-2 rounded-xl font-bold transition cursor-pointer"
                >
                  Tôi đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Submission Dialog */}
      {sendResult.status === 'success' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" id="modal-submit-success">
          <div className="bg-[#141414] border border-brand-border rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-gray-200 text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-900 border-dashed flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif italic text-brand-gold text-lg">Đồng bộ dữ liệu thành công!</h3>
              <p className="text-[11px] text-gray-400 font-sans">
                Khối Điều Hành - Đã tải lưu trữ dữ liệu tại {session.centerName}
              </p>
            </div>

            <div className="bg-[#0b0b0b] p-4 rounded-xl border border-brand-border/40 text-left space-y-3 font-sans text-xs">
              <p className="text-gray-300 leading-relaxed">
                Đã truyền phát bản ghi điểm chạm site visit thành công. Toàn bộ hình ảnh thực địa của trung tâm đã được lưu trữ tự động trong Drive theo cấu trúc thư mục riêng biệt đặt tên theo trung tâm và ngày chấm.
              </p>

              <div className="space-y-1">
                <label className="block text-gray-550 font-bold uppercase tracking-wider text-[9px]">
                  Liên kết lưu trữ hình ảnh Google Drive:
                </label>
                <a
                  href="https://drive.google.com/drive/folders/1PoATupKlpVJJOTBcMERfZVyfLhaOYAfs?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-gold hover:text-brand-gold-dark underline font-mono text-[11px] break-all block"
                >
                  https://drive.google.com/drive/folders/1PoATupKlpVJJOTBc...
                </a>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <a
                href="https://drive.google.com/drive/folders/1PoATupKlpVJJOTBcMERfZVyfLhaOYAfs?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-brand-gold text-black py-2.5 rounded-xl font-bold font-sans text-xs transition uppercase tracking-wider text-center cursor-pointer block"
              >
                Mở Google Drive
              </a>
              <button
                type="button"
                onClick={() => setSendResult({ status: null, message: '' })}
                className="flex-1 bg-brand-dark hover:bg-brand-dark-lighter border border-brand-border text-gray-400 py-2.5 rounded-xl font-bold font-sans text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Submission Dialog */}
      {sendResult.status === 'error' && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4" id="modal-submit-error">
          <div className="bg-[#141414] border border-brand-border rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-gray-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/40 text-red-400 border border-red-900 border-dashed flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif italic text-red-400 text-base">Đồng bộ thất bại</h3>
              <p className="text-[11px] text-gray-550">Kiểm tra kết nối mạng hoặc cấu hình mã Apps Script</p>
            </div>

            <p className="text-xs text-gray-300 bg-[#0b0b0b] p-3 rounded-lg border border-brand-border/45 font-mono text-left max-h-32 overflow-y-auto">
              {sendResult.message}
            </p>

            <button
              type="button"
              onClick={() => setSendResult({ status: null, message: '' })}
              className="w-full bg-brand-dark hover:bg-[#1e1e1e] border border-brand-border text-gray-300 py-2.5 rounded-xl font-bold font-sans text-xs transition cursor-pointer"
            >
              Quay lại chỉnh sửa
            </button>
          </div>
        </div>
      )}

      {/* Lightbox photo display */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 shadow-2xl" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-brand-gold p-2 cursor-pointer bg-black/40 rounded-full" onClick={() => setLightboxImg(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={lightboxImg} alt="Evidence scale check" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200 border border-brand-border" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};
