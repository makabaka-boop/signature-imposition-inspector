import { PageRef, SLOT_LABELS, SLOTS, Sheet } from '../imposition';

function Cell({ value }: { value: PageRef }) {
  return <td className={value === 'BLANK' ? 'blank' : ''}>{value === 'BLANK' ? 'BLANK' : value}</td>;
}

export function ImpositionTable({ sheets }: { sheets: Sheet[] }) {
  return (
    <section className="panel">
      <h2>拼版表（实体纸张顺序）</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>签帖</th>
              <th>纸张</th>
              {SLOTS.map((slot) => (
                <th key={slot}>{SLOT_LABELS[slot]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheets.map((sheet) => (
              <tr key={`${sheet.signatureIndex}-${sheet.sheetIndex}`}>
                <td>第 {sheet.signatureIndex + 1} 帖</td>
                <td>第 {sheet.sheetIndex + 1} 张</td>
                {SLOTS.map((slot) => (
                  <Cell key={slot} value={sheet.slots[slot]} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
