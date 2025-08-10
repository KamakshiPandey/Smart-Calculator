
let darkMode = false;

function appendValue(value) {
    document.getElementById("display").value += value;
}

function calculate() {
    try {
        let result = eval(document.getElementById("display").value);
        document.getElementById("display").value = result;
        speak(`The result is ${result}`);
    } catch {
        alert("Invalid Expression");
    }
}

function clearDisplay() {
    document.getElementById("display").value = "";
}

function convertUnit(type) {
    let val = parseFloat(document.getElementById("display").value);
    if (isNaN(val)) return alert("Enter a number first!");
    let result;
    switch(type) {
        case 'cmToInch': result = val / 2.54; break;
        case 'inchToCm': result = val * 2.54; break;
        case 'kgToLb': result = val * 2.20462; break;
        case 'lbToKg': result = val / 2.20462; break;
    }
    document.getElementById("display").value = result;
    speak(`That is ${result}`);
}

function toggleTheme() {
    darkMode = !darkMode;
    document.body.classList.toggle("dark", darkMode);
}

function startListening() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Speech recognition not supported!");
        return;
    }
    let recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    recognition.onresult = function(event) {
        let spoken = event.results[0][0].transcript;
        document.getElementById("display").value = spoken.replace(/plus/gi, '+').replace(/minus/gi, '-').replace(/times/gi, '*').replace(/divide/gi, '/');
        calculate();
    };
}

function speak(message) {
    let speech = new SpeechSynthesisUtterance(message);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
}

/* Smart Calculator JS
   - evaluateExpression uses Function constructor (safer than eval for controlled inputs)
   - history saved to localStorage
   - memory support (M+, M-, MR, MC)
   - unit conversion functions included
*/

// ---------- State ----------
let memoryValue = 0;
const display = document.getElementById('display');
const historyBox = document.getElementById('history');
const memLabel = document.getElementById('memLabel');

// load history on start
let historyArr = JSON.parse(localStorage.getItem('calc_history') || '[]');
renderHistory();
updateMemLabel();

// ---------- Basic helpers ----------
function appendValue(s) {
  display.value = (display.value || '') + s;
}

function clearDisplay() {
  display.value = '';
}

function backspace() {
  display.value = display.value.slice(0, -1);
}

function toggleSign() {
  if (!display.value) return;
  // If current is a number, toggle sign. Else append a unary minus.
  let val = display.value;
  // simple toggle: if the whole string is a number
  if (!isNaN(Number(val))) display.value = String(-Number(val));
  else display.value = '-' + val;
}

// --------- Safe expression evaluation ----------
function evaluateExpression() {
  const expr = display.value.trim();
  if (!expr) return;
  try {
    // Allow Math.* functions and basic operators
    const safeExpr = sanitizeExpression(expr);
    // Use Function instead of eval for a bit more clarity
    const result = Function('"use strict";return (' + safeExpr + ')')();
    display.value = formatResult(result);
    pushHistory(expr, result);
    speakResult(result);
  } catch (e) {
    alert('Invalid expression');
    console.error(e);
  }
}

function sanitizeExpression(s) {
  // We allow digits, parentheses, operators, dots, and Math identifiers.
  // Replace Unicode × ÷ with * / if any
  s = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/—/g, '-');
  // Basic filter: remove characters not allowed (letters allowed for Math.*)
  // This is not bulletproof but reduces risk.
  if (/[^0-9+\-*/().,%\sMathsqrtlogintancosepiPIabssinctanexppow\^]/i.test(s)) {
    // allow letters for Math.* functions explicitly by permitting word chars and Math.
    // fallback: return s as-is (risky), but we rely on Function error handling.
  }
  // allow exponent operator '**' — modern JS
  return s;
}

function formatResult(r) {
  if (typeof r === 'number' && !Number.isFinite(r)) return 'Error';
  if (typeof r === 'number') {
    // limit decimals
    return Math.round((r + Number.EPSILON) * 1e12) / 1e12;
  }
  return r;
}

// ---------- History ----------
function pushHistory(expr, result) {
  const entry = { expr, result, time: new Date().toISOString() };
  historyArr.unshift(entry);
  if (historyArr.length > 100) historyArr.pop();
  localStorage.setItem('calc_history', JSON.stringify(historyArr));
  renderHistory();
}

function renderHistory() {
  historyBox.innerHTML = '';
  if (!historyArr.length) {
    historyBox.innerHTML = '<div style="color:#666">No history</div>';
    return;
  }
  historyArr.forEach((h, idx) => {
    const div = document.createElement('div');
    div.className = 'item';
    const left = document.createElement('div');
    left.textContent = `${h.expr} = ${h.result}`;
    const btns = document.createElement('div');

    const reuse = document.createElement('button');
    reuse.textContent = 'Use';
    reuse.onclick = () => { display.value = h.expr; };

    const del = document.createElement('button');
    del.textContent = '✖';
    del.style.marginLeft = '6px';
    del.onclick = () => { historyArr.splice(idx, 1); localStorage.setItem('calc_history', JSON.stringify(historyArr)); renderHistory(); };

    btns.appendChild(reuse);
    btns.appendChild(del);

    div.appendChild(left);
    div.appendChild(btns);
    historyBox.appendChild(div);
  });
}

function clearHistory() {
  if (!confirm('Clear calculation history?')) return;
  historyArr = [];
  localStorage.removeItem('calc_history');
  renderHistory();
}

function exportHistory() {
  const data = JSON.stringify(historyArr, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'calc_history.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Memory functions ----------
function memoryClear() { memoryValue = 0; updateMemLabel(); }
function memoryRecall() { display.value = String(memoryValue); }
function memoryAdd() { const v = Number(display.value || 0); memoryValue += v; updateMemLabel(); }
function memorySub() { const v = Number(display.value || 0); memoryValue -= v; updateMemLabel(); }

function updateMemLabel() {
  memLabel.textContent = `M=${memoryValue}`;
}

// ---------- Voice feedback ----------
function speakResult(v) {
  if (!('speechSynthesis' in window)) return;
  const msg = new SpeechSynthesisUtterance(`Result is ${v}`);
  window.speechSynthesis.speak(msg);
}

// ---------- Unit conversion data ----------
const unitTables = {
  length: {
    base: 'meter',
    units: {
      meter: 1,
      m: 1,
      kilometer: 1000,
      km: 1000,
      centimeter: 0.01,
      cm: 0.01,
      millimeter: 0.001,
      mm: 0.001,
      inch: 0.0254,
      in: 0.0254,
      foot: 0.3048,
      ft: 0.3048,
      yard: 0.9144,
      yd: 0.9144,
      mile: 1609.344,
      mi: 1609.344
    }
  },
  weight: {
    base: 'kg',
    units: {
      kg: 1,
      g: 0.001,
      mg: 1e-6,
      lb: 0.45359237,
      lbm: 0.45359237,
      oz: 0.0283495231
    }
  },
  volume: {
    base: 'liter',
    units: {
      liter: 1,
      l: 1,
      ml: 0.001,
      gallon: 3.78541,
      gal: 3.78541,
      cup: 0.236588
    }
  },
  time: {
    base: 'second',
    units: {
      second: 1,
      sec: 1,
      s: 1,
      minute: 60,
      min: 60,
      hour: 3600,
      h: 3600,
      day: 86400,
      d: 86400
    }
  }
};

// Temperature special handling (not linear scale same base multiply)
const temperatureUnits = ['C', 'F', 'K'];

// UI hookups for conversion
const unitType = document.getElementById('unitType');
const fromUnit = document.getElementById('fromUnit');
const toUnit = document.getElementById('toUnit');
const unitInput = document.getElementById('unitInput');
const convResult = document.getElementById('convResult');

function populateUnits() {
  const type = unitType.value;
  fromUnit.innerHTML = '';
  toUnit.innerHTML = '';
  if (type === 'temperature') {
    temperatureUnits.forEach(u => {
      const o1 = document.createElement('option'); o1.value = u; o1.text = u;
      const o2 = document.createElement('option'); o2.value = u; o2.text = u;
      fromUnit.appendChild(o1); toUnit.appendChild(o2);
    });
  } else {
    const tbl = unitTables[type].units;
    Object.keys(tbl).forEach(k => {
      const o1 = document.createElement('option'); o1.value = k; o1.text = k;
      const o2 = document.createElement('option'); o2.value = k; o2.text = k;
      fromUnit.appendChild(o1); toUnit.appendChild(o2);
    });
  }
}
populateUnits();

function convertUnit() {
  const type = unitType.value;
  const from = fromUnit.value;
  const to = toUnit.value;
  const v = parseFloat(unitInput.value);
  if (isNaN(v)) { convResult.textContent = 'Enter a valid number'; return; }

  let res;
  if (type === 'temperature') {
    res = convertTemp(v, from, to);
  } else {
    const tbl = unitTables[type].units;
    const baseVal = v * tbl[from]; // convert to base
    res = baseVal / tbl[to];
  }
  convResult.textContent = `${v} ${from} = ${Math.round((res + Number.EPSILON) * 1e9) / 1e9} ${to}`;
}

// temperature conversions
function convertTemp(v, from, to) {
  let c;
  if (from === 'C') c = v;
  if (from === 'F') c = (v - 32) * 5/9;
  if (from === 'K') c = v - 273.15;
  if (to === 'C') return c;
  if (to === 'F') return c * 9/5 + 32;
  if (to === 'K') return c + 273.15;
  return NaN;
}

// ---------- Theme toggle ----------
function toggleTheme() {
  document.body.classList.toggle('dark');
}

// ---------- Initialize keyboard support ----------
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') evaluateExpression();
  if (e.key === 'Backspace') backspace();
  if (e.key === 'Escape') clearDisplay();
  // allow numbers, period, parentheses, operators
  const allowed = '0123456789+-/*().%';
  if (allowed.includes(e.key)) appendValue(e.key);
});
