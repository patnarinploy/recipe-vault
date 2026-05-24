"use client";

import { createContext, use, useId, useState } from "react";
import { motion } from "framer-motion";

const TabsCtx = createContext<{
  activeTab: string;
  setActiveTab: (t: string) => void;
  layoutId: string;
}>({ activeTab: "", setActiveTab: () => {}, layoutId: "tab-indicator" });

export function Tabs({
  defaultValue = "",
  value,
  onValueChange,
  children,
  className = "",
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const [internal, setInternal] = useState(defaultValue);
  const active = value ?? internal;
  function setActive(t: string) {
    setInternal(t);
    onValueChange?.(t);
  }
  return (
    <TabsCtx.Provider value={{ activeTab: active, setActiveTab: setActive, layoutId: `tab-${id}` }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex gap-2 border-b border-outline ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { activeTab, setActiveTab, layoutId } = use(TabsCtx);
  const isActive = activeTab === value;
  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "text-orange-600 dark:text-orange-400"
          : "text-muted hover:text-foreground"
      } ${className}`}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId={layoutId}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  );
}
