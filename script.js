/******************************************************************
*  Firebase (compat) inicializado en <index.html> -----------------
******************************************************************/
const db   = firebase.firestore();
const auth = firebase.auth();

/******************************************************************
*  Variables globales de UI
******************************************************************/
let modal, openBtn, closeBtn;
let tabLogin, tabReg, paneLogin, paneReg, authMsg;
let loginEmail, loginPass, regEmail, regPass, loginBtn, regBtn;

let uid;                 // se asigna tras login
let habitInput, descInput, list;

/******************************************************************
*  Utilidades de fecha
******************************************************************/
const pad = n => (n < 10 ? '0' + n : '' + n);
const dateOnly = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => toISO(new Date());
const fromISO = iso => { const [y,m,d] = iso.split('-').map(Number); return new Date(y, m-1, d); };

/******************************************************************
*  DOM READY: capturar elementos y asignar listeners
******************************************************************/
document.addEventListener('DOMContentLoaded', () => {

  /* -------- Modal -------- */
  modal     = document.getElementById('modal');
  openBtn   = document.getElementById('openModal');
  closeBtn  = document.getElementById('closeModal');

  openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  window.addEventListener('click', e => { if(e.target === modal) modal.classList.add('hidden'); });

  /* -------- Tabs dentro del modal -------- */
  tabLogin   = document.getElementById('tabLogin');
  tabReg     = document.getElementById('tabReg');
  paneLogin  = document.getElementById('loginPane');
  paneReg    = document.getElementById('regPane');
  authMsg    = document.getElementById('authMsg');

  tabLogin.addEventListener('click', () => activateTab(true));
  tabReg.addEventListener('click',   () => activateTab(false));

  function activateTab(login){
    tabLogin.classList.toggle('active', login);
    tabReg.classList.toggle('active', !login);
    paneLogin.classList.toggle('hidden', !login);
    paneReg.classList.toggle('hidden',  login);
    authMsg.textContent = '';
  }

  /* -------- Inputs y botones de auth -------- */
  loginEmail = document.getElementById('loginEmail');
  loginPass  = document.getElementById('loginPass');
  regEmail   = document.getElementById('regEmail');
  regPass    = document.getElementById('regPass');
  loginBtn   = document.getElementById('loginBtn');
  regBtn     = document.getElementById('regBtn');

  loginBtn.addEventListener('click', login);
  regBtn.addEventListener('click', register);
});

/******************************************************************
*  Funciones de autenticación
******************************************************************/
function login(){
  const email = loginEmail.value.trim();
  const pass  = loginPass.value.trim();
  if(!email || !pass){ authMsg.textContent = 'Completa los datos'; return; }
  auth.signInWithEmailAndPassword(email, pass)
      .catch(e => authMsg.textContent = translateError(e.code));
}

function register(){
  const email = regEmail.value.trim();
  const pass  = regPass.value.trim();
  if(!email || !pass){ authMsg.textContent = 'Completa los datos'; return; }
  auth.createUserWithEmailAndPassword(email, pass)
      .catch(e => authMsg.textContent = translateError(e.code));
}

function translateError(code){
  const map = {
    'auth/email-already-in-use' : 'Ese correo ya está registrado.',
    'auth/weak-password'        : 'La contraseña debe tener mínimo 6 caracteres.',
    'auth/invalid-credential'   : 'Credenciales incorrectas.',
    'auth/invalid-email'        : 'Correo no válido.'
  };
  return map[code] || code;
}

/******************************************************************
*  Tras iniciar sesión
******************************************************************/
auth.onAuthStateChanged(user=>{
  if(!user) return;
  uid = user.uid;

  /* Ocultar hero + modal, mostrar app */
  modal.classList.add('hidden');
  document.querySelector('.hero').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');

  initApp();
});

/******************************************************************
*  Inicializar gestor de hábitos
******************************************************************/
function initApp(){
  habitInput = document.getElementById('habitInput');
  descInput  = document.getElementById('descInput');
  list       = document.getElementById('habitList');

  initAccordions();
  renderToday();
  loadHabits();

  document.getElementById('addHabitButton').addEventListener('click', addHabit);
}

/* ---------- Acordeones ---------- */
function initAccordions(){
  document.querySelectorAll('.accordion').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      btn.classList.toggle('active');
      const p = btn.nextElementSibling;
      p.style.display = p.style.display === 'block' ? 'none' : 'block';
    });
  });
}

/* ---------- Hoy ---------- */
function renderToday(){
  const d = dateOnly(new Date());
  document.getElementById('todayLabel').textContent =
    `Hoy es ${d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
}

/* ---------- Añadir hábito ---------- */
function addHabit(){
  const name = habitInput.value.trim();
  if(!name){ alert('Escribe un hábito'); return; }
  createCard(name, descInput.value.trim(), todayISO(), []);
  habitInput.value = ''; descInput.value = '';
  saveHabits();
}

/* ---------- Crear tarjeta ---------- */
function createCard(name, desc, isoStart, completed = []){
  const card = document.createElement('div'); card.className = 'habit';

  /* Cabecera */
  const h3 = document.createElement('h3'); h3.textContent = name;
  h3.ondblclick = () => inlineEdit(h3, 'Nuevo nombre');

  const editBtn = button('Editar','edit-btn', () => inlineEdit(h3,'Nuevo nombre'));
  const delBtn  = button('Eliminar','delete-btn', () => { card.remove(); saveHabits(); });

  const header = document.createElement('header');
  header.append(h3, editBtn, delBtn);
  card.appendChild(header);

  /* Descripción */
  if(desc){
    const p = document.createElement('p');
    p.className = 'desc'; p.textContent = desc;
    p.ondblclick = () => inlineEdit(p, 'Editar descripción');
    card.appendChild(p);
  }

  /* Grid 40 días */
  const grid = document.createElement('div'); grid.className = 'days';
  const startDate = fromISO(isoStart);
  const daysPassed = Math.floor((dateOnly(new Date()) - startDate) / 86400000);

  for(let i=1;i<=40;i++){
    const cell = document.createElement('span');
    cell.className = 'day' + (i===21 ? ' milestone' : '');
    cell.textContent = i;

    if(i-1 > daysPassed)         cell.classList.add('disabled');
    if(completed.includes(i))    cell.classList.add('completed');

    cell.addEventListener('click', ()=>{
      if(cell.classList.contains('disabled')) return;
      cell.classList.toggle('completed');
      saveHabits();
    });
    grid.appendChild(cell);
  }
  card.appendChild(grid);

  /* Fecha inicio */
  const [y,m,d] = isoStart.split('-');
  const startP = document.createElement('p');
  startP.dataset.iso = isoStart;
  startP.textContent = `Comenzado el ${d}/${m}/${y}`;
  startP.style.cssText = 'font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(startP);

  list.prepend(card);
}

function button(text, cls, fn){
  const b = document.createElement('button');
  b.className = cls; b.textContent = text; b.addEventListener('click', fn);
  return b;
}
function inlineEdit(el,msg){
  const v = prompt(msg, el.textContent);
  if(v && v.trim()){ el.textContent = v.trim(); saveHabits(); }
}

/******************************************************************
*  Guardar / Cargar hábitos en Firestore
******************************************************************/
async function saveHabits(){
  const arr = [];
  document.querySelectorAll('.habit').forEach(card=>{
    const name = card.querySelector('h3').textContent;
    const descE= card.querySelector('.desc');
    const desc = descE ? descE.textContent : '';
    const iso  = card.querySelector('p').dataset.iso;

    const completed = [];
    card.querySelectorAll('.day.completed').forEach(c=>completed.push(+c.textContent));

    arr.push({name,desc,isoStart:iso,completed});
  });
  await db.collection('users').doc(uid).set({ habits: arr });
}

async function loadHabits(){
  const snap = await db.collection('users').doc(uid).get();
  if(!snap.exists) return;
  const arr = snap.data().habits || [];
  arr.forEach(h => createCard(
    h.name,
    h.desc,
    h.isoStart,
    Array.isArray(h.completed) ? h.completed : []
  ));
}
