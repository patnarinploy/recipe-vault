"use client";

import { Joyride, STATUS, type EventData, type Step } from "react-joyride";
import { useLocale } from "@/lib/locale";

interface Props {
  run: boolean;
  onFinish: () => void;
}

export default function BookTour({ run, onFinish }: Props) {
  const { locale } = useLocale();
  const isTh = locale === "th";

  const steps: Step[] = [
    {
      target: "[data-tour='book-pages']",
      title: isTh ? "ยินดีต้อนรับสู่หนังสือสูตรอาหาร" : "Welcome to your recipe book",
      content: isTh
        ? "ปัดซ้าย-ขวา หรือกดที่ขอบหน้ากระดาษเพื่อพลิกหน้า"
        : "Swipe left/right or tap the page edge to flip pages",
      skipBeacon: true,
      placement: "center",
      buttons: ["skip", "primary"],
      showProgress: true,
    },
    {
      target: "[data-tour='fab-menu']",
      title: isTh ? "เมนูเพิ่มเติม" : "More options",
      content: isTh
        ? "กดปุ่มนี้เพื่อเพิ่มสูตร แก้ไข หรือดูสารบัญ"
        : "Tap here to add recipes, edit, or view the table of contents",
      placement: "top-end",
      buttons: ["back", "skip", "primary"],
      showProgress: true,
    },
  ];

  function handleEvent(data: EventData) {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onFinish();
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      onEvent={handleEvent}
      options={{
        primaryColor: "#f97316",
        zIndex: 10000,
      }}
      styles={{
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
