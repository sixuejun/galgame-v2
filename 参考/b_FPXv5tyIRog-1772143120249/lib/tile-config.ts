export const TILE_CONFIG: Record<number, { image: string; label: string }> = {
  2: { image: "/tiles/tile-2.jpg", label: "口粮" },
  4: { image: "/tiles/tile-4.jpg", label: "蜡烛" },
  8: { image: "/tiles/tile-8.jpg", label: "麻绳" },
  16: { image: "/tiles/tile-16.jpg", label: "防毒面具" },
  32: { image: "/tiles/tile-32.jpg", label: "急救包" },
  64: { image: "/tiles/tile-64.jpg", label: "火柴" },
  128: { image: "/tiles/tile-128.jpg", label: "求生刀" },
  256: { image: "/tiles/tile-256.jpg", label: "铁罐头" },
  512: { image: "/tiles/tile-512.jpg", label: "指南针" },
  1024: { image: "/tiles/tile-1024.jpg", label: "要塞" },
  2048: { image: "/tiles/tile-2048.jpg", label: "新生" },
}

export function getTileConfig(value: number) {
  return TILE_CONFIG[value] || { image: "/tiles/tile-2.jpg", label: `第${value}级` }
}
