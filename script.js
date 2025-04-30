/* ========== UTILIDADES DE FECHA ========== */
function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function getToday() {
  return dateOnly(new Date());
}
function toISO(d) {
  return d.toISOString().split('T')[0];  // "YYYY-MM-DD"
}
function fromISO(iso) {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
}

/* ========== ARRANQUE ========== */
document.addEventListener('DOMContentLoaded', () => {
  initAccordions();
  renderTodayLabel();
  loadHabits();
  checkMissedDays();
  document.getElementById('addHabitButton').addEventListener('click', addHabit);
});

/* ========== ACORDEONES ========== */
function initAccordions() {
  document.querySelectorAll('.accordion').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const panel = btn.nextElementSibling;
      panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    });
  });
}

/* ========== HOY ========== */
function renderTodayLabel() {
  const today = getToday();
  document.getElementById('todayLabel').textContent =
    `Hoy es ${today.toLocaleDateString('es-ES', {
       weekday:'long', day:'numeric', month:'long', year:'numeric'
    })}`;
}

/* ========== AÑADIR HÁBITO ========== */
function addHabit() {
  const name = document.getElementById('habitInput').value.trim();
  if (!name) return alert('Escribe un hábito');

  const desc     = document.getElementById('descInput').value.trim();
  const startISO = toISO(getToday());

  createCard(name, desc, startISO, [], []);
  document.getElementById('habitInput').value = '';
  document.getElementById('descInput').value  = '';
  saveHabits();
}

/* ========== CREAR TARJETA ========== */
function createCard(name, desc, startISO, completed = [], missed = []) {
  const list = document.getElementById('habitList');
  const card = document.createElement('div'); card.className = 'habit';

  // Cabecera
  const title = document.createElement('h3');
  title.textContent = name;
  title.ondblclick = () => editField(title, 'Nuevo nombre');

  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.textContent = 'Editar';
  editBtn.onclick = () => editNameDesc(card);

  const delBtn = document.createElement('button');
  delBtn.className = 'delete-btn';
  delBtn.textContent = 'Eliminar';
  delBtn.onclick = () => { card.remove(); saveHabits(); };

  const header = document.createElement('header');
  header.append(title, editBtn, delBtn);
  card.appendChild(header);

  // Descripción
  if (desc) {
    const p = document.createElement('p');
    p.className = 'desc';
    p.textContent = desc;
    p.ondblclick = () => editField(p, 'Editar descripción');
    card.appendChild(p);
  }

  // Cuadrícula 40 días
  const grid       = document.createElement('div'); grid.className = 'days';
  const startDate  = fromISO(startISO);
  const today      = getToday();
  const daysPassed = Math.floor((today - startDate) / 86400000); // 0-based

  for (let i = 1; i <= 40; i++) {
    const cell = document.createElement('span');
    cell.className = 'day' + (i === 21 ? ' milestone' : '');
    cell.textContent = i;

    // futuro
    if (i - 1 > daysPassed) cell.classList.add('disabled');
    // completados / omitidos
    if (completed.includes(i)) cell.classList.add('completed');
    if (missed.includes(i))    cell.classList.add('missed');

    cell.onclick = () => {
      if (cell.classList.contains('disabled')) return;
      if (cell.classList.contains('missed')) cell.classList.remove('missed');
      cell.classList.toggle('completed');
      saveHabits();
    };
    grid.appendChild(cell);
  }
  card.appendChild(grid);

  // Fecha inicio visible + ISO en data-attr
  const startP = document.createElement('p');
  startP.dataset.startIso = startISO;
  const [y, m, d] = startISO.split('-');
  startP.textContent = `Comenzado el ${d}/${m}/${y}`;
  startP.style.cssText = 'font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(startP);

  list.prepend(card);
}

/* ========== EDICIÓN INLINE ========== */
function editField(el, msg) {
  const val = prompt(msg, el.textContent);
  if (val && val.trim()) {
    el.textContent = val.trim();
    saveHabits();
  }
}
function editNameDesc(card) {
  editField(card.querySelector('h3'), 'Nuevo nombre');
  const desc = card.querySelector('.desc');
  if (desc) editField(desc, 'Editar descripción');
  else {
    const text = prompt('Añadir descripción (opcional):','');
    if (text && text.trim()) {
      const p = document.createElement('p');
      p.className = 'desc';
      p.textContent = text.trim();
      p.ondblclick = () => editField(p,'Editar descripción');
      card.insertBefore(p, card.querySelector('.days'));
      saveHabits();
    }
  }
}

/* ========== GUARDAR/CARGAR ========== */
function saveHabits() {
  const arr = [];
  document.querySelectorAll('.habit').forEach(card => {
    const name     = card.querySelector('h3').textContent;
    const descEl   = card.querySelector('.desc');
    const desc     = descEl ? descEl.textContent : '';
    const startISO = card.querySelector('p').dataset.startIso;
    const completed = [], missed = [];
    card.querySelectorAll('.day').forEach(c => {
      const idx = +c.textContent;
      if (c.classList.contains('completed')) completed.push(idx);
      else if (c.classList.contains('missed')) missed.push(idx);
    });
    arr.push({ name, desc, startISO, completed, missed });
  });
  localStorage.setItem('habits', JSON.stringify(arr));
  localStorage.setItem('lastOpenDate', getTodayISO());
}

function loadHabits() {
  JSON.parse(localStorage.getItem('habits')||'[]')
    .forEach(h => createCard(h.name, h.desc, h.startISO, h.completed, h.missed));
}

/* ========== DÍAS OMITIDOS ========== */
function checkMissedDays() {
  const lastISO = localStorage.getItem('lastOpenDate');
  const last    = lastISO ? fromISO(lastISO) : getToday();
  const diff    = Math.floor((getToday() - last) / 86400000);
  if (diff <= 0) { saveHabits(); return; }

  let misses = 0;
  document.querySelectorAll('.habit').forEach(card => {
    const startISO = card.querySelector('p').dataset.startIso;
    const start    = fromISO(startISO);
    const daysSince= Math.floor((getToday() - start) / 86400000) + 1;

    card.querySelectorAll('.day').forEach(c => {
      const idx = +c.textContent;
      if (idx <= Math.min(daysSince - 1, 40) &&
          !c.classList.contains('completed') &&
          !c.classList.contains('missed')) {
        c.classList.add('missed'); misses++;
      }
    });
  });

  if (misses) alert(`Tienes ${misses} día(s) sin marcar desde tu última visita.`);
  saveHabits();
}
