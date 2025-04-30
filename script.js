/* ---------- Utilidades de fecha ---------- */
function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function isoString(d) {
  return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
}
function isoToLocalDate(iso) {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
}

/* ---------- Obtener hoy ---------- */
function getToday() {
  return dateOnly(new Date());
}
function getTodayISO() {
  return isoString(getToday());
}

/* ---------- Inicialización ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initAccordions();
  renderToday();
  loadHabits();
  checkMissedDays();
  document.getElementById('addHabitButton')
          .addEventListener('click', addHabit);
});

/* ---------- Acordeones ---------- */
function initAccordions() {
  document.querySelectorAll('.accordion').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const panel = btn.nextElementSibling;
      panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    });
  });
}

/* ---------- Mostrar "Hoy es ..." ---------- */
function renderToday() {
  const today = getToday();
  document.getElementById('todayLabel').textContent =
    `Hoy es ${today.toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })}`;
}

/* ---------- Agregar nuevo hábito ---------- */
function addHabit() {
  const habitInput = document.getElementById('habitInput');
  const descInput  = document.getElementById('descInput');
  const name = habitInput.value.trim();
  if (!name) {
    alert('Escribe un hábito');
    return;
  }
  // Fecha de inicio ISO, proveniente del sistema
  const startISO = getTodayISO();
  createCard(name, descInput.value.trim(), startISO, [], []);
  habitInput.value = '';
  descInput.value  = '';
  saveHabits();
}

/* ---------- Crear tarjeta de hábito ---------- */
function createCard(name, desc, startISO, completed = [], missed = []) {
  const list = document.getElementById('habitList');
  const card = document.createElement('div'); card.className = 'habit';

  // Cabecera: título + editar + eliminar
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

  // Descripción (opcional)
  if (desc) {
    const p = document.createElement('p');
    p.className = 'desc';
    p.textContent = desc;
    p.ondblclick = () => editField(p, 'Editar descripción');
    card.appendChild(p);
  }

  // Cuadrícula de 40 días
  const grid       = document.createElement('div');
  grid.className   = 'days';
  const startDate  = isoToLocalDate(startISO);
  const today      = getToday();
  const daysPassed = Math.floor((today - startDate) / 86400000); // 0-based

  for (let i = 1; i <= 40; i++) {
    const cell = document.createElement('span');
    cell.className = 'day' + (i === 21 ? ' milestone' : '');
    cell.textContent = i;

    // Futuro → deshabilitado
    if (i - 1 > daysPassed) cell.classList.add('disabled');
    // Pasado completado / omitido
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

  // Fecha de inicio (visible en DD/MM/YYYY) y oculto en data-attribute
  const startP = document.createElement('p');
  startP.dataset.startIso = startISO;
  const [year, month, day] = startISO.split('-');
  startP.textContent = `Comenzado el ${day}/${month}/${year}`;
  startP.style.cssText = 'font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(startP);

  list.prepend(card);
}

/* ---------- Edición inline ---------- */
function editField(el, msg) {
  const nuevo = prompt(msg, el.textContent);
  if (nuevo !== null && nuevo.trim()) {
    el.textContent = nuevo.trim();
    saveHabits();
  }
}
function editNameDesc(card) {
  editField(card.querySelector('h3'), 'Nuevo nombre');
  const d = card.querySelector('.desc');
  if (d) {
    editField(d, 'Editar descripción');
  } else {
    const text = prompt('Añadir descripción (opcional):', '');
    if (text !== null && text.trim()) {
      const p = document.createElement('p');
      p.className = 'desc';
      p.textContent = text.trim();
      p.ondblclick = () => editField(p, 'Editar descripción');
      card.insertBefore(p, card.querySelector('.days'));
      saveHabits();
    }
  }
}

/* ---------- Guardar en localStorage ---------- */
function saveHabits() {
  const data = [];
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
    data.push({ name, desc, startISO, completed, missed });
  });
  localStorage.setItem('habits', JSON.stringify(data));
  localStorage.setItem('lastOpenDate', getTodayISO());
}

/* ---------- Cargar desde localStorage ---------- */
function loadHabits() {
  JSON.parse(localStorage.getItem('habits') || '[]')
    .forEach(h => createCard(h.name, h.desc, h.startISO, h.completed, h.missed));
}

/* ---------- Marcar días omitidos al volver ---------- */
function checkMissedDays() {
  const lastISO = localStorage.getItem('lastOpenDate');
  const last    = lastISO ? isoToLocalDate(lastISO) : getToday();
  const diff    = Math.floor((getToday() - last) / 86400000);
  if (diff <= 0) {
    saveHabits();
    return;
  }

  let missedCount = 0;
  document.querySelectorAll('.habit').forEach(card => {
    const startISO = card.querySelector('p').dataset.startIso;
    const start    = isoToLocalDate(startISO);
    const daysSince = Math.floor((getToday() - start) / 86400000) + 1;

    card.querySelectorAll('.day').forEach(c => {
      const idx = +c.textContent;
      if (
        idx <= Math.min(daysSince - 1, 40) &&
        !c.classList.contains('completed') &&
        !c.classList.contains('missed')
      ) {
        c.classList.add('missed');
        missedCount++;
      }
    });
  });

  if (missedCount) {
    alert(`Tienes ${missedCount} día(s) sin marcar desde tu última visita.`);
  }
  saveHabits();
}
