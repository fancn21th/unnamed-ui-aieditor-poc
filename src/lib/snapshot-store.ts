import type { JSONContent } from "@tiptap/react";

export interface SnapshotEntry {
  id: string;
  name: string;
  timestamp: number;
  docJSON: JSONContent;
}

const STORAGE_KEY = "md_snapshots_v1";

function load(): SnapshotEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SnapshotEntry[]) : [];
  } catch {
    return [];
  }
}

function persist(entries: SnapshotEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** 保存一个新快照，自动命名"Version N"，按时间戳倒序排列（最新在前） */
export function saveSnapshot(docJSON: JSONContent, name?: string): SnapshotEntry {
  const entries = load();
  const version = entries.length + 1;
  const entry: SnapshotEntry = {
    id: `snap_${Date.now()}`,
    name: name ?? `Version ${version}`,
    timestamp: Date.now(),
    docJSON,
  };
  // 最新版本放在数组头部
  persist([entry, ...entries]);
  return entry;
}

/** 获取所有快照，最新在前 */
export function getSnapshots(): SnapshotEntry[] {
  return load();
}

/** 删除指定快照 */
export function deleteSnapshot(id: string): void {
  persist(load().filter((e) => e.id !== id));
}

/** 清空所有快照 */
export function clearSnapshots(): void {
  localStorage.removeItem(STORAGE_KEY);
}
