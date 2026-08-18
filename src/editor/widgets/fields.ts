import { createElement } from '../../platform/dom';

/* Constructores reutilizables de campos de formulario para los paneles del editor. Cada uno es un
   componente atómico: el layout contextual se añade en el consumidor, no aquí. */

export function fieldRow(labelText: string, control: HTMLElement): HTMLElement {
  const row = createElement('label', 'filaCampo');
  row.append(createElement('span', 'etiquetaCampo', labelText), control);
  return row;
}

export function makeSelect(
  options: ReadonlyArray<{ value: string; label: string }>,
  onChange: (value: string) => void,
): HTMLSelectElement {
  const select = createElement('select', 'selectorCampo');
  for (const option of options) {
    const element = createElement('option');
    element.value = option.value;
    element.textContent = option.label;
    select.appendChild(element);
  }
  select.addEventListener('change', () => onChange(select.value));
  return select;
}

export function makeCheckbox(checked: boolean, onChange: (checked: boolean) => void): HTMLInputElement {
  const input = createElement('input', 'casillaCampo');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  return input;
}

export function makeRange(
  min: number,
  max: number,
  step: number,
  value: number,
  onChange: (value: number) => void,
): HTMLInputElement {
  const input = createElement('input', 'rangoCampo');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener('input', () => onChange(Number(input.value)));
  return input;
}

export function makeNumber(value: number, onChange: (value: number) => void): HTMLInputElement {
  const input = createElement('input', 'numeroCampo');
  input.type = 'number';
  input.value = String(value);
  input.addEventListener('change', () => onChange(Number(input.value)));
  return input;
}
