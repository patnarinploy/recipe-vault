"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBook, updateBook, deleteBook } from "@/app/actions/books";
import { BOOK_COLORS, type Book } from "@/lib/types";
import BookCover from "./BookCover";
import { Trash2 } from "lucide-react";
import LoadingButton from "./ui/LoadingButton";

interface Props {
  book?: Book;
  author?: string;
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
  inModal?: boolean;
}

export default function BookCoverEditor({ book, author, onSuccess, onCancel, inModal }: Props) {
  const router = useRouter();
  const isEdit = !!book;
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const defaultTitle = author ? `หนังสือของ${author}` : "";
  const [form, setForm] = useState({
    title:       book?.title    ?? defaultTitle,
    subtitle:    book?.subtitle ?? "",
    tagline:     book?.tagline  ?? "",
    cover_color: book?.cover_color ?? "#6b7c5b",
  });

  const previewBook: Book = {
    id: "preview",
    user_id: "preview",
    title: form.title || "Untitled",
    subtitle: form.subtitle || null,
    tagline: form.tagline || null,
    cover_color: form.cover_color,
    created_at: new Date().toISOString(),
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("กรุณาใส่ชื่อหนังสือ");
      return;
    }
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      tagline: form.tagline.trim() || null,
      cover_color: form.cover_color,
    };
    startTransition(async () => {
      const res = isEdit
        ? await updateBook(book.id, payload)
        : await createBook(payload);
      if ("error" in res) { toast.error(res.error); return; }
      toast.success(isEdit ? "บันทึกการแก้ไขแล้ว" : "สร้างหนังสือใหม่แล้ว");
      const resultId = isEdit ? book.id : ("id" in res ? res.id : "");
      if (onSuccess) onSuccess(resultId);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!book) return;
    startTransition(async () => {
      const res = await deleteBook(book.id);
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("ลบหนังสือแล้ว");
      onCancel?.();
      router.refresh();
    });
  }

  const cancel = onCancel ?? (() => router.back());
  const inputCls = "w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white";
  const labelCls = "block text-sm font-medium text-stone-700 mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        inModal
          ? "bg-white rounded-b-2xl border border-stone-100 border-t-0 shadow-xl overflow-hidden"
          : "bg-white rounded-2xl border border-stone-100 shadow-sm"
      }
    >
      <div className={inModal ? "p-6 sm:p-8 max-h-[calc(100vh-8rem)] overflow-y-auto" : "p-6"}>
        {/* Preview + fields */}
        <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start mb-8">
          <div className="shrink-0">
            <BookCover book={previewBook} size="md" author={author} />
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className={labelCls}>Tagline (ด้านบน)</label>
              <input
                value={form.tagline}
                onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
                maxLength={40}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>ชื่อหนังสือ *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder={defaultTitle || "ชื่อหนังสือ"}
                maxLength={30}
                required
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Subtitle (ด้านล่าง)</label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                maxLength={60}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Color picker */}
        <div className="mb-6">
          <label className={labelCls}>สีปก</label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
            {BOOK_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, cover_color: c.value }))}
                className={`relative w-full aspect-square rounded-xl transition-all ${
                  form.cover_color === c.value ? "ring-2 ring-offset-2 ring-orange-400 scale-105" : "hover:scale-105"
                }`}
                style={{ background: c.value }}
                title={c.name}
              >
                <span className="sr-only">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {isEdit && (
            confirmDelete ? (
              <div className="flex-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 border border-stone-200 text-stone-600 rounded-xl py-2.5 text-sm hover:bg-stone-50"
                >
                  ยกเลิกลบ
                </button>
                <LoadingButton
                  type="button"
                  onClick={handleDelete}
                  pending={isPending}
                  pendingLabel="กำลังลบ…"
                  variant="danger"
                  className="flex-1"
                >
                  ยืนยันลบ
                </LoadingButton>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="border border-red-200 text-red-500 rounded-xl px-4 py-2.5 text-sm hover:bg-red-50 flex items-center gap-1.5"
                title="ลบหนังสือ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}
          {!confirmDelete && (
            <>
              <button
                type="button"
                onClick={cancel}
                className="flex-1 border border-stone-200 text-stone-600 rounded-xl py-2.5 text-sm hover:bg-stone-50"
              >
                ยกเลิก
              </button>
              <LoadingButton
                type="submit"
                pending={isPending}
                pendingLabel="กำลังบันทึก…"
                className="flex-1"
              >
                {isEdit ? "บันทึก" : "สร้างหนังสือ"}
              </LoadingButton>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
