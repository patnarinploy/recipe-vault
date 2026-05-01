import { requireSession } from "@/lib/session";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const user = await requireSession();
  return <ProfileForm currentUsername={user.username} currentDisplayName={user.display_name} currentAvatar={user.avatar} />;
}
