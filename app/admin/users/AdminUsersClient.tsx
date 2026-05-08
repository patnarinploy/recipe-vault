"use client";

import { useState, useTransition } from "react";
import { createUser, deleteUser } from "@/app/actions/auth";
import type { User } from "@/lib/types";
import { UserPlus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import LoadingButton from "@/components/ui/LoadingButton";

export default function AdminUsersClient({ users: initialUsers }: { users: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletesPending, setDeletesPending] = useState<Set<string>>(new Set());

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createUser(formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      toast.success("สร้างผู้ใช้แล้ว");
      router.refresh();
    });
  }

  async function handleDelete(userId: string) {
    setDeletesPending((s) => new Set(s).add(userId));
    const res = await deleteUser(userId);
    setDeletesPending((s) => { const n = new Set(s); n.delete(userId); return n; });
    setConfirmDeleteId(null);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("ลบผู้ใช้แล้ว");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  }

  return (
    <div className="space-y-6">
      {/* Create user form */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-stone-700 mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> สร้างผู้ใช้ใหม่
        </h2>
        <form action={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Username</label>
              <input name="username" required minLength={3} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="username" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
              <input name="password" type="password" required minLength={4} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="••••" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Role</label>
            <select name="role" className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <LoadingButton type="submit" pending={isPending} pendingLabel="กำลังสร้าง…" size="sm">
            สร้างผู้ใช้
          </LoadingButton>
        </form>
      </div>

      {/* Users list */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="text-base font-semibold text-stone-700">ผู้ใช้ทั้งหมด ({users.length})</h2>
        </div>
        <ul className="divide-y divide-stone-100">
          {users.map((u) => {
            const isConfirming = confirmDeleteId === u.id;
            const isDeleting   = deletesPending.has(u.id);
            return (
              <li key={u.id} className="flex items-center justify-between px-6 py-3.5 gap-3">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-stone-800">{u.username}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-orange-100 text-orange-600" : "bg-stone-100 text-stone-500"}`}>
                    {u.role}
                  </span>
                </div>

                {isConfirming ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-stone-500 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      ยืนยันลบ?
                    </span>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs px-2.5 py-1 border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-50"
                    >
                      ยกเลิก
                    </button>
                    <LoadingButton
                      size="sm"
                      variant="danger"
                      pending={isDeleting}
                      pendingLabel="ลบ…"
                      onClick={() => handleDelete(u.id)}
                    >
                      ลบ
                    </LoadingButton>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(u.id)}
                    disabled={isDeleting}
                    className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
