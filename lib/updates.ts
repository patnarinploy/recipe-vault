export type UpdateEntry = {
  build: number;
  timestamp: string; // ISO 8601 UTC
  title: string;
  features?: string[];
  improvements?: string[];
  fixes?: string[];
};

// Newest first — this is the canonical source of truth for the public changelog.
// Add a new entry at the TOP of this array for each meaningful release.
export const UPDATES: UpdateEntry[] = [
  {
    build: 37,
    timestamp: "2026-05-16T15:52:00.000Z",
    title: "ระบบ Admin Hub & การจัดการระบบ",
    features: [
      "สร้างหน้า /admin เป็น Control Center สำหรับ Admin",
      "เพิ่มหน้า /admin/achievements แสดงรายละเอียด Achievement ทั้งหมด",
      "เพิ่ม AdminLayout component ที่ใช้ร่วมกันได้ในทุกหน้า Admin",
    ],
    improvements: [
      "เปลี่ยน Dropdown จาก 'จัดการผู้ใช้' เป็น 'การจัดการระบบ' ที่ชัดเจนกว่า",
      "เพิ่มปุ่ม Placeholder สำหรับ Audit Logs และ System Settings ในอนาคต",
      "/admin/users กลับสู่ /admin แทนหน้าหลัก",
    ],
  },
  {
    build: 36,
    timestamp: "2026-05-16T14:30:00.000Z",
    title: "Badge ระบบ Achievement แทนตัวเลขสถิติ",
    improvements: [
      "ลบ Badge ตัวเลข (📖 X Books, 🍳 X Recipes, 🌐 X Shared) ออกจากทุกหน้า",
      "สร้าง WriterAchievements component เป็น Single Source of Truth ของ Badge",
      "Tooltip แต่ละ Badge แสดงตัวเลขจริง เช่น 'สร้างหนังสือแล้ว 4 เล่ม'",
      "เรียงลำดับ: Role → ฉายาหลัก (ใหญ่) → ฉายารอง (เล็ก)",
    ],
  },
  {
    build: 35,
    timestamp: "2026-05-16T13:10:00.000Z",
    title: "ระบบ Achievement ฉายานักเขียน",
    features: [
      "ฉายาสาย Book 5 ระดับ: มือสมัครเล่น → รักการเขียน → นักประพันธ์ → ปรมาจารย์อักษร → ศาสดาแห่งชั้นหนังสือ",
      "ฉายาสาย Recipe 5 ระดับ: พ่อครัวฝึกหัด → เข้าครัวจริงจัง → จอมปรุงรส → เชฟประจำห้องเครื่อง → มหาปรมาจารย์แห่งเตาไฟ",
      "ฉายาสาย Share 5 ระดับ: ผู้กล้าแบ่งปัน → นักเผยแพร่รสชาติ → ขวัญใจมหาชน → ตำนานโต๊ะอาหาร → ผู้ปลุกยุคแห่งรสชาติ",
      "Achievement พิเศษ: ครบเครื่อง, นักเขียนเงา, เชฟลับ, หน้าใหม่ไฟแรง",
      "ฉายาหลักคือ Tier สูงสุด (สาย Book > Recipe > Share เมื่อเท่ากัน)",
    ],
  },
  {
    build: 34,
    timestamp: "2026-05-16T11:45:00.000Z",
    title: "Writer Card — Badge ไม่กระพริบขณะโหลด",
    improvements: [
      "Badge ทั้งหมดแสดง Skeleton ขณะรอข้อมูล Stats แทนการโผล่ทีละส่วน",
      "Role Badge แสดงทันที ส่วน Achievement Badge รอ Stats พร้อมแล้วค่อยโผล่ทีเดียว",
      "ลด Layout Shift บน Admin Panel และ Book Reader",
    ],
  },
  {
    build: 33,
    timestamp: "2026-05-16T10:30:00.000Z",
    title: "แก้ไข Status Dot — รูปวงกลมสมบูรณ์",
    fixes: [
      "แก้ Status Dot เป็นรูปวงรีเนื่องจาก Line Height ของ Inline Element",
      "ใช้ Wrapper div แทน span เพื่อให้ได้วงกลมแท้จริง",
    ],
    improvements: [
      "รวม OnlineIndicator เป็น Component กลาง ใช้ร่วมกันระหว่าง WriterCard และ Admin Panel",
    ],
  },
  {
    build: 32,
    timestamp: "2026-05-16T09:15:00.000Z",
    title: "รวม Role Labels — Admin / Writer ที่สอดคล้องกัน",
    improvements: [
      "สร้าง lib/role.ts เป็น Single Source of Truth สำหรับชื่อและสี Role",
      "เปลี่ยน 'Admin' → '👑 Admin', 'User' → '📚 Writer' ทุกที่",
      "UserMenu, WriterCard, Admin Panel ใช้ ROLE_LABELS และ ROLE_COLORS เดียวกัน",
    ],
  },
  {
    build: 31,
    timestamp: "2026-05-16T08:00:00.000Z",
    title: "รวม WriterCard Data — Stats + Status Badge",
    improvements: [
      "Admin Panel ดึง Stats แบบ Async เหมือน Book Reader (เปิด Card ทันที Stats โหลดทีหลัง)",
      "WriterCard รองรับ status banned → แสดง 🚫 Banned Badge",
      "เพิ่ม created_at ใน WriterInfo สำหรับ Achievement ที่ใช้อายุบัญชี",
    ],
  },
  {
    build: 30,
    timestamp: "2026-05-16T07:00:00.000Z",
    title: "หน้าจัดการผู้ใช้ — ปรับปรุงครั้งใหญ่",
    features: [
      "แยกส่วน 'บัญชีของคุณ' ออกจากรายการผู้ใช้ชัดเจนขึ้น",
      "Modal ยืนยันก่อน Promote/Demote พร้อม Loading Spinner",
    ],
    improvements: [
      "Skeleton Loading ที่ตรงกับ Layout จริงทุก Element",
      "เรียงผู้ใช้ A→Z ตามชื่อหรืออีเมล",
    ],
  },
  {
    build: 29,
    timestamp: "2026-05-16T06:00:00.000Z",
    title: "ล้างฐานข้อมูล — ลบ username และ password_hash",
    improvements: [
      "ลบ Column username และ password_hash ออกจากฐานข้อมูล",
      "อัปเดต Trigger handle_new_auth_user ก่อน Drop Column",
      "ทำความสะอาด Code ที่อ้างอิง username ในทุก File",
    ],
  },
  {
    build: 28,
    timestamp: "2026-05-15T16:00:00.000Z",
    title: "เปิดใช้งาน Google OAuth Provider",
    improvements: [
      "เปิด Gate สำหรับ Google OAuth ผ่าน Environment Variable",
    ],
    fixes: [
      "แก้ OAuth Provider Error ที่เกิดจากการตั้งค่าผิดพลาด",
    ],
  },
  {
    build: 27,
    timestamp: "2026-05-15T14:00:00.000Z",
    title: "ระบบ Auth ใหม่ — Google / Microsoft OAuth",
    features: [
      "รองรับ Google OAuth และ Microsoft OAuth",
      "ระบบ Account Linking สำหรับผู้ใช้เดิมที่เชื่อมต่อ OAuth ใหม่",
      "Environment Variable Gates สำหรับเปิด/ปิด Provider แต่ละตัว",
    ],
  },
  {
    build: 26,
    timestamp: "2026-05-15T11:00:00.000Z",
    title: "ปรับปรุง Auth UX + Error Messages ภาษาไทย",
    improvements: [
      "แปล Error Messages เป็นภาษาไทยทุกกรณี",
      "Guest Mode — เข้าดูหนังสือสาธารณะโดยไม่ต้อง Login",
      "Onboarding Gate บังคับตั้งชื่อก่อนใช้งาน",
    ],
    fixes: [
      "แก้ปุ่ม OAuth ที่ไม่ทำงาน",
      "แก้ Duplicate Profile Issue หลัง Onboarding",
    ],
  },
  {
    build: 25,
    timestamp: "2026-05-14T16:00:00.000Z",
    title: "Writer Card Modal — ตำแหน่งและขนาดที่ถูกต้อง",
    fixes: [
      "แก้ Writer Card Modal ไม่อยู่กึ่งกลางบนจอเล็ก",
      "ปรับขนาด Modal เป็น 30rem สำหรับ Desktop",
    ],
  },
  {
    build: 24,
    timestamp: "2026-05-14T13:00:00.000Z",
    title: "เพิ่ม updated_at Column และ Timestamp Tracking",
    improvements: [
      "เพิ่ม updated_at ให้ Table books และ recipes",
      "ทุก Mutation Path บันทึก Timestamp ชัดเจน",
    ],
  },
  {
    build: 23,
    timestamp: "2026-05-14T10:00:00.000Z",
    title: "แก้ Book Cover Timestamp",
    fixes: [
      "Book Cover ไม่นำ created_at ของ Recipe มาคำนวณ MAX Timestamp อีกต่อไป",
      "แสดงเวลากิจกรรมล่าสุดที่ถูกต้องบน Book Cover",
    ],
  },
  {
    build: 22,
    timestamp: "2026-05-13T15:00:00.000Z",
    title: "Layout ส่วนผสมบนมือถือ",
    improvements: [
      "ออกแบบ Layout ส่วนผสมใหม่สำหรับจอมือถือ พร้อม Label แต่ละช่อง",
    ],
  },
  {
    build: 21,
    timestamp: "2026-05-13T12:00:00.000Z",
    title: "Book Cover Timestamp จาก Activity จริง",
    features: [
      "Book Cover แสดงเวลาจาก Activity ล่าสุด (max ของ Book + Recipe ทั้งหมด)",
    ],
  },
  {
    build: 20,
    timestamp: "2026-05-13T09:00:00.000Z",
    title: "รวม Metadata และ Writer Card Stats",
    improvements: [
      "Writer Card แสดง Stats เดียวกันทุกหน้า (Library, Settings, Book Reader)",
      "Book Count, Recipe Count, Public Count คำนวณแบบ Unified",
    ],
  },
  {
    build: 19,
    timestamp: "2026-05-12T16:00:00.000Z",
    title: "Writer Card ปุ่มปิด + Stats Badges + Recipe Timestamp",
    features: [
      "ปุ่ม X บน Writer Card Modal",
      "Stats Badges บน Writer Card (Books / Recipes / Shared)",
      "Recipe แสดง Timestamp อัปเดตล่าสุด",
    ],
  },
  {
    build: 18,
    timestamp: "2026-05-12T12:00:00.000Z",
    title: "แก้ YouTube Placement บน Portrait / Embedded Instruction",
    fixes: [
      "YouTube ปรากฏถูกตำแหน่งเมื่ออยู่ใน Portrait Mode หรือ Embedded Step",
    ],
  },
  {
    build: 17,
    timestamp: "2026-05-12T09:00:00.000Z",
    title: "แก้ YouTube Fit Check + Thumbnail Centering",
    fixes: [
      "แก้ YouTube Fit Check นับเกิน ทำให้ Thumbnail ไม่แสดง",
      "Thumbnail อยู่กึ่งกลางถูกต้องบน Page",
    ],
  },
  {
    build: 16,
    timestamp: "2026-05-11T16:00:00.000Z",
    title: "YouTube Two-Phase Placement + Step Image Sizing",
    improvements: [
      "วาง YouTube แบบ Two-Phase: ลอง Inline ก่อน ถ้าไม่พอค่อย Slot แยก",
      "Step Image ขนาดพอดีกับ Page ไม่ Overflow",
    ],
  },
  {
    build: 15,
    timestamp: "2026-05-11T13:00:00.000Z",
    title: "แก้ Pagination Regression + ESC Stack",
    fixes: [
      "แก้ Instruction Steps หายระหว่าง Pagination",
      "ESC ปิด Modal ตามลำดับ Stack ถูกต้อง",
      "Page Number แสดง Font Monospace ชัดเจน",
    ],
  },
  {
    build: 14,
    timestamp: "2026-05-11T09:00:00.000Z",
    title: "แก้ Book Reader — Double YouTube Block + Click Isolation",
    fixes: [
      "แก้ YouTube Block ซ้ำซ้อนบน Page เดียวกัน",
      "แก้ Click ทะลุ Modal ไปยัง Page ด้านหลัง",
    ],
  },
  {
    build: 13,
    timestamp: "2026-05-10T16:00:00.000Z",
    title: "Recipe UX — Layout มือถือ + Step Images + YouTube Thumbnail",
    features: [
      "Layout ส่วนผสมที่เหมาะสมบนมือถือ",
      "รูปภาพประกอบแต่ละ Step",
      "YouTube Thumbnail บน Book Reader",
    ],
  },
  {
    build: 12,
    timestamp: "2026-05-10T12:00:00.000Z",
    title: "Unit Combobox + Mobile Ingredient Layout + Step Images (Phase 1)",
    features: [
      "Combobox สำหรับเลือกหน่วยส่วนผสม",
      "Layout ส่วนผสมใหม่บนมือถือ",
      "รองรับรูปภาพในแต่ละ Step",
    ],
  },
  {
    build: 11,
    timestamp: "2026-05-09T16:00:00.000Z",
    title: "Drag & Drop + Canvas Measurement + YouTube Modal",
    features: [
      "ลาก Step เพื่อเรียงลำดับ",
      "YouTube Modal สำหรับดูวิดีโอประกอบ",
      "Canvas measureText สำหรับจัด Pagination ที่แม่นยำขึ้น",
    ],
  },
  {
    build: 10,
    timestamp: "2026-05-09T12:00:00.000Z",
    title: "Book Reader Pagination Engine",
    features: [
      "ระบบ Pagination แบบ Smart Content Flow",
      "Ingredients และ Instructions แสดงบน Page เดียวกันเมื่อพอดี",
      "รองรับ Step เยอะด้วยการแบ่ง Page อัตโนมัติ",
    ],
    improvements: [
      "Typography Scale ปรับตาม Viewport ด้วย vmin",
    ],
  },
  {
    build: 9,
    timestamp: "2026-05-08T16:00:00.000Z",
    title: "Magazine-Style Book Reader (Book Reader V2)",
    features: [
      "Book Reader ใหม่แบบ Magazine สไตล์",
      "Flipbook Animation พลิกหน้าสมจริง",
      "Hero Page + Detail Page สำหรับแต่ละ Recipe",
    ],
  },
  {
    build: 8,
    timestamp: "2026-05-08T12:00:00.000Z",
    title: "Parallax Effect + UI Polish",
    improvements: [
      "Parallax Effect บน Recipe Cover Image",
      "UI Polish รอบด้าน: Font, Spacing, Badges",
    ],
  },
  {
    build: 7,
    timestamp: "2026-05-07T16:00:00.000Z",
    title: "Step-by-Step Instructions + YouTube Links per Step",
    features: [
      "ระบบ Step ขั้นตอนแทน Textarea เดียว",
      "YouTube Link แนบได้ต่อ Step",
    ],
  },
  {
    build: 6,
    timestamp: "2026-05-07T12:00:00.000Z",
    title: "Ingredient Picker Row-Based",
    features: [
      "เพิ่มส่วนผสมแบบ Row (ชื่อ + ปริมาณ + หน่วย) แทน Textarea",
      "ลาก Row เพื่อเรียงลำดับส่วนผสม",
    ],
  },
  {
    build: 5,
    timestamp: "2026-05-06T16:00:00.000Z",
    title: "Avatar Preset Picker + Profile Settings",
    features: [
      "เลือก Avatar จาก Preset หรืออัปโหลดรูปเอง",
      "หน้า Profile Settings แก้ไขนามแฝงและ Bio",
    ],
    improvements: [
      "แก้ Avatar Flash และ Drag Highlight บนมือถือ",
    ],
  },
  {
    build: 4,
    timestamp: "2026-05-06T12:00:00.000Z",
    title: "Book Cover Editor + Color Themes",
    features: [
      "เลือกสีปกหนังสือจาก 8 ธีม",
      "แก้ไขชื่อและคำบรรยายหนังสือ",
    ],
  },
  {
    build: 3,
    timestamp: "2026-05-05T16:00:00.000Z",
    title: "Public Recipe Sharing + Writer Card",
    features: [
      "ตั้งค่า Recipe เป็น Public แชร์ให้ทุกคนเห็น",
      "Writer Card แสดงข้อมูลผู้เขียนบน Book ที่แชร์",
    ],
  },
  {
    build: 2,
    timestamp: "2026-05-05T12:00:00.000Z",
    title: "Recipe CRUD + Book Management",
    features: [
      "เพิ่ม แก้ไข ลบ Recipe",
      "จัดการหนังสือหลายเล่ม",
      "จัดเรียง Recipe ใน Book",
    ],
  },
  {
    build: 1,
    timestamp: "2026-05-04T12:00:00.000Z",
    title: "Recipe Vault — Launch",
    features: [
      "สร้างหนังสือสูตรอาหารส่วนตัว",
      "ระบบสมาชิกพื้นฐาน",
      "Library หน้าหลักแสดงหนังสือของตัวเอง",
    ],
  },
];
