"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DropdownContent } from "./ui/dropdown-menu";
import { Plus, BookOpen, Settings, Palette, User, Search, X, Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import BookCover from "./BookCover";
import BookCoverEditor from "./BookCoverEditor";
import BookReaderModalV2 from "./BookReaderModalV2";
import WriterCardModal from "./WriterCardModal";
import RecipeForm from "./RecipeForm";
import AuthModal from "./AuthModal";
import type { Book, WriterInfo, PresetUnit, PresetCategory } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale } from "@/lib/locale";
import { FAVORITES_BOOK_ID } from "./BookReaderV2";
import {
  getUserPresetUnits,
  getUserPresetCategories,
  getUserPresetIngredients,
} from "@/app/actions/user-presets";
import { createClient } from "@/lib/supabase/client";

interface BookWithCounts extends Book {
  recipe_count: number;
  public_count: number;
  bookAuthor?: WriterInfo;
}

interface Props {
  myBooks: BookWithCounts[];
  publicBooks: BookWithCounts[];
  followingBooks: BookWithCounts[];
  currentUser: WriterInfo | null;
  favoriteCount: number;
  shoppingCount: number;
}

export default function Library({ myBooks, publicBooks, followingBooks, currentUser, favoriteCount, shoppingCount }: Props) {
  const { t } = useLocale();
  const lib = t.library;
  const router = useRouter();

  const isGuest = !currentUser;
  const [tab, setTab] = useState<"mine" | "public" | "following">(isGuest ? "public" : "mine");

  // When the user logs out, props change but the component stays mounted — reset to public tab
  useEffect(() => {
    if (isGuest) setTab("public");
  }, [isGuest]);
  const [newBookOpen, setNewBookOpen]   = useState(false);
  const [openBook, setOpenBook]         = useState<{ id: string; isOwner: boolean } | null>(null);
  const [settingsBookId, setSettingsBookId] = useState<string | null>(null);
  const [editCoverBook, setEditCoverBook]   = useState<BookWithCounts | null>(null);
  const [writerCard, setWriterCard]           = useState<WriterInfo | null>(null);
  const [writerCardLoading, setWriterCardLoading] = useState(false);
  const [authOpen, setAuthOpen]               = useState(false);

  // Opens WriterCard and fetches follower_count + is_following client-side.
  // Always fetches follower_count (including own card). Skips is_following only
  // when viewer is the same as the target or viewer is a guest.
  const openWriterCard = useCallback(async (info: WriterInfo) => {
    setWriterCard(info);
    setWriterCardLoading(true);
    const viewerId = currentUser?.user_id;
    const targetId = info.user_id;
    if (!targetId) { setWriterCardLoading(false); return; }
    const sb = createClient();
    const isSelf = viewerId === targetId;
    const [followerRes, followRes] = await Promise.all([
      sb.from("user_follows").select("id", { count: "exact", head: true }).eq("following_id", targetId),
      (!isSelf && viewerId)
        ? sb.from("user_follows").select("id").eq("follower_id", viewerId).eq("following_id", targetId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setWriterCard(prev => prev?.user_id === targetId ? {
      ...prev,
      is_following: !!(followRes as { data: unknown }).data,
      follower_count: followerRes.count ?? 0,
    } : prev);
    setWriterCardLoading(false);
  }, [currentUser?.user_id]);
  const [mySearch, setMySearch]             = useState("");
  const [pubSearch, setPubSearch]           = useState("");

  // Quick-add recipe: open RecipeForm directly without opening the book reader
  const [quickAddBookId, setQuickAddBookId] = useState<string | null>(null);
  const [qaPresetUnits,  setQaPresetUnits]  = useState<PresetUnit[]>([]);
  const [qaPresetCats,   setQaPresetCats]   = useState<PresetCategory[]>([]);
  const [qaIngNames,     setQaIngNames]     = useState<string[]>([]);

  useEffect(() => {
    if (!quickAddBookId) return;
    Promise.all([getUserPresetUnits(), getUserPresetCategories(), getUserPresetIngredients()])
      .then(([units, cats, ings]) => {
        setQaPresetUnits(units);
        setQaPresetCats(cats);
        setQaIngNames(ings.map(i => i.name_th));
      });
  }, [quickAddBookId]);
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

  const rawBooks = tab === "mine" ? myBooks : tab === "following" ? followingBooks : publicBooks;

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
            {tab === "mine" ? lib.myShelfTpl.replace("{name}", displayName) : tab === "following" ? lib.followingBooksTitle : lib.publicTitle}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {tab === "mine"
              ? `${myBooks.length} ${lib.totalBooks} · ${myBooks.reduce((a, b) => a + b.recipe_count, 0)} ${lib.totalRecipes}`
              : tab === "following"
              ? `${followingBooks.length} ${lib.totalBooks}`
              : `${publicBooks.length} ${lib.publicShared}`}
          </p>
        </div>
      </div>

      {/* Tab */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "mine" | "public" | "following")} className="mb-4">
        <TabsList>
          {!isGuest && <TabsTrigger value="mine">{lib.myTab}</TabsTrigger>}
          <TabsTrigger value="public">{lib.publicTab}</TabsTrigger>
          {!isGuest && <TabsTrigger value="following">{lib.followingTab}</TabsTrigger>}
        </TabsList>
      </Tabs>

      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
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
        ) : tab === "following" ? null : (
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

      {/* Favorites virtual book + shopping list — only shown in "mine" tab for logged-in users */}
      {tab === "mine" && !isGuest && (
        <div className="mb-8 flex flex-wrap gap-6">
          <div
            className="inline-flex items-center gap-3 cursor-pointer group"
            onClick={() => setOpenBook({ id: FAVORITES_BOOK_ID, isOwner: false })}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:scale-110"
              style={{ background: "#c0392b" }}
            >
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-red-600 transition-colors">
                {lib.favoritesBook}
              </p>
              <p className="text-xs text-muted">
                {lib.favoritesCount.replace("{n}", String(favoriteCount))}
              </p>
            </div>
          </div>

          <Link href="/shopping" className="inline-flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 bg-emerald-600">
              <ShoppingCart className="w-5 h-5 text-white" />
              {shoppingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {shoppingCount > 9 ? "9+" : shoppingCount}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                {lib.viewShoppingList}
              </p>
              <p className="text-xs text-muted">
                {lib.shoppingListCount.replace("{n}", String(shoppingCount))}
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Grid of books */}
      {books.length === 0 ? (
        <>
          {/* Search returned nothing — show "not found" */}
          {rawBooks.length > 0 && (
            <div className="text-center py-20">
              <p className="text-secondary font-medium">{lib.searchNoResults}</p>
            </div>
          )}

          {/* Truly empty shelf — show only create card, no icon/text */}
          {rawBooks.length === 0 && tab === "mine" && !isGuest && (
            <div className="flex justify-center mt-4">
              <div className="flex flex-col items-center">
                <button onClick={() => requireAuth(() => setNewBookOpen(true))}
                  className="w-40 h-[220px] rounded-md border-2 border-dashed border-outline hover:border-orange-400 bg-elevated hover:bg-orange-50 dark:hover:bg-orange-950/20 flex flex-col items-center justify-center gap-2 text-muted hover:text-orange-500 transition-all group">
                  <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium">{lib.createFirst}</span>
                </button>
                <p className="mt-4 text-sm text-muted text-center">{lib.newBookLabel}</p>
              </div>
            </div>
          )}

          {/* Public tab: no books at all */}
          {rawBooks.length === 0 && tab === "public" && (
            <div className="text-center py-20">
              <p className="text-secondary font-medium mb-1">{lib.emptyPublicTitle}</p>
              <p className="text-sm text-muted">{lib.emptyPublicSubtitle}</p>
            </div>
          )}

          {/* Following tab: not following anyone yet */}
          {rawBooks.length === 0 && tab === "following" && (
            <div className="text-center py-20">
              <p className="text-secondary font-medium mb-1">{lib.followingEmpty}</p>
              <p className="text-sm text-muted">{lib.followingEmptySub}</p>
            </div>
          )}
        </>
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
                  onAuthorClick={authorLabel ? () => openWriterCard(bookWriter) : undefined}
                  onClick={() => setOpenBook({ id: book.id, isOwner: tab === "mine" })}
                />

                <div className="mt-4 flex items-start justify-between gap-1 w-full max-w-[160px]">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-secondary text-left line-clamp-1">{book.title}</p>
                    <p className="text-xs text-muted">
                      {tab === "public" || tab === "following" ? `${book.public_count} ${lib.publicSuffix}` : `${book.recipe_count} ${lib.recipeSuffix}`}
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

                      <DropdownContent
                        open={settingsBookId === book.id}
                        origin="bottom right"
                        className="absolute bottom-full right-0 mb-1 z-20 min-w-[12rem]"
                      >
                        <button onClick={() => { setSettingsBookId(null); setQuickAddBookId(book.id); }}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl w-full text-left">
                          <Plus className="w-4 h-4 text-muted shrink-0" />
                          {lib.addRecipe}
                        </button>
                        <button onClick={() => { setSettingsBookId(null); setEditCoverBook(book); }}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl w-full text-left">
                          <Palette className="w-4 h-4 text-muted shrink-0" />
                          {lib.editCover}
                        </button>
                        <button onClick={() => { setSettingsBookId(null); if (currentUser) openWriterCard(currentUser); }}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl w-full text-left">
                          <User className="w-4 h-4 text-muted shrink-0" />
                          {lib.viewWriterCard}
                        </button>
                      </DropdownContent>
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
                className="w-40 h-[220px] rounded-md border-2 border-dashed border-outline hover:border-orange-400 bg-elevated hover:bg-orange-50 dark:hover:bg-orange-950/20 flex flex-col items-center justify-center gap-2 text-muted hover:text-orange-500 transition-all group">
                <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">{lib.addBook}</span>
              </button>
              <p className="mt-4 text-sm text-muted text-center">{lib.newBookLabel}</p>
            </div>
          )}
        </div>
      )}

      </motion.div>
      </AnimatePresence>

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
        onClose={() => setOpenBook(null)}
      />

      {/* Quick-add recipe modal — opens directly without loading the book reader */}
      <Modal
        open={!!quickAddBookId}
        onClose={() => setQuickAddBookId(null)}
        title={lib.addRecipe}
        disableBackdropClick
      >
        {quickAddBookId && (
          <RecipeForm
            bookId={quickAddBookId}
            inModal
            presetUnits={qaPresetUnits}
            presetCategories={qaPresetCats}
            ingredientNameOptions={qaIngNames}
            onSuccess={() => { setQuickAddBookId(null); router.refresh(); }}
            onCancel={() => setQuickAddBookId(null)}
          />
        )}
      </Modal>

      {/* Writer card modal */}
      <WriterCardModal open={!!writerCard} onClose={() => setWriterCard(null)} info={writerCard} currentUserId={currentUser?.user_id} statsLoading={writerCardLoading} />

      {/* Auth modal — triggered when guest tries a protected action */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
