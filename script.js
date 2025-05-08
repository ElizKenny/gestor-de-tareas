/******************************************************************
*  Firebase Auth + Firestore + gestor de hábitos 40 días
******************************************************************/
const db   = firebase.firestore();
const auth = firebase.auth();

/* ------------------ Modal / Tabs ------------------ */
const modal   = document.getElementById('modal');
const openBtn = document.getElementById('openModal');
const closeBtn= document.getElementById('closeModal');
openBtn.onclick = ()=>modal.classList.remove('hidden');
closeBtn.onclick= ()=>modal.classList.add('hidden');
window.onclick  = e=>{ if(e.target===modal) modal.classList.add('hidden'); };

/* Tabs */
const tabL = document.getElementById('tabLogin');
const tabR = document.getElementById('tabReg');
const paneL= document.getElementById('loginPane');
const paneR= document.getElementById('regPane');
tabL.onclick=()=>activateTab(true);
tabR.onclick=()=>activateTab(false);
function activateTab(login){
  tabL.classList.toggle('active',login);
  tabR.classList.toggle('active',!login);
  paneL.classList.toggle('hidden',!login);
  paneR.classList.toggle('hidden',login);
}

/* ------------------ Login + Registro ------------------ */
const msg  = document.getElementById('authMsg');

document.getElementById('loginBtn').onclick = async ()=>{
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value.trim();
  if(!email||!pass){ msg.textContent='Completa los datos'; return; }
  try{
    await auth.signInWithEmailAndPassword(email,pass);
  }catch(e){
    msg.textContent = traduceError(e.code);
  }
};

document.getElementById('regBtn').onclick = async ()=>{
  const email = document.getElementById('regEmail').value.trim();
  const pass  = document.getElementById('regPass').value.trim();
  if(!email||!pass){ msg.textContent='Completa los datos'; return; }
  try{
    await auth.createUserWithEmailAndPassword(email,pass);
  }catch(e){
    msg.textContent = traduceError(e.code);
  }
};

function traduceError(code){
  const map={
    'auth/email-already-in-use':'Ese correo ya está registrado.',
    'auth/weak-password':'La contraseña debe tener 6 caracteres mínimo.',
    'auth/invalid-credential':'Credenciales incorrectas.',
    'auth/invalid-email':'Correo no válido.'
  };
  return map[code] || code;
}

/* ------------------ Una vez logueado ------------------ */
auth.onAuthStateChanged(user=>{
  if(!user) return;
  modal.classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  document.querySelector('.hero').classList.add('hidden');
  uid = user.uid;
  initApp();
});

/* ------------------ Gestor de hábitos (igual que antes) ------------------ */
let uid, habitInput, descInput, list;
const pad = n=>n<10?'0'+n:n;
const dateOnly = d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const toISO = d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO = ()=>toISO(new Date());
const fromISO = iso=>{const[a,b,c]=iso.split('-').map(Number);return new Date(a,b-1,c);};

function initApp(){
  habitInput=document.getElementById('habitInput');
  descInput =document.getElementById('descInput');
  list      =document.getElementById('habitList');
  initAccordions();
  renderToday();
  loadHabits();
  document.getElementById('addHabitButton').onclick = addHabit;
}

function initAccordions(){
  document.querySelectorAll('.accordion').forEach(btn=>{
    btn.onclick=()=>{btn.classList.toggle('active');
      const p=btn.nextElementSibling;
      p.style.display=p.style.display==='block'?'none':'block';};
  });
}
function renderToday(){
  const d=dateOnly(new Date());
  document.getElementById('todayLabel').textContent =
    `Hoy es ${d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
}
function addHabit(){
  const n=habitInput.value.trim();
  if(!n){alert('Escribe un hábito');return;}
  createCard(n,descInput.value.trim(),todayISO(),[]);
  habitInput.value='';descInput.value='';
  saveHabits();
}
function createCard(name,desc,iso,completed=[]){
  const card=document.createElement('div');card.className='habit';
  const h3=document.createElement('h3');h3.textContent=name;
  h3.ondblclick=()=>edit(h3,'Nuevo nombre');
  const editB=btn('Editar','edit-btn',()=>edit(h3,'Nuevo nombre'));
  const delB =btn('Eliminar','delete-btn',()=>{card.remove();saveHabits();});
  const head=document.createElement('header');head.append(h3,editB,delB);
  card.appendChild(head);
  if(desc){
    const p=document.createElement('p');p.className='desc';p.textContent=desc;
    p.ondblclick=()=>edit(p,'Editar descripción');card.appendChild(p);}
  const grid=document.createElement('div');grid.className='days';
  const start=fromISO(iso);const dp=Math.floor((dateOnly(new Date())-start)/86400000);
  for(let i=1;i<=40;i++){
    const c=document.createElement('span');c.className='day'+(i===21?' milestone':'');c.textContent=i;
    if(i-1>dp) c.classList.add('disabled');
    if(completed.includes(i)) c.classList.add('completed');
    c.onclick=()=>{if(c.classList.contains('disabled'))return;
                   c.classList.toggle('completed');saveHabits();};
    grid.appendChild(c);}
  card.appendChild(grid);
  const [y,m,d]=iso.split('-');const s=document.createElement('p');
  s.dataset.iso=iso;s.textContent=`Comenzado el ${d}/${m}/${y}`;
  s.style.cssText='font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(s);list.prepend(card);
}
function btn(text,cls,fn){const b=document.createElement('button');
  b.className=cls;b.textContent=text;b.onclick=fn;return b;}
function edit(el,msg){const v=prompt(msg,el.textContent);
  if(v&&v.trim()){el.textContent=v.trim();saveHabits();}}
async function saveHabits(){
  const arr=[];document.querySelectorAll('.habit').forEach(card=>{
    const name=card.querySelector('h3').textContent;
    const descE=card.querySelector('.desc');const desc=descE?descE.textContent:'';
    const iso=card.querySelector('p').dataset.iso;
    const comp=[];card.querySelectorAll('.day.completed').forEach(c=>comp.push(+c.textContent));
    arr.push({name,desc,isoStart:iso,completed:comp});});
  await db.collection('users').doc(uid).set({habits:arr});
}
async function loadHabits(){
  const snap=await db.collection('users').doc(uid).get();
  if(!snap.exists) return;
  (snap.data().habits||[]).forEach(h=>createCard(
      h.name,h.desc,h.isoStart,Array.isArray(h.completed)?h.completed:[]));
}
