const BASE = "https://vfehasgrmzfpnbujonnu.supabase.co/storage/v1/object/public/recipe-images/presets/";

export const AVATAR_PRESETS = [
  { value: `${BASE}bear-(1).png`,   name: "หมี 1"        },
  { value: `${BASE}bear-(2).png`,   name: "หมี 2"        },
  { value: `${BASE}cat.png`,        name: "แมว"          },
  { value: `${BASE}chicken.png`,    name: "ไก่"          },
  { value: `${BASE}cow.png`,        name: "วัว"          },
  { value: `${BASE}deer.png`,       name: "กวาง"         },
  { value: `${BASE}dog-(1).png`,    name: "หมา 1"        },
  { value: `${BASE}dog-(2).png`,    name: "หมา 2"        },
  { value: `${BASE}dragon.png`,     name: "มังกร"        },
  { value: `${BASE}giraffe.png`,    name: "ยีราฟ"        },
  { value: `${BASE}koala.png`,      name: "โคอาล่า"      },
  { value: `${BASE}lion.png`,       name: "สิงโต"        },
  { value: `${BASE}meerkat.png`,    name: "เมียร์แคต"    },
  { value: `${BASE}panda.png`,      name: "แพนด้า"       },
  { value: `${BASE}polar-bear.png`, name: "หมีขาว"       },
  { value: `${BASE}puffer-fish.png`,name: "ปลาปักเป้า"   },
  { value: `${BASE}rabbit.png`,     name: "กระต่าย"      },
  { value: `${BASE}sea-lion.png`,   name: "สิงโตทะเล"    },
  { value: `${BASE}sloth.png`,      name: "สลอธ"         },
  { value: `${BASE}snake.png`,      name: "งู"           },
  { value: `${BASE}weasel.png`,     name: "วีเซิล"       },
  { value: `${BASE}wolf.png`,       name: "หมาป่า"       },
] as const;

/** Returns true when the stored avatar value is an uploaded/preset image URL */
export function isAvatarUrl(avatar: string | null | undefined): boolean {
  return !!avatar && avatar.startsWith("http");
}

/** Background colour fallback for legacy emoji avatars */
export function emojiAvatarBg(_emoji: string): string {
  return "#fed7aa";
}
