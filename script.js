/* ------------------ Constante de almacenamiento ------------------ */
const STORAGE_KEY = 'habit40';   // 1 sola clave para guardar y leer

/* ------------------ Utilidades de fecha ------------------ */
function dateOnly(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function pad(n){ return n < 10 ? '0' + n : '' + n; }
function toISO(d){
  d = dateOnly(d);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; // YYYY-MM-DD
}
function fromISO(iso){
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
}
function todayISO(){ return toISO(new Date()); }

/* ------------------ Referencias (se asignan al cargar) ------------------ */
let habitInput, descInput, list;

/* ------------------ Arranque seguro ------------------ */
document.addEventListener('DOMContentLoaded', () => {
  habitInput = document.getElementById('habitInput');
  descInput  = document.getElementById('descInput');
  list       = document.getElementById('habitList');
  document.getElementById('addHabitButton').addEventListener('click', addHabit);

  initAccordions();
  renderToday();
  loadHabits();
});

/* ------------------ Acordeones ------------------ */
function initAccordions(){
  document.querySelectorAll('.accordion').forEach(btn=>{
    btn.addEventListener('click',()=>{
      btn.classList.toggle('active');
      const p = btn.nextElementSibling;
      p.style.display = p.style.display==='block' ? 'none' : 'block';
    });
  });
}

/* ------------------ Mostrar hoy ------------------ */
function renderToday(){
  const d = dateOnly(new Date());
  document.getElementById('todayLabel').textContent =
    `Hoy es ${d.toLocaleDateString('es-ES',{
      weekday:'long', day:'numeric', month:'long', year:'numeric'
    })}`;
}

/* ------------------ Añadir hábito ------------------ */
function addHabit(){
  const name = habitInput.value.trim();
  if(!name){ alert('Escribe un hábito'); return; }
  createCard(name, descInput.value.trim(), todayISO(), []);
  habitInput.value = ''; descInput.value = '';
  saveHabits();
}

/* ------------------ Crear tarjeta ------------------ */
function createCard(name, desc, startISO, completed = []){
  const card = document.createElement('div'); card.className = 'habit';

  /* Cabecera */
  const title = document.createElement('h3');
  title.textContent = name;
  title.ondblclick  = () => editField(title, 'Nuevo nombre');

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

  /* Descripción opcional */
  if (desc){
    const p = document.createElement('p');
    p.className = 'desc'; p.textContent = desc;
    p.ondblclick = () => editField(p,'Editar descripción');
    card.appendChild(p);
  }

  /* Cuadrícula 40 días */
  const grid       = document.createElement('div'); grid.className = 'days';
  const startDate  = fromISO(startISO);
  const today      = dateOnly(new Date());
  const daysPassed = Math.floor((today - startDate)/86400000);

  for (let i = 1; i <= 40; i++){
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

  /* Fecha inicio visible + ISO oculto */
  const [y,m,d] = startISO.split('-');
  const startP  = document.createElement('p');
  startP.dataset.startIso = startISO;
  startP.textContent = `Comenzado el ${d}/${m}/${y}`;
  startP.style.cssText = 'font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(startP);

  list.prepend(card);
}

/* ------------------ Edición inline ------------------ */
function editField(el,msg){
  const v = prompt(msg, el.textContent);
  if(v && v.trim()){ el.textContent = v.trim(); saveHabits(); }
}
function editNameDesc(card){
  editField(card.querySelector('h3'),'Nuevo nombre');
  const d = card.querySelector('.desc');
  if (d) editField(d,'Editar descripción');
  else{
    const t = prompt('Añadir descripción (opcional):','');
    if(t && t.trim()){
      const p = document.createElement('p');
      p.className = 'desc'; p.textContent = t.trim();
      p.ondblclick = () => editField(p,'Editar descripción');
      card.insertBefore(p, card.querySelector('.days'));
      saveHabits();
    }
  }
}

/* ------------------ Guardar ------------------ */
function saveHabits(){
  const data = [];
  document.querySelectorAll('.habit').forEach(card=>{
    const name  = card.querySelector('h3').textContent;
    const descE = card.querySelector('.desc');
    const desc  = descE ? descE.textContent : '';
    const startISO = card.querySelector('p').dataset.startIso;

    const completed = [];
    card.querySelectorAll('.day.completed')
        .forEach(c=>completed.push(+c.textContent));

    data.push({name, desc, startISO, completed});
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ------------------ Cargar ------------------ */
function loadHabits(){
  try{
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    arr.forEach(h =>
      createCard(
        h.name,
        h.desc,
        h.startISO,
        Array.isArray(h.completed) ? h.completed : []
      )
    );
  }catch(e){
    console.warn('Datos corruptos, reinicio almacenamiento', e);
    localStorage.removeItem(STORAGE_KEY);
  }
}
