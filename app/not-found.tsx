import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-32 text-stone-400">
      <div className="text-6xl mb-4">🍽️</div>
      <h2 className="text-xl font-semibold text-stone-600 mb-2">
        ไม่พบหน้านี้
      </h2>
      <p className="text-sm mb-6">อาจถูกลบหรือ URL ไม่ถูกต้อง</p>
      <Link
        href="/"
        className="inline-block bg-orange-500 text-white px-5 py-2.5 rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
      >
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
