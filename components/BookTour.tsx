"use client";

import { useEffect, useState } from "react";
import { Joyride, ACTIONS, EVENTS, STATUS, type EventData, type Step } from "react-joyride";
import { useLocale } from "@/lib/locale";
import {
  Plus, Palette, Edit2, Heart, List, ShoppingCart,
  ChevronLeft, ChevronRight,
} from "lucide-react";

// ─── FAB option swiper shown inside step 7 ───────────────────────────────────

type FabSlide = { icon: React.ReactNode; label: string; desc: string };

function FabSwiper({ isTh }: { isTh: boolean }) {
  const [idx, setIdx] = useState(0);

  const slides: FabSlide[] = isTh ? [
    {
      icon: <Plus  style={{ width: 15, height: 15 }} />,
      label: "เพิ่มสูตรอาหาร",
      desc:  "สร้างสูตรอาหารใหม่แล้วเพิ่มเข้าหนังสือได้เลย",
    },
    {
      icon: <Palette style={{ width: 15, height: 15 }} />,
      label: "แก้ไขปก / การ์ดนักเขียน",
      desc:  "เปลี่ยนสีปก ชื่อหนังสือ หรือข้อมูลผู้เขียน",
    },
    {
      icon: <Edit2 style={{ width: 15, height: 15 }} />,
      label: "แก้ไขสูตร",
      desc:  "แก้ไขชื่อ ส่วนผสม หรือขั้นตอนของสูตรที่กำลังดูอยู่",
    },
    {
      icon: <Heart style={{ width: 15, height: 15 }} />,
      label: "บันทึกถูกใจ",
      desc:  "กดเพื่อเพิ่มหรือเอาสูตรนี้ออกจากรายการโปรด",
    },
    {
      icon: <List  style={{ width: 15, height: 15 }} />,
      label: "เปิดสารบัญ",
      desc:  "ดูรายการสูตรทั้งหมดและข้ามไปได้ทันที",
    },
    {
      icon: <ShoppingCart style={{ width: 15, height: 15 }} />,
      label: "รายการที่อยากทำ",
      desc:  "เพิ่มสูตรนี้เข้ารายการที่อยากลองทำ",
    },
    {
      icon: (
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          <ChevronLeft  style={{ width: 15, height: 15 }} />
          <ChevronRight style={{ width: 15, height: 15 }} />
        </span>
      ),
      label: "พลิกหน้า",
      desc:  "ข้ามไปหน้าถัดไปหรือย้อนกลับผ่านเมนูนี้ได้",
    },
  ] : [
    {
      icon: <Plus  style={{ width: 15, height: 15 }} />,
      label: "Add recipe",
      desc:  "Create a new recipe and add it to your book.",
    },
    {
      icon: <Palette style={{ width: 15, height: 15 }} />,
      label: "Edit cover / writer card",
      desc:  "Change the cover color, book title, or author info.",
    },
    {
      icon: <Edit2 style={{ width: 15, height: 15 }} />,
      label: "Edit recipe",
      desc:  "Edit the title, ingredients, or steps of this recipe.",
    },
    {
      icon: <Heart style={{ width: 15, height: 15 }} />,
      label: "Mark as favorite",
      desc:  "Add or remove this recipe from your favorites.",
    },
    {
      icon: <List  style={{ width: 15, height: 15 }} />,
      label: "Table of contents",
      desc:  "See all recipes and jump to any one instantly.",
    },
    {
      icon: <ShoppingCart style={{ width: 15, height: 15 }} />,
      label: "Want-to-cook list",
      desc:  "Save this recipe to your cooking wishlist.",
    },
    {
      icon: (
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          <ChevronLeft  style={{ width: 15, height: 15 }} />
          <ChevronRight style={{ width: 15, height: 15 }} />
        </span>
      ),
      label: "Flip pages",
      desc:  "Navigate to the next or previous page from this menu.",
    },
  ];

  const total = slides.length;
  const slide = slides[idx];

  return (
    <div style={{ userSelect: "none", minWidth: 220 }}>
      {/* Mockup button */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "7px 14px", borderRadius: 10,
          background: "rgba(249,115,22,0.10)",
          border: "1px solid rgba(249,115,22,0.25)",
          color: "#f97316", fontWeight: 600, fontSize: 13,
          whiteSpace: "nowrap",
        }}>
          {slide.icon}
          <span>{slide.label}</span>
        </div>
      </div>

      {/* Description */}
      <p style={{
        textAlign: "center", fontSize: 12.5, lineHeight: 1.65,
        color: "#6b7280", margin: "0 0 14px",
      }}>
        {slide.desc}
      </p>

      {/* Prev / dots / Next */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={() => setIdx(i => i - 1)}
          disabled={idx === 0}
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            border: "1px solid rgba(0,0,0,0.12)", background: "transparent",
            cursor: idx === 0 ? "default" : "pointer",
            opacity: idx === 0 ? 0.25 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <ChevronLeft style={{ width: 14, height: 14 }} />
        </button>

        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? 18 : 6, height: 6, borderRadius: 3,
                background: i === idx ? "#f97316" : "rgba(0,0,0,0.15)",
                cursor: "pointer",
                transition: "width 0.2s ease, background 0.2s ease",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => setIdx(i => i + 1)}
          disabled={idx === total - 1}
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            border: "1px solid rgba(0,0,0,0.12)", background: "transparent",
            cursor: idx === total - 1 ? "default" : "pointer",
            opacity: idx === total - 1 ? 0.25 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <ChevronRight style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}

// ─── Main tour ────────────────────────────────────────────────────────────────

interface Props {
  run: boolean;
  onFinish: () => void;
  portrait: boolean;
  onFlipNext: () => void;
  onFlipPrev: () => void;
  onOpenFab: () => void;
}

export default function BookTour({ run, onFinish, portrait, onFlipNext, onFlipPrev, onOpenFab }: Props) {
  const { locale } = useLocale();
  const isTh = locale === "th";
  const [stepIndex, setStepIndex] = useState(0);

  // Reset step when tour (re-)starts
  useEffect(() => {
    if (run) setStepIndex(0);
  }, [run]);

  // Auto-advance steps 2 (flip forward) and 4 (flip back)
  useEffect(() => {
    if (!run) return;
    if (stepIndex === 2) {
      onFlipNext();
      const t = setTimeout(() => setStepIndex(3), 1600);
      return () => clearTimeout(t);
    }
    if (stepIndex === 4) {
      onFlipPrev();
      const t = setTimeout(() => setStepIndex(5), 1600);
      return () => clearTimeout(t);
    }
  }, [stepIndex, run, onFlipNext, onFlipPrev]);

  const steps: Step[] = [
    // 0 — Welcome
    {
      target: "body",
      placement: "center",
      title: isTh ? "ยินดีต้อนรับสู่หนังสือสูตรอาหาร 📖" : "Welcome to your recipe book 📖",
      content: isTh
        ? "มาดูกันว่าหนังสือใช้งานยังไง จะใช้เวลาแค่ครู่เดียว"
        : "Let's take a quick look at how the book works. It'll only take a moment.",
      skipBeacon: true,
      buttons: ["skip", "primary"],
      overlayClickAction: false,
    },
    // 1 — Right half: tap to go forward
    {
      target: "[data-tour='tour-right-half']",
      placement: "left",
      title: isTh
        ? (portrait ? "กดฝั่งขวาเพื่อไปหน้าถัดไป" : "หน้าขวา — ไปหน้าถัดไป")
        : (portrait ? "Tap right to go forward" : "Right page — next page"),
      content: isTh
        ? "กดที่ด้านขวาของหนังสือเพื่อพลิกไปหน้าถัดไป"
        : "Tap the right side of the book to flip to the next page.",
      skipBeacon: true,
      buttons: ["skip", "primary"],
      overlayClickAction: false,
      showProgress: true,
    },
    // 2 — Auto: flip forward (no buttons, advances via useEffect)
    {
      target: "body",
      placement: "center",
      title: isTh ? "⏩ กำลังพลิกหน้า..." : "⏩ Flipping forward...",
      content: isTh
        ? "หนังสือกำลังพลิกไปหน้าถัดไปให้อัตโนมัติ"
        : "The book is automatically flipping to the next page.",
      skipBeacon: true,
      buttons: [],
      overlayClickAction: false,
    },
    // 3 — Left half: tap to go back
    {
      target: "[data-tour='tour-left-half']",
      placement: "right",
      title: isTh
        ? (portrait ? "กดฝั่งซ้ายเพื่อย้อนกลับ" : "หน้าซ้าย — ย้อนกลับ")
        : (portrait ? "Tap left to go back" : "Left page — previous page"),
      content: isTh
        ? "กดที่ด้านซ้ายของหนังสือเพื่อย้อนกลับไปหน้าก่อนหน้า"
        : "Tap the left side of the book to flip back to the previous page.",
      skipBeacon: true,
      buttons: ["skip", "primary"],
      overlayClickAction: false,
      showProgress: true,
    },
    // 4 — Auto: flip back (no buttons, advances via useEffect)
    {
      target: "body",
      placement: "center",
      title: isTh ? "⏪ กำลังย้อนกลับ..." : "⏪ Going back...",
      content: isTh
        ? "หนังสือกำลังย้อนกลับไปหน้าก่อนหน้าให้อัตโนมัติ"
        : "The book is automatically flipping back to the previous page.",
      skipBeacon: true,
      buttons: [],
      overlayClickAction: false,
    },
    // 5 — FAB button (circular spotlight)
    {
      target: "[data-tour='fab-menu']",
      placement: "top",
      title: isTh ? "ปุ่มตัวเลือก" : "Options button",
      content: isTh
        ? "กดปุ่มนี้เพื่อเข้าถึงฟีเจอร์ทั้งหมด เช่น เพิ่มสูตร แก้ไข สารบัญ และอื่นๆ"
        : "Tap this button to access all features: add recipes, edit, table of contents, and more.",
      skipBeacon: true,
      buttons: ["skip", "primary"],
      spotlightRadius: 999,
      spotlightPadding: 8,
      overlayClickAction: false,
      showProgress: true,
    },
    // 6 — FAB dropdown: swiper walkthrough (last step)
    {
      target: "[data-tour='fab-dropdown']",
      placement: "left",
      title: isTh ? "เมนูตัวเลือกทั้งหมด" : "All options",
      content: <FabSwiper isTh={isTh} />,
      skipBeacon: true,
      buttons: ["primary"],
      overlayClickAction: false,
      showProgress: true,
    },
  ];

  function handleEvent(data: EventData) {
    const { action, index, type, status } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setStepIndex(0);
      onFinish();
      return;
    }

    if (type !== EVENTS.STEP_AFTER) return;

    if (action === ACTIONS.NEXT || action === ACTIONS.CLOSE) {
      // Auto-steps (2, 4) advance themselves via useEffect — don't double-advance
      if (index === 2 || index === 4) return;

      if (index === 5) {
        // Open FAB dropdown before advancing to step 6
        onOpenFab();
        setTimeout(() => setStepIndex(6), 200);
        return;
      }

      setStepIndex(i => i + 1);
    } else if (action === ACTIONS.PREV) {
      // Skip over auto-steps when going backward
      if (index === 3) { setStepIndex(1); return; } // step 3 → skip step 2 → land on step 1
      if (index === 5) { setStepIndex(3); return; } // step 5 → skip step 4 → land on step 3
      setStepIndex(i => Math.max(0, i - 1));
    } else if (action === ACTIONS.SKIP) {
      setStepIndex(0);
      onFinish();
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      onEvent={handleEvent}
      options={{
        primaryColor: "#f97316",
        zIndex: 10000,
        overlayColor: "rgba(0,0,0,0.45)",
        skipScroll: true,
        blockTargetInteraction: true,
      }}
      styles={{
        spotlight: {
          // SVG stroke — orange ring so spotlight is visible on any background/theme
          stroke: "rgba(249, 115, 22, 0.85)",
          strokeWidth: 3,
        },
        tooltip: {
          borderRadius: "16px",
          padding: "20px",
        },
        buttonPrimary: {
          borderRadius: "10px",
          padding: "8px 16px",
        },
        buttonBack: {
          borderRadius: "10px",
          padding: "8px 16px",
        },
        buttonSkip: {
          borderRadius: "10px",
        },
      }}
      locale={{
        back: isTh ? "ย้อนกลับ" : "Back",
        close: isTh ? "ปิด" : "Close",
        last: isTh ? "เสร็จสิ้น" : "Done",
        next: isTh ? "ถัดไป" : "Next",
        open: isTh ? "เปิดบทแนะนำ" : "Open tour",
        skip: isTh ? "ข้ามไป" : "Skip",
      }}
    />
  );
}
