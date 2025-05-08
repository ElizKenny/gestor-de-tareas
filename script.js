/******************************************************************
*  Gestor de hábitos + Firebase (Auth & Firestore)
******************************************************************/
const STORAGE_KEY = 'habits';        // clave usada en Firestore

/* ---------- utilidades de fecha ---------- */
const pad = n => n<10?'0'+n:''+n;
const dateOnly = d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const toISO = d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO = ()=>toISO(new Date());
const fromISO = iso=>{const[a,b,c]=iso.split('-').map(Number);return new Date(a,b-1,c);};

/* ---------- refs globales (se asignan post-login) ---------- */
let habitInput, descInput, list, uid;

/* ---------- Auth ---------- */
const $email  = document.getElementById('email');
const $pass   = document.getElementById('pass');
const $loginB = document.getElementById('loginBtn');
const $authErr= document.getElementById('authError');

$loginB.onclick = async ()=>{
  const e=$email.value.trim(), p=$pass.value.trim();
  if(!e||!p){$authErr.textContent='Rellena correo y contraseña';return;}
  $authErr.textContent='';
  try{
    await auth.signInWithEmailAndPassword(e,p);
  }catch(err){
    if(err.code==='auth/user-not-found'){
      await auth.createUserWithEmailAndPassword(e,p);
    }else{
      $authErr.textContent = err.message; }
  }
};

auth.onAuthStateChanged(user=>{
  if(!user) return;
  uid = user.uid;
  document.getElementById('authSection').style.display='none';
  document.getElementById('appContainer').style.display='block';
  initApp();          // una sola vez tras login
});

/* ---------- Lógica del rastreador ---------- */
function initApp(){
  habitInput = document.getElementById('habitInput');
  descInput  = document.getElementById('descInput');
  list       = document.getElementById('habitList');

  initAccordions();
  renderToday();
  loadHabits();

  document.getElementById('addHabitButton').addEventListener('click', addHabit);
}

/* acordeones */
function initAccordions(){
  document.querySelectorAll('.accordion').forEach(btn=>{
    btn.addEventListener('click',()=>{
      btn.classList.toggle('active');
      const p=btn.nextElementSibling;
      p.style.display = p.style.display==='block' ? 'none':'block';
    });
  });
}

/* etiqueta Hoy */
function renderToday(){
  const d=dateOnly(new Date());
  document.getElementById('todayLabel').textContent =
    `Hoy es ${d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
}

/* añadir hábito */
function addHabit(){
  const name=habitInput.value.trim();
  if(!name){alert('Escribe un hábito');return;}
  createCard(name,descInput.value.trim(),todayISO(),[]);
  habitInput.value=''; descInput.value='';
  saveHabits();
}

/* crear tarjeta */
function createCard(name,desc,iso,completed=[]){
  const card=document.createElement('div');card.className='habit';

  const h3=document.createElement('h3');h3.textContent=name;
  h3.ondblclick=()=>inlineEdit(h3,'Nuevo nombre');

  const edit=button('Editar','edit-btn',()=>inlineEdit(h3,'Nuevo nombre'));
  const del =button('Eliminar','delete-btn',()=>{card.remove();saveHabits();});

  const header=document.createElement('header');header.append(h3,edit,del);
  card.appendChild(header);

  if(desc){
    const p=document.createElement('p');p.className='desc';p.textContent=desc;
    p.ondblclick=()=>inlineEdit(p,'Editar descripción');
    card.appendChild(p);
  }

  /* grid 40 */
  const grid=document.createElement('div');grid.className='days';
  const startDate=fromISO(iso);
  const daysPassed=Math.floor((dateOnly(new Date())-startDate)/86400000);
  for(let i=1;i<=40;i++){
    const cell=document.createElement('span');
    cell.className='day'+(i===21?' milestone':''); cell.textContent=i;
    if(i-1>daysPassed) cell.classList.add('disabled');
    if(completed.includes(i)) cell.classList.add('completed');
    cell.onclick=()=>{if(cell.classList.contains('disabled'))return;
                      cell.classList.toggle('completed'); saveHabits();};
    grid.appendChild(cell);
  }
  card.appendChild(grid);

  const [y,m,d]=iso.split('-');
  const start=document.createElement('p');
  start.dataset.iso=iso;
  start.textContent=`Comenzado el ${d}/${m}/${y}`;
  start.style.cssText='font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(start);

  list.prepend(card);
}

function button(txt,cls,fn){
  const b=document.createElement('button');
  b.className=cls;b.textContent=txt;b.addEventListener('click',fn);return b;
}
function inlineEdit(el,msg){
  const v=prompt(msg,el.textContent);
  if(v&&v.trim()){el.textContent=v.trim();saveHabits();}
}

/* guardar en Firestore */
async function saveHabits(){
  if(!uid) return;
  const arr=[];
  document.querySelectorAll('.habit').forEach(card=>{
    const name=card.querySelector('h3').textContent;
    const descE=card.querySelector('.desc'); const desc=descE?descE.textContent:'';
    const iso =card.querySelector('p').dataset.iso;
    const completed=[];
    card.querySelectorAll('.day.completed').forEach(c=>completed.push(+c.textContent));
    arr.push({name,desc,isoStart:iso,completed});
  });
  await db.collection('users').doc(uid).set({ habits: arr });
}

/* cargar de Firestore */
async function loadHabits(){
  const doc = await db.collection('users').doc(uid).get();
  if(!doc.exists) return;
  const arr = doc.data().habits || [];
  arr.forEach(h=>createCard(
    h.name,
    h.desc,
    h.isoStart,
    Array.isArray(h.completed)?h.completed:[]
  ));
}
