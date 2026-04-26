"use client";

import { useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import Modal from "./Modal";
import BookCover from "./BookCover";
import BookCoverEditor from "./BookCoverEditor";
import BookReaderModalV2 from "./BookReaderModalV2";
import type { Book } from "@/lib/types";

interface BookWithCounts extends Book {
  recipe_count: number;
  public_count: number;
}

interface Props {
  myBooks: BookWithCounts[];
  publicBooks: BookWithCounts[];
  username: string;
}

export default function Library({ myBooks, publicBooks, username }: Props) {
  const [tab, setTab] = useState<"mine" | "public">("mine");
  const [newBookOpen, setNewBookOpen] = useState(false);
  const [openBook, setOpenBook] = useState<{ id: string; isOwner: boolean } | null>(null);

  const books = tab === "mine" ? myBooks : publicBooks;

  return (
    <div className="anim-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] tracking-[0.35em] text-stone-400 uppercase mb-3">Recipe Vault</p>
          <h1 className="text-3xl font-bold text-stone-800">
            {tab === "mine" ? `ชั้นหนังสือของ ${username}` : "สูตรสาธารณะ"}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {tab === "mine"
              ? `${myBooks.length} เล่ม · ${myBooks.reduce((a, b) => a + b.recipe_count, 0)} สูตรทั้งหมด`
              : `${publicBooks.length} เล่มที่ผู้ใช้แชร์ไว้`}
          </p>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-8 border-b border-stone-200">
        {(["mine", "public"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${
              tab === t
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            {t === "mine" ? "📚 ชั้นของฉัน" : "🌐 สาธารณะ"}
          </button>
        ))}
      </div>

      {/* Grid of books */}
      {books.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 mx-auto text-stone-200 mb-4" />
          <p className="text-stone-500 font-medium mb-1">
            {tab === "mine" ? "ยังไม่มีหนังสือในชั้น" : "ยังไม่มีหนังสือสาธารณะ"}
          </p>
          <p className="text-sm text-stone-400">
            {tab === "mine" ? "เริ่มสร้างหนังสือสูตรเล่มแรกของคุณ" : "หนังสือที่มีสูตรถูกแชร์จะแสดงที่นี่"}
          </p>
          {tab === "mine" && (
            <button
              onClick={() => setNewBookOpen(true)}
              className="mt-5 inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              สร้างหนังสือเล่มแรก
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 justify-items-center">
          {books.map((book, i) => (
            <div
              key={book.id}
              className="flex flex-col items-center anim-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <BookCover
                book={book}
                size="sm"
                publicCount={book.public_count}
                onClick={() => setOpenBook({ id: book.id, isOwner: tab === "mine" })}
              />
              <p className="mt-4 text-sm font-medium text-stone-700 text-center line-clamp-1 max-w-[160px]">
                {book.title}
              </p>
              <p className="text-xs text-stone-400">
                {tab === "public"
                  ? `${book.public_count} สูตรสาธารณะ`
                  : `${book.recipe_count} สูตร`}
              </p>
            </div>
          ))}

          {/* Add new book tile (mine tab only) */}
          {tab === "mine" && (
            <div className="flex flex-col items-center anim-fade-up"
                 style={{ animationDelay: `${books.length * 60}ms` }}>
              <button
                onClick={() => setNewBookOpen(true)}
                className="w-40 h-[220px] rounded-md border-2 border-dashed border-stone-300 hover:border-orange-400 bg-stone-50 hover:bg-orange-50 flex flex-col items-center justify-center gap-2 text-stone-400 hover:text-orange-500 transition-all group"
              >
                <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">เพิ่มหนังสือใหม่</span>
              </button>
              <p className="mt-4 text-sm text-stone-400 text-center">หนังสือเล่มใหม่</p>
            </div>
          )}
        </div>
      )}

      {/* New book modal */}
      <Modal
        open={newBookOpen}
        onClose={() => setNewBookOpen(false)}
        title="สร้างหนังสือสูตรใหม่"
        maxWidth="max-w-3xl"
      >
        <BookCoverEditor
          inModal
          onSuccess={(id) => { setNewBookOpen(false); setOpenBook({ id, isOwner: true }); }}
          onCancel={() => setNewBookOpen(false)}
        />
      </Modal>

      {/* Book reader modal */}
      <BookReaderModalV2
        bookId={openBook?.id ?? null}
        isOwner={openBook?.isOwner ?? false}
        onClose={() => setOpenBook(null)}
      />
    </div>
  );
}
