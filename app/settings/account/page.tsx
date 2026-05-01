import { requireSession } from "@/lib/session";
import AccountForm from "./AccountForm";

export default async function AccountPage() {
  const user = await requireSession();
  return (
    <AccountForm
      currentUsername={user.username}
      currentEmail={user.email}
      currentTel={user.tel}
    />
  );
}
