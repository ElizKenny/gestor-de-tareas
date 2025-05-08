/******************************************************************
*  Firebase compat ya inicializado en index.html
******************************************************************/
var db   = window._habitsDB   || (window._habitsDB   = firebase.firestore());
var auth = window._habitsAuth || (window._habitsAuth = firebase.auth());

/* ---------- Modal ---------- */
const modal   = document.getElementById('modal');
document.getElementById('openModal').onclick  = ()=>modal.classList.remove('hidden');
document.getElementById('closeModal').onclick = ()=>modal.classList.add('hidden');
window.onclick = e=>{ if(e.target===modal) modal.classList.add('hidden'); };

/* ---------- Tabs ---------- */
function actTab(login){
  tabL.classList.toggle('active',login);
  tabR.classList.toggle('active',!login);
  paneL.classList.toggle('hidden',!login);
  paneR.classList.toggle('hidden', login);
  authMsg.textContent='';
}
const tabL=document.getElementById('tabLogin');
const tabR=document.getElementById('tabReg');
const paneL=document.getElementById('loginPane');
const paneR=document.getElementById('regPane');
const authMsg=document.getElementById('authMsg');
tabL.onclick=()=>actTab(true);
tabR.onclick=()=>actTab(false);

/* ---------- Login / Registro ---------- */
document.getElementById('loginBtn').onclick=()=>doAuth('login');
document.getElementById('regBtn').onclick  =()=>doAuth('reg');

async function doAuth(mode){
  const email = (mode==='login'?loginEmail:regEmail).value.trim();
  const pass  = (mode==='login'?loginPass:regPass).value.trim();
  if(!email||!pass){authMsg.textContent='Completa los datos';return;}
  try{
    if(mode==='login') await auth.signInWithEmailAndPassword(email,pass);
    else               await auth.createUserWithEmailAndPassword(email,pass);
  }catch(e){authMsg.textContent=mapErr[e.code]||e.code;}
}
const loginEmail=document.getElementById('loginEmail');
const loginPass =document.getElementById('loginPass');
const regEmail  =document.getElementById('regEmail');
const regPass   =document.getElementById('regPass');
const mapErr={
  'auth/email-already-in-use':'Ese correo ya existe.',
  'auth/weak-password':'Contraseña mínima 6 caracteres.',
  'auth/invalid-email':'Correo no válido.',
  'auth/invalid-credential':'Credenciales incorrectas.'
};

/* ---------- Logout ---------- */
document.getElementById('logoutBtn').onclick = ()=>auth.signOut();

/* ---------- Después de login ---------- */
let uid;
auth.onAuthStateChanged(user=>{
  if(!user){ /* volvió a login */ location.reload(); return; }
  uid=user.uid;
  modal.classList.add('hidden');
  document.querySelector('.hero').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  initApp();
});

/* ---------- Utilidades de fecha ---------- */
const pad=n=>n<10?'0'+n:n;
const dateOnly=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const toISO=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO=()=>toISO(new Date());
const fromISO=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c);};

/* ---------- Gestor de hábitos ---------- */
let habitInput,descInput,list;
function initApp(){
  habitInput=document.getElementById('habitInput');
  descInput =document.getElementById('descInput');
  list      =document.getElementById('habitList');
  initAccordions(); renderToday(); loadHabits();
  document.getElementById('addHabitButton').onclick=addHabit;
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
  document.getElementById('todayLabel').textContent=
    `Hoy es ${d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
}
function addHabit(){
  const name=habitInput.value.trim();
  if(!name){alert('Escribe un hábito');return;}
  createCard(name,descInput.value.trim(),todayISO(),[]);
  habitInput.value='';descInput.value='';saveHabits();
}
function createCard(name,desc,iso,completed=[]){
  const card=document.createElement('div');card.className='habit';
  const h3=document.createElement('h3');h3.textContent=name;
  h3.ondblclick=()=>inlineEdit(h3,'Nuevo nombre');
  const edit=btn('Editar','edit-btn',()=>inlineEdit(h3,'Nuevo nombre'));
  const del =btn('Eliminar','delete-btn',()=>{card.remove();saveHabits();});
  card.append(header(h3,edit,del));
  if(desc){
    const p=document.createElement('p');p.className='desc';p.textContent=desc;
    p.ondblclick=()=>inlineEdit(p,'Editar descripción');card.appendChild(p);}
  const g=document.createElement('div');g.className='days';
  const start=fromISO(iso);const dp=Math.floor((dateOnly(new Date())-start)/86400000);
  for(let i=1;i<=40;i++){const c=document.createElement('span');
    c.className='day'+(i===21?' milestone':'');c.textContent=i;
    if(i-1>dp)c.classList.add('disabled');
    if(completed.includes(i))c.classList.add('completed');
    c.onclick=()=>{if(c.classList.contains('disabled'))return;
      c.classList.toggle('completed');saveHabits();};
    g.appendChild(c);}card.appendChild(g);
  const [y,m,d]=iso.split('-');const info=document.createElement('p');
  info.dataset.iso=iso;info.textContent=`Comenzado el ${d}/${m}/${y}`;
  info.style.cssText='font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(info); list.prepend(card);
}
function header(...els){const h=document.createElement('header');els.forEach(e=>h.appendChild(e));return h;}
function btn(t,c,f){const b=document.createElement('button');b.className=c;b.textContent=t;b.onclick=f;return b;}
function inlineEdit(el,msg){const v=prompt(msg,el.textContent);if(v&&v.trim()){el.textContent=v.trim();saveHabits();}}
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
