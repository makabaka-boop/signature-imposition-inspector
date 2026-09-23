/**
 * 骑马订拼版核心逻辑。
 *
 * 这是全应用唯一的映射来源：表格、卡片预览、页码反查、JSON 导出
 * 全部读取 buildImposition 生成的同一份结构，不存在第二套公式。
 *
 * 生成顺序：
 *   1. 先按「左订 + 长边翻转」基准排出每个签帖的每一张纸；
 *   2. 右订：把每一面（正面、背面）的左右槽位互换；
 *   3. 短边翻转：在已有结果上，把背面的左右槽位再互换一次；
 *   4. 每个签帖独立补 BLANK 到满帖。
 */

export type Binding = 'left' | 'right';
export type Flip = 'long' | 'short';

export interface ImpositionSettings {
  /** 正文页数，1–512 */
  totalPages: number;
  /** 每签帖页数，4–32 且为 4 的倍数 */
  signatureSize: number;
  /** 左订 / 右订 */
  binding: Binding;
  /** 长边 / 短边翻转 */
  flip: Flip;
}

export const LIMITS = {
  totalPages: { min: 1, max: 512 },
  signatureSize: { min: 4, max: 32, step: 4 },
} as const;

/** 槽位内容：实体页码或补白 */
export type PageRef = number | 'BLANK';

export type Slot = 'frontLeft' | 'frontRight' | 'backLeft' | 'backRight';

export const SLOTS: readonly Slot[] = ['frontLeft', 'frontRight', 'backLeft', 'backRight'];

export const SLOT_LABELS: Record<Slot, string> = {
  frontLeft: '正面 · 左',
  frontRight: '正面 · 右',
  backLeft: '背面 · 左',
  backRight: '背面 · 右',
};

export type SheetSlots = Record<Slot, PageRef>;

/** 一张实体纸（正背两面、每面左右两槽） */
export interface Sheet {
  /** 签帖序号，从 0 开始 */
  signatureIndex: number;
  /** 签帖内纸张序号，从 0 开始（0 为最外层） */
  sheetIndex: number;
  slots: SheetSlots;
}

export interface Imposition {
  settings: ImpositionSettings;
  /** 按实体纸张顺序排列：先签帖、再签帖内从外到内 */
  sheets: Sheet[];
}

/** 页码反查结果 */
export interface PageLocation {
  page: number;
  signatureIndex: number;
  sheetIndex: number;
  side: 'front' | 'back';
  slot: Slot;
}

export function signatureSizeOptions(): number[] {
  const { min, max, step } = LIMITS.signatureSize;
  const options: number[] = [];
  for (let v = min; v <= max; v += step) options.push(v);
  return options;
}

/** 校验参数，返回错误信息列表（空数组表示合法） */
export function validateSettings(settings: ImpositionSettings): string[] {
  const errors: string[] = [];
  const { totalPages, signatureSize } = settings;
  const tp = LIMITS.totalPages;
  const ss = LIMITS.signatureSize;

  if (!Number.isInteger(totalPages) || totalPages < tp.min || totalPages > tp.max) {
    errors.push(`正文页数必须是 ${tp.min}–${tp.max} 的整数`);
  }
  if (
    !Number.isInteger(signatureSize) ||
    signatureSize < ss.min ||
    signatureSize > ss.max ||
    signatureSize % ss.step !== 0
  ) {
    errors.push(`签帖大小必须是 ${ss.min}–${ss.max} 之间 ${ss.step} 的倍数`);
  }
  return errors;
}

export function isValidSettings(settings: ImpositionSettings): boolean {
  return validateSettings(settings).length === 0;
}

function swapLeftRight(slots: SheetSlots, sides: ReadonlyArray<'front' | 'back'>): SheetSlots {
  const next: SheetSlots = { ...slots };
  for (const side of sides) {
    const left: Slot = side === 'front' ? 'frontLeft' : 'backLeft';
    const right: Slot = side === 'front' ? 'frontRight' : 'backRight';
    const tmp = next[left];
    next[left] = next[right];
    next[right] = tmp;
  }
  return next;
}

/**
 * 生成完整拼版。参数非法时抛错——调用方（UI）应保证只用合法参数调用，
 * 非法输入不得覆盖上一次合法的拼版结果。
 */
export function buildImposition(settings: ImpositionSettings): Imposition {
  const errors = validateSettings(settings);
  if (errors.length > 0) {
    throw new Error(`非法拼版参数：${errors.join('；')}`);
  }

  const { totalPages, signatureSize, binding, flip } = settings;
  const signatureCount = Math.ceil(totalPages / signatureSize);
  const sheetsPerSignature = signatureSize / 4;
  const sheets: Sheet[] = [];

  for (let signatureIndex = 0; signatureIndex < signatureCount; signatureIndex++) {
    const base = signatureIndex * signatureSize; // 签帖内第 1 页的全局页码 = base + 1
    for (let sheetIndex = 0; sheetIndex < sheetsPerSignature; sheetIndex++) {
      // 基准：左订 + 长边翻转
      let slots: SheetSlots = {
        frontLeft: base + signatureSize - 2 * sheetIndex,
        frontRight: base + 1 + 2 * sheetIndex,
        backLeft: base + 2 + 2 * sheetIndex,
        backRight: base + signatureSize - 1 - 2 * sheetIndex,
      };
      // 右订：每一面的左右槽位互换
      if (binding === 'right') {
        slots = swapLeftRight(slots, ['front', 'back']);
      }
      // 短边翻转：背面左右槽位再互换一次
      if (flip === 'short') {
        slots = swapLeftRight(slots, ['back']);
      }
      // 每个签帖独立补 BLANK 到满帖
      for (const slot of SLOTS) {
        const page = slots[slot] as number;
        if (page > totalPages) slots[slot] = 'BLANK';
      }
      sheets.push({ signatureIndex, sheetIndex, slots });
    }
  }

  return { settings, sheets };
}

/** 由同一份拼版结构反建「页码 → 实体位置」索引 */
export function buildPageIndex(imposition: Imposition): Map<number, PageLocation> {
  const index = new Map<number, PageLocation>();
  for (const sheet of imposition.sheets) {
    for (const slot of SLOTS) {
      const ref = sheet.slots[slot];
      if (ref === 'BLANK') continue;
      index.set(ref, {
        page: ref,
        signatureIndex: sheet.signatureIndex,
        sheetIndex: sheet.sheetIndex,
        side: slot.startsWith('front') ? 'front' : 'back',
        slot,
      });
    }
  }
  return index;
}

export interface ImpositionSummary {
  signatureCount: number;
  sheetCount: number;
  blankCount: number;
}

export function summarize(imposition: Imposition): ImpositionSummary {
  let blankCount = 0;
  const signatures = new Set<number>();
  for (const sheet of imposition.sheets) {
    signatures.add(sheet.signatureIndex);
    for (const slot of SLOTS) {
      if (sheet.slots[slot] === 'BLANK') blankCount++;
    }
  }
  return {
    signatureCount: signatures.size,
    sheetCount: imposition.sheets.length,
    blankCount,
  };
}
