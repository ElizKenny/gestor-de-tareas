const habitInput = document.getElementById('habitInput');
const addHabitButton = document.getElementById('addHabitButton');
const habitList = document.getElementById('habitList');

// Cargar hábitos guardados
function loadHabits() {
  const savedHabits = JSON.parse(localStorage.getItem('habits')) || [];
  savedHabits.forEach(habit => {
    createHabit(habit.name, habit.days);
  });
}

// Guardar hábitos en el almacenamiento local
function saveHabits() {
  const habits = [];
  document.querySelectorAll('.habit').forEach(habitElement => {
    const habitName = habitElement.querySelector('h3').textContent;
    const completedDays = Array.from(habitElement.querySelectorAll('.day.completed')).map(day => parseInt(day.textContent));
    habits.push({ name: habitName, days: completedDays });
  });
  localStorage.setItem('habits', JSON.stringify(habits));
}

// Función para crear el calendario para cada hábito
function createCalendar(habitName, completedDays = []) {
  const calendarDiv = document.createElement('div');
  calendarDiv.classList.add('calendar');
  calendarDiv.setAttribute('id', `calendar-${habitName}`);

  const totalDays = 30;  // Número de días (puedes cambiarlo)
  
  for (let day = 1; day <= totalDays; day++) {
    const dayElement = document.createElement('div');
    dayElement.classList.add('day');
    dayElement.textContent = day;

    // Marcar los días completados al cargar
    if (completedDays.includes(day)) {
      dayElement.classList.add('completed');
    }

    dayElement.addEventListener('click', () => {
      dayElement.classList.toggle('completed');
      saveHabits();  // Guardar después de cada cambio
    });

    calendarDiv.appendChild(dayElement);
  }

  return calendarDiv;
}

// Función para agregar un nuevo hábito
function addHabit() {
  const habitName = habitInput.value.trim();
  
  if (habitName) {
    const habitDiv = document.createElement('div');
    habitDiv.classList.add('habit');
    habitDiv.innerHTML = `<h3>${habitName}</h3>`;

    // Crear el calendario para el hábito
    const calendar = createCalendar(habitName);
    habitDiv.appendChild(calendar);
    habitList.appendChild(habitDiv);

    // Limpiar el campo de entrada
    habitInput.value = '';
    saveHabits();  // Guardar los hábitos después de agregar uno nuevo
  } else {
    alert('Por favor ingresa un nombre para el hábito');
  }
}

// Evento para agregar el hábito cuando se hace clic en el botón
addHabitButton.addEventListener('click', addHabit);

// Cargar los hábitos cuando se carga la página
window.onload = loadHabits;

// Pedir permiso para notificaciones
if (Notification.permission !== 'granted') {
  Notification.requestPermission();
}

// Función para enviar notificación
function sendNotification(habitName) {
  if (Notification.permission === 'granted') {
    new Notification(`No olvides tu hábito: ${habitName}`);
  }
}

// Revisar si algún hábito no se completó al final del día (esto puede ser al final de la jornada)
function checkForIncompleteHabits() {
  const habits = JSON.parse(localStorage.getItem('habits')) || [];
  habits.forEach(habit => {
    if (habit.days.length === 0) {
      sendNotification(habit.name);  // Enviar notificación si el hábito no tiene días completados
    }
  });
}

// Ejecutar la comprobación de hábitos a las 10:00 PM (por ejemplo)
setInterval(() => {
  const currentTime = new Date();
  if (currentTime.getHours() === 22 && currentTime.getMinutes() === 0) {
    checkForIncompleteHabits();
  }
}, 60000);  // Comprobar cada minuto
