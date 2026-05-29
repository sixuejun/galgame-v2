"use client"

interface GameHeaderProps {
  score: number
  bestScore: number
  onNewGame: () => void
}

export function GameHeader({ score, bestScore, onNewGame }: GameHeaderProps) {
  return (
    <header className="w-full flex flex-col items-center mb-4">
      {/* Newspaper masthead */}
      <div className="w-full border-b-2 border-foreground pb-1 mb-2">
        <div className="flex items-center justify-between">
          <div className="text-[0.55rem] font-mono tracking-widest text-muted-foreground uppercase">
            第 MMXLVIII 期
          </div>
          <div className="text-[0.55rem] font-mono tracking-widest text-muted-foreground uppercase">
            废土通讯社
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="font-serif font-black text-3xl md:text-4xl tracking-tight text-foreground ink-text text-center leading-none mb-1">
        废土 2048
      </h1>
      <div className="w-full flex items-center gap-2 mb-3">
        <div className="flex-1 h-px bg-foreground" />
        <p className="font-mono text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase whitespace-nowrap">
          合并求生·重建文明
        </p>
        <div className="flex-1 h-px bg-foreground" />
      </div>

      {/* Score boxes and New Game button */}
      <div className="w-full flex items-center justify-between">
        <div className="flex gap-2">
          <ScoreBox label="得分" value={score} />
          <ScoreBox label="最高" value={bestScore} />
        </div>
        <button
          onClick={onNewGame}
          className="font-mono text-[0.65rem] tracking-widest uppercase px-3 py-1.5 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          新局
        </button>
      </div>
    </header>
  )
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-3 py-1 border border-border"
      style={{ background: "rgba(80, 60, 30, 0.15)", minWidth: "4rem" }}
    >
      <div className="font-mono text-[0.5rem] tracking-[0.15em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className="font-serif font-black text-lg leading-tight text-foreground ink-text">
        {value}
      </div>
    </div>
  )
}
