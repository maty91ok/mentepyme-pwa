// MentePyme App Logic

// Display current year in footer
document.getElementById('current-year').textContent = new Date().getFullYear();

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((err) => console.error('Service worker registration failed:', err));
  });
}

// Supabase integration (placeholder keys)
// To enable syncing with Supabase, set your project URL and anon key below.
const SUPABASE_URL = '';
const SUPABASE_KEY = '';
let supabase = null;

// Dynamically import Supabase if keys are provided
if (SUPABASE_URL && SUPABASE_KEY) {
  import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm').then(({ createClient }) => {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  });
}

const STORAGE_KEY = 'mentepyme-records';

// Load records from localStorage or initialize structure
function getData() {
  const defaultData = { ventas: [], gastos: [], stock: [] };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultData;
  } catch (e) {
    console.error('Error parsing localStorage data:', e);
    return defaultData;
  }
}

function setData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Utility to format date for display (dd/mm/aaaa)
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Render lists on the page
function renderList(type) {
  const data = getData();
  const listEl = document.getElementById(`${type}-list`);
  listEl.innerHTML = '';
  data[type].forEach((record, index) => {
    const li = document.createElement('li');
    let text = '';
    if (type === 'ventas') {
      text = `${formatDate(record.fecha)} • $${record.monto.toFixed(2)} • ${record.medio.toUpperCase()}`;
      if (record.producto) text += ` • ${record.producto}`;
    } else if (type === 'gastos') {
      text = `${formatDate(record.fecha)} • $${record.monto.toFixed(2)} • ${record.categoria}`;
      if (record.nota) text += ` • ${record.nota}`;
    } else if (type === 'stock') {
      text = `${formatDate(record.fecha)} • ${record.tipo.toUpperCase()} • ${record.cantidad} × ${record.producto}`;
      if (record.costo) text += ` • $${record.costo.toFixed(2)}`;
    }
    li.textContent = text;
    listEl.appendChild(li);
  });
}

// Save record locally and optionally to Supabase
async function saveRecord(type, record) {
  const data = getData();
  data[type].push(record);
  setData(data);
  renderList(type);
  // If supabase is available, sync record
  if (supabase) {
    try {
      await supabase.from(type).insert([record]);
    } catch (error) {
      console.error('Error inserting into Supabase:', error);
    }
  }
}

// Event handlers for forms
document.getElementById('venta-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const fecha = document.getElementById('venta-fecha').value;
  const monto = parseFloat(document.getElementById('venta-monto').value) || 0;
  const medio = document.getElementById('venta-medio').value;
  const producto = document.getElementById('venta-producto').value.trim();
  if (!fecha || monto <= 0) return;
  const record = {
    fecha,
    monto,
    medio,
    producto: producto || null
  };
  saveRecord('ventas', record);
  e.target.reset();
});

document.getElementById('gasto-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const fecha = document.getElementById('gasto-fecha').value;
  const monto = parseFloat(document.getElementById('gasto-monto').value) || 0;
  const categoria = document.getElementById('gasto-categoria').value.trim();
  const nota = document.getElementById('gasto-nota').value.trim();
  if (!fecha || !categoria || monto <= 0) return;
  const record = {
    fecha,
    monto,
    categoria,
    nota: nota || null
  };
  saveRecord('gastos', record);
  e.target.reset();
});

document.getElementById('stock-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const fecha = new Date().toISOString().slice(0, 10); // Use current date for stock entries
  const producto = document.getElementById('stock-producto').value.trim();
  const tipo = document.getElementById('stock-tipo').value;
  const cantidad = parseFloat(document.getElementById('stock-cantidad').value) || 0;
  const costo = parseFloat(document.getElementById('stock-costo').value);
  if (!producto || cantidad <= 0) return;
  const record = {
    fecha,
    producto,
    tipo,
    cantidad,
    costo: isNaN(costo) ? null : costo
  };
  saveRecord('stock', record);
  e.target.reset();
});

// Initial render of lists on load
['ventas', 'gastos', 'stock'].forEach((type) => renderList(type));