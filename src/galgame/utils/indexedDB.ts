/**
 * IndexedDB 封装：用于存储场景绑定图片
 *
 * 设计思路：
 * - IndexedDB 存储实际图片数据（base64）
 * - 聊天变量只存储轻量元数据（id、type、timestamp）
 * - 这样可以避免聊天文件膨胀
 */

const DB_NAME = 'galgame-bindings';
const DB_VERSION = 1;
const STORE_NAME = 'bindings';

export interface BindingData {
  id: string;
  imageData: string; // base64
  type: 'background' | 'cg';
  timestamp: number;
}

export interface BindingMeta {
  id: string;
  type: 'background' | 'cg';
  timestamp: number;
}

export interface ChatBindings {
  [sceneTitle: string]: BindingMeta;
}

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('IndexedDB 打开失败'));

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * 保存单张绑定图片到 IndexedDB
 */
export async function saveBindingImage(binding: BindingData): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(binding);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error('保存绑定图片失败'));
  });
}

/**
 * 从 IndexedDB 获取单张绑定图片
 */
export async function getBindingImage(id: string): Promise<BindingData | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(new Error('获取绑定图片失败'));
  });
}

/**
 * 从 IndexedDB 删除单张绑定图片
 */
export async function deleteBindingImage(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error('删除绑定图片失败'));
  });
}

/**
 * 获取 IndexedDB 中所有绑定图片
 */
export async function getAllBindings(): Promise<BindingData[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(new Error('获取所有绑定失败'));
  });
}

/**
 * 计算存储用量
 */
export async function calculateStorageUsage(): Promise<{ used: number; count: number }> {
  const all = await getAllBindings();
  let used = 0;
  for (const binding of all) {
    // 估算 base64 大小（原始字节数的 4/3）
    const base64Length = binding.imageData.length - 'data:image/jpeg;base64,'.length;
    used += Math.ceil((base64Length * 3) / 4);
  }
  return { used, count: all.length };
}

/**
 * 清理孤立的绑定图片（聊天变量中不存在对应元数据的图片）
 */
export async function cleanOrphanedBindings(chatBindings: ChatBindings): Promise<number> {
  const all = await getAllBindings();
  const validIds = new Set(Object.values(chatBindings).map((m) => m.id));
  const orphaned = all.filter((b) => !validIds.has(b.id));

  let deleted = 0;
  for (const binding of orphaned) {
    await deleteBindingImage(binding.id);
    deleted++;
  }

  if (deleted > 0) {
    console.info('[IndexedDB] 清理了', deleted, '张孤立绑定图片');
  }
  return deleted;
}

/**
 * 清空所有绑定图片
 */
export async function clearAllBindings(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => {
      console.info('[IndexedDB] 已清空所有绑定图片');
      resolve();
    };
    tx.onerror = () => reject(new Error('清空绑定图片失败'));
  });
}

/**
 * 导出所有绑定数据为 JSON
 */
export async function exportAllBindings(): Promise<string> {
  const all = await getAllBindings();
  const data = {
    version: 1,
    exportedAt: Date.now(),
    bindings: all,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * 从 JSON 导入绑定数据
 */
export async function importBindings(jsonString: string): Promise<{ imported: number; skipped: number }> {
  const data = JSON.parse(jsonString);
  if (!data.version || !data.bindings) {
    throw new Error('无效的备份文件格式');
  }

  let imported = 0;
  let skipped = 0;

  for (const binding of data.bindings as BindingData[]) {
    if (!binding.id || !binding.imageData || !binding.type) {
      skipped++;
      continue;
    }
    await saveBindingImage(binding);
    imported++;
  }

  console.info('[IndexedDB] 导入完成：新增', imported, '张，跳过', skipped, '张');
  return { imported, skipped };
}

/**
 * 生成唯一 ID
 */
export function generateBindingId(): string {
  return crypto.randomUUID();
}
