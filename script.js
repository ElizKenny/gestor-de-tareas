const STORAGE_KEY = 'habit40';

/* ====== FECHA ====== */
const pad = n => n < 10 ? '0' + n : '' + n;
const dateOnly = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const toISO = d => {
  d = dateOnly(d);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const fromISO = iso => {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
};
const todayISO = () => toISO(new Date());

/* ====== DOM ready ====== */
let habitInput, descInput, list;

document.addEventListener('DOMContentLoaded', () => {
  habitInput = document.getElementById('habitInput');
  descInput  = document.getElementById('descInput');
  list       = document.getElementById('habitList');

  document.getElementById('addHabitButton')
          .addEventListener('click', addHabit);

  initAccordions();
  renderToday();
  loadHabits();
});

/* ====== UI helpers ====== */
function initAccordions(){
  document.querySelectorAll('.accordion').forEach(btn=>{
    btn.addEventListener('click',()=>{
      btn.classList.toggle('active');
      const p = btn.nextElementSibling;
      p.style.display = p.style.display==='block' ? 'none' : 'block';
    });
  });
}
function renderToday(){
  const d = dateOnly(new Date());
  document.getElementById('todayLabel').textContent =
    `Hoy es ${d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
}

/* ====== CRUD ====== */
function addHabit(){
  const name = habitInput.value.trim();
  if(!name){ alert('Escribe un hábito'); return; }

  createCard(name, descInput.value.trim(), todayISO(), []);
  habitInput.value = ''; descInput.value = '';
  saveHabits();
}

function createCard(name, desc, isoStart, completed = []){
  if(!isoStart) return;                   // seguridad

  const card = document.createElement('div'); card.className = 'habit';

  /* -- cabecera -- */
  const title = document.createElement('h3'); title.textContent = name;
  title.ondblclick = () => inlineEdit(title, 'Nuevo nombre');

  const edit = btn('Editar','edit-btn', () => inlineEdit(title,'Nuevo nombre'));
  const del  = btn('Eliminar','delete-btn', () => { card.remove(); saveHabits(); });

  const header = document.createElement('header');
  header.append(title, edit, del);
  card.appendChild(header);

  /* -- descripción -- */
  if(desc){
    const p = document.createElement('p');
    p.className = 'desc'; p.textContent = desc;
    p.ondblclick = () => inlineEdit(p,'Editar descripción');
    card.appendChild(p);
  }

  /* -- grid 40 -- */
  const grid = document.createElement('div'); grid.className = 'days';
  const startDate  = fromISO(isoStart);
  const daysPassed = Math.floor((dateOnly(new Date()) - startDate) / 86400000);

  for(let i=1;i<=40;i++){
    const c = document.createElement('span');
    c.className = 'day' + (i===21?' milestone':'');
    c.textContent = i;

    if(i-1 > daysPassed)          c.classList.add('disabled');
    if(completed.includes(i))     c.classList.add('completed');

    c.onclick = () => {
      if(c.classList.contains('disabled')) return;
      c.classList.toggle('completed');
      saveHabits();
    };
    grid.appendChild(c);
  }
  card.appendChild(grid);

  /* -- fecha inicio -- */
  const [y,m,d] = isoStart.split('-');
  const startP = document.createElement('p');
  startP.dataset.iso = isoStart;
  startP.textContent = `Comenzado el ${d}/${m}/${y}`;
  startP.style.cssText = 'font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(startP);

  list.prepend(card);
}

function btn(text,cls,fn){
  const b=document.createElement('button');
  b.className=cls; b.textContent=text; b.addEventListener('click',fn);
  return b;
}

function inlineEdit(el,msg){
  const v = prompt(msg, el.textContent);
  if(v && v.trim()){ el.textContent = v.trim(); saveHabits(); }
}

/* ====== Persistencia ====== */
function saveHabits(){
  const arr=[];
  document.querySelectorAll('.habit').forEach(card=>{
    const name = card.querySelector('h3').textContent;
    const descE= card.querySelector('.desc');
    const desc = descE ? descE.textContent : '';
    const iso  = card.querySelector('p').dataset.iso;

    const completed=[];
    card.querySelectorAll('.day.completed').forEach(c=>completed.push(+c.textContent));

    arr.push({name,desc,isoStart:iso,completed});
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function loadHabits(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return;

  let data;
  try{ data = JSON.parse(raw); }
  catch(e){ console.warn('JSON corrupto, se descarta'); return; }

  (Array.isArray(data) ? data : []).forEach(obj=>{
    /* -- normalizar campos de versiones antiguas -- */
    const iso = obj.isoStart || obj.startISO || obj.start || '';
    const name= obj.name || obj.nombre || '';
    if(!iso || !name) return;                          // inválido

    const completed = Array.isArray(obj.completed) ? obj.completed : [];
    const desc = obj.desc || '';

    createCard(name, desc, iso, completed);
  });
}
