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

  const totalDays = 30;
  
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

    // Botón para eliminar el hábito
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-btn');
    deleteButton.textContent = 'Eliminar';
    deleteButton.addEventListener('click', () => {
      habitDiv.remove();
      saveHabits();  // Guardar después de eliminar un hábito
    });
    habitDiv.appendChild(deleteButton);

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

// Acordeón para mostrar/ocultar las ideas de hábitos
const accordion = document.querySelector('.accordion');
const panel = document.querySelector('.panel');

accordion.addEventListener('click', () => {
  panel.style.display = panel.style.display === "block" ? "none" : "block";
});
// Cerrar el acordeón al hacer clic fuera de él 