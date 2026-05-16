"use client";

import { useState, useTransition } from "react";
import { banUser, unbanUser, promoteUser, demoteUser } from "@/app/actions/auth";
import type { User, WriterInfo } from "@/lib/types";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/role";
import { Shield, ShieldOff, Crown, UserMinus, Search, X, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { isAvatarUrl } from "@/lib/avatar";
import WriterCard from "@/components/WriterCard";
import OnlineIndicator from "@/components/OnlineIndicator";
import { createClient } from "@/lib/supabase/client";

// ─── helpers ────────────────────────────────────────────────────────────────

function sortKey(u: User) {
  return (u.display_name ?? u.email ?? "").toLowerCase();
}

// ─── sub-components ──────────────────────────────────────────────────────────

function LastSeenLabel({ lastSeen }: { lastSeen: string | null }) {
  if (!lastSeen) return <span className="text-stone-300">ไม่เคยออนไลน์</span>;
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2)  return <span className="text-green-500 font-medium">ออนไลน์อยู่</span>;
  if (mins < 60) return <span className="text-yellow-600">{mins} นาทีที่แล้ว</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return <span className="text-stone-400">{hrs} ชั่วโมงที่แล้ว</span>;
  return <span className="text-stone-300">{Math.floor(hrs / 24)} วันที่แล้ว</span>;
}

function UserAvatar({ user }: { user: User }) {
  const name = user.display_name ?? user.email ?? "?";
  return (
    <div className="relative shrink-0">
      <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center"
           style={{ background: isAvatarUrl(user.avatar) ? "#f5f5f4" : "#f97316" }}>
        {isAvatarUrl(user.avatar)
          ? <img src={user.avatar!} alt={name} className="w-full h-full object-cover" draggable={false} />
          : <span className="text-white text-sm font-bold">{name[0].toUpperCase()}</span>}
      </div>
      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white shadow flex items-center justify-center shrink-0">
        <OnlineIndicator lastSeen={user.last_seen} size="sm" />
      </div>
    </div>
  );
}

interface UserRowProps {
  u: User;
  isSelf: boolean;
  showActions: boolean;
  banPending: boolean;
  rolePending: boolean;
  onPreview: () => void;
  onBan: () => void;
  onUnban: () => void;
  onPromote: () => void;
  onDemote: () => void;
}

function UserRow({ u, isSelf, showActions, banPending, rolePending, onPreview, onBan, onUnban, onPromote, onDemote }: UserRowProps) {
  const isBanned = u.status === "banned";
  const isAdmin  = u.role === "admin";
  return (
    <div className={`flex items-center gap-3 px-5 py-3.5 ${isBanned ? "bg-red-50/60" : ""}`}>
      <button type="button" onClick={onPreview} className="shrink-0 hover:opacity-80 transition-opacity">
        <UserAvatar user={u} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" onClick={onPreview}
            className="text-sm font-semibold text-stone-800 hover:text-orange-500 transition-colors truncate">
            {u.display_name ?? u.email ?? ""}
          </button>
          {isAdmin && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${ROLE_COLORS.admin}`}>
              {ROLE_LABELS.admin}
            </span>
          )}
          {isBanned && (
            <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-semibold shrink-0">Banned</span>
          )}
          {isSelf && (
            <span className="text-[10px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded-full font-semibold shrink-0">คุณ</span>
          )}
        </div>
        <p className="text-xs text-stone-400 truncate">{u.email ?? ""}</p>
        <p className="text-xs mt-0.5"><LastSeenLabel lastSeen={u.last_seen} /></p>
        {isBanned && u.banned_reason && (
          <p className="text-xs text-red-400 mt-0.5 truncate">เหตุผล: {u.banned_reason}</p>
        )}
      </div>

      {showActions && (
        <div className="flex items-center gap-1 shrink-0">
          {isBanned ? (
            <button onClick={onUnban} disabled={banPending} title="ยกเลิกแบน"
              className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors disabled:opacity-40">
              <ShieldOff className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={onBan} disabled={banPending} title="แบน"
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40">
              <Shield className="w-4 h-4" />
            </button>
          )}

          {isAdmin ? (
            <button onClick={onDemote} disabled={rolePending} title="ลดเป็น Writer"
              className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 transition-colors disabled:opacity-40">
              <UserMinus className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={onPromote} disabled={rolePending} title="เลื่อนเป็น Admin"
              className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-50 transition-colors disabled:opacity-40">
              <Crown className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
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
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
            ยกเลิก
          </button>
          <button onClick={() => onConfirm(reason)}
            className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
            แบน
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleModal({
  target, direction, onConfirm, onClose, pending,
}: {
  target: User;
  direction: "promote" | "demote";
  onConfirm: () => void;
  onClose: () => void;
  pending: boolean;
}) {
  const isPromote = direction === "promote";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          {isPromote
            ? <Crown className="w-5 h-5 text-amber-400" />
            : <UserMinus className="w-5 h-5 text-stone-400" />}
          <h3 className="text-base font-semibold text-stone-800">
            {isPromote ? "เลื่อนเป็น Admin?" : "ลดเป็น Writer?"}
          </h3>
        </div>
        <p className="text-sm text-stone-500 mb-1">
          {isPromote
            ? "ผู้ใช้นี้จะได้รับสิทธิ์การดูแลระบบแบบเต็ม"
            : "ผู้ใช้นี้จะสูญเสียสิทธิ์การดูแลระบบทั้งหมด"}
        </p>
        <p className="text-sm font-semibold text-stone-700 mb-5">
          {target.display_name ?? target.email ?? ""}
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} disabled={pending}
            className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50">
            ยกเลิก
          </button>
          <button onClick={onConfirm} disabled={pending}
            className={`flex-1 py-2 rounded-xl text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 ${
              isPromote ? "bg-amber-500 hover:bg-amber-600" : "bg-stone-500 hover:bg-stone-600"
            }`}>
            {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────

export default function AdminUsersClient({
  users: initialUsers,
  currentAdminId,
}: {
  users: User[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [users, setUsers]       = useState(initialUsers);
  const [search, setSearch]     = useState("");
  const [banTarget, setBanTarget]   = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ user: User; direction: "promote" | "demote" } | null>(null);
  const [previewUser,  setPreviewUser]  = useState<User | null>(null);
  const [previewStats, setPreviewStats] = useState<{ book_count: number; recipe_count: number; public_count: number } | null>(null);
  const [banPending,   startBanTransition]  = useTransition();
  const [rolePending,  startRoleTransition] = useTransition();

  function openPreview(u: User) {
    setPreviewUser(u);
    setPreviewStats(null);
    void (async () => {
      try {
        const sb = createClient();
        const { data: books } = await sb.from("books").select("id").eq("user_id", u.id);
        const bkIds = (books ?? []).map((b: { id: string }) => b.id);
        const [recipeRes, publicRes] = bkIds.length
          ? await Promise.all([
              sb.from("recipes").select("id", { count: "exact", head: true }).in("book_id", bkIds),
              sb.from("recipes").select("id", { count: "exact", head: true }).in("book_id", bkIds).eq("is_public", true),
            ])
          : [{ count: 0 }, { count: 0 }];
        setPreviewStats({
          book_count:   bkIds.length,
          recipe_count: recipeRes.count ?? 0,
          public_count: publicRes.count ?? 0,
        });
      } catch {}
    })();
  }

  function optimisticUpdate(id: string, patch: Partial<User>) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
  }

  function handleBanConfirm(reason: string) {
    if (!banTarget) return;
    const target = banTarget;
    setBanTarget(null);
    startBanTransition(async () => {
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

  function handleUnban(u: User) {
    startBanTransition(async () => {
      const res = await unbanUser(u.id);
      if ("error" in res) { toast.error(res.error); return; }
      optimisticUpdate(u.id, { status: "active", banned_at: null, banned_reason: null, banned_by: null });
      toast.success("ยกเลิกแบนแล้ว");
      router.refresh();
    });
  }

  function handleRoleConfirm() {
    if (!roleTarget) return;
    const { user: target, direction } = roleTarget;
    startRoleTransition(async () => {
      const res = direction === "promote" ? await promoteUser(target.id) : await demoteUser(target.id);
      if ("error" in res) {
        toast.error(res.error);
        setRoleTarget(null);
        return;
      }
      optimisticUpdate(target.id, { role: direction === "promote" ? "admin" : "user" });
      toast.success(direction === "promote" ? "เลื่อนเป็น Admin แล้ว" : "ลดเป็น Writer แล้ว");
      setRoleTarget(null);
      router.refresh();
    });
  }

  // Split self out; sort + filter only other users
  const selfUser   = users.find(u => u.id === currentAdminId) ?? null;
  const otherUsers = users.filter(u => u.id !== currentAdminId);

  const q = search.toLowerCase().trim();
  const filtered = [...otherUsers]
    .filter(u => !q
      || (u.display_name ?? "").toLowerCase().includes(q)
      || (u.email ?? "").toLowerCase().includes(q))
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b), "th"));

  const previewInfo: WriterInfo | null = previewUser
    ? {
        display_name: previewUser.display_name,
        bio:          previewUser.bio,
        avatar:       previewUser.avatar,
        role:         previewUser.role,
        status:       previewUser.status,
        last_seen:    previewUser.last_seen,
        created_at:   previewUser.created_at,
        ...previewStats,
      }
    : null;

  return (
    <>
      {/* Modals */}
      {banTarget && (
        <BanModal user={banTarget} onConfirm={handleBanConfirm} onClose={() => setBanTarget(null)} />
      )}

      {roleTarget && (
        <RoleModal
          target={roleTarget.user}
          direction={roleTarget.direction}
          onConfirm={handleRoleConfirm}
          onClose={() => { if (!rolePending) setRoleTarget(null); }}
          pending={rolePending}
        />
      )}

      {previewUser && previewInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setPreviewUser(null)}
        >
          <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <WriterCard info={previewInfo} statsLoading={previewStats === null} onClose={() => setPreviewUser(null)} />
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหานามแฝง หรืออีเมล…"
          className="w-full border border-stone-200 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-white"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Your Account */}
      {selfUser && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest px-1 mb-2">
            บัญชีของคุณ
          </p>
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <UserRow
              u={selfUser}
              isSelf
              showActions={false}
              banPending={banPending}
              rolePending={rolePending}
              onPreview={() => openPreview(selfUser)}
              onBan={() => {}}
              onUnban={() => {}}
              onPromote={() => {}}
              onDemote={() => {}}
            />
          </div>
        </div>
      )}

      {/* All other users */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
            ผู้ใช้ทั้งหมด
          </p>
          <span className="text-xs text-stone-400">{filtered.length} / {otherUsers.length}</span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-stone-400 py-10">ไม่พบผู้ใช้</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {filtered.map(u => (
                <li key={u.id}>
                  <UserRow
                    u={u}
                    isSelf={false}
                    showActions
                    banPending={banPending}
                    rolePending={rolePending}
                    onPreview={() => openPreview(u)}
                    onBan={() => setBanTarget(u)}
                    onUnban={() => handleUnban(u)}
                    onPromote={() => setRoleTarget({ user: u, direction: "promote" })}
                    onDemote={() => setRoleTarget({ user: u, direction: "demote" })}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
