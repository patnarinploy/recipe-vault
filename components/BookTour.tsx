"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Joyride, ACTIONS, EVENTS, STATUS, type EventData, type Step } from "react-joyride";
import { useLocale } from "@/lib/locale";
import {
  Plus, Palette, Edit2, Heart, List, ShoppingCart,
  ChevronLeft, ChevronRight,
} from "lucide-react";

// ─── FAB option swiper shown inside step 5 ───────────────────────────────────

type FabSlide = { icon: React.ReactNode; label: string; desc: string };

function FabSwiper({ isTh }: { isTh: boolean }) {
  const [idx, setIdx] = useState(0);
  const touchX = useRef<number | null>(null);

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

  const arrowBtn = (disabled: boolean, onClick: () => void, icon: React.ReactNode) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        border: "1px solid rgba(0,0,0,0.12)", background: "transparent",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.25 : 1,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {icon}
    </button>
  );

  return (
    <div style={{ userSelect: "none", minWidth: 220 }}>
      {/* Arrows flank the body content, vertically centered */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {arrowBtn(idx === 0, () => setIdx(i => i - 1), <ChevronLeft style={{ width: 14, height: 14 }} />)}

        <div
          style={{ flex: 1 }}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (dx < -40 && idx < total - 1) setIdx(i => i + 1);
            if (dx >  40 && idx > 0)         setIdx(i => i - 1);
          }}
        >
          {/* Mockup button */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
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
            color: "#6b7280", margin: 0,
          }}>
            {slide.desc}
          </p>
        </div>

        {arrowBtn(idx === total - 1, () => setIdx(i => i + 1), <ChevronRight style={{ width: 14, height: 14 }} />)}
      </div>

      {/* Dots */}
      <div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "center" }}>
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
  const [flipOverlay, setFlipOverlay] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    if (run) setStepIndex(0);
  }, [run]);

  // 5 real steps — auto-flip transitions are handled in handleEvent,
  // so they no longer appear as numbered steps in the progress counter.
  const steps: Step[] = [
    // 0 — Welcome (no progress shown)
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

    // 1 — Right half: tap to go forward (2/5)
    {
      target: "[data-tour='tour-right-half']",
      placement: "auto",
      offset: -140,
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

    // 2 — Left half: tap to go back (3/5)
    // Book is already flipped forward when this step shows (flip happens on leaving step 1).
    {
      target: "[data-tour='tour-left-half']",
      placement: "auto",
      offset: -140,
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

    // 3 — FAB button (4/5)
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

    // 4 — FAB dropdown: swiper walkthrough (5/5)
    {
      target: "[data-tour='fab-dropdown']",
      placement: "auto",
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
      setFlipOverlay(null);
      onFinish();
      return;
    }

    if (type !== EVENTS.STEP_AFTER) return;

    if (action === ACTIONS.NEXT || action === ACTIONS.CLOSE) {
      if (index === 1) {
        onFlipNext();
        setFlipOverlay(isTh
          ? { title: "⏩ กำลังพลิกหน้า...", body: "หนังสือกำลังพลิกไปหน้าถัดไปให้อัตโนมัติ" }
          : { title: "⏩ Flipping forward...", body: "The book is automatically flipping to the next page." });
        setTimeout(() => { setFlipOverlay(null); setStepIndex(2); }, 1600);
        return;
      }
      if (index === 2) {
        onFlipPrev();
        setFlipOverlay(isTh
          ? { title: "⏪ กำลังย้อนกลับ...", body: "หนังสือกำลังย้อนกลับไปหน้าก่อนหน้าให้อัตโนมัติ" }
          : { title: "⏪ Going back...", body: "The book is automatically flipping back to the previous page." });
        setTimeout(() => { setFlipOverlay(null); setStepIndex(3); }, 1600);
        return;
      }
      if (index === 3) {
        // Open FAB dropdown before showing its step
        onOpenFab();
        setTimeout(() => setStepIndex(4), 200);
        return;
      }
      setStepIndex(i => i + 1);
    } else if (action === ACTIONS.PREV) {
      setStepIndex(i => Math.max(0, i - 1));
    } else if (action === ACTIONS.SKIP) {
      setStepIndex(0);
      onFinish();
    }
  }

  return (
    <>
      <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      onEvent={handleEvent}
      floatingOptions={{ shiftOptions: { padding: 16 } }}
      options={{
        primaryColor: "#f97316",
        zIndex: 10000,
        overlayColor: "rgba(0,0,0,0.45)",
        skipScroll: true,
        blockTargetInteraction: true,
      }}
      styles={{
        spotlight: {
          stroke: "rgba(249, 115, 22, 0.85)",
          strokeWidth: 3,
        },
        tooltip: {
          borderRadius: "16px",
          padding: "20px",
          maxWidth: "min(340px, calc(100vw - 24px))",
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

      {/* Flip transition notification — portal into body so z-index beats Joyride's own portal */}
      {flipOverlay && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed", inset: 0, zIndex: 10001,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.55)",
          pointerEvents: "none",
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "20px 28px",
            textAlign: "center", maxWidth: 280,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#1c1917", margin: "0 0 6px" }}>{flipOverlay.title}</p>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{flipOverlay.body}</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
