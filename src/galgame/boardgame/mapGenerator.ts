import type { MapConfig, MapNode, NodeType } from './types';

// ===== Mulberry32 PRNG (fast, good distribution) =====
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

// ===== Sparse Grid Map Generator =====

/**
 * Generate a sparse grid-based map from a numeric seed.
 * Only walkable path tiles are rendered, creating a "road shape" on blank background.
 *
 * Structure:
 *   - Sparse 2D grid (only path cells exist)
 *   - Each cell has fixed (row, col) coordinates
 *   - Movement is only to adjacent cells (up/down/left/right)
 *   - Creates a winding path through sparse grid space
 */
export function generateMap(seed: number): MapConfig {
  const rng = mulberry32(seed);
  const rand = () => rng();
  const ri = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

  // Grid configuration
  const CELL_SIZE = 70; // Size of each cell (px)
  const MARGIN = 40; // Margin around the map

  // Create sparse grid using Map
  type GridCell = {
    row: number;
    col: number;
    type: NodeType;
  };

  const grid = new Map<string, GridCell>();

  const getKey = (r: number, c: number) => `${r},${c}`;
  const hasCell = (r: number, c: number) => grid.has(getKey(r, c));
  const setCell = (r: number, c: number, type: NodeType) => {
    grid.set(getKey(r, c), { row: r, col: c, type });
  };

  // ── 1. Generate main path using random walk ──────────────────
  const pathLength = ri(15, 50);

  // Start position
  let curRow = 0;
  let curCol = 0;
  setCell(curRow, curCol, 'start');

  const pathCells: { row: number; col: number }[] = [{ row: curRow, col: curCol }];

  // Random walk to create path
  for (let i = 1; i < pathLength; i++) {
    // Weighted directions (prefer forward movement)
    const directions: { dr: number; dc: number; weight: number }[] = [
      { dr: 0, dc: 1, weight: 4 }, // Right (strongly preferred)
      { dr: 1, dc: 0, weight: 2.5 }, // Down (preferred)
      { dr: -1, dc: 0, weight: 1 }, // Up
      { dr: 0, dc: -1, weight: 0.2 }, // Left (strongly discouraged)
    ];

    // Filter out directions that would revisit existing cells
    const validDirs = directions.filter(d => {
      const nr = curRow + d.dr;
      const nc = curCol + d.dc;
      return !hasCell(nr, nc);
    });

    if (validDirs.length === 0) {
      // Dead end - path ends here
      break;
    }

    // Weighted random direction
    const totalWeight = validDirs.reduce((sum, d) => sum + d.weight, 0);
    let r = rand() * totalWeight;
    let chosenDir = validDirs[0]!;

    for (const dir of validDirs) {
      r -= dir.weight;
      if (r <= 0) {
        chosenDir = dir;
        break;
      }
    }

    curRow += chosenDir.dr;
    curCol += chosenDir.dc;
    setCell(curRow, curCol, 'empty');
    pathCells.push({ row: curRow, col: curCol });
  }

  // Mark the last cell as end point
  if (pathCells.length > 0) {
    const endCell = pathCells[pathCells.length - 1]!;
    const endKey = getKey(endCell.row, endCell.col);
    const cell = grid.get(endKey);
    if (cell) {
      cell.type = 'end';
    }
  }

  // ── 2. Add minimal branches (only 1-2 short branches) ────────
  const branchCount = ri(1, 2);

  for (let b = 0; b < branchCount; b++) {
    if (pathCells.length < 10) break;

    // Pick random cell from middle section of path
    const startIdx = Math.floor(pathCells.length * 0.3);
    const endIdx = Math.floor(pathCells.length * 0.7);
    const branchRoot = pathCells[ri(startIdx, endIdx)]!;
    const branchLen = ri(2, 3); // Very short branches

    let br = branchRoot.row;
    let bc = branchRoot.col;

    // Check if this cell already has too many neighbors
    const rootKey = getKey(br, bc);
    const rootCell = grid.get(rootKey);
    if (!rootCell) continue;

    // Count existing neighbors
    const existingNeighbors = [
      { dr: 0, dc: 1 },
      { dr: 0, dc: -1 },
      { dr: 1, dc: 0 },
      { dr: -1, dc: 0 },
    ].filter(d => hasCell(br + d.dr, bc + d.dc)).length;

    // Skip if already has 3+ neighbors (to keep max 4)
    if (existingNeighbors >= 3) continue;

    for (let j = 0; j < branchLen; j++) {
      const dirs = [
        { dr: 0, dc: 1 },
        { dr: 0, dc: -1 },
        { dr: 1, dc: 0 },
        { dr: -1, dc: 0 },
      ];

      // Shuffle directions
      for (let i = dirs.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j]!, dirs[i]!];
      }

      let extended = false;
      for (const dir of dirs) {
        const nr = br + dir.dr;
        const nc = bc + dir.dc;
        if (!hasCell(nr, nc)) {
          // Check if adding this cell would give any cell more than 4 neighbors
          const wouldExceedLimit = [
            { dr: 0, dc: 1 },
            { dr: 0, dc: -1 },
            { dr: 1, dc: 0 },
            { dr: -1, dc: 0 },
          ].some(d => {
            const checkKey = getKey(nr + d.dr, nc + d.dc);
            const checkCell = grid.get(checkKey);
            if (!checkCell) return false;
            const neighborCount = [
              { dr: 0, dc: 1 },
              { dr: 0, dc: -1 },
              { dr: 1, dc: 0 },
              { dr: -1, dc: 0 },
            ].filter(dd => hasCell(checkCell.row + dd.dr, checkCell.col + dd.dc)).length;
            return neighborCount >= 3; // Would become 4 after adding new cell
          });

          if (!wouldExceedLimit) {
            setCell(nr, nc, 'empty');
            br = nr;
            bc = nc;
            extended = true;
            break;
          }
        }
      }
      if (!extended) break;
    }
  }

  // ── 3. Assign node types to cells ─────────────────────────────
  // 格子类型仅作为"结果倾向权重"：
  // - empty: 空地，无事件 (40%)
  // - encounter: 遭遇，中性倾向 (35%)
  // - trap: 陷阱，偏负面 (15%)
  // - fortune: 意外之喜，偏正面 (10%)
  const typePool: NodeType[] = [
    ...Array<NodeType>(40).fill('empty' as NodeType),
    ...Array<NodeType>(35).fill('encounter' as NodeType),
    ...Array<NodeType>(15).fill('trap' as NodeType),
    ...Array<NodeType>(10).fill('fortune' as NodeType),
  ];

  // ── 相邻约束：禁止三个及以上相同事件格子相连 ───────────────────
  // trap、encounter、fortune 都不能三个及以上相连（上下左右相连，对角线不算）
  // 辅助函数：获取邻居格子（上下左右）
  const getNeighbors = (r: number, c: number): { row: number; col: number }[] => [
    { row: r - 1, col: c },
    { row: r + 1, col: c },
    { row: r, col: c - 1 },
    { row: r, col: c + 1 },
  ];

  // 辅助函数：统计邻居中某类型的数量
  const countNeighborType = (r: number, c: number, type: NodeType): number => {
    return getNeighbors(r, c).filter(n => {
      const cell = grid.get(getKey(n.row, n.col));
      return cell && cell.type === type;
    }).length;
  };

  // 辅助函数：检查分配某类型后是否会形成三个及以上相连
  const wouldCauseThreeConsecutive = (r: number, c: number, newType: NodeType): boolean => {
    // 对所有事件类型（trap、encounter、fortune）都进行检查
    if (newType === 'empty' || newType === 'start' || newType === 'end') return false;

    const neighbors = getNeighbors(r, c);
    const sameTypeNeighbors = neighbors.filter(n => {
      const cell = grid.get(getKey(n.row, n.col));
      return cell && cell.type === newType;
    });

    // 如果有两个相同类型的邻居，加上自己就会形成三个相连
    if (sameTypeNeighbors.length >= 2) return true;

    // 如果有一个相同类型的邻居，检查该邻居是否还有另一个相同类型的邻居
    if (sameTypeNeighbors.length === 1) {
      const firstNeighbor = sameTypeNeighbors[0];
      if (firstNeighbor) {
        const countInNeighbor = countNeighborType(firstNeighbor.row, firstNeighbor.col, newType);
        // 如果邻居已经有 >= 2 个同类型邻居，加上自己会形成三个
        if (countInNeighbor >= 2) return true;
      }
    }

    return false;
  };

  // 对所有格子分配类型（按从 start 到 end 的路径顺序分配）
  const cellsToAssign = Array.from(grid.values()).filter(cell => cell.type !== 'start');

  // 按距离 start 的远近排序（优先分配路径上的格子）
  const startCell = grid.get(getKey(0, 0));
  const startR = startCell?.row ?? 0;
  const startC = startCell?.col ?? 0;

  cellsToAssign.sort((a, b) => {
    const distA = Math.abs(a.row - startR) + Math.abs(a.col - startC);
    const distB = Math.abs(b.row - startR) + Math.abs(b.col - startC);
    return distA - distB;
  });

  for (const cell of cellsToAssign) {
    if (cell.type === 'start') continue;

    // 尝试找到一个不违反约束的类型
    let assignedType: NodeType | null = null;

    // 从类型池中找一个不会造成三个相连的类型
    const shuffledPool = [...typePool].sort(() => Math.random() - 0.5);

    for (const candidateType of shuffledPool) {
      // 对 trap、encounter、fortune 都检查是否会形成三个相连
      if (!wouldCauseThreeConsecutive(cell.row, cell.col, candidateType)) {
        assignedType = candidateType;
        break;
      }
    }

    // 如果所有类型都不满足约束，强制分配 empty（兜底）
    if (assignedType === null) {
      assignedType = 'empty';
    }

    cell.type = assignedType;
  }

  // ── 3.5. Mark end points ──────────────────────────────────────
  // Find all cells that could be end points (cells with only 1 neighbor = dead ends)
  const potentialEndPoints: GridCell[] = [];
  for (const cell of grid.values()) {
    if (cell.type === 'start') continue;

    // Count neighbors
    const neighborCount = [
      { dr: 0, dc: 1 },
      { dr: 0, dc: -1 },
      { dr: 1, dc: 0 },
      { dr: -1, dc: 0 },
    ].filter(d => hasCell(cell.row + d.dr, cell.col + d.dc)).length;

    // Dead end (only 1 neighbor) = potential end point
    if (neighborCount === 1) {
      potentialEndPoints.push(cell);
    }
  }

  // If we have potential end points, randomly pick one
  if (potentialEndPoints.length > 0) {
    const endCell = potentialEndPoints[Math.floor(rand() * potentialEndPoints.length)]!;
    endCell.type = 'end';
  } else {
    // Fallback: mark the last cell in the main path as end
    if (pathCells.length > 0) {
      const endCell = pathCells[pathCells.length - 1]!;
      const endKey = getKey(endCell.row, endCell.col);
      const cell = grid.get(endKey);
      if (cell) {
        cell.type = 'end';
      }
    }
  }

  // ── 4. Convert grid to MapNode format ─────────────────────────
  const allNodes: MapNode[] = [];

  // Calculate bounds for centering
  const rows = Array.from(grid.values()).map(c => c.row);
  const cols = Array.from(grid.values()).map(c => c.col);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);

  for (const cell of grid.values()) {
    const id = getKey(cell.row, cell.col);

    // Calculate pixel position (centered in viewport)
    const x = MARGIN + (cell.col - minCol) * CELL_SIZE + CELL_SIZE / 2;
    const y = MARGIN + (cell.row - minRow) * CELL_SIZE + CELL_SIZE / 2;

    const node: MapNode = {
      id,
      x,
      y,
      type: cell.type,
      neighbors: [],
    };

    // Add neighbors (only adjacent cells that exist in grid)
    const directions = [
      { dr: -1, dc: 0 }, // Up
      { dr: 1, dc: 0 }, // Down
      { dr: 0, dc: -1 }, // Left
      { dr: 0, dc: 1 }, // Right
    ];

    for (const dir of directions) {
      const nr = cell.row + dir.dr;
      const nc = cell.col + dir.dc;
      const neighborKey = getKey(nr, nc);
      if (grid.has(neighborKey)) {
        node.neighbors.push(neighborKey);
      }
    }

    allNodes.push(node);
  }

  // Find start node
  const startNode = allNodes.find(n => n.type === 'start');
  const startNodeId = startNode?.id ?? allNodes[0]?.id ?? '0,0';

  // Calculate canvas size based on actual content
  const width = MARGIN * 2 + (maxCol - minCol + 1) * CELL_SIZE;
  const height = MARGIN * 2 + (maxRow - minRow + 1) * CELL_SIZE;

  return {
    nodes: allNodes,
    width: Math.max(width, 600),
    height: Math.max(height, 400),
    startNodeId,
  };
}
