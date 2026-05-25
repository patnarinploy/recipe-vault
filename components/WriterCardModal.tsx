"use client";

import Modal from "./Modal";
import WriterCard from "./WriterCard";
import type { WriterInfo } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  info: WriterInfo | null;
  currentUserId?: string | null;
  statsLoading?: boolean;
}

export default function WriterCardModal({ open, onClose, info, currentUserId, statsLoading }: Props) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-[30rem]">
      {info && (
        <WriterCard
          info={info}
          onClose={onClose}
          currentUserId={currentUserId}
          statsLoading={statsLoading}
        />
      )}
    </Modal>
  );
}
