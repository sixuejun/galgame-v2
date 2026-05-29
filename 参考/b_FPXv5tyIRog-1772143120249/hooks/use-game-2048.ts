import { useState, useCallback, useEffect } from "react"

export const GRID_SIZE = 4

export type Direction = "up" | "down" | "left" | "right"

export type Tile = {
  value: number
  id: string
  row: number
  col: number
  isNew?: boolean
  justMerged?: boolean
}

function createTileId(): string {
  return `tile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function getEmptyCells(board: Tile[]): { row: number; col: number }[] {
  const occupied = new Set(board.map((t) => `${t.row},${t.col}`))
  const empty: { row: number; col: number }[] = []
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!occupied.has(`${row},${col}`)) {
        empty.push({ row, col })
      }
    }
  }
  return empty
}

function addNewTile(board: Tile[]): Tile[] {
  const empty = getEmptyCells(board)
  if (empty.length === 0) return board
  const { row, col } = empty[Math.floor(Math.random() * empty.length)]
  return [
    ...board,
    {
      value: Math.random() < 0.9 ? 2 : 4,
      id: createTileId(),
      row,
      col,
      isNew: true,
    },
  ]
}

function isGameOver(board: Tile[]): boolean {
  if (board.length < GRID_SIZE * GRID_SIZE) return false
  for (const tile of board) {
    const { row, col, value } = tile
    const neighbors = [
      { r: row - 1, c: col },
      { r: row + 1, c: col },
      { r: row, c: col - 1 },
      { r: row, c: col + 1 },
    ]
    for (const { r, c } of neighbors) {
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        const neighbor = board.find((t) => t.row === r && t.col === c)
        if (neighbor && neighbor.value === value) return false
      }
    }
  }
  return true
}

function hasWon(board: Tile[]): boolean {
  return board.some((t) => t.value >= 2048)
}

function moveTiles(board: Tile[], direction: Direction): { newBoard: Tile[]; scored: number; changed: boolean } {
  let tiles = board.map((t) => ({ ...t, isNew: false, justMerged: false }))
  let scored = 0
  let changed = false

  const sorted = [...tiles].sort((a, b) => {
    if (direction === "up") return a.row - b.row
    if (direction === "down") return b.row - a.row
    if (direction === "left") return a.col - b.col
    return b.col - a.col
  })

  for (const tile of sorted) {
    let newRow = tile.row
    let newCol = tile.col

    while (true) {
      const nextRow = newRow + (direction === "up" ? -1 : direction === "down" ? 1 : 0)
      const nextCol = newCol + (direction === "left" ? -1 : direction === "right" ? 1 : 0)

      if (nextRow < 0 || nextRow >= GRID_SIZE || nextCol < 0 || nextCol >= GRID_SIZE) break

      const target = tiles.find((t) => t !== tile && t.row === nextRow && t.col === nextCol)
      if (target) {
        if (target.value === tile.value && !target.justMerged) {
          tiles = tiles.filter((t) => t !== target && t !== tile)
          tiles.push({
            value: tile.value * 2,
            id: tile.id,
            row: nextRow,
            col: nextCol,
            justMerged: true,
          })
          scored += tile.value * 2
          changed = true
        }
        break
      }

      newRow = nextRow
      newCol = nextCol
    }

    if (newRow !== tile.row || newCol !== tile.col) {
      tile.row = newRow
      tile.col = newCol
      changed = true
    }
  }

  return { newBoard: tiles, scored, changed }
}

export function useGame2048() {
  const [board, setBoard] = useState<Tile[]>([])
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [wonAcknowledged, setWonAcknowledged] = useState(false)

  const initGame = useCallback(() => {
    let newBoard: Tile[] = []
    newBoard = addNewTile(newBoard)
    newBoard = addNewTile(newBoard)
    setBoard(newBoard)
    setScore(0)
    setGameOver(false)
    setWon(false)
    setWonAcknowledged(false)
  }, [])

  useEffect(() => {
    initGame()
    const stored = localStorage.getItem("wasteland2048_best")
    if (stored) setBestScore(Number(stored))
  }, [initGame])

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score)
      localStorage.setItem("wasteland2048_best", score.toString())
    }
  }, [score, bestScore])

  const move = useCallback(
    (direction: Direction) => {
      if (gameOver) return

      const { newBoard, scored, changed } = moveTiles(board, direction)
      if (!changed) {
        if (isGameOver(board)) setGameOver(true)
        return
      }

      const finalBoard = addNewTile(newBoard)
      setBoard(finalBoard)
      setScore((s) => s + scored)

      if (hasWon(finalBoard) && !won) {
        setWon(true)
      }

      if (isGameOver(finalBoard)) {
        setGameOver(true)
      }
    },
    [board, gameOver, won]
  )

  const acknowledgeWin = useCallback(() => {
    setWonAcknowledged(true)
  }, [])

  return {
    board,
    score,
    bestScore,
    gameOver,
    won: won && !wonAcknowledged,
    move,
    initGame,
    acknowledgeWin,
  }
}
