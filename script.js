// Constants (CODATA values consistent with SciPy's constants collection)
const CONSTS = {
  EH_J: 4.3597447222071e-18,   // Hartree (atomic unit of energy) in J
  EV_J: 1.602176634e-19,       // electronvolt in J
  H: 6.62607015e-34,           // Planck constant (J s)
  C: 299792458,                // speed of light (m/s)
  KB: 1.380649e-23,           // Boltzmann constant (J/K)
  NA: 6.02214076e23,          // Avogadro's number
  J_PER_KCAL: 4184            // 1 kcal = 4184 J
};

const els = {
  precision: document.getElementById('precision'),
  precisionSlider: document.getElementById('precision-slider')
};

const inputs = {
  'hartree': document.getElementById('in-hartree'),
  'ev': document.getElementById('in-ev'),
  'kcal_per_mol': document.getElementById('in-kcal_per_mol'),
  'kj_per_mol': document.getElementById('in-kj_per_mol'),
  'cm-1': document.getElementById('in-cm-1'),
  'kelvin': document.getElementById('in-kelvin'),
  'mhz': document.getElementById('in-mhz')
};

let isUpdating = false;

// Convert input value in `unit` into Joules per particle
function toJoulesPerParticle(val, unit){
  const v = Number(val);
  switch(unit){
    case 'hartree':
      return v * CONSTS.EH_J;
    case 'ev':
      return v * CONSTS.EV_J;
    case 'kcal_per_mol':
      // value is kcal/mol -> J/mol -> J per particle
      return (v * CONSTS.J_PER_KCAL) / CONSTS.NA;
    case 'kj_per_mol':
      return (v * 1000) / CONSTS.NA;
    case 'cm-1':
      // cm^-1 -> m^-1 (x100), E = h * c * (m^-1)
      return v * 100 * CONSTS.H * CONSTS.C;
    case 'kelvin':
      // temperature equivalent: E = k_B * T
      return v * CONSTS.KB;
    case 'mhz':
      // MHz -> Hz: *1e6, E = h * nu
      return v * 1e6 * CONSTS.H;
    default:
      return NaN;
  }
}

// Convert Joules per particle to the requested units
function fromJoules(j){
  const jmol = j * CONSTS.NA;
  return {
    hartree: j / CONSTS.EH_J,
    ev: j / CONSTS.EV_J,
    'kcal_per_mol': jmol / CONSTS.J_PER_KCAL,
    'kj_per_mol': jmol / 1000,
    'cm-1': j / (CONSTS.H * CONSTS.C) / 100,
    'kelvin': j / CONSTS.KB,
    'mhz': (j / CONSTS.H) / 1e6
  };
}

function formatNumber(v, precision){
  if (!isFinite(v)) return '—';
  const abs = Math.abs(v);
  if ((abs !== 0 && (abs < 1e-6 || abs >= 1e8))){
    return Number(v).toExponential(precision);
  }
  // Disable grouping to avoid thousands separators (commas)
  return Number(v).toLocaleString(undefined, {maximumFractionDigits: precision, useGrouping: false});
}

// Format a number for putting into an <input type="number"> value.
// Must use dot as decimal separator and avoid locale-specific formatting.
function formatForInput(v, precision){
  if (!isFinite(v)) return '';
  const abs = Math.abs(v);
  if ((abs !== 0 && (abs < 1e-6 || abs >= 1e8))){
    // exponential with specified precision
    return Number(v).toExponential(precision);
  }
  // Use fixed with requested fraction digits, then trim trailing zeros
  const fixed = Number(v).toFixed(precision);
  // Remove trailing zeros and optional trailing decimal point
  return fixed.replace(/(?:\.0+|(?<=\.\d*)0+)$/, '').replace(/\.$/, '');
}

function update(){
  // This update() is kept for backward compatibility but primary updates
  // are handled by per-input event listeners below.
}

function updateAllFromJ(j, skipUnit = null){
  const rawPrec = Number(els.precision.value);
  const prec = Number.isFinite(rawPrec) ? Math.max(0, Math.min(14, Math.round(rawPrec))) : 6;
  const out = fromJoules(j);
  isUpdating = true;
  for (const key of Object.keys(inputs)){
    const el = inputs[key];
    if (!el) continue;
    // Avoid overwriting the input the user is currently typing to keep cursor position
    if (skipUnit && key === skipUnit) continue;
    const v = out[key];
    el.value = isFinite(v) ? formatForInput(v, prec) : '';
  }
  isUpdating = false;
}

// attach listeners to each input so typing in any box updates the others
for (const unit of Object.keys(inputs)){
  const el = inputs[unit];
  if (!el) continue;
  el.addEventListener('input', (ev)=>{
    if (isUpdating) return;
    const text = ev.target.value;
    if (text === '' || text === null){
      // clear others
      isUpdating = true;
      for (const k of Object.keys(inputs)){
        if (k === unit) continue;
        inputs[k].value = '';
      }
      isUpdating = false;
      return;
    }
    const num = Number(text);
    if (!isFinite(num)) return;
    const j = toJoulesPerParticle(num, unit);
    updateAllFromJ(j, unit);
  });
}
// precision change: re-render from whichever input has a value (prefer hartree)
function onPrecisionChange(){
  // clamp precision value to integer between 0 and 14
  let p = Number(els.precision.value);
  if (!isFinite(p)) p = 6;
  p = Math.max(0, Math.min(14, Math.round(p)));
  els.precision.value = String(p);
  if (els.precisionSlider) els.precisionSlider.value = String(p);

  // find first non-empty input
  let sourceUnit = null;
  for (const k of Object.keys(inputs)){
    if (inputs[k] && inputs[k].value !== ''){ sourceUnit = k; break; }
  }
  if (!sourceUnit){
    // default: set hartree=1
    inputs['hartree'].value = '1';
    updateAllFromJ(toJoulesPerParticle(1, 'hartree'), 'hartree');
    return;
  }
  const val = Number(inputs[sourceUnit].value);
  if (!isFinite(val)) return;
  updateAllFromJ(toJoulesPerParticle(val, sourceUnit), sourceUnit);
}

els.precision.addEventListener('input', onPrecisionChange);
if (els.precisionSlider){
  els.precisionSlider.addEventListener('input', (e)=>{
    els.precision.value = e.target.value;
    onPrecisionChange();
  });
}

// initial seed: set hartree=1 and populate
inputs['hartree'].value = '1';
if (els.precisionSlider) els.precisionSlider.value = els.precision.value;
updateAllFromJ(toJoulesPerParticle(1, 'hartree'), 'hartree');
