"use client";

import { useState, useTransition } from "react";
import { banUser, unbanUser, promoteUser, demoteUser } from "@/app/actions/auth";
import type { User, WriterInfo } from "@/lib/types";
import { Shield, ShieldOff, Crown, UserMinus, Search, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { isAvatarUrl } from "@/lib/avatar";
import WriterCard from "@/components/WriterCard";

function onlineStatus(lastSeen: string | null): "online" | "away" | "offline" {
  if (!lastSeen) return "offline";
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 2 * 60 * 1000) return "online";
  if (diff < 15 * 60 * 1000) return "away";
  return "offline";
}

const STATUS_DOT: Record<string, string> = {
  online:  "bg-green-400",
  away:    "bg-yellow-400",
  offline: "bg-stone-300",
};

function LastSeenLabel({ lastSeen }: { lastSeen: string | null }) {
  if (!lastSeen) return <span className="text-stone-300">ไม่เคยออนไลน์</span>;
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return <span className="text-green-500 font-medium">ออนไลน์อยู่</span>;
  if (mins < 60) return <span className="text-yellow-600">{mins} นาทีที่แล้ว</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span className="text-stone-400">{hrs} ชั่วโมงที่แล้ว</span>;
  return <span className="text-stone-300">{Math.floor(hrs / 24)} วันที่แล้ว</span>;
}

function Avatar({ user }: { user: User }) {
  const name = user.display_name ?? user.email ?? "?";
  const status = onlineStatus(user.last_seen);
  return (
    <div className="relative shrink-0">
      <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center" style={{ background: isAvatarUrl(user.avatar) ? "#f5f5f4" : "#f97316" }}>
        {isAvatarUrl(user.avatar)
          ? <img src={user.avatar!} alt={name} className="w-full h-full object-cover" draggable={false} />
          : <span className="text-white text-sm font-bold">{name[0].toUpperCase()}</span>
        }
      </div>
      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${STATUS_DOT[status]}`} />
    </div>
  );
}

function BanModal({ user, onConfirm, onClose }: { user: User; onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-base font-semibold text-stone-800">แบนผู้ใช้</h3>
        </div>
        <p className="text-sm text-stone-500 mb-4">
          คุณกำลังจะแบน <strong>{user.display_name ?? user.email ?? ""}</strong>
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="เหตุผล (ไม่บังคับ)"
          rows={3}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none resize-none mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
            ยกเลิก
          </button>
          <button onClick={() => onConfirm(reason)} className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
            แบน
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersClient({
  users: initialUsers,
  currentAdminId,
}: {
  users: User[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [previewUser, setPreviewUser] = useState<User | null>(null);
  const [pending, startTransition] = useTransition();

  function optimisticUpdate(id: string, patch: Partial<User>) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
  }

  function handleBanConfirm(reason: string) {
    if (!banTarget) return;
    const target = banTarget;
    setBanTarget(null);
    startTransition(async () => {
      const res = await banUser(target.id, reason);
      if ("error" in res) { toast.error(res.error); return; }
      optimisticUpdate(target.id, {
        status: "banned", banned_at: new Date().toISOString(),
        banned_reason: reason || null, banned_by: currentAdminId,
      });
      toast.success("แบนผู้ใช้แล้ว");
      router.refresh();
    });
  }

  function handleUnban(user: User) {
    startTransition(async () => {
      const res = await unbanUser(user.id);
      if ("error" in res) { toast.error(res.error); return; }
      optimisticUpdate(user.id, { status: "active", banned_at: null, banned_reason: null, banned_by: null });
      toast.success("ยกเลิกแบนแล้ว");
      router.refresh();
    });
  }

  function handlePromote(user: User) {
    startTransition(async () => {
      const res = await promoteUser(user.id);
      if ("error" in res) { toast.error(res.error); return; }
      optimisticUpdate(user.id, { role: "admin" });
      toast.success("เลื่อนเป็น Admin แล้ว");
      router.refresh();
    });
  }

  function handleDemote(user: User) {
    startTransition(async () => {
      const res = await demoteUser(user.id);
      if ("error" in res) { toast.error(res.error); return; }
      optimisticUpdate(user.id, { role: "user" });
      toast.success("ลดเป็น User แล้ว");
      router.refresh();
    });
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q
      || (u.display_name ?? "").toLowerCase().includes(q)
      || (u.email ?? "").toLowerCase().includes(q);
  });

  const previewInfo: WriterInfo | null = previewUser
    ? {
        display_name: previewUser.display_name,
        bio:          previewUser.bio,
        avatar:       previewUser.avatar,
        role:         previewUser.role,
        last_seen:    previewUser.last_seen,
      }
    : null;

  return (
    <>
      {banTarget && (
        <BanModal user={banTarget} onConfirm={handleBanConfirm} onClose={() => setBanTarget(null)} />
      )}

      {previewUser && previewInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setPreviewUser(null)}>
          <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <WriterCard info={previewInfo} onClose={() => setPreviewUser(null)} />
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อผู้ใช้ หรืออีเมล…"
          className="w-full border border-stone-200 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-white"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Users list */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-700">ผู้ใช้ทั้งหมด</h2>
          <span className="text-xs text-stone-400">{filtered.length} / {users.length}</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-sm text-stone-400 py-10">ไม่พบผู้ใช้</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {filtered.map(u => {
              const isSelf    = u.id === currentAdminId;
              const isBanned  = u.status === "banned";
              const isAdmin   = u.role === "admin";

              return (
                <li key={u.id} className={`flex items-center gap-3 px-5 py-3.5 ${isBanned ? "bg-red-50/60" : ""}`}>
                  {/* Avatar + click to preview */}
                  <button type="button" onClick={() => setPreviewUser(u)} className="shrink-0 hover:opacity-80 transition-opacity">
                    <Avatar user={u} />
                  </button>

                  {/* Identity */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button type="button" onClick={() => setPreviewUser(u)} className="text-sm font-semibold text-stone-800 hover:text-orange-500 transition-colors truncate">
                        {u.display_name ?? u.email ?? ""}
                      </button>
                      {isAdmin && (
                        <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold shrink-0">Admin</span>
                      )}
                      {isBanned && (
                        <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-semibold shrink-0">Banned</span>
                      )}
                      {isSelf && (
                        <span className="text-[10px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded-full font-semibold shrink-0">คุณ</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 truncate">{u.email ?? ""}</p>
                    <p className="text-xs mt-0.5">
                      <LastSeenLabel lastSeen={u.last_seen} />
                    </p>
                    {isBanned && u.banned_reason && (
                      <p className="text-xs text-red-400 mt-0.5 truncate">เหตุผล: {u.banned_reason}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {!isSelf && (
                    <div className="flex items-center gap-1 shrink-0">
                      {isBanned ? (
                        <button
                          onClick={() => handleUnban(u)}
                          disabled={pending}
                          title="ยกเลิกแบน"
                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors disabled:opacity-40"
                        >
                          <ShieldOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setBanTarget(u)}
                          disabled={pending}
                          title="แบน"
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}

                      {isAdmin ? (
                        <button
                          onClick={() => handleDemote(u)}
                          disabled={pending}
                          title="ลดเป็น User"
                          className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 transition-colors disabled:opacity-40"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePromote(u)}
                          disabled={pending}
                          title="เลื่อนเป็น Admin"
                          className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-50 transition-colors disabled:opacity-40"
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
