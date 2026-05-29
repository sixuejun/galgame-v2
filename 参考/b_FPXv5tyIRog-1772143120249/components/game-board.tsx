"use client"

import { GRID_SIZE, type Tile } from "@/hooks/use-game-2048"
import { GameTile } from "./game-tile"

const CELL_SIZE = 5.5
const CELL_GAP = 0.4

interface GameBoardProps {
  board: Tile[]
}

export function GameBoard({ board }: GameBoardProps) {
  const totalSize = CELL_SIZE * GRID_SIZE + CELL_GAP * (GRID_SIZE - 1)

  return (
    <div
      className="relative distressed-border paper-texture"
      style={{
        width: `${totalSize}rem`,
        height: `${totalSize}rem`,
        padding: `${CELL_GAP}rem`,
        background: "hsl(35, 22%, 62%)",
      }}
    >
      {/* Empty cell grid */}
      {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
        const row = Math.floor(index / GRID_SIZE)
        const col = index % GRID_SIZE
        return (
          <div
            key={`cell-${index}`}
            className="absolute"
            style={{
              width: `${CELL_SIZE}rem`,
              height: `${CELL_SIZE}rem`,
              left: `${col * (CELL_SIZE + CELL_GAP) + CELL_GAP}rem`,
              top: `${row * (CELL_SIZE + CELL_GAP) + CELL_GAP}rem`,
              background: "rgba(80, 60, 30, 0.12)",
              border: "1px dashed rgba(120, 90, 50, 0.2)",
            }}
          />
        )
      })}

      {/* Tiles layer */}
      <div
        className="absolute"
        style={{
          left: `${CELL_GAP}rem`,
          top: `${CELL_GAP}rem`,
          width: `${totalSize - CELL_GAP * 2}rem`,
          height: `${totalSize - CELL_GAP * 2}rem`,
        }}
      >
        {board.map((tile) => (
          <GameTile key={tile.id} tile={tile} />
        ))}
      </div>
    </div>
  )
}
