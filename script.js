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
