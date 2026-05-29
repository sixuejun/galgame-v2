"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface GameOverDialogProps {
  open: boolean
  score: number
  bestScore: number
  onPlayAgain: () => void
}

export function GameOverDialog({ open, score, bestScore, onPlayAgain }: GameOverDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="border-2 border-foreground sm:rounded-none max-w-sm"
        style={{ background: "hsl(38, 30%, 78%)" }}
      >
        <DialogHeader className="items-center text-center">
          <div className="w-full border-b border-foreground pb-2 mb-2">
            <div className="font-mono text-[0.55rem] tracking-[0.2em] text-muted-foreground uppercase">
              紧急公告
            </div>
          </div>
          <DialogTitle className="font-serif font-black text-2xl tracking-tight text-foreground ink-text">
            任务失败
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground tracking-wide leading-relaxed">
            {'废土已将你吞噬。你的求生记录将留存，以警示后来者。'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-4 py-2">
          <div className="text-center">
            <div className="font-mono text-[0.5rem] tracking-widest text-muted-foreground uppercase">
              最终得分
            </div>
            <div className="font-serif font-black text-2xl text-foreground ink-text">{score}</div>
          </div>
          {score === bestScore && score > 0 && (
            <div className="text-center">
              <div className="font-mono text-[0.5rem] tracking-widest text-accent uppercase">
                新纪录
              </div>
              <div className="font-serif font-black text-2xl text-accent ink-text">{bestScore}</div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-center">
          <button
            onClick={onPlayAgain}
            className="font-mono text-[0.65rem] tracking-widest uppercase px-6 py-2 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            再次出发
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface WinDialogProps {
  open: boolean
  score: number
  onContinue: () => void
  onNewGame: () => void
}

export function WinDialog({ open, score, onContinue, onNewGame }: WinDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="border-2 border-foreground sm:rounded-none max-w-sm"
        style={{ background: "hsl(38, 30%, 78%)" }}
      >
        <DialogHeader className="items-center text-center">
          <div className="w-full border-b border-foreground pb-2 mb-2">
            <div className="font-mono text-[0.55rem] tracking-[0.2em] text-accent uppercase">
              特别号外
            </div>
          </div>
          <DialogTitle className="font-serif font-black text-2xl tracking-tight text-foreground ink-text">
            文明重生
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground tracking-wide leading-relaxed">
            {'在绝境中，你集齐了重建所需的一切。希望的灯塔照耀废土，得分：'}{score}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-center flex-col gap-2">
          <button
            onClick={onContinue}
            className="font-mono text-[0.65rem] tracking-widest uppercase px-6 py-2 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            继续探索
          </button>
          <button
            onClick={onNewGame}
            className="font-mono text-[0.55rem] tracking-widest uppercase px-4 py-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            重新开始
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
