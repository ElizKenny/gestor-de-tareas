/******************************************************************
*  Firebase compat ya inicializado en index.html
******************************************************************/
const db   = firebase.firestore();
const auth = firebase.auth();

/******************************************************************
*  MODAL — abrir / cerrar
******************************************************************/
const modal    = document.getElementById('modal');       // <div id="modal">
const openBtn  = document.getElementById('openModal');   // <button id="openModal">
const closeBtn = document.getElementById('closeModal');  // <span id="closeModal">

if (!modal || !openBtn || !closeBtn){
  console.error('❌  Verifica IDs: modal / openModal / closeModal');
} else {
  openBtn.onclick  = () => modal.classList.remove('hidden');
  closeBtn.onclick = () => modal.classList.add('hidden');
  window.onclick   = e => { if (e.target === modal) modal.classList.add('hidden'); };
}

/******************************************************************
*  TABS Login / Registro
******************************************************************/
const tabLogin   = document.getElementById('tabLogin');
const tabReg     = document.getElementById('tabReg');
const paneLogin  = document.getElementById('loginPane');
const paneReg    = document.getElementById('regPane');
const authMsg    = document.getElementById('authMsg');

function activateTab(login=true){
  tabLogin.classList.toggle('active', login);
  tabReg.classList.toggle('active', !login);
  paneLogin.classList.toggle('hidden', !login);
  paneReg.classList.toggle('hidden',  login);
  authMsg.textContent = '';
}
tabLogin.onclick = () => activateTab(true);
tabReg.onclick   = () => activateTab(false);

/******************************************************************
*  Login / Registro
******************************************************************/
const loginEmail = document.getElementById('loginEmail');
const loginPass  = document.getElementById('loginPass');
const regEmail   = document.getElementById('regEmail');
const regPass    = document.getElementById('regPass');

document.getElementById('loginBtn').onclick = async ()=>{
  const e = loginEmail.value.trim(), p = loginPass.value.trim();
  if(!e || !p){ authMsg.textContent = 'Completa los datos'; return; }
  try{
    await auth.signInWithEmailAndPassword(e, p);
  }catch(err){
    authMsg.textContent = translateError(err.code);
  }
};

document.getElementById('regBtn').onclick = async ()=>{
  const e = regEmail.value.trim(), p = regPass.value.trim();
  if(!e || !p){ authMsg.textContent = 'Completa los datos'; return; }
  try{
    await auth.createUserWithEmailAndPassword(e, p);
  }catch(err){
    authMsg.textContent = translateError(err.code);
  }
};

function translateError(code){
  const map = {
    'auth/email-already-in-use':'Ese correo ya existe.',
    'auth/weak-password':'Contraseña mínima 6 caracteres.',
    'auth/invalid-email':'Correo no válido.',
    'auth/invalid-credential':'Credenciales incorrectas.'
  };
  return map[code] || code;
}

/******************************************************************
*  Tras autenticación
******************************************************************/
let uid;                // se asigna al entrar
auth.onAuthStateChanged(user=>{
  if(!user) return;
  uid = user.uid;
  modal.classList.add('hidden');
  document.querySelector('.hero').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  initApp();
});

/******************************************************************
*  Utilidades de fecha
******************************************************************/
const pad = n => n<10 ? '0'+n : ''+n;
const dateOnly = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO = () => toISO(new Date());
const fromISO = iso => { const [y,m,d] = iso.split('-').map(Number); return new Date(y,m-1,d); };

/******************************************************************
*  Gestor de hábitos
******************************************************************/
let habitInput, descInput, list;

function initApp(){
  habitInput = document.getElementById('habitInput');
  descInput  = document.getElementById('descInput');
  list       = document.getElementById('habitList');

  initAccordions();
  renderToday();
  loadHabits();

  document.getElementById('addHabitButton').onclick = addHabit;
}

/* --- acordeones --- */
function initAccordions(){
  document.querySelectorAll('.accordion').forEach(btn=>{
    btn.onclick = () => {
      btn.classList.toggle('active');
      const p = btn.nextElementSibling;
      p.style.display = p.style.display==='block' ? 'none' : 'block';
    };
  });
}
/* --- etiqueta “Hoy” --- */
function renderToday(){
  const d = dateOnly(new Date());
  document.getElementById('todayLabel').textContent =
    `Hoy es ${d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
}
/* --- añadir hábito --- */
function addHabit(){
  const name = habitInput.value.trim();
  if(!name){ alert('Escribe un hábito'); return; }
  createCard(name, descInput.value.trim(), todayISO(), []);
  habitInput.value=''; descInput.value='';
  saveHabits();
}
/* --- crear tarjeta --- */
function createCard(name, desc, isoStart, completed=[]){
  const card=document.createElement('div'); card.className='habit';

  const h3=document.createElement('h3'); h3.textContent=name;
  h3.ondblclick = () => editInline(h3,'Nuevo nombre');

  const editB = makeBtn('Editar','edit-btn', ()=>editInline(h3,'Nuevo nombre'));
  const delB  = makeBtn('Eliminar','delete-btn',()=>{card.remove();saveHabits();});

  const header=document.createElement('header'); header.append(h3,editB,delB);
  card.appendChild(header);

  if(desc){
    const p=document.createElement('p'); p.className='desc'; p.textContent=desc;
    p.ondblclick = () => editInline(p,'Editar descripción');
    card.appendChild(p);
  }

  /* grid 40 */
  const grid=document.createElement('div'); grid.className='days';
  const start=fromISO(isoStart);
  const daysPassed=Math.floor((dateOnly(new Date())-start)/86400000);
  for(let i=1;i<=40;i++){
    const cell=document.createElement('span');
    cell.className='day'+(i===21?' milestone':'');
    cell.textContent=i;
    if(i-1>daysPassed) cell.classList.add('disabled');
    if(completed.includes(i)) cell.classList.add('completed');
    cell.onclick = ()=>{ if(cell.classList.contains('disabled')) return;
                         cell.classList.toggle('completed'); saveHabits(); };
    grid.appendChild(cell);
  }
  card.appendChild(grid);

  const [y,m,d]=isoStart.split('-');
  const startP=document.createElement('p');
  startP.dataset.iso = isoStart;
  startP.textContent = `Comenzado el ${d}/${m}/${y}`;
  startP.style.cssText='font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(startP);

  list.prepend(card);
}
/* --- helpers --- */
function makeBtn(txt,cls,fn){
  const b=document.createElement('button');
  b.className=cls; b.textContent=txt; b.onclick=fn; return b;
}
function editInline(el,msg){
  const v=prompt(msg, el.textContent);
  if(v && v.trim()){ el.textContent=v.trim(); saveHabits(); }
}

/******************************************************************
*  Guardar / cargar hábitos en Firestore
******************************************************************/
async function saveHabits(){
  const arr=[];
  document.querySelectorAll('.habit').forEach(card=>{
    const name=card.querySelector('h3').textContent;
    const descE=card.querySelector('.desc');
    const desc=descE?descE.textContent:'';
    const iso=card.querySelector('p').dataset.iso;
    const comp=[];
    card.querySelectorAll('.day.completed').forEach(c=>comp.push(+c.textContent));
    arr.push({name,desc,isoStart:iso,completed:comp});
  });
  await db.collection('users').doc(uid).set({habits:arr});
}

async function loadHabits(){
  const snap = await db.collection('users').doc(uid).get();
  if(!snap.exists) return;
  (snap.data().habits || []).forEach(h=>createCard(
    h.name,h.desc,h.isoStart,Array.isArray(h.completed)?h.completed:[]));
}
