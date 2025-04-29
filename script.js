/* ---------- acordeones ---------- */
document.querySelectorAll('.accordion').forEach(btn=>{
  btn.addEventListener('click',()=>{
    btn.classList.toggle('active');
    const p=btn.nextElementSibling;
    p.style.display=p.style.display==='block'?'none':'block';
  });
});

/* ---------- fecha de hoy ---------- */
let today = new Date();                        // se usa luego para cálculos
fetch('https://worldtimeapi.org/api/ip')
  .then(r=>r.json()).then(d=>{today=new Date(d.datetime);setToday(today);checkMissedDays();})
  .catch(()=>{setToday(today);checkMissedDays();});

function setToday(d){
  document.getElementById('todayLabel').textContent=
    `Hoy es ${d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
}

/* ---------- refs ---------- */
const habitInput=document.getElementById('habitInput');
const descInput=document.getElementById('descInput');
const addBtn    =document.getElementById('addHabitButton');
const list      =document.getElementById('habitList');

/* ---------- añadir hábito ---------- */
addBtn.addEventListener('click',()=>{
  const name=habitInput.value.trim();
  if(!name){alert('Escribe un hábito');return;}
  createCard(name,descInput.value.trim(),today,[]);
  habitInput.value='';descInput.value='';
  save();
});

/* ---------- crear tarjeta ---------- */
function createCard(name,desc,start,completed,missed=[]){
  const card=document.createElement('div');card.className='habit';

  /* cabecera */
  const title=document.createElement('h3');title.textContent=name;
  title.ondblclick=()=>editField(title,'Nuevo nombre');
  const edit=document.createElement('button');edit.className='edit-btn';edit.textContent='Editar';
  edit.onclick=()=>editNameDesc(card);
  const del=document.createElement('button');del.className='delete-btn';del.textContent='Eliminar';
  del.onclick=()=>{card.remove();save();};

  const header=document.createElement('header');
  header.append(title,edit,del);card.appendChild(header);

  /* descripción */
  if(desc){
    const p=document.createElement('p');p.className='desc';p.textContent=desc;
    p.ondblclick=()=>editField(p,'Editar descripción');card.appendChild(p);
  }

  /* cuadrícula 40 */
  const grid=document.createElement('div');grid.className='days';
  for(let i=1;i<=40;i++){
    const d=document.createElement('span');
    d.className='day'+(i===21?' milestone':'');
    d.textContent=i;
    if(completed.includes(i)) d.classList.add('completed');
    if(missed.includes(i))   d.classList.add('missed');
    d.onclick=()=>{
      if(d.classList.contains('missed')) d.classList.remove('missed');
      d.classList.toggle('completed');
      save();
    };
    grid.appendChild(d);
  }
  card.appendChild(grid);

  /* fecha inicio */
  const startP=document.createElement('p');
  startP.style.cssText='font-size:.75rem;color:#666;margin-top:8px';
  startP.textContent=`Comenzado el ${new Date(start).toLocaleDateString('es-ES')}`;
  card.appendChild(startP);

  list.prepend(card);
}

/* ---------- editar campos ---------- */
function editField(el,msg){
  const nuevo=prompt(msg,el.textContent);
  if(nuevo!==null&&nuevo.trim()){el.textContent=nuevo.trim();save();}
}
function editNameDesc(card){
  editField(card.querySelector('h3'),'Nuevo nombre');
  const desc=card.querySelector('.desc');
  if(desc){editField(desc,'Editar descripción');}
  else{
    const nuevo=prompt('Añadir descripción (opcional):','');
    if(nuevo!==null&&nuevo.trim()){
      const p=document.createElement('p');p.className='desc';p.textContent=nuevo.trim();
      p.ondblclick=()=>editField(p,'Editar descripción');
      card.insertBefore(p,card.querySelector('.days'));
      save();
    }
  }
}

/* ---------- guardar / cargar ---------- */
function save(){
  const data=[];
  list.querySelectorAll('.habit').forEach(card=>{
    const name=card.querySelector('h3').textContent;
    const descEl=card.querySelector('.desc');const desc=descEl?descEl.textContent:'';
    const start=card.querySelector('p').textContent.split(' el ')[1];
    const completed=[], missed=[];
    card.querySelectorAll('.day').forEach(d=>{
      if(d.classList.contains('completed')) completed.push(+d.textContent);
      else if(d.classList.contains('missed')) missed.push(+d.textContent);
    });
    data.push({name,desc,start,completed,missed});
  });
  localStorage.setItem('habits',JSON.stringify(data));
  localStorage.setItem('lastOpenDate',today.toISOString().split('T')[0]);
}

function load(){
  JSON.parse(localStorage.getItem('habits')||'[]')
    .forEach(h=>createCard(h.name,h.desc,new Date(h.start),h.completed,h.missed||[]));
}
load();

/* ---------- detectar días olvidados ---------- */
function checkMissedDays(){
  const lastOpen=localStorage.getItem('lastOpenDate');
  const lastDate= lastOpen ? new Date(lastOpen+"T00:00") : today;
  const diffDays=Math.floor((dateOnly(today)-dateOnly(lastDate))/(1000*60*60*24));
  if(diffDays<=0){save();return;}

  let totalMissed=0;

  list.querySelectorAll('.habit').forEach(card=>{
    const startDateText=card.querySelector('p').textContent.split(' el ')[1];
    const startDate=new Date(startDateText+"T00:00");
    const daysPassed=Math.floor((dateOnly(today)-dateOnly(startDate))/(1000*60*60*24))+1;
    const grid=card.querySelectorAll('.day');

    for(let i=1;i<=Math.min(daysPassed-1,40);i++){          // hasta ayer, no incluye hoy
      const cell=grid[i-1];
      if(!cell.classList.contains('completed') && !cell.classList.contains('missed')){
        cell.classList.add('missed');
        totalMissed++;
      }
    }
  });

  if(totalMissed){
    alert(`¡Atención! Tienes ${totalMissed} día(s) sin marcar desde tu última visita.`);
  }
  save();
}
function dateOnly(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
