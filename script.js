const habitInput = document.getElementById('habitInput');
const addHabitButton = document.getElementById('addHabitButton');
const habitList = document.getElementById('habitList');

// Función para crear un calendario para cada hábito
function createCalendar(habitName) {
  const calendarDiv = document.createElement('div');
  calendarDiv.classList.add('calendar');
  calendarDiv.setAttribute('id', `calendar-${habitName}`);

  const totalDays = 30; // Número de días (puedes cambiarlo)
  
  for (let day = 1; day <= totalDays; day++) {
    const dayElement = document.createElement('div');
    dayElement.classList.add('day');
    dayElement.textContent = day;

    dayElement.addEventListener('click', () => {
      dayElement.classList.toggle('completed');
    });

    calendarDiv.appendChild(dayElement);
  }

  return calendarDiv;
}

// Función para agregar un nuevo hábito
function addHabit() {
  const habitName = habitInput.value.trim();
  
  if (habitName) {
    // Crear el contenedor del hábito
    const habitDiv = document.createElement('div');
    habitDiv.classList.add('habit');
    habitDiv.innerHTML = `<h3>${habitName}</h3>`;

    // Crear el calendario para el hábito
    const calendar = createCalendar(habitName);

    habitDiv.appendChild(calendar);
    habitList.appendChild(habitDiv);

    // Limpiar el campo de entrada
    habitInput.value = '';
  } else {
    alert('Por favor ingresa un nombre para el hábito');
  }
}

// Evento para agregar el hábito cuando se hace clic en el botón
addHabitButton.addEventListener('click', addHabit);
