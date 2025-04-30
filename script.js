/* ---------- Acordeones ---------- */
document.querySelectorAll('.accordion').forEach(btn=>{
  btn.addEventListener('click',()=>{
    btn.classList.toggle('active');
    const p = btn.nextElementSibling;
    p.style.display = p.style.display === 'block' ? 'none' : 'block';
  });
});

/* ---------- Fecha “Hoy” ---------- */
fetch('https://worldtimeapi.org/api/ip')
  .then(r=>r.json())
  .then(d=>setToday(new Date(d.datetime)))
  .catch(()=>setToday(new Date()));

function setToday(d){
  document.getElementById('todayLabel').textContent =
    `Hoy es ${d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
}

/* ---------- Refs ---------- */
const habitInput = document.getElementById('habitInput');
const descInput  = document.getElementById('descInput');
const addBtn     = document.getElementById('addHabitButton');
const list       = document.getElementById('habitList');

/* ---------- Añadir hábito ---------- */
addBtn.addEventListener('click',()=>{
  const name = habitInput.value.trim();
  if(!name){ alert('Escribe un hábito'); return; }
  createCard(name, descInput.value.trim(), new Date(), []);
  habitInput.value = '';
  descInput.value  = '';
  saveHabits();
});

/* ---------- Crear tarjeta ---------- */
function createCard(name, desc, start, completed){
  const card = document.createElement('div');
  card.className = 'habit';

  /* Cabecera */
  const header = document.createElement('header');
  const title  = document.createElement('h3');
  title.textContent = name;
  title.ondblclick = ()=>editText(title, 'Nuevo nombre del hábito');

  const edit = document.createElement('span');
  edit.textContent = '✏️'; edit.className = 'edit-icon';
  edit.onclick = ()=>editText(title, 'Nuevo nombre del hábito');

  const del = document.createElement('button');
  del.className = 'delete-btn'; del.textContent = 'Eliminar';
  del.onclick = ()=>{ card.remove(); saveHabits(); };

  header.append(title, edit, del);
  card.appendChild(header);

  /* Descripción */
  if(desc){
    const p = document.createElement('p');
    p.className = 'desc';
    p.textContent = desc;
    p.ondblclick = ()=>editText(p, 'Editar descripción');
    card.appendChild(p);
  }

  /* Grid 60 días */
  const grid = document.createElement('div');
  grid.className = 'days';
  for(let i=1; i<=60; i++){
    const d = document.createElement('span');
    d.className = 'day' + (i===21 ? ' milestone' : '');
    d.textContent = i;
    if(completed.includes(i)) d.classList.add('completed');
    d.onclick = ()=>{ d.classList.toggle('completed'); saveHabits(); };
    grid.appendChild(d);
  }
  card.appendChild(grid);

  /* Fecha inicio */
  const startP = document.createElement('p');
  startP.style.cssText = 'font-size:.75rem;color:#666;margin-top:8px';
  startP.textContent = `Comenzado el ${new Date(start).toLocaleDateString('es-ES')}`;
  card.appendChild(startP);

  list.prepend(card);
}

/* ---------- Editar inline ---------- */
function editText(el, msg){
  const nuevo = prompt(msg, el.textContent);
  if(nuevo!==null && nuevo.trim()){
    el.textContent = nuevo.trim();
    saveHabits();
  }
}

/* ---------- Guardar / Cargar ---------- */
function saveHabits(){
  const arr = [];
  list.querySelectorAll('.habit').forEach(card=>{
    const name   = card.querySelector('h3').textContent;
    const descEl = card.querySelector('.desc');
    const desc   = descEl ? descEl.textContent : '';
    const start  = card.querySelector('p').textContent.split(' el ')[1];
    const completed = [];
    card.querySelectorAll('.day.completed').forEach(d=>completed.push(+d.textContent));
    arr.push({ name, desc, start, completed });
  });
  localStorage.setItem('habits', JSON.stringify(arr));
}

(function load(){
  (JSON.parse(localStorage.getItem('habits') || '[]'))
    .forEach(h=>createCard(h.name, h.desc, new Date(h.start), h.completed));
})();
