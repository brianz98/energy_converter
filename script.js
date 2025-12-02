// Constants (CODATA values consistent with SciPy's constants collection)
const CONSTS = {
  J_PER_EH: 4.359744722206e-18,   // 1 Hartree (atomic unit of energy) in J
  NA: 6.02214076e23,              // Avogadro's number
  J_PER_KCAL: 4184,               // 1 kcal = 4184 J
  EV_PER_EH: 27.211386245981,     // 1 Hartree in eV
  WN_PER_EH: 219474.63136314,     // 1 Hartree in cm^-1
  K_PER_EH: 315775.02480398,      // 1 Hartree in Kelvin
  HZ_PER_EH: 6579683920499900.0   // 1 Hartree in Hz
};

const els = {
  precision: document.getElementById('precision'),
  precisionDec: document.getElementById('precision-decrement'),
  precisionInc: document.getElementById('precision-increment')
};

els.diffToggle = document.getElementById('diff-toggle');

const inputs = {
  'hartree': document.getElementById('in-hartree'),
  'ev': document.getElementById('in-ev'),
  'kcal_per_mol': document.getElementById('in-kcal_per_mol'),
  'kj_per_mol': document.getElementById('in-kj_per_mol'),
  'cm-1': document.getElementById('in-cm-1'),
  'kelvin': document.getElementById('in-kelvin'),
  'mhz': document.getElementById('in-mhz'),
  'nm': document.getElementById('in-nm')
};

// Pair-mode inputs: a, b (editable) and d (difference, readonly)
const pairA = {
  'hartree': document.getElementById('in-hartree-a'),
  'ev': document.getElementById('in-ev-a'),
  'kcal_per_mol': document.getElementById('in-kcal_per_mol-a'),
  'kj_per_mol': document.getElementById('in-kj_per_mol-a'),
  'cm-1': document.getElementById('in-cm-1-a'),
  'kelvin': document.getElementById('in-kelvin-a'),
  'mhz': document.getElementById('in-mhz-a'),
  'nm': document.getElementById('in-nm-a')
};
const pairB = {
  'hartree': document.getElementById('in-hartree-b'),
  'ev': document.getElementById('in-ev-b'),
  'kcal_per_mol': document.getElementById('in-kcal_per_mol-b'),
  'kj_per_mol': document.getElementById('in-kj_per_mol-b'),
  'cm-1': document.getElementById('in-cm-1-b'),
  'kelvin': document.getElementById('in-kelvin-b'),
  'mhz': document.getElementById('in-mhz-b'),
  'nm': document.getElementById('in-nm-b')
};
const pairD = {
  'hartree': document.getElementById('in-hartree-d'),
  'ev': document.getElementById('in-ev-d'),
  'kcal_per_mol': document.getElementById('in-kcal_per_mol-d'),
  'kj_per_mol': document.getElementById('in-kj_per_mol-d'),
  'cm-1': document.getElementById('in-cm-1-d'),
  'kelvin': document.getElementById('in-kelvin-d'),
  'mhz': document.getElementById('in-mhz-d'),
  'nm': document.getElementById('in-nm-d')
};

let isUpdating = false;

// Convert input value in `unit` into Hartree
function toHartree(val, unit){
  const v = Number(val);
  switch(unit){
    case 'hartree':
      return v;
    case 'ev':
      return v / CONSTS.EV_PER_EH;
    case 'kcal_per_mol':
      return (v * CONSTS.J_PER_KCAL) / CONSTS.NA / CONSTS.J_PER_EH;
    case 'kj_per_mol':
      return (v * 1000) / CONSTS.NA / CONSTS.J_PER_EH;
    case 'cm-1':
      return v / CONSTS.WN_PER_EH;
    case 'kelvin':
      return v / CONSTS.K_PER_EH;
    case 'mhz':
      return v / (CONSTS.HZ_PER_EH / 1e6);
    case 'nm':
      const wn = 0.01 / (v * 1e-9); // convert nm to cm-1
      return wn / CONSTS.WN_PER_EH;
    default:
      return NaN;
  }
}

// Convert Hartree to the requested units
function fromHartree(h){
  return {
    'hartree': h,
    'ev': h * CONSTS.EV_PER_EH,
    'kcal_per_mol': h * CONSTS.J_PER_EH * CONSTS.NA / CONSTS.J_PER_KCAL,
    'kj_per_mol': h * CONSTS.J_PER_EH * CONSTS.NA / 1000,
    'cm-1': h * CONSTS.WN_PER_EH,
    'kelvin': h * CONSTS.K_PER_EH,
    'mhz': h * CONSTS.HZ_PER_EH / 1e6,
    'nm': 1e7 / (h * CONSTS.WN_PER_EH)
  };
}

function formatNumber(v, precision){
  if (!isFinite(v)) return '—';
  const abs = Math.abs(v);
  const sig = Math.max(1, Math.min(30, Math.round(Number(precision))));
  // For very small/large numbers prefer exponential with sig significant digits
  if ((abs !== 0 && (abs < 1e-6 || abs >= 1e8))){
    return Number(v).toExponential(Math.max(0, sig - 1));
  }
  // Use toPrecision for significant-digit formatting, then trim trailing zeros
  let s = Number(v).toPrecision(sig);
  if (/[eE]/.test(s)) return s;
  s = s.replace(/(?:\.0+|(?<=\.\d*)0+)$/, '').replace(/\.$/, '');
  return s;
}

// Format a number for putting into an <input type="number"> value.
// Must use dot as decimal separator and avoid locale-specific formatting.
function formatForInput(v, precision){
  if (!isFinite(v)) return '';
  const abs = Math.abs(v);
  const sig = Math.max(1, Math.min(30, Math.round(Number(precision))));
  if ((abs !== 0 && (abs < 1e-6 || abs >= 1e8))){
    // exponential with specified significant digits
    return Number(v).toExponential(Math.max(0, sig - 1));
  }
  // Use toPrecision for significant-digit formatting and trim trailing zeros
  let s = Number(v).toPrecision(sig);
  if (/[eE]/.test(s)) return s;
  s = s.replace(/(?:\.0+|(?<=\.\d*)0+)$/, '').replace(/\.$/, '');
  return s;
}

// Count significant digits from a user-entered numeric string.
// Rules:
// - Handles plain decimals and exponential notation.
// - Leading zeros are ignored; decimal point presence makes trailing zeros significant.
// - For integers (no decimal point and no exponent) trailing zeros entered by the user are counted as significant.
function countSignificantDigits(str){
  if (typeof str !== 'string') str = String(str);
  str = str.trim();
  if (str === '' ) return 0;
  // Remove sign
  if (str[0] === '+' || str[0] === '-') str = str.slice(1);
  // Exponential form
  let mantissa = str;
  const eIndex = Math.max(str.indexOf('e'), str.indexOf('E'));
  if (eIndex !== -1){
    mantissa = str.slice(0, eIndex);
  }
  // Remove decimal point
  const hasDecimal = mantissa.indexOf('.') !== -1;
  let digits = mantissa.replace('.', '');
  // Remove leading zeros
  digits = digits.replace(/^0+/, '');
  // Edge: if all digits removed (e.g. "0" or "0.00"), count 1
  if (digits === '') return 1;
  // The remaining length is the significant digits (we keep trailing zeros)
  return Math.min(30, digits.length);
}

function update(){
  // This update() is kept for backward compatibility but primary updates
  // are handled by per-input event listeners below.
}

function updateAllFromHartree(h, skipUnit = null){
  const rawPrec = Number(els.precision.value);
  const prec = Number.isFinite(rawPrec) ? Math.max(1, Math.min(30, Math.round(rawPrec))) : 10;
  const out = fromHartree(h);
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

function updateAllPairFromHartree(hA, hB, skipId = null){
  const prec = getPrecision();
  const outA_all = fromHartree(hA);
  const outB_all = fromHartree(hB);
  const hD = hA - hB;
  const outD_all = fromHartree(hD);
  isUpdating = true;
  for (const key of Object.keys(pairA)){
    const aEl = pairA[key];
    const bEl = pairB[key];
    const dEl = pairD[key];
    if (aEl && (!skipId || skipId !== aEl.id)) aEl.value = isFinite(outA_all[key]) ? formatForInput(outA_all[key], prec) : '';
    if (bEl && (!skipId || skipId !== bEl.id)) bEl.value = isFinite(outB_all[key]) ? formatForInput(outB_all[key], prec) : '';
    if (dEl) dEl.value = isFinite(outD_all[key]) ? formatForInput(outD_all[key], prec) : '';
  }
  isUpdating = false;
}

function getPrecision(){
  const rawPrec = Number(els.precision.value);
  return Number.isFinite(rawPrec) ? Math.max(1, Math.min(30, Math.round(rawPrec))) : 10;
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
    // if the user typed more significant digits than current precision, increase precision
    try{
      const sig = countSignificantDigits(text);
      const cur = getPrecision();
      if (sig > cur){
        els.precision.value = String(Math.min(30, sig));
      }
    }catch(e){/* ignore */}
    const h = toHartree(num, unit);
    // if diff mode active, populate pair A with this value and B=0
      if (els.diffToggle && els.diffToggle.classList.contains('active')){
      // set pair A for this unit to the entered value, keep B as-is if present
      const bVal = pairB[unit] && pairB[unit].value !== '' ? Number(pairB[unit].value) : 0;
      const hB = toHartree(bVal, unit);
      updateAllPairFromHartree(h, hB, inputs[unit] ? inputs[unit].id : null);
    } else {
      updateAllFromHartree(h, unit);
    }
  });
}

// pair mode listeners: for A and B inputs
for (const unit of Object.keys(pairA)){
  const aEl = pairA[unit];
  const bEl = pairB[unit];
  if (aEl){
    aEl.addEventListener('input', (ev)=>{
      if (isUpdating) return;
      const text = ev.target.value;
      if (text === '' || text === null){
        isUpdating = true;
        for (const k of Object.keys(pairA)){ if (k===unit) continue; pairD[k].value = ''; }
        isUpdating = false;
        return;
      }
      const numA = Number(text);
      if (!isFinite(numA)) return;
      // auto-upgrade precision if necessary
      try{
        const sig = countSignificantDigits(text);
        const cur = getPrecision();
        if (sig > cur){
          els.precision.value = String(Math.min(30, sig));
        }
      }catch(e){/* ignore */}
      const jA = toHartree(numA, unit);
      const bVal = bEl && bEl.value !== '' ? Number(bEl.value) : 0;
      const jB = toHartree(bVal, unit);
      updateAllPairFromHartree(jA, jB, ev.target.id);
    });
  }
  if (bEl){
    bEl.addEventListener('input', (ev)=>{
      if (isUpdating) return;
      const text = ev.target.value;
      if (text === '' || text === null){
        isUpdating = true;
        for (const k of Object.keys(pairB)){ if (k===unit) continue; pairD[k].value = ''; }
        isUpdating = false;
        return;
      }
      const numB = Number(text);
      if (!isFinite(numB)) return;
      // auto-upgrade precision if necessary
      try{
        const sig = countSignificantDigits(text);
        const cur = getPrecision();
        if (sig > cur){
          els.precision.value = String(Math.min(30, sig));
        }
      }catch(e){/* ignore */}
      const jB = toHartree(numB, unit);
      const aVal = aEl && aEl.value !== '' ? Number(aEl.value) : 0;
      const jA = toHartree(aVal, unit);
      updateAllPairFromHartree(jA, jB, ev.target.id);
    });
  }
}
// precision change: re-render from whichever input has a value (prefer hartree)
function onPrecisionChange(){
  // clamp precision value to integer between 1 and 30
  let p = Number(els.precision.value);
  if (!isFinite(p)) p = 10;
  p = Math.max(1, Math.min(30, Math.round(p)));
  els.precision.value = String(p);
  // no-op for UI buttons here; steppers update via click handlers

  // find first non-empty input
  let sourceUnit = null;
  for (const k of Object.keys(inputs)){
    if (inputs[k] && inputs[k].value !== ''){ sourceUnit = k; break; }
  }
  if (!sourceUnit){
    // default: set hartree=1
    inputs['hartree'].value = '1';
    updateAllFromHartree(toHartree(1, 'hartree'), 'hartree');
    return;
  }
  const val = Number(inputs[sourceUnit].value);
  if (!isFinite(val)) return;
  updateAllFromHartree(toHartree(val, sourceUnit), sourceUnit);
}

els.precision.addEventListener('input', onPrecisionChange);
// stepper buttons: decrement / increment precision
if (els.precisionDec){
  els.precisionDec.addEventListener('click', ()=>{
    let p = getPrecision();
    p = Math.max(1, p - 1);
    els.precision.value = String(p);
    onPrecisionChange();
  });
}
if (els.precisionInc){
  els.precisionInc.addEventListener('click', ()=>{
    let p = getPrecision();
    p = Math.min(30, p + 1);
    els.precision.value = String(p);
    onPrecisionChange();
  });
}

// Toggle diff (pair) mode visibility and initialization
function setDiffMode(on){
  for (const key of Object.keys(inputs)){
    const singleWrap = inputs[key] ? inputs[key].parentElement : null;
    // in our structure single input is directly inside a div.single
    if (singleWrap && singleWrap.classList.contains('single')){
      singleWrap.style.display = on ? 'none' : '';
      const pairWrap = singleWrap.nextElementSibling;
      if (pairWrap && pairWrap.classList.contains('pair')){
        pairWrap.style.display = on ? '' : 'none';
      }
    }
  }
  if (on){
    // initialize pair inputs: set A from single, B=0 if empty
    for (const key of Object.keys(inputs)){
      const s = inputs[key];
      const a = pairA[key];
      const b = pairB[key];
      const d = pairD[key];
      const sval = s && s.value !== '' ? Number(s.value) : 0;
      if (a) a.value = formatForInput(sval, getPrecision());
      if (b) b.value = '';
      if (d) d.value = '';
    }
    // trigger a global update using hartree A and B (or zeros)
    const jA = toHartree(Number(pairA['hartree'].value||0),'hartree');
    const jB = toHartree(Number(pairB['hartree'].value||0),'hartree');
    updateAllPairFromHartree(jA, jB, null);
  } else {
    // switching back to single: set single inputs to the current difference value
    // prefer hartree difference as seed
    const jA = toHartree(Number(pairA['hartree'].value||0),'hartree');
    const jB = toHartree(Number(pairB['hartree'].value||0),'hartree');
    const jD = jA - jB;
    const out = fromHartree(jD);
    for (const key of Object.keys(inputs)){
      const s = inputs[key];
      if (!s) continue;
      s.value = isFinite(out[key]) ? formatForInput(out[key], getPrecision()) : '';
    }
  }
}

if (els.diffToggle){
  els.diffToggle.addEventListener('click', (e)=>{
    const on = !els.diffToggle.classList.contains('active');
    if (on) {
      els.diffToggle.classList.add('active');
      els.diffToggle.setAttribute('aria-pressed','true');
    } else {
      els.diffToggle.classList.remove('active');
      els.diffToggle.setAttribute('aria-pressed','false');
    }
    setDiffMode(on);
  });
}

// copy button wiring
document.querySelectorAll('.copy-btn').forEach(btn=>{
  btn.addEventListener('click', async (e)=>{
    const unit = btn.dataset.unit;
    let text = '';
    if (els.diffToggle && els.diffToggle.classList.contains('active')){
      // copy the difference value (D) if present
      const dEl = pairD[unit];
      text = dEl ? dEl.value : '';
    } else {
      const sEl = inputs[unit];
      text = sEl ? sEl.value : '';
    }
    if (!text) return;
    try{
      await navigator.clipboard.writeText(String(text));
      btn.classList.add('copied');
      const old = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(()=>{ btn.classList.remove('copied'); btn.textContent = old; }, 900);
    }catch(err){
      // fallback: select and execCopy
      console.warn('Clipboard write failed', err);
      const ta = document.createElement('textarea');
      ta.value = String(text);
      document.body.appendChild(ta);
      ta.select();
      try{ document.execCommand('copy'); btn.classList.add('copied'); const old = btn.textContent; btn.textContent='Copied!'; setTimeout(()=>{btn.classList.remove('copied'); btn.textContent=old; ta.remove();},900);}catch(e){ ta.remove(); }
    }
  });
});

// initial seed: set hartree=1 and populate
inputs['hartree'].value = '1';
updateAllFromHartree(toHartree(1, 'hartree'), 'hartree');

// no DOMContentLoaded initialization required for steppers
