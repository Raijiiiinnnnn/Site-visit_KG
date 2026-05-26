export interface Criterion {
  id: string;
  category: string;
  description: string;
  score: number; // 0 to 5 (0 means not graded or not applicable)
  remarks: string;
  images: string[]; // List of base64 images
}

export interface Touchpoint {
  id: string;
  name: string;
  criteria: Criterion[];
}

export interface AuditSession {
  id: string;
  centerName: string;
  evaluatorName: string;
  date: string;
  status: 'In_Progress' | 'Completed';
  touchpoints: Touchpoint[];
  summaryNote?: string;
  aiReport?: string;
}

export const INITIAL_TOUCHPOINTS: Touchpoint[] = [
  {
    id: 'touchpoint-1',
    name: '1. Khu vực đón tiếp',
    criteria: [
      {
        id: 'tp1-c1',
        category: 'Bãi xe',
        description: 'sạch rác; biển chỉ dẫn ô tô/xe máy đặt đúng chỗ, không bám bụi.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp1-c2',
        category: 'Mặt tiền',
        description: 'cổng hoa, hoa trang trí không bạc màu, không bám bụi; bậc thềm đá sạch, không nứt vỡ.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp1-c3',
        category: 'Nhân sự',
        description: '100% nhân viên mặc đúng đồng phục, đeo biển tên; chào "Trống Đồng xin chào" với thái độ niềm nở.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp1-c4',
        category: 'Tiểu cảnh',
        description: 'cây cảnh chăm sóc hằng ngày, vệ sinh bồn cây/chậu cảnh, quét lá khô, giữ khuôn viên sạch.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp1-c5',
        category: 'Khu vực tiếp khách',
        description: 'bàn tiếp khách sạch sẽ, không để đồ ăn hay vật dụng cá nhân.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp1-c6',
        category: 'Bảng biển chỉ dẫn',
        description: 'đúng ngày, đúng tên khách; bảng không nứt vỡ, không bụi; không đặt nhiều biển trùng lặp; biển không sử dụng phải xếp gọn.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp1-c7',
        category: 'Tiện ích',
        description: 'máy xông tinh dầu hoạt động; nhiệt độ sảnh mát mẻ.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp1-c8',
        category: 'Nội thất',
        description: 'ghế, sofa sạch sẽ, đặt đúng vị trí; gối tựa xếp ngay ngắn.',
        score: 0,
        remarks: '',
        images: []
      }
    ]
  },
  {
    id: 'touchpoint-2',
    name: '2. Không gian sự kiện chính',
    criteria: [
      {
        id: 'tp2-c1',
        category: 'Photo booth, khu check-in',
        description: 'backdrop, bàn gallery, biển khánh tên, hòm tiền mừng đúng vị trí, sạch sẽ, không bạc màu.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp2-c2',
        category: 'Biển khánh tên',
        description: 'xoay đúng mặt; bảng chỉ dẫn không còn tiệc cũ; cất gọn giá ảnh; hòm tiền mừng đặt đúng vị trí.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp2-c3',
        category: 'Setup bàn tiệc',
        description: 'mặt kính xoay, bình detox, ly cốc không sứt mẻ/bám bẩn; khăn bàn và nơ ghế phẳng, không rách.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp2-c4',
        category: 'Hoa bàn, hoa đường dẫn',
        description: 'sạch sẽ, không mốc, không dính thức ăn.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp2-c5',
        category: 'Hệ thống ATAS',
        description: 'màn hình LED không ám màu; loa không rè; micro đủ pin; đèn follow, laser, máy tuyết, pháo điện hoạt động tốt.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp2-c6',
        category: 'Điện lạnh',
        description: 'điều hòa hoạt động ổn định, nhiệt độ sảnh tiệc đảm bảo trước khi đón khách.',
        score: 0,
        remarks: '',
        images: []
      }
    ]
  },
  {
    id: 'touchpoint-3',
    name: '3. Khu vực dịch vụ bổ trợ',
    criteria: [
      {
        id: 'tp3-c1',
        category: 'Khu vực WC',
        description: 'gương không nứt vỡ; vòi nước không rò rỉ; sàn khô ráo; đủ giấy và nước rửa tay; không có mùi hôi.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp3-c2',
        category: 'Phòng chờ cô dâu',
        description: 'sạch sẽ, gọn gàng, nội thất và trang trí tinh tế, tạo cảm giác thoải mái. Điều hòa hoạt động ổn định, nhiệt độ dễ chịu; gương trong, máy xông tinh dầu hoặc hương thơm nhẹ.',
        score: 0,
        remarks: '',
        images: []
      }
    ]
  },
  {
    id: 'touchpoint-4',
    name: '4. Không gian lưu thông',
    criteria: [
      {
        id: 'tp4-c1',
        category: 'Hành lang & Sảnh',
        description: 'trần/tường không ẩm mốc, thảm sàn phẳng, không mùi hôi.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp4-c2',
        category: 'Thảm & Đường dẫn',
        description: 'sạch, không mùi hôi, không dồn gập/nếp nhăn.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp4-c3',
        category: 'Bề mặt cao',
        description: 'tay nắm cầu thang, kính hành lang, gương sảnh không bám bụi/dấu vân tay.',
        score: 0,
        remarks: '',
        images: []
      }
    ]
  },
  {
    id: 'touchpoint-5',
    name: '5. An toàn & Hậu cần',
    criteria: [
      {
        id: 'tp5-c1',
        category: 'An toàn',
        description: 'hệ thống PCCC kiểm tra đầy đủ; đèn thoát hiểm và lối thoát hiểm không bị chặn.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp5-c2',
        category: 'Bếp',
        description: 'sàn bếp, bồn rửa sạch; rác được đổ đúng quy định; tường khu sơ chế sạch, không bám máu/vết bẩn.',
        score: 0,
        remarks: '',
        images: []
      },
      {
        id: 'tp5-c3',
        category: 'Bảo quản',
        description: 'thực phẩm không đặt dưới đất; nhiệt độ tủ đông/tủ mát đạt yêu cầu.',
        score: 0,
        remarks: '',
        images: []
      }
    ]
  }
];

export const POPULAR_CENTERS = [
  "Hàng Cót",
  "Trần Đăng Ninh",
  "Cảnh Hồ",
  "Quán Sứ",
  "Hà Đông",
  "Hoàng Quốc Việt",
  "Linh Đàm",
  "Hoàng Gia",
  "Lãng Yên",
  "Thái Nguyên",
  "Mễ Trì",
  "Nam Định",
  "Long Biên"
];

// Cấu hình URL Web App Google Apps Script để đồng bộ Google Sheets
// Thay thế URL Ứng dụng Web đã triển khai của bạn tại đây
export const GOOGLE_SHEETS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyr-aopcTTvdX8BV-gdwvVUSJ8eR3hRISp5L_0yIHTC3FEFXm7H3yKjGBL4dXZlj31o/exec";


