import { describe, expect, it } from 'vitest';
import {
  Binding,
  Flip,
  ImpositionSettings,
  PageRef,
  SLOTS,
  buildImposition,
  buildPageIndex,
  summarize,
  validateSettings,
} from './imposition';

const BINDINGS: Binding[] = ['left', 'right'];
const FLIPS: Flip[] = ['long', 'short'];

function settings(totalPages: number, signatureSize: number, binding: Binding, flip: Flip): ImpositionSettings {
  return { totalPages, signatureSize, binding, flip };
}

/** 把拼版压成便于断言的二维数组：[纸张][frontLeft, frontRight, backLeft, backRight] */
function slotsOf(s: ImpositionSettings): PageRef[][] {
  return buildImposition(s).sheets.map((sheet) => SLOTS.map((slot) => sheet.slots[slot]));
}

describe('金样：4 页（1 签帖 1 张）', () => {
  it('左订长边', () => {
    expect(slotsOf(settings(4, 4, 'left', 'long'))).toEqual([[4, 1, 2, 3]]);
  });
  it('左订短边', () => {
    expect(slotsOf(settings(4, 4, 'left', 'short'))).toEqual([[4, 1, 3, 2]]);
  });
  it('右订长边', () => {
    expect(slotsOf(settings(4, 4, 'right', 'long'))).toEqual([[1, 4, 3, 2]]);
  });
  it('右订短边', () => {
    expect(slotsOf(settings(4, 4, 'right', 'short'))).toEqual([[1, 4, 2, 3]]);
  });
});

describe('金样：8 页（1 签帖 2 张）', () => {
  it('左订长边', () => {
    expect(slotsOf(settings(8, 8, 'left', 'long'))).toEqual([
      [8, 1, 2, 7],
      [6, 3, 4, 5],
    ]);
  });
  it('左订短边', () => {
    expect(slotsOf(settings(8, 8, 'left', 'short'))).toEqual([
      [8, 1, 7, 2],
      [6, 3, 5, 4],
    ]);
  });
  it('右订长边', () => {
    expect(slotsOf(settings(8, 8, 'right', 'long'))).toEqual([
      [1, 8, 7, 2],
      [3, 6, 5, 4],
    ]);
  });
  it('右订短边', () => {
    expect(slotsOf(settings(8, 8, 'right', 'short'))).toEqual([
      [1, 8, 2, 7],
      [3, 6, 4, 5],
    ]);
  });
});

describe('金样：12 页（1 签帖 3 张）', () => {
  it('左订长边', () => {
    expect(slotsOf(settings(12, 12, 'left', 'long'))).toEqual([
      [12, 1, 2, 11],
      [10, 3, 4, 9],
      [8, 5, 6, 7],
    ]);
  });
  it('左订短边', () => {
    expect(slotsOf(settings(12, 12, 'left', 'short'))).toEqual([
      [12, 1, 11, 2],
      [10, 3, 9, 4],
      [8, 5, 7, 6],
    ]);
  });
  it('右订长边', () => {
    expect(slotsOf(settings(12, 12, 'right', 'long'))).toEqual([
      [1, 12, 11, 2],
      [3, 10, 9, 4],
      [5, 8, 7, 6],
    ]);
  });
  it('右订短边', () => {
    expect(slotsOf(settings(12, 12, 'right', 'short'))).toEqual([
      [1, 12, 2, 11],
      [3, 10, 4, 9],
      [5, 8, 6, 7],
    ]);
  });
});

describe('金样：每个签帖独立补 BLANK 到满帖', () => {
  it('10 页 / 签帖 8：第二签帖补 6 个 BLANK', () => {
    expect(slotsOf(settings(10, 8, 'left', 'long'))).toEqual([
      [8, 1, 2, 7],
      [6, 3, 4, 5],
      ['BLANK', 9, 10, 'BLANK'],
      ['BLANK', 'BLANK', 'BLANK', 'BLANK'],
    ]);
  });
  it('5 页 / 签帖 4：第二签帖只有第 5 页', () => {
    expect(slotsOf(settings(5, 4, 'left', 'long'))).toEqual([
      [4, 1, 2, 3],
      ['BLANK', 5, 'BLANK', 'BLANK'],
    ]);
  });
});

describe('变换语义：由基准推导而非另写公式', () => {
  const cases: Array<[number, number]> = [
    [4, 4],
    [8, 8],
    [12, 12],
    [10, 8],
    [16, 8],
    [33, 8],
  ];

  it('右订 = 基准每一面左右互换', () => {
    for (const [pages, size] of cases) {
      for (const flip of FLIPS) {
        const base = slotsOf(settings(pages, size, 'left', flip));
        const swapped = slotsOf(settings(pages, size, 'right', flip));
        expect(swapped).toEqual(base.map(([fl, fr, bl, br]) => [fr, fl, br, bl]));
      }
    }
  });

  it('短边 = 同装订方式下背面左右再互换', () => {
    for (const [pages, size] of cases) {
      for (const binding of BINDINGS) {
        const longEdge = slotsOf(settings(pages, size, binding, 'long'));
        const shortEdge = slotsOf(settings(pages, size, binding, 'short'));
        expect(shortEdge).toEqual(longEdge.map(([fl, fr, bl, br]) => [fl, fr, br, bl]));
      }
    }
  });
});

describe('性质：正向生成与反向查找互查（覆盖全部模式）', () => {
  const combos: Array<[number, number]> = [
    [1, 4],
    [4, 4],
    [5, 4],
    [7, 4],
    [8, 8],
    [9, 12],
    [10, 8],
    [12, 12],
    [16, 8],
    [20, 20],
    [32, 32],
    [33, 8],
    [100, 16],
    [512, 32],
    [512, 4],
  ];

  for (const [totalPages, signatureSize] of combos) {
    for (const binding of BINDINGS) {
      for (const flip of FLIPS) {
        it(`${totalPages} 页 / 签帖 ${signatureSize} / ${binding} 订 / ${flip} 边`, () => {
          const imposition = buildImposition(settings(totalPages, signatureSize, binding, flip));
          const index = buildPageIndex(imposition);

          // 每个正文页恰好出现一次
          expect(index.size).toBe(totalPages);

          // 正查：每个槽位里的页码，反查结果必须指回这个槽位
          for (const sheet of imposition.sheets) {
            for (const slot of SLOTS) {
              const ref = sheet.slots[slot];
              if (ref === 'BLANK') continue;
              const loc = index.get(ref);
              expect(loc).toBeDefined();
              expect(loc!.signatureIndex).toBe(sheet.signatureIndex);
              expect(loc!.sheetIndex).toBe(sheet.sheetIndex);
              expect(loc!.slot).toBe(slot);
            }
          }

          // 反查：每个页码按索引指到的槽位，里面必须正是这个页码
          for (let page = 1; page <= totalPages; page++) {
            const loc = index.get(page);
            expect(loc).toBeDefined();
            const sheet = imposition.sheets.find(
              (s) => s.signatureIndex === loc!.signatureIndex && s.sheetIndex === loc!.sheetIndex,
            );
            expect(sheet).toBeDefined();
            expect(sheet!.slots[loc!.slot]).toBe(page);
          }

          // 纸张数与 BLANK 数符合签帖独立补白
          const signatureCount = Math.ceil(totalPages / signatureSize);
          const summary = summarize(imposition);
          expect(summary.signatureCount).toBe(signatureCount);
          expect(summary.sheetCount).toBe(signatureCount * (signatureSize / 4));
          expect(summary.blankCount).toBe(signatureCount * signatureSize - totalPages);
        });
      }
    }
  }
});

describe('参数校验', () => {
  it('接受边界合法值', () => {
    expect(validateSettings(settings(1, 4, 'left', 'long'))).toEqual([]);
    expect(validateSettings(settings(512, 32, 'right', 'short'))).toEqual([]);
  });

  it('拒绝非法正文页数', () => {
    for (const totalPages of [0, -1, 513, 1.5, NaN]) {
      expect(validateSettings(settings(totalPages, 8, 'left', 'long')).length).toBeGreaterThan(0);
    }
  });

  it('拒绝非法签帖大小', () => {
    for (const signatureSize of [0, 2, 5, 6, 10, 34, 36, NaN]) {
      expect(validateSettings(settings(16, signatureSize, 'left', 'long')).length).toBeGreaterThan(0);
    }
  });

  it('非法参数不得用于生成拼版', () => {
    expect(() => buildImposition(settings(0, 8, 'left', 'long'))).toThrow();
    expect(() => buildImposition(settings(16, 6, 'left', 'long'))).toThrow();
  });
});
