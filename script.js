/******************************************************************
*  Firebase compat
******************************************************************/
var db   = window._habitsDB   || (window._habitsDB   = firebase.firestore());
var auth = window._habitsAuth || (window._habitsAuth = firebase.auth());

/* ---------- Modal ---------- */
const modal=document.getElementById('modal');
document.getElementById('openModal').onclick=()=>modal.classList.remove('hidden');
document.getElementById('closeModal').onclick=()=>modal.classList.add('hidden');
window.onclick=e=>{if(e.target===modal)modal.classList.add('hidden');};

/* ---------- Tabs ---------- */
const tabL=document.getElementById('tabLogin');
const tabR=document.getElementById('tabReg');
const paneL=document.getElementById('loginPane');
const paneR=document.getElementById('regPane');
const authMsg=document.getElementById('authMsg');
function actTab(login){
  tabL.classList.toggle('active',login);
  tabR.classList.toggle('active',!login);
  paneL.classList.toggle('hidden',!login);
  paneR.classList.toggle('hidden', login);
  authMsg.textContent='';
}
tabL.onclick=()=>actTab(true);
tabR.onclick=()=>actTab(false);

/* ---------- Login / Registro ---------- */
const loginEmail=document.getElementById('loginEmail');
const loginPass =document.getElementById('loginPass');
const regName  =document.getElementById('regName');
const regEmail =document.getElementById('regEmail');
const regPass  =document.getElementById('regPass');

document.getElementById('loginBtn').onclick = ()=>doAuth('login');
document.getElementById('regBtn').onclick   = ()=>doAuth('reg');

async function doAuth(mode){
  const email = (mode==='login'?loginEmail:regEmail).value.trim();
  const pass  = (mode==='login'?loginPass :regPass ).value.trim();
  if(!email||!pass){authMsg.textContent='Completa los datos';return;}

  try{
    if(mode==='login'){
      await auth.signInWithEmailAndPassword(email,pass);
    }else{
      const name = regName.value.trim();
      if(!name){authMsg.textContent='Ingresa tu nombre';return;}
      const cred = await auth.createUserWithEmailAndPassword(email,pass);
      await cred.user.updateProfile({displayName:name});
      await db.collection('users').doc(cred.user.uid).set({ profile:{name}, habits:[] });
    }
  }catch(e){authMsg.textContent=mapErr[e.code]||e.code;}
}
const mapErr={
  'auth/email-already-in-use':'Ese correo ya existe.',
  'auth/weak-password':'Contraseña mínima 6 caracteres.',
  'auth/invalid-email':'Correo no válido.',
  'auth/invalid-credential':'Credenciales incorrectas.'
};

/* ---------- Logout ---------- */
const logoutBtn=document.getElementById('logoutBtn');
logoutBtn.onclick = async ()=>{
  logoutBtn.style.opacity=.5;
  await saveHabits();
  await auth.signOut();
  logoutBtn.style.opacity=1;
};

/* ---------- Cambio de estado ---------- */
let uid;
auth.onAuthStateChanged(async user=>{
  if(user){
    uid=user.uid;
    // buscar nombre en displayName o Firestore
    let name=user.displayName;
    if(!name){
      const snap=await db.collection('users').doc(uid).get();
      name = snap.exists && snap.data().profile ? snap.data().profile.name : '';
    }
    document.getElementById('greeting').textContent = name ? `Hola, ${name}` : 'Hola';
    modal.classList.add('hidden');
    document.querySelector('.hero').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    initApp();
  }else{
    document.querySelector('.hero').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
    document.getElementById('habitList').innerHTML='';
  }
});

/******************************************************************
*  Utilidades de fecha
******************************************************************/
const pad=n=>n<10?'0'+n:n;
const dateOnly=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const toISO=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO=()=>toISO(new Date());
const fromISO=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c);};

/******************************************************************
*  Gestor de hábitos
******************************************************************/
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
  const header=document.createElement('header');
  header.appendChild(h3);
  header.appendChild(btn('Editar','edit-btn',()=>inlineEdit(h3,'Nuevo nombre')));
  header.appendChild(btn('Eliminar','delete-btn',()=>{card.remove();saveHabits();}));
  card.appendChild(header);
  if(desc){
    const p=document.createElement('p');p.className='desc';p.textContent=desc;
    p.ondblclick=()=>inlineEdit(p,'Editar descripción');
    card.appendChild(p);
  }
  const grid=document.createElement('div');grid.className='days';
  const start=fromISO(iso);const passed=Math.floor((dateOnly(new Date())-start)/86400000);
  for(let i=1;i<=40;i++){
    const c=document.createElement('span');
    c.className='day'+(i===21?' milestone':'');c.textContent=i;
    if(i-1>passed) c.classList.add('disabled');
    if(completed.includes(i)) c.classList.add('completed');
    c.onclick=()=>{if(c.classList.contains('disabled'))return;
                   c.classList.toggle('completed');saveHabits();};
    grid.appendChild(c);
  }
  card.appendChild(grid);
  const info=document.createElement('p');
  info.dataset.iso=iso;
  const [y,m,d]=iso.split('-');
  info.textContent=`Comenzado el ${d}/${m}/${y}`;
  info.style.cssText='font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(info);
  list.prepend(card);
}
function btn(t,c,f){const b=document.createElement('button');b.className=c;b.textContent=t;b.onclick=f;return b;}
function inlineEdit(el,msg){const v=prompt(msg,el.textContent);
  if(v&&v.trim()){el.textContent=v.trim();saveHabits();}}

async function saveHabits(){
  const arr=[];document.querySelectorAll('.habit').forEach(card=>{
    const name=card.querySelector('h3').textContent;
    const descE=card.querySelector('.desc');const desc=descE?descE.textContent:'';
    const iso=card.querySelector('p').dataset.iso;
    const comp=[];card.querySelectorAll('.day.completed').forEach(c=>comp.push(+c.textContent));
    arr.push({name,desc,isoStart:iso,completed:comp});
  });
  await db.collection('users').doc(uid).set({profile:{},habits:arr},{merge:true});
}

async function loadHabits(){
  const snap=await db.collection('users').doc(uid).get();
  if(!snap.exists) return;
  (snap.data().habits||[]).forEach(h=>createCard(
    h.name,h.desc,h.isoStart,Array.isArray(h.completed)?h.completed:[]));
}
