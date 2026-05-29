import type { MapConfig } from '@/types'

/**
 * Doomsday Board Game Map Configuration
 * 
 * Layout: A roughly serpentine path with branches & shortcuts.
 * ~40 nodes spread across a 1400x900 space.
 * 
 * Node naming: n01..n40
 * Types: start, empty, encounter, trap, fortune, transfer
 */
export const defaultMap: MapConfig = {
  width: 1600,
  height: 950,
  startNodeId: 'n01',
  nodes: [
    // === Row 1: Top path (left to right) ===
    { id: 'n01', x: 80,  y: 80,  type: 'start',     label: '起点',     neighbors: ['n02'] },
    { id: 'n02', x: 200, y: 80,  type: 'empty',      neighbors: ['n01', 'n03'] },
    { id: 'n03', x: 320, y: 80,  type: 'encounter',  label: '遭遇',     neighbors: ['n02', 'n04'] },
    { id: 'n04', x: 440, y: 80,  type: 'empty',      neighbors: ['n03', 'n05', 'n15'] },  // branch down to n15
    { id: 'n05', x: 560, y: 80,  type: 'trap',       label: '陷阱',     neighbors: ['n04', 'n06'] },
    { id: 'n06', x: 680, y: 80,  type: 'empty',      neighbors: ['n05', 'n07'] },
    { id: 'n07', x: 800, y: 80,  type: 'fortune',    label: '意外之喜', neighbors: ['n06', 'n08'] },
    { id: 'n08', x: 920, y: 80,  type: 'empty',      neighbors: ['n07', 'n09'] },
    { id: 'n09', x: 1040,y: 80,  type: 'encounter',  label: '遭遇',     neighbors: ['n08', 'n10'] },
    { id: 'n10', x: 1160,y: 80,  type: 'empty',      neighbors: ['n09', 'n11'] },
    { id: 'n11', x: 1280,y: 80,  type: 'trap',       label: '陷阱',     neighbors: ['n10', 'n12'] },
    { id: 'n12', x: 1400,y: 80,  type: 'empty',      neighbors: ['n11', 'n13'] },

    // === Turn down (right side) ===
    { id: 'n13', x: 1480,y: 180, type: 'transfer',   label: '传送',     neighbors: ['n12', 'n14'] },
    { id: 'n14', x: 1480,y: 300, type: 'empty',      neighbors: ['n13', 'n21'] },

    // === Shortcut branch (from n04 going down) ===
    { id: 'n15', x: 440, y: 200, type: 'encounter',  label: '遭遇',     neighbors: ['n04', 'n16'] },
    { id: 'n16', x: 440, y: 320, type: 'trap',       label: '陷阱',     neighbors: ['n15', 'n17'] },
    { id: 'n17', x: 540, y: 400, type: 'fortune',    label: '意外之喜', neighbors: ['n16', 'n18'] },
    { id: 'n18', x: 440, y: 490, type: 'empty',      neighbors: ['n17', 'n27'] }, // merges at n27

    // === Row 2: Middle path (right to left) ===
    { id: 'n21', x: 1400,y: 400, type: 'encounter',  label: '遭遇',     neighbors: ['n14', 'n22'] },
    { id: 'n22', x: 1280,y: 400, type: 'empty',      neighbors: ['n21', 'n23'] },
    { id: 'n23', x: 1160,y: 400, type: 'fortune',    label: '意外之喜', neighbors: ['n22', 'n24'] },
    { id: 'n24', x: 1040,y: 400, type: 'empty',      neighbors: ['n23', 'n25', 'n35'] }, // branch down to n35
    { id: 'n25', x: 920, y: 400, type: 'trap',       label: '陷阱',     neighbors: ['n24', 'n26'] },
    { id: 'n26', x: 800, y: 400, type: 'encounter',  label: '遭遇',     neighbors: ['n25', 'n27'] },
    { id: 'n27', x: 640, y: 490, type: 'empty',      neighbors: ['n26', 'n18', 'n28'] }, // shortcut merge
    { id: 'n28', x: 520, y: 580, type: 'transfer',   label: '传送',     neighbors: ['n27', 'n29'] },

    // === Turn down (left side) ===
    { id: 'n29', x: 200, y: 490, type: 'empty',      neighbors: ['n28', 'n30'] },
    { id: 'n30', x: 80,  y: 580, type: 'trap',       label: '陷阱',     neighbors: ['n29', 'n31'] },

    // === Row 3: Bottom path (left to right) ===
    { id: 'n31', x: 80,  y: 720, type: 'empty',      neighbors: ['n30', 'n32'] },
    { id: 'n32', x: 200, y: 720, type: 'encounter',  label: '遭遇',     neighbors: ['n31', 'n33'] },
    { id: 'n33', x: 320, y: 720, type: 'fortune',    label: '意外之喜', neighbors: ['n32', 'n34'] },
    { id: 'n34', x: 440, y: 720, type: 'empty',      neighbors: ['n33', 'n37'] },

    // === Shortcut branch (from n24 going down) ===
    { id: 'n35', x: 1040,y: 540, type: 'encounter',  label: '遭遇',     neighbors: ['n24', 'n36'] },
    { id: 'n36', x: 1040,y: 660, type: 'trap',       label: '陷阱',     neighbors: ['n35', 'n40'] },

    // === Row 3 continued ===
    { id: 'n37', x: 600, y: 780, type: 'trap',       label: '陷阱',     neighbors: ['n34', 'n38'] },
    { id: 'n38', x: 760, y: 840, type: 'transfer',   label: '传送',     neighbors: ['n37', 'n39'] },
    { id: 'n39', x: 920, y: 840, type: 'fortune',    label: '意外之喜', neighbors: ['n38', 'n40'] },
    { id: 'n40', x: 1100,y: 800, type: 'encounter',  label: '终末',     neighbors: ['n39', 'n36'] }, // shortcut merge
  ],
}
