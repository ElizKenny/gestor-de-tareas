/* ---------- utilidades de fecha ---------- */
function dateOnly(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function iso(d){ return d.toISOString().split('T')[0]; }          // AAAA-MM-DD

/* ---------- variables globales ---------- */
let today = dateOnly(new Date());                                 // valor provisional
let todayISO = iso(today);

/* ---------- obtener hora real vía API ---------- */
fetch('https://worldtimeapi.org/api/ip')
  .then(r=>r.json()).then(data=>{
      today = dateOnly(new Date(data.datetime));
      todayISO = iso(today);
      init();
  })
  .catch(init);                                                   // si falla, usa provisional

/* ---------- inicio ---------- */
function init(){
  setTodayLabel();
  loadHabits();
  checkMissedDays();
}

/* ---------- etiqueta "Hoy es…" ---------- */
function setTodayLabel(){
  document.getElementById('todayLabel').textContent =
    `Hoy es ${today.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
}

/* ---------- referencias DOM ---------- */
const habitInput = document.getElementById('habitInput');
const descInput  = document.getElementById('descInput');
const addBtn     = document.getElementById('addHabitButton');
const list       = document.getElementById('habitList');

/* ---------- añadir hábito ---------- */
addBtn.addEventListener('click', ()=>{
  const name = habitInput.value.trim();
  if(!name){ alert('Escribe un hábito'); return; }

  createCard(name, descInput.value.trim(), todayISO, [], []);
  habitInput.value=''; descInput.value='';
  saveHabits();
});

/* ---------- crear tarjeta ---------- */
function createCard(name, desc, startISO, completed=[], missed=[]){
  const card = document.createElement('div'); card.className='habit';

  /* cabecera */
  const title = document.createElement('h3');
  title.textContent = name;
  title.ondblclick  = () => editField(title,'Nuevo nombre');

  const edit = document.createElement('button');
  edit.className='edit-btn'; edit.textContent='Editar';
  edit.onclick = () => editNameDesc(card);

  const del  = document.createElement('button');
  del.className='delete-btn'; del.textContent='Eliminar';
  del.onclick = () => { card.remove(); saveHabits(); };

  const header = document.createElement('header');
  header.append(title, edit, del);
  card.appendChild(header);

  /* descripción */
  if(desc){
    const p = document.createElement('p');
    p.className='desc'; p.textContent = desc;
    p.ondblclick = () => editField(p,'Editar descripción');
    card.appendChild(p);
  }

  /* cuadrícula 40 */
  const grid = document.createElement('div'); grid.className='days';
  const startDate = new Date(startISO+'T00:00');                  // local
  const daysPassed = Math.floor((today - startDate)/86400000);    // 0-based

  for(let i=1;i<=40;i++){
    const cell = document.createElement('span');
    cell.className = 'day' + (i===21 ? ' milestone' : '');
    cell.textContent = i;

    if(i-1>daysPassed) cell.classList.add('disabled');
    if(completed.includes(i)) cell.classList.add('completed');
    if(missed.includes(i))    cell.classList.add('missed');

    cell.onclick = ()=>{
      if(cell.classList.contains('disabled')) return;             // bloquear futuro
      if(cell.classList.contains('missed')) cell.classList.remove('missed');
      cell.classList.toggle('completed');
      saveHabits();
    };
    grid.appendChild(cell);
  }
  card.appendChild(grid);

  /* fecha inicio visible + ISO oculto */
  const startP = document.createElement('p');
  startP.dataset.startIso = startISO;
  startP.style.cssText='font-size:.75rem;color:#666;margin-top:8px';
  startP.textContent = `Comenzado el ${startDate.toLocaleDateString('es-ES')}`;
  card.appendChild(startP);

  list.prepend(card);
}

/* ---------- edición ---------- */
function editField(el,msg){
  const nuevo = prompt(msg, el.textContent);
  if(nuevo!==null && nuevo.trim()){
    el.textContent = nuevo.trim();
    saveHabits();
  }
}
function editNameDesc(card){
  editField(card.querySelector('h3'),'Nuevo nombre');
  const d = card.querySelector('.desc');
  if(d){ editField(d,'Editar descripción'); }
  else{
    const nuevo = prompt('Añadir descripción (opcional):','');
    if(nuevo!==null && nuevo.trim()){
      const p=document.createElement('p');
      p.className='desc'; p.textContent = nuevo.trim();
      p.ondblclick = ()=>editField(p,'Editar descripción');
      card.insertBefore(p, card.querySelector('.days'));
      saveHabits();
    }
  }
}

/* ---------- guardar ---------- */
function saveHabits(){
  const arr=[];
  list.querySelectorAll('.habit').forEach(card=>{
    const name = card.querySelector('h3').textContent;
    const descEl = card.querySelector('.desc'); const desc = descEl ? descEl.textContent : '';
    const startISO = card.querySelector('p').dataset.startIso;
    const completed=[], missed=[];
    card.querySelectorAll('.day').forEach(c=>{
      const idx=+c.textContent;
      if(c.classList.contains('completed')) completed.push(idx);
      else if(c.classList.contains('missed')) missed.push(idx);
    });
    arr.push({name, desc, startISO, completed, missed});
  });
  localStorage.setItem('habits', JSON.stringify(arr));
  localStorage.setItem('lastOpenDate', todayISO);
}

/* ---------- cargar ---------- */
function loadHabits(){
  JSON.parse(localStorage.getItem('habits')||'[]')
    .forEach(h=>createCard(h.name, h.desc, h.startISO, h.completed, h.missed));
}

/* ---------- marcar días olvidados ---------- */
function checkMissedDays(){
  const lastISO = localStorage.getItem('lastOpenDate');
  const last = lastISO ? new Date(lastISO+'T00:00') : today;
  const diffDays = Math.floor((today - last)/86400000);
  if(diffDays<=0){ saveHabits(); return; }

  let missedCount=0;

  list.querySelectorAll('.habit').forEach(card=>{
    const startISO = card.querySelector('p').dataset.startIso;
    const startDate = new Date(startISO+'T00:00');
    const daysSinceStart = Math.floor((today - startDate)/86400000)+1;

    card.querySelectorAll('.day').forEach(cell=>{
      const idx = +cell.textContent;
      if(idx<=Math.min(daysSinceStart-1,40) &&
         !cell.classList.contains('completed') &&
         !cell.classList.contains('missed')){
        cell.classList.add('missed');
        missedCount++;
      }
    });
  });

  if(missedCount){
    alert(`Tienes ${missedCount} día(s) sin marcar desde tu última visita.`);
  }
  saveHabits();
}
