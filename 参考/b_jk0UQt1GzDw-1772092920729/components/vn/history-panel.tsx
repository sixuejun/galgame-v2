"use client"

import { useVN, useVNActions } from "@/lib/vn-store"
import { X } from "lucide-react"
import { useRef, useEffect } from "react"

export function HistoryPanel() {
  const { state } = useVN()
  const { setOverlay, goToLine } = useVNActions()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to current line
  useEffect(() => {
    if (scrollRef.current) {
      const currentEl = scrollRef.current.querySelector(`[data-line="${state.currentLineIndex}"]`)
      if (currentEl) {
        currentEl.scrollIntoView({ block: "center", behavior: "smooth" })
      }
    }
  }, [state.currentLineIndex])

  // Only show lines up to currentLineIndex
  const visibleLines = state.dialogueHistory.slice(0, state.currentLineIndex + 1)

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setOverlay("none")} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[85vh] mx-4 border border-border/60 bg-[var(--vn-panel-bg)] backdrop-blur-md overflow-hidden animate-fade-in-up">
        {/* Header decoration */}
        <div className="h-[3px] bg-gradient-to-r from-transparent via-rust/60 to-transparent" />
        <div className="h-[1px] mt-[1px] bg-gradient-to-r from-transparent via-rust/30 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="stamp-effect">
              <span className="text-rust text-xs font-bold tracking-widest">LOG</span>
            </div>
            <h2 className="text-lg font-bold tracking-widest text-foreground/90">历史记录</h2>
          </div>
          <button
            onClick={() => setOverlay("none")}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close history"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Newspaper-style column header */}
        <div className="px-6 py-2 border-b border-border/20 flex items-center">
          <div className="text-[9px] text-muted-foreground font-mono tracking-wider">
            {'--- 对话记录 · 第一章 ---'}
          </div>
          <div className="flex-1" />
          <div className="text-[9px] text-muted-foreground font-mono">
            共 {visibleLines.length} 条
          </div>
        </div>

        {/* History list */}
        <div
          ref={scrollRef}
          className="px-6 py-4 overflow-y-auto no-scrollbar max-h-[calc(85vh-130px)]"
        >
          {visibleLines.map((line, index) => {
            const isCurrent = index === state.currentLineIndex

            return (
              <div
                key={line.id}
                data-line={index}
                onClick={() => {
                  goToLine(index)
                  setOverlay("none")
                }}
                className={`py-2.5 border-b border-border/10 cursor-pointer transition-colors duration-150 hover:bg-foreground/5 ${
                  isCurrent ? "bg-rust/10 border-rust/20" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Line number */}
                  <span className="text-[9px] text-muted-foreground/50 font-mono w-6 text-right shrink-0 pt-0.5">
                    {String(index + 1).padStart(3, "0")}
                  </span>

                  <div className="flex-1 min-w-0">
                    {line.speaker ? (
                      <>
                        {/* Speaker name */}
                        <span className="text-rust text-xs font-bold tracking-wider">
                          {line.speaker}
                        </span>
                        {/* Dialogue text */}
                        <p className="text-sm text-foreground/80 mt-0.5 leading-relaxed">
                          {line.text}
                        </p>
                      </>
                    ) : (
                      /* Narration - indent 2 chars when no speaker */
                      <p className="text-sm text-foreground/60 italic leading-relaxed pl-[2em]">
                        {line.text}
                      </p>
                    )}
                  </div>

                  {/* Current marker */}
                  {isCurrent && (
                    <div className="w-1.5 h-1.5 bg-rust rotate-45 mt-1.5 shrink-0" />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom decoration */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-rust/30 to-transparent" />
        <div className="h-[2px] mt-[1px] bg-gradient-to-r from-transparent via-rust/50 to-transparent" />
      </div>
    </div>
  )
}
