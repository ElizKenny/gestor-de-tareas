/********************************************************************
 *  RASTREADOR 40-DÍAS — persistencia garantizada en localStorage
 ********************************************************************/
const STORAGE_KEY = 'habit40';   // ← única clave que usamos

/* ---------- helpers de fecha ---------- */
const pad = n => (n < 10 ? '0' + n : '' + n);
const dateOnly = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const toISO   = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today   = () => dateOnly(new Date());

/* ---------- refs ---------- */
let habitInput, descInput, list;

/* ---------- DOM READY ---------- */
document.addEventListener('DOMContentLoaded', () => {
  habitInput = document.getElementById('habitInput');
  descInput  = document.getElementById('descInput');
  list       = document.getElementById('habitList');

  document.getElementById('addHabitButton').addEventListener('click', addHabit);

  initAccordions();
  renderToday();
  loadHabits();                    // <- pinta lo guardado (si existe)
});

/* ---------- acordeones ---------- */
function initAccordions(){
  document.querySelectorAll('.accordion').forEach(btn=>{
    btn.addEventListener('click',()=>{
      btn.classList.toggle('active');
      const panel = btn.nextElementSibling;
      panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    });
  });
}

/* ---------- etiqueta “Hoy es …” ---------- */
function renderToday(){
  const d = today();
  document.getElementById('todayLabel').textContent =
    `Hoy es ${d.toLocaleDateString('es-ES', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}`;
}

/* ---------- añadir hábito ---------- */
function addHabit(){
  const name = habitInput.value.trim();
  if(!name){ alert('Escribe un hábito'); return; }

  createCard(name, descInput.value.trim(), toISO(today()), []);
  habitInput.value = ''; descInput.value = '';
  saveHabits();
}

/* ---------- crear tarjeta ---------- */
function createCard(name, desc, isoStart, completed = []){
  const card = document.createElement('div'); card.className = 'habit';

  /* cabecera */
  const h3 = document.createElement('h3'); h3.textContent = name;
  h3.ondblclick = () => inlineEdit(h3, 'Nuevo nombre');

  const edit = btn('Editar', 'edit-btn', () => inlineEdit(card.querySelector('h3'), 'Nuevo nombre'));
  const del  = btn('Eliminar','delete-btn', () => { card.remove(); saveHabits(); });

  const header = document.createElement('header');
  header.append(h3, edit, del);
  card.appendChild(header);

  /* descripción */
  if(desc){
    const p = document.createElement('p');
    p.className = 'desc'; p.textContent = desc;
    p.ondblclick = () => inlineEdit(p, 'Editar descripción');
    card.appendChild(p);
  }

  /* cuadrícula 40 */
  const grid = document.createElement('div'); grid.className = 'days';
  const startDate = dateOnly(new Date(isoStart));
  const daysPassed = Math.floor((today() - startDate)/86400000); // 0-based

  for(let i=1; i<=40; i++){
    const cell = document.createElement('span');
    cell.className = 'day' + (i===21 ? ' milestone' : '');
    cell.textContent = i;

    if(i-1 > daysPassed) cell.classList.add('disabled');
    if(completed.includes(i)) cell.classList.add('completed');

    cell.addEventListener('click', () => {
      if(cell.classList.contains('disabled')) return;
      cell.classList.toggle('completed');
      saveHabits();
    });

    grid.appendChild(cell);
  }
  card.appendChild(grid);

  /* fecha inicio (visible y en data-*) */
  const startP = document.createElement('p');
  startP.dataset.start = isoStart;
  const [y,m,d] = isoStart.split('-');
  startP.textContent = `Comenzado el ${d}/${m}/${y}`;
  startP.style.cssText = 'font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(startP);

  list.prepend(card);
}

/* ---------- botones util ---------- */
function btn(text, cls, fn){
  const b = document.createElement('button');
  b.className = cls; b.textContent = text; b.addEventListener('click', fn);
  return b;
}

/* ---------- edición ---------- */
function inlineEdit(el,msg){
  const v = prompt(msg, el.textContent);
  if(v && v.trim()){ el.textContent = v.trim(); saveHabits(); }
}

/* ---------- guardar ---------- */
function saveHabits(){
  const data = [];
  list.querySelectorAll('.habit').forEach(card=>{
    const name = card.querySelector('h3').textContent;
    const descE= card.querySelector('.desc');
    const desc = descE ? descE.textContent : '';
    const iso  = card.querySelector('p').dataset.start;
    const completed = [];
    card.querySelectorAll('.day.completed').forEach(c => completed.push(+c.textContent));
    data.push({name, desc, isoStart: iso, completed});
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ---------- cargar ---------- */
function loadHabits(){
  try{
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    arr.forEach(h => createCard(
      h.name,
      h.desc,
      h.isoStart,
      Array.isArray(h.completed) ? h.completed : []
    ));
  }catch(err){
    console.warn('LocalStorage corrupto. Se reinicia.', err);
    localStorage.removeItem(STORAGE_KEY);
  }
}
