import { describe, it, expect } from "vitest";
import { getTocDepth, calcScrollTarget } from "../toc-utils";

// ─────────────────────────────────────────────────────────────────────────────
// A. getTocDepth — 层级归一化
// ─────────────────────────────────────────────────────────────────────────────
describe("getTocDepth", () => {
  // 边界：空列表时 Math.min(...[]) === Infinity，需特殊处理
  it("空列表时始终返回 1", () => {
    expect(getTocDepth([], 0)).toBe(1);
  });

  it("单个条目深度为 1，无论其原始 level", () => {
    expect(getTocDepth([{ level: 1 }], 0)).toBe(1);
    expect(getTocDepth([{ level: 4 }], 0)).toBe(1);
    expect(getTocDepth([{ level: 6 }], 0)).toBe(1);
  });

  it("全部同级别，所有条目深度均为 1", () => {
    const items = [{ level: 2 }, { level: 2 }, { level: 2 }];
    expect(getTocDepth(items, 0)).toBe(1);
    expect(getTocDepth(items, 1)).toBe(1);
    expect(getTocDepth(items, 2)).toBe(1);
  });

  it("h1→h2→h3 归一化为 1→2→3", () => {
    const items = [{ level: 1 }, { level: 2 }, { level: 3 }];
    expect(getTocDepth(items, 0)).toBe(1);
    expect(getTocDepth(items, 1)).toBe(2);
    expect(getTocDepth(items, 2)).toBe(3);
  });

  it("从 h2 开始（无 h1），最小层级归一化为深度 1", () => {
    const items = [{ level: 2 }, { level: 3 }, { level: 4 }];
    expect(getTocDepth(items, 0)).toBe(1);
    expect(getTocDepth(items, 1)).toBe(2);
    expect(getTocDepth(items, 2)).toBe(3);
  });

  it("从 h3 开始跳至 h5，保留原始相对差值", () => {
    const items = [{ level: 3 }, { level: 5 }];
    // minLevel=3; depths = 1, 3
    expect(getTocDepth(items, 0)).toBe(1);
    expect(getTocDepth(items, 1)).toBe(3);
  });

  it("非单调顺序 h3→h1→h2，各项独立归一化（不依赖顺序）", () => {
    const items = [{ level: 3 }, { level: 1 }, { level: 2 }];
    // minLevel=1; depths = 3, 1, 2
    expect(getTocDepth(items, 0)).toBe(3);
    expect(getTocDepth(items, 1)).toBe(1);
    expect(getTocDepth(items, 2)).toBe(2);
  });

  it("index 指向最后一项（边界索引）", () => {
    const items = [{ level: 1 }, { level: 2 }, { level: 6 }];
    expect(getTocDepth(items, 2)).toBe(6);
  });

  it("h6 单独出现时深度为 1", () => {
    const items = [{ level: 6 }, { level: 6 }];
    expect(getTocDepth(items, 0)).toBe(1);
    expect(getTocDepth(items, 1)).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// B. calcScrollTarget — 滚动偏移计算
// ─────────────────────────────────────────────────────────────────────────────
describe("calcScrollTarget", () => {
  it("基础场景：容器已滚动 100px，目标在容器视口 top=250，容器本身 top=50，无偏移", () => {
    // 100 + (250 - 50) - 0 = 300
    expect(calcScrollTarget(100, 250, 50, 0)).toBe(300);
  });

  it("减去 topOffset 可正确预留 toolbar 高度（60px）", () => {
    // 100 + (250 - 50) - 60 = 240
    expect(calcScrollTarget(100, 250, 50, 60)).toBe(240);
  });

  it("容器未滚动（scrollTop=0），目标与 offset 相等时结果为 0", () => {
    // 0 + (80 - 0) - 80 = 0
    expect(calcScrollTarget(0, 80, 0, 80)).toBe(0);
  });

  it("topOffset 大于元素距容器顶部距离时结果为负数（浏览器 scrollTo 会夹在 0）", () => {
    // 0 + (30 - 0) - 80 = -50
    expect(calcScrollTarget(0, 30, 0, 80)).toBe(-50);
  });

  it("目标恰好在容器顶部（domTop === containerTop），结果为 scrollTop 减去 offset", () => {
    // 200 + (120 - 120) - 0 = 200
    expect(calcScrollTarget(200, 120, 120, 0)).toBe(200);
  });

  it("大数值滚动位置仍保持精度", () => {
    // 10000 + (5000 - 200) - 80 = 14720
    expect(calcScrollTarget(10000, 5000, 200, 80)).toBe(14720);
  });
});
