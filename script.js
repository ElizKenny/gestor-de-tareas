/* ---------- utilidades ---------- */
function dateOnly(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function iso(d){ return d.toISOString().split('T')[0]; }            // AAAA-MM-DD
function isoToLocalDate(isoStr){                                    // seguro → Date local
  const [y,m,d]=isoStr.split('-').map(Number);
  return new Date(y, m-1, d);
}

/* ---------- “hoy” local ---------- */
const today     = dateOnly(new Date());           // 00:00 local
const todayISO  = iso(today);

/* ---------- al cargar DOM ---------- */
document.addEventListener('DOMContentLoaded', () => {
  setTodayLabel();
  loadHabits();
  checkMissedDays();
  document.getElementById('addHabitButton').addEventListener('click', addHabit);
});

/* ---------- etiqueta hoy ---------- */
function setTodayLabel(){
  document.getElementById('todayLabel').textContent =
    `Hoy es ${today.toLocaleDateString('es-ES',
      {weekday:'long', day:'numeric', month:'long', year:'numeric'})}`;
}

/* ---------- refs ---------- */
const habitInput = document.getElementById('habitInput');
const descInput  = document.getElementById('descInput');
const list       = document.getElementById('habitList');

/* ---------- añadir hábito ---------- */
function addHabit(){
  const name = habitInput.value.trim();
  if(!name){ alert('Escribe un hábito'); return; }

  createCard(name, descInput.value.trim(), todayISO, [], []);
  habitInput.value=''; descInput.value='';
  saveHabits();
}

/* ---------- crear tarjeta ---------- */
function createCard(name, desc, startISO, completed=[], missed=[]){
  const card=document.createElement('div'); card.className='habit';

  /* cabecera */
  const title=document.createElement('h3'); title.textContent=name;
  title.ondblclick=()=>editField(title,'Nuevo nombre');

  const edit=document.createElement('button');
  edit.className='edit-btn'; edit.textContent='Editar';
  edit.onclick=()=>editNameDesc(card);

  const del=document.createElement('button');
  del.className='delete-btn'; del.textContent='Eliminar';
  del.onclick=()=>{ card.remove(); saveHabits(); };

  const header=document.createElement('header');
  header.append(title,edit,del); card.appendChild(header);

  /* descripción */
  if(desc){
    const p=document.createElement('p');
    p.className='desc'; p.textContent=desc;
    p.ondblclick=()=>editField(p,'Editar descripción');
    card.appendChild(p);
  }

  /* cuadrícula 40 */
  const grid=document.createElement('div'); grid.className='days';
  const startDate=isoToLocalDate(startISO);
  const daysPassed=Math.floor((today - startDate)/86400000);

  for(let i=1;i<=40;i++){
    const cell=document.createElement('span');
    cell.className='day' + (i===21 ? ' milestone' : '');
    cell.textContent=i;

    if(i-1>daysPassed) cell.classList.add('disabled');
    if(completed.includes(i)) cell.classList.add('completed');
    if(missed.includes(i))    cell.classList.add('missed');

    cell.onclick=()=>{
      if(cell.classList.contains('disabled')) return;
      if(cell.classList.contains('missed')) cell.classList.remove('missed');
      cell.classList.toggle('completed');
      saveHabits();
    };
    grid.appendChild(cell);
  }
  card.appendChild(grid);

  /* fecha inicio visible + ISO oculto */
  const startP=document.createElement('p');
  startP.dataset.startIso=startISO;
  const [y,m,d]=startISO.split('-');
  startP.textContent=`Comenzado el ${d}/${m}/${y}`;
  startP.style.cssText='font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(startP);

  list.prepend(card);
}

/* ---------- edición ---------- */
function editField(el,msg){
  const val=prompt(msg,el.textContent);
  if(val && val.trim()){ el.textContent=val.trim(); saveHabits(); }
}
function editNameDesc(card){
  editField(card.querySelector('h3'),'Nuevo nombre');
  const d=card.querySelector('.desc');
  if(d){ editField(d,'Editar descripción'); }
  else{
    const nuevo = prompt('Añadir descripción (opcional):','');
    if(nuevo && nuevo.trim()){
      const p=document.createElement('p');
      p.className='desc'; p.textContent=nuevo.trim();
      p.ondblclick=()=>editField(p,'Editar descripción');
      card.insertBefore(p, card.querySelector('.days'));
      saveHabits();
    }
  }
}

/* ---------- guardar ---------- */
function saveHabits(){
  const arr=[];
  document.querySelectorAll('.habit').forEach(card=>{
    const name=card.querySelector('h3').textContent;
    const descEl=card.querySelector('.desc'); const desc=descEl?descEl.textContent:'';
    const startISO=card.querySelector('p').dataset.startIso;
    const completed=[], missed=[];
    card.querySelectorAll('.day').forEach(c=>{
      const idx=+c.textContent;
      if(c.classList.contains('completed')) completed.push(idx);
      else if(c.classList.contains('missed')) missed.push(idx);
    });
    arr.push({name,desc,startISO,completed,missed});
  });
  localStorage.setItem('habits', JSON.stringify(arr));
  localStorage.setItem('lastOpenDate', todayISO);
}

/* ---------- cargar ---------- */
function loadHabits(){
  JSON.parse(localStorage.getItem('habits')||'[]')
    .forEach(h=>createCard(h.name,h.desc,h.startISO,h.completed,h.missed));
}

/* ---------- días olvidados ---------- */
function checkMissedDays(){
  const lastISO=localStorage.getItem('lastOpenDate');
  const last= lastISO ? isoToLocalDate(lastISO) : today;
  const diff=Math.floor((today-last)/86400000);
  if(diff<=0){ saveHabits(); return; }

  let missed=0;
  document.querySelectorAll('.habit').forEach(card=>{
    const startISO=card.querySelector('p').dataset.startIso;
    const start=isoToLocalDate(startISO);
    const daysSince=Math.floor((today-start)/86400000)+1;

    card.querySelectorAll('.day').forEach(c=>{
      const idx=+c.textContent;
      if(idx<=Math.min(daysSince-1,40) &&
         !c.classList.contains('completed') &&
         !c.classList.contains('missed')){
        c.classList.add('missed'); missed++;
      }
    });
  });

  if(missed) alert(`Tienes ${missed} día(s) sin marcar desde tu última visita.`);
  saveHabits();
}
