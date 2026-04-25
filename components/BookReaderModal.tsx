"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import BookReader from "./BookReader";
import { SkeletonBookCover } from "./Skeleton";
import { getBookWithRecipes } from "@/app/actions/books";
import type { Book, Recipe } from "@/lib/types";
import toast from "react-hot-toast";

interface Props {
  bookId: string | null;
  onClose: () => void;
}

export default function BookReaderModal({ bookId, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ book: Book; recipes: Recipe[]; isOwner: boolean } | null>(null);

  useEffect(() => {
    if (!bookId) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    setData(null);
    getBookWithRecipes(bookId).then((res) => {
      if (cancelled) return;
      if ("error" in res) {
        toast.error(res.error);
        onClose();
      } else {
        setData(res);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [bookId, onClose]);

  // When modal closes, refresh server components so Library counts update
  function handleClose() {
    onClose();
    router.refresh();
  }

  return (
    <Modal open={!!bookId} onClose={handleClose} fullscreen hideChrome>
      {loading && <SkeletonBookCover />}
      {!loading && data && (
        <BookReader
          book={data.book}
          recipes={data.recipes}
          isOwner={data.isOwner}
          onClose={handleClose}
        />
      )}
    </Modal>
  );
}
