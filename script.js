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
    'nm': (function(){
      // when hartree is zero, show 0 for consistency with other units
      if (!isFinite(h)) return NaN;
      if (h === 0) return 0;
      return 1e7 / (h * CONSTS.WN_PER_EH);
    })()
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
  // update nm color/region based on the rendered nm value
  try{ updateNmColorFromValue(out['nm']); }catch(e){}
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
  // update nm color/region using the difference value
  try{ updateNmColorFromValue(outD_all['nm']); }catch(e){}
}

// Convert wavelength in nm to approximate RGB. Returns {r,g,b} 0-255 or null if outside visible range
function wavelengthToRGB(wavelength){
  const wl = Number(wavelength);
  if (!isFinite(wl) || wl <= 0) return null;
  // visible range approx 380..780 nm
  if (wl < 380 || wl > 780) return null;
  let r=0,g=0,b=0;
  if (wl >= 380 && wl < 440){ r = -(wl - 440) / (440-380); g = 0; b = 1; }
  else if (wl >= 440 && wl < 490){ r = 0; g = (wl - 440) / (490-440); b = 1; }
  else if (wl >= 490 && wl < 510){ r = 0; g = 1; b = -(wl - 510) / (510-490); }
  else if (wl >= 510 && wl < 580){ r = (wl - 510) / (580-510); g = 1; b = 0; }
  else if (wl >= 580 && wl < 645){ r = 1; g = -(wl - 645) / (645-580); b = 0; }
  else if (wl >= 645 && wl <= 780){ r = 1; g = 0; b = 0; }
  // intensity factor near vision limits
  let factor = 1;
  if (wl < 420) factor = 0.3 + 0.7 * (wl - 380) / (420 - 380);
  else if (wl > 700) factor = 0.3 + 0.7 * (780 - wl) / (780 - 700);
  // apply gamma correction-like curve
  const gamma = 0.8;
  const R = Math.round(Math.max(0, Math.min(1, Math.pow(r * factor, gamma))) * 255);
  const G = Math.round(Math.max(0, Math.min(1, Math.pow(g * factor, gamma))) * 255);
  const B = Math.round(Math.max(0, Math.min(1, Math.pow(b * factor, gamma))) * 255);
  return {r:R,g:G,b:B};
}

function rgbToHex(rgb){
  if (!rgb) return '#000000';
  const toHex = v => ('0' + v.toString(16)).slice(-2);
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function regionFromWavelength(wl){
  const v = Number(wl);
  if (!isFinite(v) || v <= 0) return '—';
  if (v <= 0.01) return 'Gamma ray (γ)';
  if (v <= 0.10) return 'Hard X-ray (HX)';
  if (v <= 10) return 'Soft X-ray (SX)';
  if (v <= 121) return 'Extreme ultraviolet (EUV)';
  if (v <= 200) return 'Far ultraviolet (FUV)';
  if (v <= 300) return 'Middle ultraviolet (MUV)';
  if (v <= 380) return 'Near ultraviolet (NUV)';
  if (v <= 450) return 'Violet';
  if (v <= 495) return 'Blue';
  if (v <= 570) return 'Green';
  if (v <= 590) return 'Yellow';
  if (v <= 620) return 'Orange';
  if (v <= 750) return 'Red';
  if (v <= 1400) return 'Near infrared (NIR)';
  if (v <= 3000) return 'Short-wavelength infrared (SWIR)';
  if (v <= 8000) return 'Mid-wavelength infrared (MWIR)';
  if (v <= 15000) return 'Long-wavelength infrared (LWIR)';
  if (v <= 1e6) return 'Far infrared (FIR)';
  if (v <= 1e7) return 'Extremely high frequency (EHF)';
  if (v <= 1e8) return 'Super high frequency (SHF)';
  if (v <= 1e9) return 'Ultra high frequency (UHF)';

  return 'Radio wave';
}

function updateNmColorFromValue(val){
  const descEl = document.getElementById('nm-region-desc');
  const bar = document.getElementById('nm-color-bar');
  let nm = Number(val);
  if (!isFinite(nm)){
    // try to read visible inputs if val missing
    const cur = (els.diffToggle && els.diffToggle.classList.contains('active')) ? (pairD['nm'] && Number(pairD['nm'].value)) : (inputs['nm'] && Number(inputs['nm'].value));
    nm = Number.isFinite(cur) ? cur : NaN;
  }
  const region = regionFromWavelength(nm);
  descEl.textContent = region === '—' ? 'Outside visible' : region;
  const rgb = wavelengthToRGB(nm);
  const hex = rgb ? rgbToHex(rgb) : '#000000';
  if (bar) bar.style.background = hex;
  // store current hex for copying
  const copyBtn = document.querySelector('.copy-color-btn');
  if (copyBtn) copyBtn.dataset.hex = hex;
}

// wire up copy button for color hex
document.querySelectorAll('.copy-color-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    // determine current nm (diff mode uses D)
    const hex = btn.dataset.hex || (() => {
      const cur = (els.diffToggle && els.diffToggle.classList.contains('active')) ? (pairD['nm'] && Number(pairD['nm'].value)) : (inputs['nm'] && Number(inputs['nm'].value));
      const rgb = wavelengthToRGB(Number(cur));
      return rgb ? rgbToHex(rgb) : '#000000';
    })();
    try{
      await navigator.clipboard.writeText(String(hex));
      btn.classList.add('copied');
      const oldHTML = btn.innerHTML;
      // show the hex temporarily while preserving the icon/html so it can be restored
      btn.innerHTML = '<span class="copied-text">' + String(hex) + '</span>';
      setTimeout(()=>{ btn.classList.remove('copied'); btn.innerHTML = oldHTML; },900);
    }catch(err){
      console.warn('Clipboard write failed', err);
      const ta = document.createElement('textarea'); ta.value = String(hex); document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); btn.classList.add('copied'); const oldHTML = btn.innerHTML; btn.innerHTML = '<span class="copied-text">' + String(hex) + '</span>'; setTimeout(()=>{btn.classList.remove('copied'); btn.innerHTML=oldHTML; ta.remove();},900);}catch(e){ ta.remove(); }
    }
  });
});

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
    // For nm (photon wavelength) the pair A/B fields are not meaningful — hide them and their separators
    try{
      const a = pairA['nm'];
      const b = pairB['nm'];
      const d = pairD['nm'];
      if (a){ a.style.visibility = 'hidden'; a.disabled = true; a.title = 'Wavelength A is not editable in difference mode';
        // hide the separator after A (the '−' span) if present but keep its space
        const s1 = a.nextElementSibling; if (s1 && s1.tagName === 'SPAN') s1.style.visibility = 'hidden'; }
      if (b){ b.style.visibility = 'hidden'; b.disabled = true; b.title = 'Wavelength B is not editable in difference mode'; b.value = '0';
        // hide the separator after B (the '=' span) if present but keep its space
        const s2 = b.nextElementSibling; if (s2 && s2.tagName === 'SPAN') s2.style.visibility = 'hidden'; }
      if (d) { d.style.visibility = 'visible'; }
    }catch(e){/* ignore */}
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
    // Re-enable / show nm pair inputs when leaving diff mode
    try{
      const a = pairA['nm'];
      const b = pairB['nm'];
      const d = pairD['nm'];
      if (a){ a.style.visibility = 'visible'; a.disabled = false; a.title = ''; const s1 = a.nextElementSibling; if (s1 && s1.tagName === 'SPAN') s1.style.visibility = 'visible'; }
      if (b){ b.style.visibility = 'visible'; b.disabled = false; b.title = ''; const s2 = b.nextElementSibling; if (s2 && s2.tagName === 'SPAN') s2.style.visibility = 'visible'; }
      if (d) { d.style.visibility = 'visible'; }
    }catch(e){/* ignore */}
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
      const oldHTML = btn.innerHTML;
      btn.innerHTML = '<span class="copied-text">Copied!</span>';
      setTimeout(()=>{ btn.classList.remove('copied'); btn.innerHTML = oldHTML; }, 900);
    }catch(err){
      // fallback: select and execCopy
      console.warn('Clipboard write failed', err);
      const ta = document.createElement('textarea');
      ta.value = String(text);
      document.body.appendChild(ta);
      ta.select();
      try{
        document.execCommand('copy');
        btn.classList.add('copied');
        const oldHTML = btn.innerHTML;
        btn.innerHTML = '<span class="copied-text">Copied!</span>';
        setTimeout(()=>{ btn.classList.remove('copied'); btn.innerHTML = oldHTML; ta.remove(); },900);
      }catch(e){ ta.remove(); }
    }
  });
});

// initial seed: set hartree=1 and populate
inputs['hartree'].value = '1';
updateAllFromHartree(toHartree(1, 'hartree'), 'hartree');

// no DOMContentLoaded initialization required for steppers
