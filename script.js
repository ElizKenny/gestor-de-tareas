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
    // Marcar el día como completado o tachado (con un color de fondo)
    const clickedDate = info.dateStr;
    let dayEvent = calendar.getEventById(clickedDate);
    
    if (dayEvent) {
      // Si ya está marcado, eliminarlo
      dayEvent.remove();  
    } else {
      // Crear un evento (marca el día como "completado")
      calendar.addEvent({
        id: clickedDate, // Usamos la fecha como ID único
        title: 'Hábito Completado',
        start: clickedDate,
        allDay: true,
        color: '#2ecc71' // Verde para indicar completado
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
        color: '#f39c12' // Color para los hábitos
      });
    });
  }
}

// Cargar los hábitos al cargar la página
document.addEventListener('DOMContentLoaded', loadHabits);

// Desplegables para "¿Qué es el rastreo de hábitos?" y "Empieza tu viaje"
const accordions = document.querySelectorAll('.accordion');
accordions.forEach((accordion) => {
  accordion.addEventListener('click', function() {
    this.classList.toggle('active');
    const panel = this.nextElementSibling;
    if (panel.style.display === "block") {
      panel.style.display = "none";
    } else {
      panel.style.display = "block";
    }
  });
});
