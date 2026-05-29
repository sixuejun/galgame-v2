"use client"

import { memo } from "react"
import type { Tile } from "@/hooks/use-game-2048"
import { getTileConfig } from "@/lib/tile-config"

const CELL_SIZE = 5.5
const CELL_GAP = 0.4

interface GameTileProps {
  tile: Tile
}

function GameTileInner({ tile }: GameTileProps) {
  const config = getTileConfig(tile.value)
  const x = tile.col * (CELL_SIZE + CELL_GAP)
  const y = tile.row * (CELL_SIZE + CELL_GAP)

  return (
    <div
      className={`absolute transition-all duration-150 ease-in-out ${tile.isNew ? "tile-new" : ""} ${tile.justMerged ? "tile-merged" : ""}`}
      style={{
        width: `${CELL_SIZE}rem`,
        height: `${CELL_SIZE}rem`,
        left: `${x}rem`,
        top: `${y}rem`,
      }}
    >
      <div className="relative w-full h-full overflow-hidden distressed-border bg-card">
        {/* Tile background image */}
        <img
          src={config.image}
          alt={config.label}
          className="absolute inset-0 w-full h-full object-cover tile-image"
          draggable={false}
        />

        {/* Dark vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(40, 30, 15, 0.35) 100%)",
          }}
        />

        {/* Number badge in top-right corner */}
        <div className="absolute top-0 right-0 z-10">
          <div
            className="flex items-center justify-center font-serif font-black ink-text"
            style={{
              minWidth: tile.value >= 1000 ? "2.2rem" : tile.value >= 100 ? "1.8rem" : "1.5rem",
              height: "1.4rem",
              fontSize: tile.value >= 1000 ? "0.65rem" : "0.75rem",
              background: "rgba(40, 30, 15, 0.82)",
              color: "#d4c4a0",
              padding: "0 0.3rem",
              borderLeft: "1px solid rgba(120, 90, 50, 0.4)",
              borderBottom: "1px solid rgba(120, 90, 50, 0.4)",
            }}
          >
            {tile.value}
          </div>
        </div>

        {/* Item label at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div
            className="font-mono text-center ink-text truncate"
            style={{
              fontSize: "0.5rem",
              lineHeight: "1.2rem",
              letterSpacing: "0.08em",
              background: "rgba(40, 30, 15, 0.75)",
              color: "#c4ad8a",
              padding: "0 0.2rem",
              borderTop: "1px solid rgba(120, 90, 50, 0.3)",
            }}
          >
            {config.label}
          </div>
        </div>
      </div>
    </div>
  )
}

export const GameTile = memo(GameTileInner)
