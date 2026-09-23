import { useEffect, useMemo, useState } from 'react';
import {
  Binding,
  Flip,
  Imposition,
  ImpositionSettings,
  buildImposition,
  buildPageIndex,
  summarize,
  validateSettings,
} from './imposition';
import { Controls } from './components/Controls';
import { ImpositionTable } from './components/ImpositionTable';
import { PageLookup } from './components/PageLookup';
import { SheetCardGrid } from './components/SheetCard';

const DEFAULT_SETTINGS: ImpositionSettings = {
  totalPages: 16,
  signatureSize: 8,
  binding: 'left',
  flip: 'long',
};

function sameSettings(a: ImpositionSettings, b: ImpositionSettings): boolean {
  return (
    a.totalPages === b.totalPages &&
    a.signatureSize === b.signatureSize &&
    a.binding === b.binding &&
    a.flip === b.flip
  );
}

export default function App() {
  const [totalPagesInput, setTotalPagesInput] = useState(String(DEFAULT_SETTINGS.totalPages));
  const [signatureSize, setSignatureSize] = useState(DEFAULT_SETTINGS.signatureSize);
  const [binding, setBinding] = useState<Binding>(DEFAULT_SETTINGS.binding);
  const [flip, setFlip] = useState<Flip>(DEFAULT_SETTINGS.flip);

  // 只保存「上一次合法」的拼版；非法输入永远不会覆盖它
  const [imposition, setImposition] = useState<Imposition>(() => buildImposition(DEFAULT_SETTINGS));

  const candidate: ImpositionSettings = {
    totalPages: Number(totalPagesInput),
    signatureSize,
    binding,
    flip,
  };
  const errors = validateSettings(candidate);

  useEffect(() => {
    if (errors.length > 0) return; // 非法组合：保留旧拼版
    setImposition((prev) =>
      sameSettings(prev.settings, candidate) ? prev : buildImposition(candidate),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPagesInput, signatureSize, binding, flip]);

  // 反查索引、表格、卡片、JSON 导出全部来自同一份 imposition
  const pageIndex = useMemo(() => buildPageIndex(imposition), [imposition]);
  const summary = summarize(imposition);

  const downloadJson = () => {
    const payload = {
      settings: imposition.settings,
      summary,
      sheets: imposition.sheets,
      pageIndex: Array.from(pageIndex.values()),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imposition-p${imposition.settings.totalPages}-s${imposition.settings.signatureSize}-${imposition.settings.binding}-${imposition.settings.flip}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header>
        <h1>骑马订拼版检查台</h1>
        <p className="subtitle">离线 · 纯前端 · 印刷前逐页确认实体位置</p>
      </header>

      <Controls
        totalPagesInput={totalPagesInput}
        onTotalPagesChange={setTotalPagesInput}
        signatureSize={signatureSize}
        onSignatureSizeChange={setSignatureSize}
        binding={binding}
        onBindingChange={setBinding}
        flip={flip}
        onFlipChange={setFlip}
        errors={errors}
      />

      <section className="panel summary">
        <div>
          当前拼版：{imposition.settings.totalPages} 页正文 · 签帖 {imposition.settings.signatureSize}{' '}
          页 · {imposition.settings.binding === 'left' ? '左订' : '右订'} ·{' '}
          {imposition.settings.flip === 'long' ? '长边翻转' : '短边翻转'}
        </div>
        <div>
          共 {summary.signatureCount} 签帖 · {summary.sheetCount} 张纸 · {summary.blankCount} 个 BLANK
        </div>
        <button type="button" onClick={downloadJson}>
          下载 JSON
        </button>
      </section>

      <PageLookup pageIndex={pageIndex} totalPages={imposition.settings.totalPages} />
      <ImpositionTable sheets={imposition.sheets} />
      <SheetCardGrid sheets={imposition.sheets} />
    </div>
  );
}
