import { Binding, Flip, LIMITS, signatureSizeOptions } from '../imposition';

interface ControlsProps {
  totalPagesInput: string;
  onTotalPagesChange: (value: string) => void;
  signatureSize: number;
  onSignatureSizeChange: (value: number) => void;
  binding: Binding;
  onBindingChange: (value: Binding) => void;
  flip: Flip;
  onFlipChange: (value: Flip) => void;
  errors: string[];
}

export function Controls(props: ControlsProps) {
  return (
    <section className="panel controls">
      <div className="field">
        <label htmlFor="totalPages">
          正文页数（{LIMITS.totalPages.min}–{LIMITS.totalPages.max}）
        </label>
        <input
          id="totalPages"
          type="number"
          min={LIMITS.totalPages.min}
          max={LIMITS.totalPages.max}
          value={props.totalPagesInput}
          onChange={(e) => props.onTotalPagesChange(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="signatureSize">签帖大小（4 的倍数）</label>
        <select
          id="signatureSize"
          value={props.signatureSize}
          onChange={(e) => props.onSignatureSizeChange(Number(e.target.value))}
        >
          {signatureSizeOptions().map((size) => (
            <option key={size} value={size}>
              {size} 页 / 帖
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <span className="field-label">装订方向</span>
        <div className="radio-row">
          <label>
            <input
              type="radio"
              name="binding"
              checked={props.binding === 'left'}
              onChange={() => props.onBindingChange('left')}
            />
            左订
          </label>
          <label>
            <input
              type="radio"
              name="binding"
              checked={props.binding === 'right'}
              onChange={() => props.onBindingChange('right')}
            />
            右订
          </label>
        </div>
      </div>

      <div className="field">
        <span className="field-label">翻纸方式</span>
        <div className="radio-row">
          <label>
            <input
              type="radio"
              name="flip"
              checked={props.flip === 'long'}
              onChange={() => props.onFlipChange('long')}
            />
            长边翻转
          </label>
          <label>
            <input
              type="radio"
              name="flip"
              checked={props.flip === 'short'}
              onChange={() => props.onFlipChange('short')}
            />
            短边翻转
          </label>
        </div>
      </div>

      {props.errors.length > 0 && (
        <div className="errors" role="alert">
          <strong>参数非法，已保留上一次合法拼版：</strong>
          <ul>
            {props.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
