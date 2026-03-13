import type { SnapshotEntry } from "@/lib/snapshot-store";

interface SnapshotHistoryPanelProps {
  snapshots: SnapshotEntry[];
  /** 当前正在比较的版本 id（点击的那个版本），null 表示未进入比较模式 */
  comparingId: string | null;
  onCompare: (id: string) => void;
  onClose: () => void;
  onRestore: (id: string) => void;
  onSave: () => void;
}

/** 将时间戳格式化为 "DD.MM.YYYY HH:MM" */
function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SnapshotHistoryPanel({
  snapshots,
  comparingId,
  onCompare,
  onClose,
  onRestore,
  onSave,
}: SnapshotHistoryPanelProps) {
  const isComparing = comparingId !== null;

  // 找到正在比较的版本和它的前一版本（index + 1，因为数组是倒序排列的）
  const comparingIndex = snapshots.findIndex((s) => s.id === comparingId);
  const baseSnapshot = comparingIndex >= 0 ? snapshots[comparingIndex] : null;
  const prevSnapshot =
    comparingIndex >= 0 && comparingIndex + 1 < snapshots.length
      ? snapshots[comparingIndex + 1]
      : null;

  return (
    <div className="snapshot-history-panel">
      {/* 标题 */}
      <div className="snapshot-history-panel__header">
        <span className="snapshot-history-panel__title">
          History ({snapshots.length} version{snapshots.length !== 1 ? "s" : ""})
        </span>
        <button className="snapshot-history-panel__save-btn" onClick={onSave}>
          Save Version
        </button>
      </div>

      {/* 版本列表 */}
      <div className="snapshot-history-panel__list">
        {snapshots.length === 0 && (
          <div className="snapshot-history-panel__empty">No versions saved yet.</div>
        )}
        {snapshots.map((snapshot) => {
          const isSelected = snapshot.id === comparingId;
          return (
            <button
              key={snapshot.id}
              className={[
                "snapshot-history-panel__item",
                isSelected ? "snapshot-history-panel__item--selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onCompare(snapshot.id)}
            >
              <span className="snapshot-history-panel__item-name">
                {snapshot.name}
              </span>
              <span className="snapshot-history-panel__item-date">
                {formatDate(snapshot.timestamp)}
              </span>
            </button>
          );
        })}
      </div>

      {/* 比较状态 + 操作按钮 */}
      {isComparing && (
        <div className="snapshot-history-panel__footer">
          {baseSnapshot && prevSnapshot && (
            <div className="snapshot-history-panel__compare-info">
              Comparing {baseSnapshot.name} with {prevSnapshot.name}
            </div>
          )}
          {baseSnapshot && !prevSnapshot && (
            <div className="snapshot-history-panel__compare-info">
              Viewing {baseSnapshot.name} (no previous version)
            </div>
          )}
          <div className="snapshot-history-panel__actions">
            <button
              className="snapshot-history-panel__btn snapshot-history-panel__btn--close"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="snapshot-history-panel__btn snapshot-history-panel__btn--restore"
              onClick={() => comparingId && onRestore(comparingId)}
            >
              Restore
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
