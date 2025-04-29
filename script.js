const habitInput = document.getElementById('habitInput');
const addHabitButton = document.getElementById('addHabitButton');
const habitList = document.getElementById('habitList');

// Iniciar FullCalendar
const calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
  initialView: 'dayGridMonth', // Vista por defecto del calendario
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek,dayGridDay'
  },
  events: [], // Inicialmente sin eventos
  editable: true, // Permitir mover y cambiar eventos
  droppable: true, // Permitir arrastrar eventos
  dateClick: function(info) {
    // Aquí puedes agregar la funcionalidad de tachar el día
    let dayEvent = calendar.getEventById(info.dateStr);
    if (!dayEvent) {
      calendar.addEvent({
        title: 'Hábito',
        start: info.dateStr,
        allDay: true,
        color: '#f39c12'
      });
    }
  }
});

calendar.render(); // Renderiza el calendario en la página

// Función para crear el calendario para cada hábito
function createCalendarEvent(habitName) {
  // Mostrar el calendario
  document.getElementById('calendarContainer').style.display = 'block';

  // Aquí agregamos el evento al calendario de FullCalendar
  calendar.addEvent({
    title: habitName,
    start: new Date(), // Fecha actual
    allDay: true, // Evento todo el día
    color: '#f39c12' // Color para diferenciarlo
  });

  saveHabits(); // Guardar el hábito después de agregarlo
}

// Función para agregar un nuevo hábito
function addHabit() {
  const habitName = habitInput.value.trim();
  
  if (habitName) {
    createCalendarEvent(habitName);

    // Limpiar el campo de entrada
    habitInput.value = '';
  } else {
    alert('Por favor ingresa un nombre para el hábito');
  }
}

// Evento para agregar el hábito cuando se hace clic en el botón
addHabitButton.addEventListener('click', addHabit);
// Evento para agregar el hábito cuando se presiona Enter
habitInput.addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    addHabit();
  }
});
// Función para guardar los hábitos en el almacenamiento local
function saveHabits() {
  const habits = [];
  calendar.getEvents().forEach(event => {
    habits.push({
      title: event.title,
      start: event.start.toISOString(),
      allDay: event.allDay
    });
  });
  localStorage.setItem('habits', JSON.stringify(habits));
}
// Función para cargar los hábitos desde el almacenamiento local
function loadHabits() {
  const habits = JSON.parse(localStorage.getItem('habits'));
  if (habits) {
    habits.forEach(habit => {
      calendar.addEvent({
        title: habit.title,
        start: new Date(habit.start),
        allDay: habit.allDay,
        color: '#f39c12'
      });
    });
  }
}
// Cargar los hábitos al cargar la página
document.addEventListener('DOMContentLoaded', loadHabits);
// Función para eliminar un hábito
function deleteHabit(habitId) {
  const habit = calendar.getEventById(habitId);
  if (habit) {
    habit.remove();
    saveHabits(); // Guardar cambios después de eliminar
  }
}
// Evento para eliminar un hábito al hacer clic en el botón de eliminar
habitList.addEventListener('click', function(event) {
  if (event.target.classList.contains('deleteHabitButton')) {
    const habitId = event.target.dataset.habitId;
    deleteHabit(habitId);
  }
});
// Función para mostrar la lista de hábitos
function showHabitList() {
  const habits = JSON.parse(localStorage.getItem('habits'));
  habitList.innerHTML = ''; // Limpiar la lista antes de mostrarla
  if (habits) {
    habits.forEach((habit, index) => {
      const li = document.createElement('li');
      li.textContent = habit.title;
      li.innerHTML += `<button class="deleteHabitButton" data-habit-id="${index}">Eliminar</button>`;
      habitList.appendChild(li);
    });
  }
}
// Mostrar la lista de hábitos al cargar la página
document.addEventListener('DOMContentLoaded', showHabitList);
// Función para mostrar el calendario al hacer clic en el botón
document.getElementById('showCalendarButton').addEventListener('click', function() {
  document.getElementById('calendarContainer').style.display = 'block';
});

// Función para ocultar el calendario al hacer clic fuera de él
document.addEventListener('click', function(event) {
  const calendarContainer = document.getElementById('calendarContainer');
  if (!calendarContainer.contains(event.target) && event.target.id !== 'showCalendarButton') {
    calendarContainer.style.display = 'none';
  }
});
