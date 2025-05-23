/******************************************************************
*  Firebase compat
******************************************************************/
const db   = window._habitsDB   || (window._habitsDB   = firebase.firestore());
const auth = window._habitsAuth || (window._habitsAuth = firebase.auth());
const LSKEY = 'habit40_backup';

/* ---------- Modal ---------- */
const modal = document.getElementById('modal');
document.getElementById('openModal').onclick  = () => modal.classList.remove('hidden');
document.getElementById('closeModal').onclick = () => modal.classList.add('hidden');
window.onclick = e => { if (e.target === modal) modal.classList.add('hidden'); };

/* ---------- Tabs ---------- */
const tabL    = document.getElementById('tabLogin');
const tabR    = document.getElementById('tabReg');
const paneL   = document.getElementById('loginPane');
const paneR   = document.getElementById('regPane');
const authMsg = document.getElementById('authMsg');
function actTab(login = true) {
  tabL.classList.toggle('active', login);
  tabR.classList.toggle('active', !login);
  paneL.classList.toggle('hidden', !login);
  paneR.classList.toggle('hidden', login);
  authMsg.textContent = '';
}
tabL.onclick = () => actTab(true);
tabR.onclick = () => actTab(false);

/* ---------- Login / Registro ---------- */
const loginEmail = document.getElementById('loginEmail');
const loginPass  = document.getElementById('loginPass');
const regName    = document.getElementById('regName');
const regEmail   = document.getElementById('regEmail');
const regPass    = document.getElementById('regPass');

document.getElementById('loginBtn').onclick = () => doAuth('login');
document.getElementById('regBtn').onclick   = () => doAuth('reg');

async function doAuth(mode) {
  const email = (mode === 'login' ? loginEmail : regEmail).value.trim();
  const pass  = (mode === 'login' ? loginPass  : regPass ).value.trim();
  if (!email || !pass) {
    authMsg.textContent = 'Completa los datos';
    return;
  }
  try {
    if (mode === 'login') {
      await auth.signInWithEmailAndPassword(email, pass);
    } else {
      const name = regName.value.trim();
      if (!name) {
        authMsg.textContent = 'Ingresa tu nombre';
        return;
      }
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      await cred.user.updateProfile({ displayName: name });
      await db.collection('users').doc(cred.user.uid)
              .set({ profile: { name }, habits: [] });
    }
  } catch (e) {
    authMsg.textContent = mapErr[e.code] || e.message;
  }
}
const mapErr = {
  'auth/email-already-in-use': 'Ese correo ya existe.',
  'auth/weak-password':         'Contraseña mínima 6 caracteres.',
  'auth/invalid-email':         'Correo no válido.',
  'auth/invalid-credential':    'Credenciales incorrectas.',
  'permission-denied':          'Sin permisos para guardar datos.'
};

/* ---------- Logout ---------- */
const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.onclick = async () => {
  logoutBtn.style.opacity = .5;
  await saveHabits();
  await auth.signOut();
  logoutBtn.style.opacity = 1;
};

/* ---------- Auth State Change ---------- */
let uid;
auth.onAuthStateChanged(async user => {
  if (user) {
    uid = user.uid;
    let name = user.displayName;
    if (!name) {
      const snap = await db.collection('users').doc(uid).get();
      name = (snap.exists && snap.data().profile)
             ? snap.data().profile.name
             : '';
    }
    document.getElementById('greeting').textContent = name ? `Hola, ${name}` : 'Hola';
    modal.classList.add('hidden');
    document.querySelector('.hero').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    initApp();
  } else {
    document.querySelector('.hero').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
    document.getElementById('habitList').innerHTML = '';
  }
});

/******************************************************************
*  Date Utilities
******************************************************************/
const pad = n => n < 10 ? '0' + n : '' + n;
const dateOnly = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO = () => toISO(new Date());
const fromISO = s => {
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/******************************************************************
*  Habit Tracker
******************************************************************/
let habitInput, descInput, list, addHabitButton;

function initApp() {
  habitInput     = document.getElementById('habitInput');
  descInput      = document.getElementById('descInput');
  list           = document.getElementById('habitList');
  addHabitButton = document.getElementById('addHabitButton');

  initAccordions();
  renderToday();
  loadHabits();

  addHabitButton.onclick = addHabit;
}

function initAccordions() {
  document.querySelectorAll('.accordion').forEach(btn => {
    btn.onclick = () => {
      btn.classList.toggle('active');
      const panel = btn.nextElementSibling;
      panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    };
  });
}

function renderToday() {
  const d = dateOnly(new Date());
  document.getElementById('todayLabel').textContent =
    `Hoy es ${d.toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })}`;
}

/* --- Add Habit --- */
async function addHabit() {
  const name = habitInput.value.trim();
  if (!name) { alert('Escribe un hábito'); return; }

  addHabitButton.disabled = true;
  createCard(name, descInput.value.trim(), todayISO(), []);
  habitInput.value = '';
  descInput.value  = '';

  try {
    await saveHabits();
  } catch (e) {
    alert(`⚠️ No se pudo guardar en la nube (code: ${e.code}).\nSe mantiene localmente.`);
  }

  addHabitButton.disabled = false;
}

/* --- Create Card con botón Unificado “Editar” --- */
function createCard(name, desc, iso, completed = []) {
  const card = document.createElement('div');
  card.className = 'habit';

  // Título
  const h3 = document.createElement('h3');
  h3.textContent = name;

  // Descripción
  let descP = null;
  if (desc) {
    descP = document.createElement('p');
    descP.className = 'desc';
    descP.textContent = desc;
  }

  // Header
  const header = document.createElement('header');
  header.appendChild(h3);

  // Botón Unificado Editar
  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.textContent = 'Editar';
  editBtn.onclick = () => {
    // Editar título
    const newTitle = prompt('Nuevo nombre:', h3.textContent);
    if (newTitle && newTitle.trim()) {
      h3.textContent = newTitle.trim();
    }
    // Asegurar párrafo de descripción
    if (!descP) {
      descP = document.createElement('p');
      descP.className = 'desc';
      descP.textContent = '';
      card.appendChild(descP);
    }
    // Editar descripción
    const newDesc = prompt('Nueva descripción:', descP.textContent);
    if (newDesc !== null) {
      descP.textContent = newDesc.trim();
    }
    saveHabits();
  };
  header.appendChild(editBtn);

  // Botón Eliminar
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Eliminar';
  deleteBtn.onclick = () => {
    card.remove();
    saveHabits();
  };
  header.appendChild(deleteBtn);

  card.appendChild(header);
  if (descP) card.appendChild(descP);

  // Grid de días
  const grid = document.createElement('div');
  grid.className = 'days';
  const start  = fromISO(iso);
  const passed = Math.floor((dateOnly(new Date()) - start) / 86400000);
  for (let i = 1; i <= 40; i++) {
    const cell = document.createElement('span');
    cell.className = 'day' + (i === 21 ? ' milestone' : '');
    cell.textContent = i;
    if (i - 1 > passed)       cell.classList.add('disabled');
    if (completed.includes(i)) cell.classList.add('completed');
    cell.onclick = () => {
      if (cell.classList.contains('disabled')) return;
      cell.classList.toggle('completed');
      saveHabits();
    };
    grid.appendChild(cell);
  }
  card.appendChild(grid);

  // Fecha de inicio
  const info = document.createElement('p');
  info.dataset.iso = iso;
  const [y,m,d] = iso.split('-');
  info.textContent = `Comenzado el ${d}/${m}/${y}`;
  info.style.cssText = 'font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(info);

  list.prepend(card);
}

/* --- Persist to Firestore (y localStorage si falla) --- */
async function saveHabits() {
  const arr = [];
  document.querySelectorAll('.habit').forEach(card => {
    const name  = card.querySelector('h3').textContent;
    const descE = card.querySelector('p.desc');
    const desc  = descE ? descE.textContent : '';
    const isoP  = card.querySelector('p[data-iso]');
    const iso   = isoP ? isoP.dataset.iso : '';
    const comp  = [];
    card.querySelectorAll('.day.completed').forEach(c => comp.push(+c.textContent));
    arr.push({ name, desc, isoStart: iso, completed: comp });
  });

  // Backup local
  localStorage.setItem(LSKEY, JSON.stringify(arr));

  try {
    // Guardar en Firestore
    await db.collection('users').doc(uid)
            .set({ profile: {}, habits: arr }, { merge: true });
    localStorage.removeItem(LSKEY);
  } catch (e) {
    console.error('Firestore saving failed:', e);
    throw e;
  }
}

/* --- Load from Firestore or local fallback --- */
async function loadHabits() {
  try {
    const snap = await db.collection('users').doc(uid).get();
    if (snap.exists && Array.isArray(snap.data().habits)) {
      snap.data().habits.forEach(h =>
        createCard(h.name, h.desc, h.isoStart,
                   Array.isArray(h.completed) ? h.completed : [])
      );
      return;
    }
  } catch (e) {
    console.warn('Firestore error, loading from localStorage →', e);
  }

  const raw = localStorage.getItem(LSKEY);
  if (raw) {
    try {
      JSON.parse(raw).forEach(h =>
        createCard(h.name, h.desc, h.isoStart,
                   Array.isArray(h.completed) ? h.completed : [])
      );
    } catch (e) {
      console.error('LocalStorage corrupto:', e);
    }
  }
}
