/* ---------------- acordeones ---------------- */
document.querySelectorAll('.accordion').forEach(btn=>{
  btn.addEventListener('click',e=>{
    btn.classList.toggle('active');
    const panel=btn.nextElementSibling;
    panel.style.display=panel.style.display==='block'?'none':'block';
  });
});

/* ---------------- hoy vía API ---------------- */
fetch('https://worldtimeapi.org/api/ip')
  .then(r=>r.json())
  .then(data=>{
    const ahora=new Date(data.datetime);
    document.getElementById('todayLabel').textContent=
      `Hoy es ${ahora.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
  })
  .catch(()=>{ /* backup local */
    const ahora=new Date();
    document.getElementById('todayLabel').textContent=
      `Hoy es ${ahora.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
  });

/* ---------------- lógica de hábitos ---------------- */
const input=document.getElementById('habitInput');
const btnAdd=document.getElementById('addHabitButton');
const list=document.getElementById('habitList');

/* cargar desde localStorage */
loadHabits();

btnAdd.addEventListener('click',()=>{  
  const name=input.value.trim();
  if(!name){alert('Escribe un hábito');return;}
  createHabitCard(name,new Date());
  input.value='';
  saveHabits();
});

/* crear tarjeta */
function createHabitCard(name,startDate,completed=[]) {
  const card=document.createElement('div');
  card.className='habit';
  
  /* cabecera */
  const header=document.createElement('header');
  header.innerHTML=`<h3>${name}</h3><button class="delete-btn">Eliminar</button>`;
  card.appendChild(header);
  
  /* grid 21 días */
  const grid=document.createElement('div');
  grid.className='days';
  for(let i=0;i<21;i++){
    const span=document.createElement('span');
    span.className='day';
    span.textContent=i+1;
    if(completed.includes(i+1)) span.classList.add('completed');
    span.addEventListener('click',()=>{
      span.classList.toggle('completed');
      saveHabits();
    });
    grid.appendChild(span);
  }
  card.appendChild(grid);
  
  /* fecha inicio */
  const startP=document.createElement('p');
  startP.style.fontSize='.75rem';
  startP.style.color='#666';
  startP.style.marginTop='8px';
  startP.textContent=`Comenzado el ${startDate.toLocaleDateString('es-ES')}`;
  card.appendChild(startP);

  /* eliminar */
  header.querySelector('.delete-btn').addEventListener('click',()=>{
    card.remove();
    saveHabits();
  });
  
  list.prepend(card);
}

/* guardar */
function saveHabits(){
  const data=[];
  list.querySelectorAll('.habit').forEach(card=>{
    const name=card.querySelector('h3').textContent;
    const startTxt=card.querySelector('p').textContent.split(' el ')[1];
    const start=new Date(startTxt);
    const completed=[];
    card.querySelectorAll('.day.completed').forEach(d=>completed.push(parseInt(d.textContent)));
    data.push({name,start,completed});
  });
  localStorage.setItem('habits',JSON.stringify(data));
}

/* cargar */
function loadHabits(){
  const data=JSON.parse(localStorage.getItem('habits')||'[]');
  data.forEach(h=>{
    createHabitCard(h.name,new Date(h.start),h.completed);
  });
}