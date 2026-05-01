export const AVATAR_ANIMALS = [
  { value: "🐱", name: "แมว",       bg: "#fde68a" },
  { value: "🐶", name: "หมา",       bg: "#bfdbfe" },
  { value: "🦊", name: "จิ้งจอก",  bg: "#fecaca" },
  { value: "🐼", name: "แพนด้า",   bg: "#d1fae5" },
  { value: "🐰", name: "กระต่าย",  bg: "#fbcfe8" },
  { value: "🐻", name: "หมี",       bg: "#fed7aa" },
  { value: "🐧", name: "เพนกวิน",  bg: "#c7d2fe" },
  { value: "🦌", name: "กวาง",      bg: "#d9f99d" },
  { value: "🦉", name: "นกฮูก",    bg: "#fef08a" },
  { value: "🐨", name: "โคอาล่า",  bg: "#e5e7eb" },
  { value: "🦔", name: "เม่น",      bg: "#fde68a" },
  { value: "🐹", name: "แฮมสเตอร์", bg: "#fbcfe8" },
] as const;

/** Returns true when the stored avatar value is an uploaded image URL */
export function isAvatarUrl(avatar: string | null | undefined): boolean {
  return !!avatar && avatar.startsWith("http");
}

/** Background colour for an emoji avatar (matches the grid palette) */
export function emojiAvatarBg(emoji: string): string {
  return AVATAR_ANIMALS.find(a => a.value === emoji)?.bg ?? "#fed7aa";
}
