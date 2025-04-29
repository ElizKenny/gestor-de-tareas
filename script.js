/* --- acordeones --- */
document.querySelectorAll('.accordion').forEach(btn=>{
  btn.addEventListener('click',()=>{
    btn.classList.toggle('active');
    const p=btn.nextElementSibling;
    p.style.display=p.style.display==='block'?'none':'block';
  });
});

/* --- mostrar fecha de hoy --- */
fetch('https://worldtimeapi.org/api/ip')
  .then(r=>r.json()).then(d=>setToday(new Date(d.datetime)))
  .catch(()=>setToday(new Date()));
function setToday(d){
  document.getElementById('todayLabel').textContent=
    `Hoy es ${d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
}

/* --- refs DOM --- */
const habitInput=document.getElementById('habitInput');
const descInput=document.getElementById('descInput');
const addBtn    =document.getElementById('addHabitButton');
const list      =document.getElementById('habitList');

/* --- añadir hábito --- */
addBtn.addEventListener('click',()=>{
  const name=habitInput.value.trim();
  if(!name){alert('Escribe un hábito');return;}
  createCard(name,descInput.value.trim(),new Date(),[]);
  habitInput.value='';descInput.value='';
  save();
});

/* --- crear tarjeta --- */
function createCard(name,desc,start,completed){
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
    if(completed.includes(i))d.classList.add('completed');
    d.onclick=()=>{d.classList.toggle('completed');save();};
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

/* --- edición --- */
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

/* --- guardar/cargar --- */
function save(){
  const data=[];
  list.querySelectorAll('.habit').forEach(card=>{
    const name=card.querySelector('h3').textContent;
    const descEl=card.querySelector('.desc');const desc=descEl?descEl.textContent:'';
    const start=card.querySelector('p').textContent.split(' el ')[1];
    const completed=[];card.querySelectorAll('.day.completed').forEach(d=>completed.push(+d.textContent));
    data.push({name,desc,start,completed});
  });
  localStorage.setItem('habits',JSON.stringify(data));
}
(function load(){
  JSON.parse(localStorage.getItem('habits')||'[]')
    .forEach(h=>createCard(h.name,h.desc,new Date(h.start),h.completed));
})();
