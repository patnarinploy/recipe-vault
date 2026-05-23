"use client";

import { useEffect, useState } from "react";
import { Joyride, ACTIONS, EVENTS, STATUS, type EventData, type Step } from "react-joyride";
import { useLocale } from "@/lib/locale";

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

  // Auto-advance steps 2 (flip forward) and 4 (flip back).
  // In 2-page landscape mode (!portrait), flip TWICE to skip the dark back-of-cover verso page.
  useEffect(() => {
    if (!run) return;
    if (stepIndex === 2) {
      onFlipNext();
      if (!portrait) {
        const t1 = setTimeout(() => onFlipNext(), 850);
        const t2 = setTimeout(() => setStepIndex(3), 1900);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      }
      const t = setTimeout(() => setStepIndex(3), 1600);
      return () => clearTimeout(t);
    }
    if (stepIndex === 4) {
      onFlipPrev();
      if (!portrait) {
        const t1 = setTimeout(() => onFlipPrev(), 850);
        const t2 = setTimeout(() => setStepIndex(5), 1900);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      }
      const t = setTimeout(() => setStepIndex(5), 1600);
      return () => clearTimeout(t);
    }
  }, [stepIndex, run, portrait, onFlipNext, onFlipPrev]);

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
    // 6 — FAB dropdown explanation (last step)
    {
      target: "[data-tour='fab-dropdown']",
      placement: "left",
      title: isTh ? "เมนูตัวเลือกทั้งหมด" : "All options",
      content: isTh ? (
        <ul style={{ margin: 0, padding: "0 0 0 1.1rem", lineHeight: 1.9 }}>
          <li>เพิ่มสูตรอาหารใหม่</li>
          <li>แก้ไขปก / การ์ดนักเขียน</li>
          <li>แก้ไขสูตร / บันทึกถูกใจ</li>
          <li>เปิดสารบัญ</li>
          <li>เพิ่มเข้ารายการที่อยากทำ</li>
          <li>พลิกหน้า ถัดไป / ก่อนหน้า</li>
        </ul>
      ) : (
        <ul style={{ margin: 0, padding: "0 0 0 1.1rem", lineHeight: 1.9 }}>
          <li>Add a new recipe</li>
          <li>Edit cover / writer card</li>
          <li>Edit recipe / mark as favorite</li>
          <li>Open table of contents</li>
          <li>Add to want-to-cook list</li>
          <li>Flip pages next / previous</li>
        </ul>
      ),
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
