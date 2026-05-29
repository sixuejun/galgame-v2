"use client"

import { useCallback, useRef, useEffect } from "react"
import { useGame2048 } from "@/hooks/use-game-2048"
import { useSwipe } from "@/hooks/use-swipe"
import { GameBoard } from "@/components/game-board"
import { GameHeader } from "@/components/game-header"
import { GameOverDialog, WinDialog } from "@/components/game-dialogs"
import type { Direction } from "@/hooks/use-game-2048"

export default function Page() {
  const { board, score, bestScore, gameOver, won, move, initGame, acknowledgeWin } = useGame2048()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSwipe = useCallback(
    (dir: Direction) => {
      move(dir)
    },
    [move]
  )

  const swipeHandlers = useSwipe(handleSwipe, containerRef)

  // Keyboard support
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const keyMap: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      }
      const dir = keyMap[e.key]
      if (dir) {
        e.preventDefault()
        move(dir)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [move])

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen p-4 paper-texture fold-lines select-none"
      style={{ background: "hsl(38, 35%, 82%)" }}
    >
      <div
        ref={containerRef}
        className="flex flex-col items-center ink-stain"
        style={{ maxWidth: "24rem", width: "100%" }}
        {...swipeHandlers}
      >
        <GameHeader score={score} bestScore={bestScore} onNewGame={initGame} />

        <GameBoard board={board} />
      </div>

      {/* Dialogs */}
      <GameOverDialog open={gameOver} score={score} bestScore={bestScore} onPlayAgain={initGame} />
      <WinDialog open={won} score={score} onContinue={acknowledgeWin} onNewGame={initGame} />
    </main>
  )
}
