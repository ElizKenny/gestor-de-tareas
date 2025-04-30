/* ---------- Acordeones ---------- */
document.querySelectorAll('.accordion').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    const panel = btn.nextElementSibling;
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  });
});

/* ---------- Helpers de fecha ---------- */
function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function todayISO() {
  return dateOnly(new Date()).toISOString().split('T')[0];
}
function fromISO(iso) {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
}

/* ---------- Renderizar “Hoy es …” ---------- */
(function renderToday() {
  const d = dateOnly(new Date());
  document.getElementById('todayLabel').textContent =
    `Hoy es ${d.toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })}`;
})();

/* ---------- Refs ---------- */
const habitInput = document.getElementById('habitInput');
const descInput  = document.getElementById('descInput');
const addBtn     = document.getElementById('addHabitButton');
const list       = document.getElementById('habitList');

/* ---------- Añadir hábito ---------- */
addBtn.addEventListener('click', () => {
  const name = habitInput.value.trim();
  if (!name) { alert('Escribe un hábito'); return; }

  const startISO = todayISO();
  createCard(name, descInput.value.trim(), startISO, []);
  habitInput.value = '';
  descInput.value  = '';
  saveHabits();
});

/* ---------- Crear tarjeta ---------- */
function createCard(name, desc, startISO, completed = []) {
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

  // Grid 40 días  
  const grid       = document.createElement('div'); grid.className = 'days';
  const startDate  = fromISO(startISO);
  const today      = dateOnly(new Date());
  const daysPassed = Math.floor((today - startDate) / 86400000); // 0-based

  for (let i = 1; i <= 40; i++) {
    const cell = document.createElement('span');
    cell.className = 'day' + (i === 21 ? ' milestone' : '');
    cell.textContent = i;

    if (i - 1 > daysPassed) cell.classList.add('disabled');
    if (completed.includes(i)) cell.classList.add('completed');

    cell.onclick = () => {
      if (cell.classList.contains('disabled')) return;
      cell.classList.toggle('completed');
      saveHabits();
    };
    grid.appendChild(cell);
  }
  card.appendChild(grid);

  // Fecha inicio  
  const startP = document.createElement('p');
  startP.dataset.startIso = startISO;
  const [y, m, d] = startISO.split('-');
  startP.textContent = `Comenzado el ${d}/${m}/${y}`;
  startP.style.cssText = 'font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(startP);

  list.prepend(card);
}

/* ---------- Edición inline ---------- */
function editField(el, msg) {
  const val = prompt(msg, el.textContent);
  if (val && val.trim()) {
    el.textContent = val.trim();
    saveHabits();
  }
}
function editNameDesc(card) {
  editField(card.querySelector('h3'), 'Nuevo nombre');
  const descEl = card.querySelector('.desc');
  if (descEl) editField(descEl, 'Editar descripción');
  else {
    const text = prompt('Añadir descripción (opcional):', '');
    if (text && text.trim()) {
      const p = document.createElement('p');
      p.className = 'desc';
      p.textContent = text.trim();
      p.ondblclick = () => editField(p, 'Editar descripción');
      card.insertBefore(p, card.querySelector('.days'));
      saveHabits();
    }
  }
}

/* ---------- Guardar y cargar ---------- */
function saveHabits() {
  const arr = [];
  document.querySelectorAll('.habit').forEach(card => {
    const name     = card.querySelector('h3').textContent;
    const descEl   = card.querySelector('.desc');
    const desc     = descEl ? descEl.textContent : '';
    const startISO = card.querySelector('p').dataset.startIso;
    const completed = [];
    card.querySelectorAll('.day.completed').forEach(c => completed.push(+c.textContent));
    arr.push({ name, desc, startISO, completed });
  });
  localStorage.setItem('habits', JSON.stringify(arr));
}

(function load() {
  JSON.parse(localStorage.getItem('habits') || '[]')
    .forEach(h => createCard(h.name, h.desc, h.startISO, h.completed));
})();
