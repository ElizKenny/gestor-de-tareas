/* ---------- acordeones ---------- */
document.querySelectorAll('.accordion').forEach(btn=>{
  btn.addEventListener('click',()=>{
    btn.classList.toggle('active');
    const panel=btn.nextElementSibling;
    panel.style.display=panel.style.display==='block'?'none':'block';
  });
});

/* ---------- fecha de hoy ---------- */
fetch('https://worldtimeapi.org/api/ip')
 .then(r=>r.json()).then(data=>{
   const hoy=new Date(data.datetime);
   document.getElementById('todayLabel').textContent=
     `Hoy es ${hoy.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
 }).catch(()=>{
   const hoy=new Date();
   document.getElementById('todayLabel').textContent=
    `Hoy es ${hoy.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
 });

/* ---------- DOM refs ---------- */
const habitInput=document.getElementById('habitInput');
const descInput =document.getElementById('descInput');
const addBtn    =document.getElementById('addHabitButton');
const list      =document.getElementById('habitList');

/* ---------- eventos ---------- */
addBtn.addEventListener('click',()=>{  
  const name=habitInput.value.trim();
  if(!name){alert('Escribe un hábito');return;}
  const desc=descInput.value.trim();
  createCard(name,desc,new Date(),[]);
  habitInput.value='';descInput.value='';
  save();
});

/* ---------- crear tarjeta ---------- */
function createCard(name,desc,start,completed){
  const card=document.createElement('div');
  card.className='habit';

  /* cabecera + editar */
  const header=document.createElement('header');
  const title=document.createElement('h3');
  title.textContent=name;
  title.addEventListener('dblclick',()=>editTitle(title));
  const edit=document.createElement('span');
  edit.textContent='✏️';
  edit.className='edit-icon';
  edit.title='Editar nombre';
  edit.onclick=()=>editTitle(title);
  const delBtn=document.createElement('button');
  delBtn.className='delete-btn';
  delBtn.textContent='Eliminar';
  delBtn.onclick=()=>{card.remove();save();};
  header.append(title,edit,delBtn);
  card.appendChild(header);

  /* descripción */
  if(desc){
    const p=document.createElement('p');
    p.className='desc';
    p.textContent=desc;
    p.addEventListener('dblclick',()=>editDesc(p));
    card.appendChild(p);
  }

  /* grid 60 días */
  const grid=document.createElement('div');
  grid.className='days';
  for(let i=1;i<=60;i++){
    const d=document.createElement('span');
    d.className='day'+(i===21?' milestone':'');
    d.textContent=i;
    if(completed.includes(i))d.classList.add('completed');
    d.onclick=()=>{d.classList.toggle('completed');save();};
    grid.appendChild(d);
  }
  card.appendChild(grid);

  /* fecha inicio */
  const startP=document.createElement('p');
  startP.style.fontSize='.75rem';
  startP.style.color='#666';
  startP.style.marginTop='8px';
  startP.textContent=`Comenzado el ${new Date(start).toLocaleDateString('es-ES')}`;
  card.appendChild(startP);

  list.prepend(card);
}

/* ---------- editar título/descripcion ---------- */
function editTitle(el){
  const nuevo=prompt('Nuevo nombre del hábito:',el.textContent);
  if(nuevo){el.textContent=nuevo;save();}
}
function editDesc(p){
  const nuevo=prompt('Editar descripción:',p.textContent);
  if(nuevo!==null){p.textContent=nuevo;save();}
}

/* ---------- guardar & cargar ---------- */
function save(){
  const data=[];
  list.querySelectorAll('.habit').forEach(card=>{
    const name=card.querySelector('h3').textContent;
    const descEl=card.querySelector('p.desc'); const desc=descEl?descEl.textContent:'';
    const start=card.querySelector('p').textContent.split(' el ')[1];
    const completed=[];
    card.querySelectorAll('.day.completed').forEach(d=>completed.push(+d.textContent));
    data.push({name,desc,start,completed});
  });
  localStorage.setItem('habits',JSON.stringify(data));
}

(function load(){
  const data=JSON.parse(localStorage.getItem('habits')||'[]');
  data.forEach(h=>createCard(h.name,h.desc,new Date(h.start),h.completed));
})();
/* ---------- dark mode ---------- */
const darkModeToggle=document.getElementById('darkModeToggle');
darkModeToggle.addEventListener('click',()=>{
  document.body.classList.toggle('dark-mode');
  darkModeToggle.textContent=document.body.classList.contains('dark-mode')?'🌞':'🌙';
  localStorage.setItem('darkMode',document.body.classList.contains('dark-mode'));
});
(function loadDarkMode(){
  const darkMode=localStorage.getItem('darkMode');
  if(darkMode==='true'){
    document.body.classList.add('dark-mode');
    darkModeToggle.textContent='🌞';
  }else{
    document.body.classList.remove('dark-mode');
    darkModeToggle.textContent='🌙';
  }
})();
/* ---------- copiar al portapapeles ---------- */