import { requireSession } from "@/lib/session";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const user = await requireSession();
  return (
    <ProfileForm
      currentDisplayName={user.display_name}
      currentBio={user.bio}
      currentAvatar={user.avatar}
    />
  );
}
