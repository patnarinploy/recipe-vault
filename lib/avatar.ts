export const AVATAR_OPTIONS = [
  { seed: "Mittens",  name: "แมว" },
  { seed: "Rex",      name: "หมา" },
  { seed: "Foxy",     name: "จิ้งจอก" },
  { seed: "Panda",    name: "แพนด้า" },
  { seed: "Bunnyhop", name: "กระต่าย" },
  { seed: "Teddy",    name: "หมี" },
  { seed: "Waddles",  name: "เพนกวิน" },
  { seed: "Bucky",    name: "กวาง" },
  { seed: "Hootie",   name: "นกฮูก" },
  { seed: "Koko",     name: "โคอาล่า" },
  { seed: "Prickles", name: "เม่น" },
  { seed: "Hammy",    name: "แฮมสเตอร์" },
] as const;

export type AvatarSeed = (typeof AVATAR_OPTIONS)[number]["seed"];

export function avatarUrl(seed: string, size = 80) {
  return `https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=fde68a,fed7aa,fecaca,bbf7d0,bfdbfe,e9d5ff`;
}
