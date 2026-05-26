import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// High-capacity JSON payload support for base64 images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy safety initialization for Gemini API
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required to generate AI reports. Please set it in the Settings -> Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Expert Audit Report generation using Gemini API
app.post("/api/audit/gemini-report", async (req: express.Request, res: express.Response) => {
  try {
    const { centerName, evaluatorName, date, touchpoints, summaryNote } = req.body;
    
    // Validate request
    if (!touchpoints || !Array.isArray(touchpoints)) {
      res.status(400).json({ error: "Dữ liệu điểm chạm (touchpoints) không hợp lệ." });
      return;
    }

    const ai = getGeminiClient();

    // Prepare formatted checklist for the prompt
    let checklistDetails = "";
    let lowScoredItems = "";
    let totalItems = 0;
    let gradedItems = 0;
    let sumScores = 0;

    touchpoints.forEach((tp: any) => {
      checklistDetails += `\n### ${tp.name}:\n`;
      tp.criteria.forEach((crit: any) => {
        totalItems++;
        const scoreText = crit.score > 0 ? `${crit.score}/5` : "Chưa đánh giá";
        if (crit.score > 0) {
          gradedItems++;
          sumScores += crit.score;
        }
        checklistDetails += `- **Hạng mục**: ${crit.category}\n  - Tiêu chuẩn: ${crit.description}\n  - Điểm: ${scoreText}\n  - Ghi chú thực tế: ${crit.remarks || "Không có"}\n`;
        
        // Items with score <= 3 need special focus
        if (crit.score > 0 && crit.score <= 3) {
          lowScoredItems += `- [${tp.name} -> ${crit.category}] Tiêu chuẩn: "${crit.description}". Điểm: ${crit.score}/5. Ghi chú thực tế: "${crit.remarks || "Ẩn/Chưa có ghi chú cụ thể"}"\n`;
        }
      });
    });

    const averageScore = gradedItems > 0 ? (sumScores / gradedItems).toFixed(1) : "0.0";

    const promptText = `
Bạn là chuyên gia đánh giá vận hành chuỗi Trung tâm Tiệc cưới & Sự kiện cao cấp Trống Đồng Palace.
Bạn có nhiệm vụ viết một BÁO CÁO PHÂN TÍCH VẬN HÀNH & KẾ HOẠCH HÀNH ĐỘNG CẢI THIỆN CHI TIẾT dựa trên dữ liệu site kiểm tra thực tế sau đây:

THÔNG TIN CHUNG:
- Địa điểm (Trung tâm): ${centerName || "Trống Đồng Palace chưa xác định"}
- Người đánh giá: ${evaluatorName || "Chuyên viên Khối Điều hành"}
- Ngày đánh giá: ${date || "Hôm nay"}
- Điểm đánh giá trung bình: ${averageScore}/5.0 (đã đánh giá ${gradedItems}/${totalItems} tiêu chí)
- Ghi chú tổng quan: ${summaryNote || "Không có ghi chú tổng quan."}

CHI TIẾT KIỂM TRA TOÀN BỘ CÁC TIÊU CHÍ:
${checklistDetails}

CÁC HẠNG MỤC DƯỚI CHUẨN ĐÒN BẨY (ĐIỂM SỐ <= 3 TRÊN 5):
${lowScoredItems ? lowScoredItems : "Tuyệt vời! Không có hạng mục nào đạt từ 3 điểm trở xuống."}

YÊU CẦU TRÌNH BÀY BÁO CÁO (Sử dụng Markdown đẹp, gãy gọn, ngôn từ của chuyên gia tư vấn chất lượng 5 sao dứt khoát, chuyên nghiệp):

1. **BÁO CÁO TÓM TẮT ĐIỀU HÀNH (Executive Executive Briefing)**:
   - Nhận định chung về chất lượng vận hành tại cơ sở kiểm tra.
   - 3 Điểm sáng nổi bật nhất (Strengths) có thể thấy qua dữ liệu hoặc thái độ nhân sự.
   - 3 Lỗ hổng rủi ro lớn nhất (Vulnerabilities) có nguy cơ ảnh hưởng trực tiếp đến trải nghiệm khách hàng cưới/sự kiện hôm nay.

2. **KẾ HOẠCH HÀNH ĐỘNG KHẮC PHỤC CHI TIẾT (Detailed Corrective Action Plan)**:
   - Với MỖI hạng mục rơi xuống dưới chuẩn hoặc điểm thấp (<= 3 điểm): Hãy chỉ rõ:
     * **Nguyên nhân tiềm ẩn (Root Cause)**: Tại sao nhân sự tại chỗ lại bị lỗi này? (Ví dụ: do thiếu giám sát, tần suất dọn dẹp thấp, thiếu bàn giao ca, hay thiết bị xuống cấp).
     * **Hành động phản ứng tức thì (Immediate Action - trong 1h_24h)**: Cần làm gì ngay lập tức để chữa cháy trước giờ đón khách?
     * **Giải pháp duy trì chất lượng lâu dài (Preventative System Update)**: Thiết lập quy trình kiểm tra định kỳ thế nào để lỗi này không tái diễn?
     *(Nếu không có hạng mục nào <= 3 điểm, hãy gợi ý nâng tầm dịch vụ từ mức 4 (Đạt) lên mức 5 (Hoàn hảo)).*

3. **CẢI THIỆN CHỮ KÝ DỊCH VỤ "TRỐNG ĐỒNG XIN CHÀO"**:
   - Đặc biệt phân tích hạng mục "Nhân sự" (chào "Trống Đồng xin chào"). Cung cấp kịch bản huấn luyện ngắn 2 phút (chỉnh tư thế, nụ cười, giọng điệu) cho phòng nhân sự cơ sở.

4. **KẾT LUẬN & KIẾN NGHỊ LỘ TRÌNH KIỂM TRA TIẾP THEO**:
   - Tần suất cần tái kiểm tra cơ sở này là bao lâu? (Hàng tuần, 2 tuần hay tháng).
   - Chỉ tiêu cam kết mà Giám Đốc cơ sở cần ký cam kết giải trình.

Hãy viết bằng tiếng Việt tự nhiên nhưng chuẩn mực, cấu trúc súc tích rõ ràng dưới định dạng Markdown để người quản lý vận hành có thể đọc và hành động được luôn.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
    });

    res.json({ report: response.text });
  } catch (error: any) {
    console.error("Lỗi sinh báo cáo Gemini:", error);
    res.status(500).json({ 
      error: error.message || "Đã xảy ra lỗi hệ thống khi sinh báo cáo vận hành AI." 
    });
  }
});

// Setup Vite as server middleware in dev mode, or serve build folder in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SV] Server is running on port ${PORT}`);
  });
}

startServer();
