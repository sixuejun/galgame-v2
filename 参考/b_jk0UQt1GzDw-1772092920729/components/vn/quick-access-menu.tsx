"use client"

import { useVN, useVNActions } from "@/lib/vn-store"
import { useState, useEffect, useRef } from "react"
import { User, Gamepad2, Settings, Maximize, BookOpen } from "lucide-react"

function CapsuleButton({
  icon,
  label,
  onClick,
  iconSide = "left",
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  iconSide?: "left" | "right"
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 border border-border/50 bg-[var(--vn-panel-bg)] backdrop-blur-sm
        hover:bg-foreground/10 hover:border-rust/40 transition-all duration-200 cursor-pointer
        text-foreground/80 hover:text-foreground group"
      style={{ borderRadius: "2px" }}
    >
      {iconSide === "left" && (
        <span className="text-rust/70 group-hover:text-rust transition-colors">{icon}</span>
      )}
      <span className="text-xs font-serif tracking-wider whitespace-nowrap">{label}</span>
      {iconSide === "right" && (
        <span className="text-rust/70 group-hover:text-rust transition-colors">{icon}</span>
      )}
    </button>
  )
}

export function QuickAccessMenu() {
  const { state } = useVN()
  const { toggleLeftMenu, toggleRightMenu, setOverlay } = useVNActions()
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        state.leftMenuExpanded &&
        leftRef.current &&
        !leftRef.current.contains(e.target as Node)
      ) {
        toggleLeftMenu()
      }
      if (
        state.rightMenuExpanded &&
        rightRef.current &&
        !rightRef.current.contains(e.target as Node)
      ) {
        toggleRightMenu()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [state.leftMenuExpanded, state.rightMenuExpanded, toggleLeftMenu, toggleRightMenu])

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <>
      {/* Left top menu */}
      <div ref={leftRef} className="absolute top-4 left-4 z-40">
        <div className="flex flex-col gap-1.5">
          {/* Button 1: always visible as icon-only when collapsed */}
          {!state.leftMenuExpanded ? (
            <button
              onClick={toggleLeftMenu}
              className="w-8 h-8 flex items-center justify-center border border-border/50 bg-[var(--vn-panel-bg)] backdrop-blur-sm
                hover:bg-foreground/10 hover:border-rust/40 transition-all duration-200 cursor-pointer text-rust/70 hover:text-rust"
              style={{ borderRadius: "2px" }}
              aria-label="Expand menu"
            >
              <User className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex flex-col gap-1.5 animate-fade-in-up">
              <CapsuleButton
                icon={<User className="w-3.5 h-3.5" />}
                label="角色"
                onClick={() => setOverlay("character")}
                iconSide="left"
              />
              <CapsuleButton
                icon={<Gamepad2 className="w-3.5 h-3.5" />}
                label="玩法"
                onClick={() => setOverlay("gameplay")}
                iconSide="left"
              />
            </div>
          )}
        </div>
      </div>

      {/* Right top menu */}
      <div ref={rightRef} className="absolute top-4 right-4 z-40">
        <div className="flex flex-col gap-1.5 items-end">
          {!state.rightMenuExpanded ? (
            <button
              onClick={toggleRightMenu}
              className="w-8 h-8 flex items-center justify-center border border-border/50 bg-[var(--vn-panel-bg)] backdrop-blur-sm
                hover:bg-foreground/10 hover:border-rust/40 transition-all duration-200 cursor-pointer text-rust/70 hover:text-rust"
              style={{ borderRadius: "2px" }}
              aria-label="Expand menu"
            >
              <Settings className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex flex-col gap-1.5 items-end animate-fade-in-up">
              <CapsuleButton
                icon={<Settings className="w-3.5 h-3.5" />}
                label="设置"
                onClick={() => setOverlay("settings")}
                iconSide="right"
              />
              <CapsuleButton
                icon={<Maximize className="w-3.5 h-3.5" />}
                label="全屏"
                onClick={handleFullscreen}
                iconSide="right"
              />
              <CapsuleButton
                icon={<BookOpen className="w-3.5 h-3.5" />}
                label="历史"
                onClick={() => setOverlay("history")}
                iconSide="right"
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
