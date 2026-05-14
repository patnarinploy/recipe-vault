import { requireSession } from "@/lib/session";
import AccountForm from "./AccountForm";

export default async function AccountPage() {
  const user = await requireSession();
  return (
    <AccountForm
      currentEmail={user.email}
      currentTel={user.tel}
      currentDob={user.dob}
      currentCountry={user.country}
      currentLanguage={user.language}
      currentSocialLinks={user.social_links}
    />
  );
}
