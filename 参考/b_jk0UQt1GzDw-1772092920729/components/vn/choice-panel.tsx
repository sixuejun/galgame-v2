"use client"

import { useVN, useVNActions } from "@/lib/vn-store"
import { useState, useCallback, useRef, useEffect } from "react"
import { Send } from "lucide-react"

export function ChoicePanel() {
  const { state } = useVN()
  const { selectChoice, lockChoice, clearChoices, setCustomInput, nextLine } = useVNActions()
  const [customText, setCustomText] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const hasChoices = state.choices.length > 0

  const handleSelect = useCallback(
    (choiceId: string) => {
      if (state.choiceLocked) return

      if (state.selectedChoiceId === choiceId) {
        // Deselect
        selectChoice(null)
        return
      }

      selectChoice(choiceId)

      // Auto submit after 200ms for non-custom choices
      const choice = state.choices.find((c) => c.choiceId === choiceId)
      if (choice && !choice.isCustomInput) {
        submitTimeoutRef.current = setTimeout(() => {
          lockChoice()
          setTimeout(() => {
            clearChoices()
            nextLine()
          }, 300)
        }, 200)
      }
    },
    [state.choiceLocked, state.selectedChoiceId, state.choices, selectChoice, lockChoice, clearChoices, nextLine]
  )

  const handleCustomSubmit = useCallback(() => {
    if (!customText.trim() || state.choiceLocked) return
    setCustomInput(customText.trim())
    lockChoice()
    setTimeout(() => {
      clearChoices()
      nextLine()
    }, 300)
  }, [customText, state.choiceLocked, setCustomInput, lockChoice, clearChoices, nextLine])

  const handleBackdropClick = useCallback(() => {
    if (state.selectedChoiceId && !state.choiceLocked) {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current)
      selectChoice(null)
    }
  }, [state.selectedChoiceId, state.choiceLocked, selectChoice])

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current)
    }
  }, [])

  if (!hasChoices) return null

  return (
    <div className="absolute inset-0 z-30" onClick={handleBackdropClick}>
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-ink/30" />

      {/* Choice list */}
      <div
        className="absolute bottom-44 md:bottom-52 left-1/2 -translate-x-1/2 w-full max-w-lg px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          {state.choices.map((choice, index) => {
            const isSelected = state.selectedChoiceId === choice.choiceId
            const isLocked = state.choiceLocked

            if (choice.isCustomInput) {
              return (
                <div
                  key={choice.choiceId}
                  className={`relative border transition-all duration-200 ${
                    isSelected
                      ? "border-rust bg-[var(--vn-choice-selected)]"
                      : "border-border/50 bg-[var(--vn-choice-bg)] hover:bg-[var(--vn-choice-hover)]"
                  } ${isLocked ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => handleSelect(choice.choiceId)}
                >
                  {/* Torn paper top edge */}
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
                  <div className="p-3 flex items-center gap-3">
                    <span className="text-rust font-mono text-xs opacity-50">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={customText}
                      onChange={(e) => {
                        setCustomText(e.target.value)
                        if (!isSelected) selectChoice(choice.choiceId)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCustomSubmit()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isSelected) handleSelect(choice.choiceId)
                      }}
                      placeholder="自由输入..."
                      className="flex-1 bg-transparent text-sm text-foreground/90 placeholder:text-muted-foreground/50 outline-none font-serif"
                    />
                    {customText.trim() && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCustomSubmit()
                        }}
                        className="text-rust hover:text-rust-light transition-colors cursor-pointer"
                        aria-label="Send custom input"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            }

            return (
              <button
                key={choice.choiceId}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelect(choice.choiceId)
                }}
                disabled={isLocked}
                className={`relative w-full text-left border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-rust bg-[var(--vn-choice-selected)]"
                    : "border-border/50 bg-[var(--vn-choice-bg)] hover:bg-[var(--vn-choice-hover)]"
                } ${isLocked ? "opacity-50 pointer-events-none" : ""}`}
              >
                {/* Torn paper top edge */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
                <div className="p-3 flex items-center gap-3">
                  <span className="text-rust font-mono text-xs opacity-50">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="text-sm text-foreground/90">{choice.text}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
