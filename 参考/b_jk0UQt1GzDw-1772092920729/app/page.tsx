"use client"

import { VNProvider, useVN, useVNActions, type Choice } from "@/lib/vn-store"
import { StageArea } from "@/components/vn/stage-area"
import { DialogueBox } from "@/components/vn/dialogue-box"
import { ChoicePanel } from "@/components/vn/choice-panel"
import { QuickAccessMenu } from "@/components/vn/quick-access-menu"
import { SettingsPanel } from "@/components/vn/settings-panel"
import { HistoryPanel } from "@/components/vn/history-panel"
import { CharacterPanel } from "@/components/vn/character-panel"
import { GameplayPanel } from "@/components/vn/gameplay-panel"
import { useEffect, useCallback } from "react"

function DemoControls() {
  const { state } = useVN()
  const { setChoices, clearChoices, showToast } = useVNActions()

  const hasChoices = state.choices.length > 0

  const handleDemoChoices = useCallback(() => {
    if (hasChoices) {
      clearChoices()
      return
    }
    const demoChoices: Choice[] = [
      { choiceId: "c1", text: "跟她走，离开这个地方" },
      { choiceId: "c2", text: "留下来，继续翻找报纸上的线索" },
      { choiceId: "c3", text: "询问她关于外面世界的情况" },
      { choiceId: "custom", text: "", isCustomInput: true },
    ]
    setChoices(demoChoices)
  }, [hasChoices, setChoices, clearChoices])

  const handleDemoToast = useCallback(() => {
    showToast("第一章：灰烬中的报纸已解锁")
  }, [showToast])

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2">
      <button
        onClick={handleDemoChoices}
        className="text-[9px] text-muted-foreground/40 hover:text-muted-foreground border border-border/20 px-2 py-0.5 transition-colors cursor-pointer font-mono"
        style={{ borderRadius: "2px" }}
      >
        {hasChoices ? "关闭选项" : "演示选项"}
      </button>
      <button
        onClick={handleDemoToast}
        className="text-[9px] text-muted-foreground/40 hover:text-muted-foreground border border-border/20 px-2 py-0.5 transition-colors cursor-pointer font-mono"
        style={{ borderRadius: "2px" }}
      >
        演示通知
      </button>
    </div>
  )
}

function VNScreen() {
  const { state } = useVN()

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (state.activeOverlay !== "none") {
        if (e.key === "Escape") {
          // Close overlay with escape
        }
        return
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [state.activeOverlay])

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-background select-none">
      {/* Stage Layer */}
      <StageArea />

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-20 flex flex-col pointer-events-none">
        {/* Top area - quick access menus */}
        <div className="pointer-events-auto">
          <QuickAccessMenu />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom area - dialogue box */}
        <div className="pointer-events-auto pb-6 md:pb-8">
          <DialogueBox />
        </div>
      </div>

      {/* Choice overlay */}
      <ChoicePanel />

      {/* Overlay panels */}
      {state.activeOverlay === "settings" && <SettingsPanel />}
      {state.activeOverlay === "history" && <HistoryPanel />}
      {state.activeOverlay === "character" && <CharacterPanel />}
      {state.activeOverlay === "gameplay" && <GameplayPanel />}

      {/* Demo controls (for prototype testing) */}
      <DemoControls />
    </main>
  )
}

export default function Page() {
  return (
    <VNProvider>
      <VNScreen />
    </VNProvider>
  )
}
