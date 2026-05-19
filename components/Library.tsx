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
import { useLocale } from "@/lib/locale";

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
  const { t } = useLocale();
  const lib = t.library;

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

  const displayName = currentUser?.display_name ?? "";

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
    const authorLabel = (b.bookAuthor?.display_name ?? "").toLowerCase();
    return b.title.toLowerCase().includes(q) || authorLabel.includes(q);
  });

  return (
    <div className="anim-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] tracking-[0.35em] text-muted uppercase mb-3">{lib.subtitle}</p>
          <h1 className="text-3xl font-bold text-foreground">
            {tab === "mine" ? lib.myShelfTpl.replace("{name}", displayName) : lib.publicTitle}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {tab === "mine"
              ? `${myBooks.length} ${lib.totalBooks} · ${myBooks.reduce((a, b) => a + b.recipe_count, 0)} ${lib.totalRecipes}`
              : `${publicBooks.length} ${lib.publicShared}`}
          </p>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-4 border-b border-outline">
        {!isGuest && (
          <button onClick={() => setTab("mine")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${tab === "mine" ? "border-orange-500 text-orange-600" : "border-transparent text-muted hover:text-foreground"}`}>
            {lib.myTab}
          </button>
        )}
        <button onClick={() => setTab("public")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${tab === "public" ? "border-orange-500 text-orange-600" : "border-transparent text-muted hover:text-foreground"}`}>
          {lib.publicTab}
        </button>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        {tab === "mine" && !isGuest ? (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input value={mySearch} onChange={e => setMySearch(e.target.value)}
              placeholder={lib.searchMy}
              className="w-full border border-outline rounded-xl pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-surface text-foreground placeholder:text-muted" />
            {mySearch && (
              <button onClick={() => setMySearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-secondary">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input value={pubSearch} onChange={e => setPubSearch(e.target.value)}
              placeholder={lib.searchPublic}
              className="w-full border border-outline rounded-xl pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-surface text-foreground placeholder:text-muted" />
            {pubSearch && (
              <button onClick={() => setPubSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-secondary">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid of books */}
      {books.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 mx-auto text-muted mb-4" />
          <p className="text-secondary font-medium mb-1">
            {tab === "mine" ? lib.emptyMyTitle : lib.emptyPublicTitle}
          </p>
          <p className="text-sm text-muted">
            {tab === "mine" ? lib.emptyMySubtitle : lib.emptyPublicSubtitle}
          </p>
          {tab === "mine" && !isGuest && (
            <div className="flex justify-center mt-10">
              <div className="flex flex-col items-center">
                <button onClick={() => requireAuth(() => setNewBookOpen(true))}
                  className="w-40 h-[220px] rounded-md border-2 border-dashed border-border hover:border-orange-400 bg-elevated hover:bg-orange-50 dark:hover:bg-orange-950/20 flex flex-col items-center justify-center gap-2 text-muted hover:text-orange-500 transition-all group">
                  <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium">{lib.createFirst}</span>
                </button>
                <p className="mt-4 text-sm text-muted text-center">{lib.newBookLabel}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 justify-items-center">
          {books.map((book, i) => {
            const bookWriter: WriterInfo = tab === "mine"
              ? (currentUser ?? { display_name: null, bio: null, avatar: null })
              : (book.bookAuthor ?? { display_name: null, bio: null, avatar: null });
            const authorLabel = bookWriter.display_name || undefined;

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
                    <p className="text-sm font-medium text-secondary text-left line-clamp-1">{book.title}</p>
                    <p className="text-xs text-muted">
                      {tab === "public" ? `${book.public_count} ${lib.publicSuffix}` : `${book.recipe_count} ${lib.recipeSuffix}`}
                    </p>
                  </div>

                  {tab === "mine" && !isGuest && (
                    <div ref={book.id === settingsBookId ? settingsRef : undefined} className="relative shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); setSettingsBookId(settingsBookId === book.id ? null : book.id); }}
                        className="w-7 h-7 rounded-full hover:bg-elevated flex items-center justify-center transition-colors text-muted hover:text-foreground"
                        aria-label={lib.bookSettings}>
                        <Settings className="w-3.5 h-3.5" />
                      </button>

                      {settingsBookId === book.id && (
                        <div className="absolute bottom-full right-0 mb-1 z-20 bg-surface rounded-2xl shadow-xl border border-border p-1.5 min-w-[12rem] flex flex-col gap-0.5 anim-scale-in">
                          <button onClick={() => { setSettingsBookId(null); setOpenBook({ id: book.id, isOwner: true, autoNewRecipe: true }); }}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl w-full text-left">
                            <Plus className="w-4 h-4 text-muted shrink-0" />
                            {lib.addRecipe}
                          </button>
                          <button onClick={() => { setSettingsBookId(null); setEditCoverBook(book); }}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl w-full text-left">
                            <Palette className="w-4 h-4 text-muted shrink-0" />
                            {lib.editCover}
                          </button>
                          <button onClick={() => { setSettingsBookId(null); setWriterCard(currentUser); }}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl w-full text-left">
                            <User className="w-4 h-4 text-muted shrink-0" />
                            {lib.viewWriterCard}
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
                className="w-40 h-[220px] rounded-md border-2 border-dashed border-border hover:border-orange-400 bg-elevated hover:bg-orange-50 dark:hover:bg-orange-950/20 flex flex-col items-center justify-center gap-2 text-muted hover:text-orange-500 transition-all group">
                <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">{lib.addBook}</span>
              </button>
              <p className="mt-4 text-sm text-muted text-center">{lib.newBookLabel}</p>
            </div>
          )}
        </div>
      )}

      {/* New book modal */}
      <Modal open={newBookOpen} onClose={() => setNewBookOpen(false)} title={lib.createBookTitle} maxWidth="max-w-3xl" disableBackdropClick>
        <BookCoverEditor author={displayName} inModal
          onSuccess={id => { setNewBookOpen(false); setOpenBook({ id, isOwner: true }); }}
          onCancel={() => setNewBookOpen(false)} />
      </Modal>

      {/* Edit cover modal */}
      <Modal open={!!editCoverBook} onClose={() => setEditCoverBook(null)} title={lib.editCoverTitle} maxWidth="max-w-3xl" disableBackdropClick>
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
