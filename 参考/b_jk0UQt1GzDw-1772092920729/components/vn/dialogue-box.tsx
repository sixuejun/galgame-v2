"use client"

import { useVN, useVNActions } from "@/lib/vn-store"
import { useEffect, useRef, useState, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function DialogueBox() {
  const { state } = useVN()
  const { nextLine, prevLine, setTyping } = useVNActions()
  const [displayedText, setDisplayedText] = useState("")
  const [isManualScroll, setIsManualScroll] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const currentLine = state.dialogueHistory[state.currentLineIndex]
  const isFirstLine = state.currentLineIndex === 0
  const isLastLine = state.currentLineIndex === state.dialogueHistory.length - 1
  const hasChoices = state.choices.length > 0

  // Typewriter effect
  useEffect(() => {
    if (!currentLine) return

    setDisplayedText("")
    setTyping(true)

    const fullText = currentLine.text
    // Text speed: 1 (slowest) to 10 (instant)
    const charDelay = state.settings.textSpeed >= 10 ? 0 : Math.max(10, 120 - state.settings.textSpeed * 12)
    let charIndex = 0

    if (charDelay === 0) {
      setDisplayedText(fullText)
      setTyping(false)
      return
    }

    const typeNextChar = () => {
      if (charIndex < fullText.length) {
        charIndex++
        setDisplayedText(fullText.slice(0, charIndex))
        typingTimerRef.current = setTimeout(typeNextChar, charDelay)
      } else {
        setTyping(false)
      }
    }

    typingTimerRef.current = setTimeout(typeNextChar, charDelay)

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [currentLine, state.settings.textSpeed, setTyping])

  // Auto scroll when typing
  useEffect(() => {
    if (!isManualScroll && textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight
    }
  }, [displayedText, isManualScroll])

  // Auto play
  useEffect(() => {
    if (!state.settings.autoPlay || state.isTyping || hasChoices || isLastLine) return

    const delay = Math.max(500, 5000 - state.settings.autoPlaySpeed * 400)
    const timer = setTimeout(() => {
      nextLine()
    }, delay)

    return () => clearTimeout(timer)
  }, [state.settings.autoPlay, state.settings.autoPlaySpeed, state.isTyping, state.currentLineIndex, hasChoices, isLastLine, nextLine])

  const handleTextScroll = useCallback(() => {
    setIsManualScroll(true)
    // Resume auto scroll after 3s
    const timer = setTimeout(() => setIsManualScroll(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleClickText = useCallback(() => {
    if (state.isTyping) {
      // Skip typing animation
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      if (currentLine) {
        setDisplayedText(currentLine.text)
        setTyping(false)
      }
    } else if (!hasChoices && !isLastLine) {
      nextLine()
    }
  }, [state.isTyping, currentLine, hasChoices, isLastLine, nextLine, setTyping])

  if (!currentLine) return null

  // Layout mode
  const layoutMode = state.userCharacter.showSprite && state.userCharacter.avatarUrl ? "withAvatar" : "normal"

  return (
    <div className="relative w-full" onClick={handleClickText}>
      {/* Dialogue container - newspaper column style */}
      <div className="relative mx-4 md:mx-12 lg:mx-20">
        <div
          className="relative border border-border/60 bg-[var(--vn-dialogue-bg)] backdrop-blur-sm"
          style={{
            boxShadow: "inset 0 0 30px rgba(42, 36, 32, 0.3), 0 4px 12px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* Top decorative rule line */}
          <div className="h-[3px] bg-gradient-to-r from-transparent via-foreground/40 to-transparent" />
          <div className="h-[1px] mt-[2px] bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />

          <div className="flex items-stretch">
            {/* User avatar area (left side, conditional) */}
            {layoutMode === "withAvatar" && (
              <div className="flex-shrink-0 w-20 md:w-24 p-3 flex items-start justify-center column-rule">
                <div className="w-14 h-14 md:w-18 md:h-18 border border-border/40 overflow-hidden bg-ink-faded/30">
                  <img
                    src={state.userCharacter.avatarUrl}
                    alt={state.userCharacter.name}
                    className="w-full h-full object-cover"
                    style={{ filter: "sepia(0.4) contrast(0.85)" }}
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
            )}

            {/* Navigation arrow - Previous */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (!isFirstLine) prevLine()
              }}
              disabled={isFirstLine}
              className={`flex-shrink-0 w-8 flex items-center justify-center transition-opacity duration-200 hover:bg-foreground/5 ${
                isFirstLine ? "opacity-20 cursor-not-allowed" : "opacity-60 hover:opacity-100 cursor-pointer"
              }`}
              aria-label="Previous dialogue"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>

            {/* Text area */}
            <div className="flex-1 py-4 px-3 md:px-5 min-w-0">
              {/* Speaker name */}
              {currentLine.speaker && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-rust font-bold text-sm tracking-widest">
                    {currentLine.speaker}
                  </span>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-rust/30 to-transparent" />
                </div>
              )}

              {/* Narration indicator */}
              {currentLine.isNarration && !currentLine.speaker && (
                <div className="mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-rust/40 rotate-45" />
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-foreground/10 to-transparent" />
                </div>
              )}

              {/* Text content */}
              <div
                ref={textRef}
                onScroll={handleTextScroll}
                className="max-h-28 md:max-h-36 overflow-y-auto no-scrollbar"
              >
                <p
                  className={`text-sm md:text-base leading-relaxed tracking-wide ${
                    currentLine.isNarration ? "text-foreground/70 italic" : "text-foreground/90"
                  }`}
                >
                  {displayedText}
                  {state.isTyping && (
                    <span className="inline-block w-[2px] h-4 bg-rust ml-0.5 animate-pulse" />
                  )}
                </p>
              </div>
            </div>

            {/* Navigation arrow - Next */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (!isLastLine && !hasChoices) nextLine()
              }}
              disabled={isLastLine || hasChoices}
              className={`flex-shrink-0 w-8 flex items-center justify-center transition-opacity duration-200 hover:bg-foreground/5 ${
                isLastLine || hasChoices ? "opacity-20 cursor-not-allowed" : "opacity-60 hover:opacity-100 cursor-pointer"
              }`}
              aria-label="Next dialogue"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {/* Bottom decorative rule line */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
          <div className="h-[2px] mt-[1px] bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />

          {/* Line counter - small newspaper page number */}
          <div className="absolute bottom-1 right-3 text-[10px] text-muted-foreground font-mono opacity-40">
            {state.currentLineIndex + 1}/{state.dialogueHistory.length}
          </div>
        </div>
      </div>
    </div>
  )
}
