import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.onboarding_complete) redirect("/");

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-3xl mb-4 shadow-lg shadow-orange-200">
            <span className="text-3xl">👨‍🍳</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-800">ยินดีต้อนรับ!</h1>
          <p className="text-stone-500 mt-2">ก่อนเริ่มใช้งาน กรุณาตั้งค่าโปรไฟล์นักเขียนของคุณ</p>
        </div>

        <OnboardingForm
          currentDisplayName={user.display_name}
          currentBio={user.bio}
          currentAvatar={user.avatar}
          currentUsername={user.display_name ?? user.email ?? ""}
        />
      </div>
    </div>
  );
}
