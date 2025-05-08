/********************************************************************
 *  Gestor de hábitos 40 días + Firebase (Auth & Firestore compat)
 ********************************************************************/
const STORAGE_KEY = 'habit40';     // usado como fallback local

/* ---------- Utils fecha ---------- */
const pad = n => n<10 ? '0'+n : ''+n;
const dateOnly = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO = () => toISO(new Date());
const fromISO = iso => {
  const [y,m,day] = iso.split('-').map(Number);
  return new Date(y, m-1, day);
};

/* ---------- refs (asignados tras login) ---------- */
let habitInput, descInput, list, uid;

/* ---------- login / registro ---------- */
document.getElementById('loginBtn').onclick = async ()=>{
  const e = email.value.trim();
  const p = pass.value.trim();
  if(!e || !p){ alert('Completa el correo y la contraseña'); return; }

  try{
    await auth.signInWithEmailAndPassword(e,p);
  }catch(err){
    if(err.code === 'auth/user-not-found'){
      await auth.createUserWithEmailAndPassword(e,p);
    }else{
      return alert(err.message);
    }
  }
};

auth.onAuthStateChanged(user=>{
  if(!user) return;                // aún no ha iniciado
  uid = user.uid;                  // establecemos uid global
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('appBox').style.display   = 'block';
  initApp();                       // ⬅️ monta todo
});

/* ---------- inicializar app de hábitos ---------- */
function initApp(){
  habitInput = document.getElementById('habitInput');
  descInput  = document.getElementById('descInput');
  list       = document.getElementById('habitList');

  initAccordions();
  renderToday();
  loadHabits();

  document.getElementById('addHabitButton').addEventListener('click', addHabit);
}

/* ---------- acordeones ---------- */
function initAccordions(){
  document.querySelectorAll('.accordion').forEach(btn=>{
    btn.addEventListener('click',()=>{
      btn.classList.toggle('active');
      const p=btn.nextElementSibling;
      p.style.display = p.style.display==='block' ? 'none':'block';
    });
  });
}

/* ---------- hoy ---------- */
function renderToday(){
  const d=dateOnly(new Date());
  document.getElementById('todayLabel').textContent =
    `Hoy es ${d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
}

/* ---------- CRUD ---------- */
function addHabit(){
  const name = habitInput.value.trim();
  if(!name){ alert('Escribe un hábito'); return; }

  createCard(name, descInput.value.trim(), todayISO(), []);
  habitInput.value=''; descInput.value='';
  saveHabits();
}

function createCard(name, desc, isoStart, completed = []){
  const card=document.createElement('div'); card.className='habit';

  /* cabecera */
  const h3=document.createElement('h3'); h3.textContent=name;
  h3.ondblclick=()=>inlineEdit(h3,'Nuevo nombre');

  const edit=btn('Editar','edit-btn',()=>inlineEdit(h3,'Nuevo nombre'));
  const del =btn('Eliminar','delete-btn',()=>{ card.remove(); saveHabits(); });

  const head=document.createElement('header');
  head.append(h3,edit,del); card.appendChild(head);

  /* descripción */
  if(desc){
    const p=document.createElement('p');
    p.className='desc'; p.textContent=desc;
    p.ondblclick=()=>inlineEdit(p,'Editar descripción');
    card.appendChild(p);
  }

  /* grid 40 */
  const grid=document.createElement('div'); grid.className='days';
  const startDate=fromISO(isoStart);
  const daysPassed=Math.floor((dateOnly(new Date()) - startDate)/86400000);

  for(let i=1;i<=40;i++){
    const c=document.createElement('span');
    c.className='day'+(i===21?' milestone':'');
    c.textContent=i;
    if(i-1>daysPassed)             c.classList.add('disabled');
    if(completed.includes(i))      c.classList.add('completed');

    c.onclick=()=>{
      if(c.classList.contains('disabled')) return;
      c.classList.toggle('completed');
      saveHabits();
    };
    grid.appendChild(c);
  }
  card.appendChild(grid);

  /* fecha inicio */
  const [y,m,d] = isoStart.split('-');
  const startP=document.createElement('p');
  startP.dataset.iso=isoStart;
  startP.textContent = `Comenzado el ${d}/${m}/${y}`;
  startP.style.cssText='font-size:.75rem;color:#666;margin-top:8px';
  card.appendChild(startP);

  list.prepend(card);
}

function btn(text,cls,fn){
  const b=document.createElement('button');
  b.textContent=text; b.className=cls;
  b.addEventListener('click',fn);
  return b;
}
function inlineEdit(el,msg){
  const v=prompt(msg,el.textContent);
  if(v && v.trim()){ el.textContent=v.trim(); saveHabits(); }
}

/* ---------- persistencia en Firestore ---------- */
async function saveHabits(){
  const arr=[];
  document.querySelectorAll('.habit').forEach(card=>{
    const name = card.querySelector('h3').textContent;
    const descE= card.querySelector('.desc');
    const desc = descE ? descE.textContent : '';
    const iso  = card.querySelector('p').dataset.iso;
    const completed=[];
    card.querySelectorAll('.day.completed')
        .forEach(c=>completed.push(+c.textContent));
    arr.push({name, desc, isoStart: iso, completed});
  });

  // guarda en Firestore 👇
  await db.collection('users').doc(uid).set({ habits: arr })
        .catch(err=>console.error('Error guardando',err));

  // fallback local (opcional)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

async function loadHabits(){
  // intenta Firestore
  let arr=[];
  try{
    const snap = await db.collection('users').doc(uid).get();
    if(snap.exists()) arr = snap.data().habits || [];
  }catch(err){
    console.warn('Firestore falla, uso localStorage',err);
  }
  // si Firestore vacío, usa local
  if(!arr.length){
    arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }
  arr.forEach(h => createCard(
    h.name,
    h.desc || '',
    h.isoStart,
    Array.isArray(h.completed)?h.completed:[]
  ));
}
