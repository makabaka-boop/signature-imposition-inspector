import { useState } from 'react';
import { PageRef, Sheet } from '../imposition';

function SlotView({ label, value }: { label: string; value: PageRef }) {
  return (
    <div className={`slot ${value === 'BLANK' ? 'blank' : ''}`}>
      <span className="slot-label">{label}</span>
      <span className="slot-page">{value === 'BLANK' ? 'BLANK' : value}</span>
    </div>
  );
}

export function SheetCard({ sheet }: { sheet: Sheet }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="sheet-card">
      <div className="sheet-card-header">
        <span>
          签帖 {sheet.signatureIndex + 1} · 纸张 {sheet.sheetIndex + 1}
        </span>
        <button type="button" onClick={() => setFlipped((f) => !f)}>
          {flipped ? '看正面' : '翻面'}
        </button>
      </div>
      <div className={`sheet-card-inner${flipped ? ' flipped' : ''}`}>
        <div className="sheet-face front">
          <div className="face-label">正面</div>
          <div className="slot-row">
            <SlotView label="左" value={sheet.slots.frontLeft} />
            <SlotView label="右" value={sheet.slots.frontRight} />
          </div>
        </div>
        <div className="sheet-face back">
          <div className="face-label">背面</div>
          <div className="slot-row">
            <SlotView label="左" value={sheet.slots.backLeft} />
            <SlotView label="右" value={sheet.slots.backRight} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SheetCardGrid({ sheets }: { sheets: Sheet[] }) {
  return (
    <section className="panel">
      <h2>纸张卡片（点击翻面核对正背）</h2>
      <div className="card-grid">
        {sheets.map((sheet) => (
          <SheetCard key={`${sheet.signatureIndex}-${sheet.sheetIndex}`} sheet={sheet} />
        ))}
      </div>
    </section>
  );
}
