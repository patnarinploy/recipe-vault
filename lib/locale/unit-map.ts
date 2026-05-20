import type { Locale } from "./index";

// [th, en] pairs — order matches th.ts / en.ts locale arrays exactly.
const UNIT_PAIRS: [string, string][] = [
  ["กรัม",      "g"     ],
  ["กิโลกรัม",  "kg"    ],
  ["ขีด",       "100g"  ],
  ["มิลลิลิตร", "ml"    ],
  ["ลิตร",      "L"     ],
  ["ช้อนชา",    "tsp"   ],
  ["ช้อนโต๊ะ",  "tbsp"  ],
  ["ถ้วย",      "cup"   ],
  ["ชิ้น",      "piece" ],
  ["ฝัก",       "pod"   ],
  ["ต้น",       "stalk" ],
  ["ใบ",        "leaf"  ],
  ["หัว",       "head"  ],
  ["ลูก",       "ball"  ],
  ["กลีบ",      "clove" ],
  ["แผ่น",      "slice" ],
  ["ฟอง",       "egg"   ],
  ["เม็ด",      "seed"  ],
  ["แว่น",      "round" ],
];

const CATEGORY_PAIRS: [string, string][] = [
  ["อาหารไทย",     "Thai"     ],
  ["อาหารจีน",     "Chinese"  ],
  ["อาหารญี่ปุ่น", "Japanese" ],
  ["อาหารตะวันตก", "Western"  ],
  ["อาหารอิตาลี",  "Italian"  ],
  ["อาหารอินเดีย", "Indian"   ],
  ["ของหวาน",      "Dessert"  ],
  ["เครื่องดื่ม",  "Drinks"   ],
  ["อื่นๆ",        "Other"    ],
];

function translate(pairs: [string, string][], value: string, locale: Locale): string {
  if (!value) return value;
  const entry = pairs.find(([th, en]) => th === value || en === value);
  return entry ? (locale === "th" ? entry[0] : entry[1]) : value;
}

export function translateUnit(value: string, locale: Locale): string {
  return translate(UNIT_PAIRS, value, locale);
}

export function translateCategory(value: string, locale: Locale): string {
  return translate(CATEGORY_PAIRS, value, locale);
}
