import { useState } from 'react';
import { PageLocation, SLOT_LABELS } from '../imposition';

interface PageLookupProps {
  pageIndex: Map<number, PageLocation>;
  totalPages: number;
}

export function PageLookup({ pageIndex, totalPages }: PageLookupProps) {
  const [input, setInput] = useState('');

  const page = Number(input);
  const location = input.trim() !== '' && Number.isInteger(page) ? pageIndex.get(page) : undefined;
  const outOfRange = input.trim() !== '' && Number.isInteger(page) && page >= 1 && page > totalPages;

  return (
    <section className="panel lookup">
      <h2>页码反查</h2>
      <div className="lookup-row">
        <label htmlFor="pageLookup">页码</label>
        <input
          id="pageLookup"
          type="number"
          min={1}
          max={totalPages}
          placeholder={`1–${totalPages}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>
      {location && (
        <p className="lookup-result">
          第 <strong>{location.page}</strong> 页 → 第 {location.signatureIndex + 1} 签帖 · 第{' '}
          {location.sheetIndex + 1} 张 · {location.side === 'front' ? '正面' : '背面'} ·{' '}
          {SLOT_LABELS[location.slot].split(' · ')[1]}槽
        </p>
      )}
      {outOfRange && <p className="lookup-miss">超出正文页数（共 {totalPages} 页）</p>}
      {input.trim() !== '' && !location && !outOfRange && (
        <p className="lookup-miss">该页不在当前拼版中</p>
      )}
    </section>
  );
}
