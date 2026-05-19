"use client";

import { useState, useTransition } from "react";
import { banUser, unbanUser, promoteUser, demoteUser } from "@/app/actions/auth";
import type { User, WriterInfo } from "@/lib/types";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/role";
import { Ban, ShieldOff, Crown, UserMinus, Search, X, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { isAvatarUrl } from "@/lib/avatar";
import WriterCard from "@/components/WriterCard";
import OnlineIndicator from "@/components/OnlineIndicator";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/locale";

// ─── helpers ────────────────────────────────────────────────────────────────

function sortKey(u: User) {
  return (u.display_name ?? u.email ?? "").toLowerCase();
}

// ─── sub-components ──────────────────────────────────────────────────────────

function LastSeenLabel({ lastSeen }: { lastSeen: string | null }) {
  const { t } = useLocale();
  const adm = t.admin.users;
  if (!lastSeen) return <span className="text-muted">{adm.neverOnline}</span>;
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2)  return <span className="text-green-500 font-medium">{adm.onlineNow}</span>;
  if (mins < 60) return <span className="text-yellow-600">{adm.minsAgo.replace("{n}", String(mins))}</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return <span className="text-muted">{adm.hrsAgo.replace("{n}", String(hrs))}</span>;
  return <span className="text-muted">{adm.daysAgo.replace("{n}", String(Math.floor(hrs / 24)))}</span>;
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
      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-surface shadow flex items-center justify-center shrink-0">
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
  youLabel: string;
  bannedReasonLabel: string;
  banTitle: string;
  unbanTitle: string;
  promoteTitle: string;
  demoteTitle: string;
  onPreview: () => void;
  onBan: () => void;
  onUnban: () => void;
  onPromote: () => void;
  onDemote: () => void;
}

function UserRow({ u, isSelf, showActions, banPending, rolePending, youLabel, bannedReasonLabel, banTitle, unbanTitle, promoteTitle, demoteTitle, onPreview, onBan, onUnban, onPromote, onDemote }: UserRowProps) {
  const isBanned = u.status === "banned";
  const isAdmin  = u.role === "admin";
  return (
    <div className={`flex items-center gap-3 px-5 py-3.5 ${isBanned ? "bg-red-50/60 dark:bg-red-950/20" : ""}`}>
      <button type="button" onClick={onPreview} className="shrink-0 hover:opacity-80 transition-opacity">
        <UserAvatar user={u} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" onClick={onPreview}
            className="text-sm font-semibold text-foreground hover:text-orange-500 transition-colors truncate">
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
            <span className="text-[10px] bg-elevated text-muted px-1.5 py-0.5 rounded-full font-semibold shrink-0">{youLabel}</span>
          )}
        </div>
        <p className="text-xs text-muted truncate">{u.email ?? ""}</p>
        <p className="text-xs mt-0.5"><LastSeenLabel lastSeen={u.last_seen} /></p>
        {isBanned && u.banned_reason && (
          <p className="text-xs text-red-400 mt-0.5 truncate">{bannedReasonLabel}: {u.banned_reason}</p>
        )}
      </div>

      {showActions && (
        <div className="flex items-center gap-1 shrink-0">
          {isBanned ? (
            <button onClick={onUnban} disabled={banPending} title={unbanTitle}
              className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors disabled:opacity-40">
              <ShieldOff className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={onBan} disabled={banPending} title={banTitle}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-40">
              <Ban className="w-4 h-4" />
            </button>
          )}

          {isAdmin ? (
            <button onClick={onDemote} disabled={rolePending} title={demoteTitle}
              className="p-1.5 rounded-lg text-muted hover:bg-elevated transition-colors disabled:opacity-40">
              <UserMinus className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={onPromote} disabled={rolePending} title={promoteTitle}
              className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors disabled:opacity-40">
              <Crown className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BanModal({ user, onConfirm, onClose, strings }: {
  user: User;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  strings: { banUser: string; banConfirm: string; banReason: string; cancel: string; banBtn: string };
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-base font-semibold text-foreground">{strings.banUser}</h3>
        </div>
        <p className="text-sm text-secondary mb-4">
          {strings.banConfirm} <strong>{user.display_name ?? user.email ?? ""}</strong>
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder={strings.banReason}
          rows={3}
          className="w-full border border-outline rounded-xl px-4 py-2.5 text-sm bg-surface text-foreground focus:ring-2 focus:ring-red-400 focus:outline-none resize-none mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-outline text-sm text-secondary hover:bg-elevated transition-colors">
            {strings.cancel}
          </button>
          <button onClick={() => onConfirm(reason)}
            className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
            {strings.banBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleModal({
  target, direction, onConfirm, onClose, pending, strings,
}: {
  target: User;
  direction: "promote" | "demote";
  onConfirm: () => void;
  onClose: () => void;
  pending: boolean;
  strings: { promote: string; demote: string; promoteMsg: string; demoteMsg: string; cancel: string; confirm: string };
}) {
  const isPromote = direction === "promote";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          {isPromote
            ? <Crown className="w-5 h-5 text-amber-400" />
            : <UserMinus className="w-5 h-5 text-muted" />}
          <h3 className="text-base font-semibold text-foreground">
            {isPromote ? strings.promote : strings.demote}
          </h3>
        </div>
        <p className="text-sm text-secondary mb-1">
          {isPromote ? strings.promoteMsg : strings.demoteMsg}
        </p>
        <p className="text-sm font-semibold text-foreground mb-5">
          {target.display_name ?? target.email ?? ""}
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} disabled={pending}
            className="flex-1 py-2 rounded-xl border border-outline text-sm text-secondary hover:bg-elevated transition-colors disabled:opacity-50">
            {strings.cancel}
          </button>
          <button onClick={onConfirm} disabled={pending}
            className={`flex-1 py-2 rounded-xl text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 ${
              isPromote ? "bg-amber-500 hover:bg-amber-600" : "bg-stone-500 hover:bg-stone-600"
            }`}>
            {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {strings.confirm}
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
  const { t } = useLocale();
  const adm = t.admin.users;

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
      toast.success(adm.bannedToast);
      router.refresh();
    });
  }

  function handleUnban(u: User) {
    startBanTransition(async () => {
      const res = await unbanUser(u.id);
      if ("error" in res) { toast.error(res.error); return; }
      optimisticUpdate(u.id, { status: "active", banned_at: null, banned_reason: null, banned_by: null });
      toast.success(adm.unbannedToast);
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
      toast.success(direction === "promote" ? adm.promotedToast : adm.demotedToast);
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

  const banStrings = {
    banUser:    adm.banUser,
    banConfirm: adm.banConfirm,
    banReason:  adm.banReason,
    cancel:     t.common.cancel,
    banBtn:     adm.banBtn,
  };

  const roleStrings = {
    promote:    adm.promote,
    demote:     adm.demote,
    promoteMsg: adm.promoteMsg,
    demoteMsg:  adm.demoteMsg,
    cancel:     t.common.cancel,
    confirm:    t.common.confirm,
  };

  return (
    <>
      {/* Modals */}
      {banTarget && (
        <BanModal user={banTarget} onConfirm={handleBanConfirm} onClose={() => setBanTarget(null)} strings={banStrings} />
      )}

      {roleTarget && (
        <RoleModal
          target={roleTarget.user}
          direction={roleTarget.direction}
          onConfirm={handleRoleConfirm}
          onClose={() => { if (!rolePending) setRoleTarget(null); }}
          pending={rolePending}
          strings={roleStrings}
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={adm.search}
          className="w-full border border-outline rounded-xl pl-9 pr-9 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-surface text-foreground placeholder:text-muted"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Your Account */}
      {selfUser && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-widest px-1 mb-2">
            {adm.yourAccount}
          </p>
          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            <UserRow
              u={selfUser}
              isSelf
              showActions={false}
              banPending={banPending}
              rolePending={rolePending}
              youLabel={adm.you}
              bannedReasonLabel={t.common.bannedReason}
              banTitle={adm.banUser}
              unbanTitle={adm.unbanUser}
              promoteTitle={adm.promote}
              demoteTitle={adm.demote}
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
          <p className="text-[11px] font-semibold text-muted uppercase tracking-widest">
            {adm.allUsers}
          </p>
          <span className="text-xs text-muted">{filtered.length} / {otherUsers.length}</span>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted py-10">{adm.noUsers}</p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map(u => (
                <li key={u.id}>
                  <UserRow
                    u={u}
                    isSelf={false}
                    showActions
                    banPending={banPending}
                    rolePending={rolePending}
                    youLabel={adm.you}
                    bannedReasonLabel={t.common.bannedReason}
                    banTitle={adm.banUser}
                    unbanTitle={adm.unbanUser}
                    promoteTitle={adm.promote}
                    demoteTitle={adm.demote}
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
