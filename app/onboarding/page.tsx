import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import OnboardingForm from "./OnboardingForm";
import { ChefHat } from "lucide-react";

export default async function OnboardingPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.onboarding_complete) redirect("/");

  return (
    <div className="max-w-lg mx-auto py-4">
      {/* Page header — matches settings/profile style */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800">ยินดีต้อนรับ!</h1>
        </div>
        <p className="text-sm text-stone-400 ml-12">ก่อนเริ่มใช้งาน กรุณาตั้งค่าโปรไฟล์นักเขียนของคุณ</p>
      </div>

      <OnboardingForm
        currentDisplayName={user.display_name}
        currentBio={user.bio}
        currentAvatar={user.avatar}
        currentEmail={user.email}
      />
    </div>
  );
}
