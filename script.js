/******************************************************************
* Firebase compat inicializado en index.html
******************************************************************/
const db   = firebase.firestore();
const auth = firebase.auth();

/******************************************************************
* Utilidades de fecha
******************************************************************/
const pad = n => (n < 10 ? '0' + n : '' + n);
const dateOnly = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO = () => toISO(new Date());
const fromISO = iso => { const [y,m,d]=iso.split('-').map(Number); return new Date(y,m-1,d); };

/******************************************************************
* Variables globales
******************************************************************/
let modal, openBtn, closeBtn;
let tabLogin, tabReg, paneLogin, paneReg, authMsg;
let loginEmail, loginPass, regEmail, regPass, loginBtn, regBtn;

let uid;
let habitInput, descInput, list;

/******************************************************************
* Puerta de entrada: setup()
******************************************************************/
function setup(){

  /* --- capturar elementos del modal --- */
  modal     = document.getElementById('modal');
  openBtn   = document.getElementById('openModal');
  closeBtn  = document.getElementById('closeModal');

  openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  window.addEventListener('click', e => { if(e.target === modal) modal.classList.add('hidden'); });

  /* --- tabs dentro del modal --- */
  tabLogin  = document.getElementById('tabLogin');
  tabReg    = document.getElementById('tabReg');
  paneLogin = document.getElementById('loginPane');
  paneReg   = document.getElementById('regPane');
  authMsg   = document.getElementById('authMsg');

  tabLogin.onclick = () => activateTab(true);
  tabReg.onclick   = () => activateTab(false);

  /* inputs / botones de auth */
  loginEmail = document.getElementById('loginEmail');
  loginPass  = document.getElementById('loginPass');
  regEmail   = document.getElementById('regEmail');
  regPass    = document.getElementById('regPass');
  loginBtn   = document.getElementById('loginBtn');
  regBtn     = document.getElementById('regBtn');

  loginBtn.onclick = login;
  regBtn.onclick   = register;

  /* escucha de Auth */
  auth.onAuthStateChanged(user=>{
    if(!user) return;
    uid = user.uid;
    modal.classList.add('hidden');
    document.querySelector('.hero').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    initApp();
  });
}

/******************************************************************
*  Tabs login / registro
******************************************************************/
function activateTab(login){
  tabLogin.classList.toggle('active', login);
  tabReg.classList.toggle('active', !login);
  paneLogin.classList.toggle('hidden', !login);
  paneReg.classList.toggle('hidden',  login);
  authMsg.textContent = '';
}

/******************************************************************
*  Funciones Auth
******************************************************************/
function login(){
  const email = loginEmail.value.trim();
  const pass  = loginPass.value.trim();
  if(!email||!pass){ authMsg.textContent='Completa los datos'; return; }
  auth.signInWithEmailAndPassword(email,pass)
      .catch(e=> authMsg.textContent = translateError(e.code));
}
function register(){
  const email = regEmail.value.trim();
  const pass  = regPass.value.trim();
  if(!email||!pass){ authMsg.textContent='Completa los datos'; return; }
  auth.createUserWithEmailAndPassword(email,pass)
      .catch(e=> authMsg.textContent = translateError(e.code));
}
function translateError(code){
  const map={
    'auth/email-already-in-use':'Ese correo ya está registrado.',
    'auth/weak-password':'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-credential':'Credenciales incorrectas.',
    'auth/invalid-email':'Correo no válido.'
  };
  return map[code]||code;
}

/******************************************************************
*  Gestor de hábitos
******************************************************************/
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
  const name=habitInput.value.trim();
  if(!name){alert('Escribe un hábito');return;}
  createCard(name,descInput.value.trim(),todayISO(),[]);
  habitInput.value=''; descInput.value='';
  saveHabits();
}
function createCard(name,desc,iso,completed=[]){
  const card=document.createElement('div');card.className='habit';
  const h3=document.createElement('h3');h3.textContent=name;
  h3.ondblclick=()=>editInline(h3,'Nuevo nombre');
  const editB=btn('Editar','edit-btn',()=>editInline(h3,'Nuevo nombre'));
  const delB =btn('Eliminar','delete-btn',()=>{card.remove();saveHabits();});
  const head=document.createElement('header');head.append(h3,editB,delB);
  card.appendChild(head);
  if(desc){
    const p=document.createElement('p');p.className='desc';p.textContent=desc;
    p.ondblclick=()=>editInline(p,'Editar descripción');card.appendChild(p);}
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
function btn(text,cls,fn){
  const b=document.createElement('button');
  b.className=cls;b.textContent=text;b.onclick=fn;return b;
}
function editInline(el,msg){
  const v=prompt(msg,el.textContent);
  if(v&&v.trim()){el.textContent=v.trim();saveHabits();}
}
async function saveHabits(){
  const arr=[];document.querySelectorAll('.habit').forEach(card=>{
    const name = card.querySelector('h3').textContent;
    const descE= card.querySelector('.desc'); const desc=descE?descE.textContent:'';
    const iso  = card.querySelector('p').dataset.iso;
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

/******************************************************************
*  Lanzar setup ahora mismo o en DOMContentLoaded
******************************************************************/
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', setup);
}else{
  setup();
}
