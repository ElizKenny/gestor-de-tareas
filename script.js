/******************************************************************
*  Firebase compat
******************************************************************/
const db   = window._habitsDB   || (window._habitsDB   = firebase.firestore());
const auth = window._habitsAuth || (window._habitsAuth = firebase.auth());
const LSKEY = 'habit40_backup';

/* ---------- Modal ---------- */
const modal=document.getElementById('modal');
document.getElementById('openModal').onclick =()=>modal.classList.remove('hidden');
document.getElementById('closeModal').onclick=()=>modal.classList.add('hidden');
window.onclick=e=>{ if(e.target===modal) modal.classList.add('hidden'); };

/* ---------- Tabs ---------- */
const tabL=document.getElementById('tabLogin');
const tabR=document.getElementById('tabReg');
const paneL=document.getElementById('loginPane');
const paneR=document.getElementById('regPane');
const authMsg=document.getElementById('authMsg');
function actTab(login=true){
  tabL.classList.toggle('active', login);
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

document.getElementById('loginBtn').onclick =()=>doAuth('login');
document.getElementById('regBtn').onclick   =()=>doAuth('reg');

async function doAuth(mode){
  const email=(mode==='login'?loginEmail:regEmail).value.trim();
  const pass =(mode==='login'?loginPass :regPass ).value.trim();
  if(!email||!pass){authMsg.textContent='Completa los datos';return;}
  try{
    if(mode==='login'){
      await auth.signInWithEmailAndPassword(email,pass);
    }else{
      const name=regName.value.trim();
      if(!name){authMsg.textContent='Ingresa tu nombre';return;}
      const cred=await auth.createUserWithEmailAndPassword(email,pass);
      await cred.user.updateProfile({displayName:name});
      await db.collection('users').doc(cred.user.uid).set({profile:{name},habits:[]});
    }
  }catch(e){authMsg.textContent=mapErr[e.code]||e.code;}
}
const mapErr={
  'auth/email-already-in-use':'Ese correo ya existe.',
  'auth/weak-password':'Contraseña mínima 6 caracteres.',
  'auth/invalid-email':'Correo no válido.',
  'auth/invalid-credential':'Credenciales incorrectas.',
  'permission-denied':'Sin permisos para guardar datos.'
};

/* ---------- Logout ---------- */
const logoutBtn=document.getElementById('logoutBtn');
logoutBtn.onclick=async()=>{
  logoutBtn.style.opacity=.5;
  await saveHabits();          // intenta enviar a Firestore
  await auth.signOut();
  logoutBtn.style.opacity=1;
};

/* ---------- Cambio de estado ---------- */
let uid;
auth.onAuthStateChanged(async user=>{
  if(user){
    uid=user.uid;
    const name=user.displayName||await getNameFromDoc(uid);
    document.getElementById('greeting').textContent = name?`Hola, ${name}`:'Hola';
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
async function getNameFromDoc(uid){
  const snap=await db.collection('users').doc(uid).get();
  return snap.exists&&snap.data().profile?snap.data().profile.name:'';
}

/******************************************************************
*  Fechas
******************************************************************/
const pad=n=>n<10?'0'+n:n;
const dateOnly=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const toISO=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO=()=>toISO(new Date());
const fromISO=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c);};

/******************************************************************
*  Gestor hábitos
******************************************************************/
let habitInput,descInput,list,addHabitButton;
function initApp(){
  habitInput=document.getElementById('habitInput');
  descInput =document.getElementById('descInput');
  list      =document.getElementById('habitList');
  addHabitButton=document.getElementById('addHabitButton');

  initAccordions(); renderToday(); loadHabits();
  addHabitButton.onclick = addHabit;
}
function initAccordions(){
  document.querySelectorAll('.accordion').forEach(b=>{
    b.onclick=()=>{b.classList.toggle('active');
      const p=b.nextElementSibling;
      p.style.display=p.style.display==='block'?'none':'block';};
  });
}
function renderToday(){
  const d=dateOnly(new Date());
  document.getElementById('todayLabel').textContent=
    `Hoy es ${d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
}

/* ---------- Añadir hábito (await save) ---------- */
async function addHabit(){
  const n=habitInput.value.trim();
  if(!n){alert('Escribe un hábito');return;}

  addHabitButton.disabled=true;
  createCard(n,descInput.value.trim(),todayISO(),[]);
  habitInput.value='';descInput.value='';

  try{ await saveHabits(); }
  catch(e){alert('⚠️ No se pudo guardar en la nube. Se guardará localmente.');}
  addHabitButton.disabled=false;
}

/* ---------- Crear tarjeta ---------- */
function createCard(name,desc,iso,completed=[]){
  const card=document.createElement('div');card.className='habit';

  const h3=document.createElement('h3');h3.textContent=name;
  h3.ondblclick=()=>editInline(h3,'Nuevo nombre');

  let descP=null;
  if(desc){
    descP=document.createElement('p');descP.className='desc';descP.textContent=desc;
    descP.ondblclick=()=>editInline(descP,'Nueva descripción');
  }

  const header=document.createElement('header');
  header.append(h3,
    btn('Editar título','edit-btn',()=>editInline(h3,'Nuevo nombre')),
    btn('Editar desc.','edit-btn',()=>editInline(descP||createDesc(card),'Nueva descripción')),
    btn('Eliminar','delete-btn',()=>{card.remove();saveHabits();}));
  card.appendChild(header);
  if(descP) card.appendChild(descP);

  const grid=document.createElement('div');grid.className='days';
  const start=fromISO(iso),passed=Math.floor((dateOnly(new Date())-start)/86400000);
  for(let i=1;i<=40;i++){
    const c=document.createElement('span');
    c.className='day'+(i===21?' milestone':'');c.textContent=i;
    if(i-1>passed)c.classList.add('disabled');
    if(completed.includes(i))c.classList.add('completed');
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
function createDesc(card){
  const p=document.createElement('p');
  p.className='desc';p.textContent='';
  card.insertBefore(p,card.querySelector('.days'));
  return p;
}
function btn(t,c,f){const b=document.createElement('button');b.className=c;b.textContent=t;b.onclick=f;return b;}
function editInline(el,msg){
  if(!el) return;
  const v=prompt(msg,el.textContent);
  if(v&&v.trim()){el.textContent=v.trim();saveHabits();}
}

/******************************************************************
*  Guardado híbrido (Firestore + localStorage)
******************************************************************/
async function saveHabits(){
  const arr=[];
  document.querySelectorAll('.habit').forEach(card=>{
    const name=card.querySelector('h3').textContent;
    const descE=card.querySelector('.desc');const desc=descE?descE.textContent:'';
    const iso =card.querySelector('p').dataset.iso;
    const comp=[];card.querySelectorAll('.day.completed').forEach(c=>comp.push(+c.textContent));
    arr.push({name,desc,isoStart:iso,completed:comp});
  });

  /* 1) localStorage backup siempre */
  localStorage.setItem(LSKEY,JSON.stringify(arr));

  /* 2) intento nube */
  await db.collection('users').doc(uid).set({profile:{},habits:arr},{merge:true});
}

async function loadHabits(){
  /* Intento nube */
  try{
    const snap=await db.collection('users').doc(uid).get();
    if(snap.exists && snap.data().habits){
      snap.data().habits.forEach(h=>createCard(h.name,h.desc,h.isoStart,h.completed||[]));
      return;
    }
  }catch(e){console.warn('Firestore no disponible, uso backup local');}

  /* Fallback localStorage */
  const raw=localStorage.getItem(LSKEY);
  if(raw){
    try{ JSON.parse(raw).forEach(h=>createCard(h.name,h.desc,h.isoStart,h.completed||[])); }
    catch(e){ console.error('Backup corrupto'); }
  }
}
  