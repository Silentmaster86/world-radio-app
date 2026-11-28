import { DESIGNS, useDesign } from '../context/DesignContext';
import { useLanguage } from '../context/LanguageContext';
import { designText } from './messages';
import './picker.css';
export default function DesignPicker() {
  const { design, setDesign, pending, error } = useDesign();
  const { language } = useLanguage();
  return (
    <fieldset className="design-picker" aria-busy={!!pending}>
      <legend>{designText(language, 0)}</legend>
      <p>{designText(language, 1)}</p>
      <div className="design-options">
        {DESIGNS.map((id, index) => (
          <button
            key={id}
            type="button"
            data-design-choice={id}
            aria-pressed={design === id}
            onClick={() => setDesign(id)}
          >
            <span className={`design-preview preview-${id}`} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <strong>{id === 'classic' ? 'Classic' : id[0].toUpperCase() + id.slice(1)}</strong>
            <small>{designText(language, index + 2)}</small>
          </button>
        ))}
      </div>
      {pending && <p role="status">{designText(language, 7)}</p>}
      {error && (
        <p role={error === 'load' ? 'alert' : 'status'}>
          {designText(language, error === 'load' ? 8 : 9)}
        </p>
      )}
    </fieldset>
  );
}
