/* ---------- utilidades de fecha ---------- */
function dateOnly(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function pad(n){ return n < 10 ? '0' + n : '' + n; }
function toISO(d){
  d = dateOnly(d);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; // YYYY-MM-DD local
}
function fromISO(iso){
  const [y,m,day] = iso.split('-').map(Number);
  return new Date(y, m-1, day);
}
function todayISO(){ return toISO(new Date()); }

/* ---------- arranque ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initAccordions();
  renderToday();
  loadHabits();
  document.getElementById('addHabitButton').addEventListener('click', addHabit);
});

/* ---------- acordeones ---------- */
function initAccordions(){
  document.querySelectorAll('.accordion').forEach(btn=>{
    btn.addEventListener('click',()=>{
      btn.classList.toggle('active');
      const panel = btn.nextElementSibling;
      panel.style.display = panel.style.display==='block' ? 'none' : 'block';
    });
  });
}

/* ---------- hoy ---------- */
function renderToday(){
  const d = dateOnly(new Date());
  document.getElementById('todayLabel').textContent =
    `Hoy es ${d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
}

/* ---------- refs ---------- */
const habitInput = document.getElementById('habitInput');
const descInput  = document.getElementById('descInput');
const list       = document.getElementById('habitList');

/* ---------- añadir hábito ---------- */
function addHabit(){
  const name = habitInput.value.trim();
  if(!name){ alert('Escribe un hábito'); return; }
  createCard(name, descInput.value.trim(), todayISO(), []);
  habitInput.value=''; descInput.value='';
  saveHabits();
}

/* ---------- crear tarjeta ---------- */
function createCard(name, desc, startISO, completed=[]){
  const card=document.createElement('div'); card.className='habit';

  /* cabecera */
  const title=document.createElement('h3');
  title.textContent=name;
  title.ondblclick=()=>editField(title,'Nuevo nombre');

  const edit=document.createElement('button');
  edit.className='edit-btn'; edit.textContent='Editar';
  edit.onclick=()=>editNameDesc(card);

  const del=document.createElement('button');
  del.className='delete-btn'; del.textContent='Eliminar';
  del.onclick=()=>{ card.remove(); saveHabits(); };

  const header=document.createElement('header');
  header.append(title,edit,del);
  card.appendChild(header);

  /* descripción */
  if(desc){
    const p=document.createElement('p');
    p.className='desc'; p.textContent=desc;
    p.ondblclick=()=>editField(p,'Editar descripción');
    card.appendChild(p);
  }

  /* grid 40 días */
  const grid=document.createElement('div'); grid.className='days';
  const startDate=fromISO(startISO);
  const today=dateOnly(new Date());
  const daysPassed=Math.floor((today-startDate)/86400000);

  for(let i=1;i<=40;i++){
    const cell=document.createElement('span');
    cell.className='day'+(i===21?' milestone':'');
    cell.textContent=i;

    if(i-1>daysPassed) cell.classList.add('disabled');
    if(completed.includes(i)) cell.classList.add('completed');

    cell.onclick=()=>{
      if(cell.classList.contains('disabled')) return;
      cell.classList.toggle('completed');
      saveHabits();
    };
    grid.appendChild(cell);
  }
  card.appendChild(grid);

  /* fecha inicio */
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
  const des=card.querySelector('.desc');
  if(des){ editField(des,'Editar descripción'); }
  else{
    const txt=prompt('Añadir descripción (opcional):','');
    if(txt && txt.trim()){
      const p=document.createElement('p');
      p.className='desc'; p.textContent=txt.trim();
      p.ondblclick=()=>editField(p,'Editar descripción');
      card.insertBefore(p,card.querySelector('.days'));
      saveHabits();
    }
  }
}

/* ---------- guardar / cargar ---------- */
function saveHabits(){
  const data=[];
  document.querySelectorAll('.habit').forEach(card=>{
    const name=card.querySelector('h3').textContent;
    const descEl=card.querySelector('.desc');
    const desc=descEl?descEl.textContent:'';
    const startISO=card.querySelector('p').dataset.startIso;
    const completed=[];
    card.querySelectorAll('.day.completed').forEach(c=>completed.push(+c.textContent));
    data.push({name,desc,startISO,completed});
  });
  localStorage.setItem('habits', JSON.stringify(data));
}
function loadHabits(){
  JSON.parse(localStorage.getItem('habits')||'[]')
    .forEach(h=>createCard(h.name,h.desc,h.startISO,h.completed));
}
