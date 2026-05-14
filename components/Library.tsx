"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, BookOpen, Settings, Palette, User, Search, X } from "lucide-react";
import Modal from "./Modal";
import BookCover from "./BookCover";
import BookCoverEditor from "./BookCoverEditor";
import BookReaderModalV2 from "./BookReaderModalV2";
import WriterCard from "./WriterCard";
import AuthModal from "./AuthModal";
import type { Book, WriterInfo } from "@/lib/types";

interface BookWithCounts extends Book {
  recipe_count: number;
  public_count: number;
  bookAuthor?: WriterInfo;
}

interface Props {
  myBooks: BookWithCounts[];
  publicBooks: BookWithCounts[];
  currentUser: WriterInfo | null;
}

export default function Library({ myBooks, publicBooks, currentUser }: Props) {
  const isGuest = !currentUser;
  const [tab, setTab] = useState<"mine" | "public">(isGuest ? "public" : "mine");
  const [newBookOpen, setNewBookOpen]   = useState(false);
  const [openBook, setOpenBook]         = useState<{ id: string; isOwner: boolean; autoNewRecipe?: boolean } | null>(null);
  const [settingsBookId, setSettingsBookId] = useState<string | null>(null);
  const [editCoverBook, setEditCoverBook]   = useState<BookWithCounts | null>(null);
  const [writerCard, setWriterCard]         = useState<WriterInfo | null>(null);
  const [authOpen, setAuthOpen]             = useState(false);
  const [mySearch, setMySearch]             = useState("");
  const [pubSearch, setPubSearch]           = useState("");
  const settingsRef = useRef<HTMLDivElement>(null);

  const displayName = currentUser?.display_name ?? "กระรอกสายลับ";

  useEffect(() => {
    if (!settingsBookId) return;
    function onDown(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node))
        setSettingsBookId(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [settingsBookId]);

  function requireAuth(action: () => void) {
    if (isGuest) { setAuthOpen(true); return; }
    action();
  }

  const rawBooks = tab === "mine" ? myBooks : publicBooks;

  // Client-side search filter
  const books = rawBooks.filter(b => {
    const q = (tab === "mine" ? mySearch : pubSearch).toLowerCase().trim();
    if (!q) return true;
    const authorLabel = (b.bookAuthor?.display_name ?? b.bookAuthor?.username ?? "").toLowerCase();
    return b.title.toLowerCase().includes(q) || authorLabel.includes(q);
  });

  return (
    <div className="anim-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] tracking-[0.35em] text-stone-400 uppercase mb-3">Recipe Vault</p>
          <h1 className="text-3xl font-bold text-stone-800">
            {tab === "mine" ? `ชั้นหนังสือของ ${displayName}` : "สูตรสาธารณะ"}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {tab === "mine"
              ? `${myBooks.length} เล่ม · ${myBooks.reduce((a, b) => a + b.recipe_count, 0)} สูตรทั้งหมด`
              : `${publicBooks.length} เล่มที่ผู้ใช้แชร์ไว้`}
          </p>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-4 border-b border-stone-200">
        {!isGuest && (
          <button onClick={() => setTab("mine")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${tab === "mine" ? "border-orange-500 text-orange-600" : "border-transparent text-stone-500 hover:text-stone-700"}`}>
            📚 ชั้นของฉัน
          </button>
        )}
        <button onClick={() => setTab("public")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${tab === "public" ? "border-orange-500 text-orange-600" : "border-transparent text-stone-500 hover:text-stone-700"}`}>
          🌐 สาธารณะ
        </button>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        {tab === "mine" && !isGuest ? (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input value={mySearch} onChange={e => setMySearch(e.target.value)}
              placeholder="ค้นหาหนังสือของฉัน…"
              className="w-full border border-stone-200 rounded-xl pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
            {mySearch && (
              <button onClick={() => setMySearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input value={pubSearch} onChange={e => setPubSearch(e.target.value)}
              placeholder="ค้นหาหนังสือ หรือนักเขียน…"
              className="w-full border border-stone-200 rounded-xl pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
            {pubSearch && (
              <button onClick={() => setPubSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid of books */}
      {books.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 mx-auto text-stone-200 mb-4" />
          <p className="text-stone-500 font-medium mb-1">
            {tab === "mine" ? "ยังไม่มีหนังสือในชั้น" : "ไม่พบหนังสือ"}
          </p>
          <p className="text-sm text-stone-400">
            {tab === "mine" ? "เริ่มสร้างหนังสือสูตรเล่มแรกของคุณ" : "ลองเปลี่ยนคำค้นหา หรือรอนักเขียนแชร์สูตร"}
          </p>
          {tab === "mine" && !isGuest && (
            <button onClick={() => requireAuth(() => setNewBookOpen(true))}
              className="mt-5 inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm">
              <Plus className="w-4 h-4" />
              สร้างหนังสือเล่มแรก
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 justify-items-center">
          {books.map((book, i) => {
            const bookWriter: WriterInfo = tab === "mine"
              ? (currentUser ?? { username: "", display_name: null, bio: null, avatar: null })
              : (book.bookAuthor ?? { username: "", display_name: null, bio: null, avatar: null });
            const authorLabel = (bookWriter.display_name ?? bookWriter.username) || undefined;

            return (
              <div key={book.id} className="flex flex-col items-center anim-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <BookCover
                  book={book} size="sm"
                  publicCount={book.public_count}
                  author={authorLabel}
                  onAuthorClick={authorLabel ? () => setWriterCard(bookWriter) : undefined}
                  onClick={() => setOpenBook({ id: book.id, isOwner: tab === "mine" })}
                />

                <div className="mt-4 flex items-start justify-between gap-1 w-full max-w-[160px]">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-700 text-left line-clamp-1">{book.title}</p>
                    <p className="text-xs text-stone-400">
                      {tab === "public" ? `${book.public_count} สูตรสาธารณะ` : `${book.recipe_count} สูตร`}
                    </p>
                  </div>

                  {tab === "mine" && !isGuest && (
                    <div ref={book.id === settingsBookId ? settingsRef : undefined} className="relative shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); setSettingsBookId(settingsBookId === book.id ? null : book.id); }}
                        className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors text-stone-400 hover:text-stone-600"
                        aria-label="ตั้งค่าหนังสือ">
                        <Settings className="w-3.5 h-3.5" />
                      </button>

                      {settingsBookId === book.id && (
                        <div className="absolute bottom-full right-0 mb-1 z-20 bg-white rounded-2xl shadow-xl border border-stone-100 p-1.5 min-w-[12rem] flex flex-col gap-0.5 anim-scale-in">
                          <button onClick={() => { setSettingsBookId(null); setOpenBook({ id: book.id, isOwner: true, autoNewRecipe: true }); }}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl w-full text-left">
                            <Plus className="w-4 h-4 text-stone-400 shrink-0" />
                            เพิ่มสูตรในเล่มนี้
                          </button>
                          <button onClick={() => { setSettingsBookId(null); setEditCoverBook(book); }}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl w-full text-left">
                            <Palette className="w-4 h-4 text-stone-400 shrink-0" />
                            แก้ไขปกหนังสือ
                          </button>
                          <button onClick={() => { setSettingsBookId(null); setWriterCard(currentUser); }}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl w-full text-left">
                            <User className="w-4 h-4 text-stone-400 shrink-0" />
                            ดูการ์ดนักเขียน
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add new book tile */}
          {tab === "mine" && !isGuest && (
            <div className="flex flex-col items-center anim-fade-up" style={{ animationDelay: `${books.length * 60}ms` }}>
              <button onClick={() => requireAuth(() => setNewBookOpen(true))}
                className="w-40 h-[220px] rounded-md border-2 border-dashed border-stone-300 hover:border-orange-400 bg-stone-50 hover:bg-orange-50 flex flex-col items-center justify-center gap-2 text-stone-400 hover:text-orange-500 transition-all group">
                <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">เพิ่มหนังสือใหม่</span>
              </button>
              <p className="mt-4 text-sm text-stone-400 text-center">หนังสือเล่มใหม่</p>
            </div>
          )}
        </div>
      )}

      {/* New book modal */}
      <Modal open={newBookOpen} onClose={() => setNewBookOpen(false)} title="สร้างหนังสือสูตรใหม่" maxWidth="max-w-3xl" disableBackdropClick>
        <BookCoverEditor author={displayName} inModal
          onSuccess={id => { setNewBookOpen(false); setOpenBook({ id, isOwner: true }); }}
          onCancel={() => setNewBookOpen(false)} />
      </Modal>

      {/* Edit cover modal */}
      <Modal open={!!editCoverBook} onClose={() => setEditCoverBook(null)} title="แก้ไขปกหนังสือ" maxWidth="max-w-3xl" disableBackdropClick>
        {editCoverBook && (
          <BookCoverEditor book={editCoverBook} author={displayName} inModal
            onSuccess={() => setEditCoverBook(null)} onCancel={() => setEditCoverBook(null)} />
        )}
      </Modal>

      {/* Book reader modal */}
      <BookReaderModalV2
        bookId={openBook?.id ?? null}
        isOwner={openBook?.isOwner ?? false}
        autoNewRecipe={openBook?.autoNewRecipe}
        onClose={() => setOpenBook(null)}
      />

      {/* Writer card modal */}
      <Modal open={!!writerCard} onClose={() => setWriterCard(null)} maxWidth="max-w-[30rem]">
        {writerCard && (
          <div className="rounded-2xl overflow-hidden">
            <WriterCard info={writerCard} onClose={() => setWriterCard(null)} />
          </div>
        )}
      </Modal>

      {/* Auth modal — triggered when guest tries a protected action */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
