/**
 * 通过点分隔路径访问嵌套对象
 * @param obj 目标对象
 * @param path 点分隔路径 (例如: 'characters.user.name')
 * @returns 路径对应的值
 */
export function getDataByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * 通过点分隔路径设置嵌套对象的值
 * @param obj 目标对象
 * @param path 点分隔路径
 * @param value 要设置的值
 */
export function setDataByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  let current: Record<string, unknown> = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }

  current[keys[keys.length - 1]] = value
}
