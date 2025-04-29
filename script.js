const habitInput = document.getElementById('habitInput');
const addHabitButton = document.getElementById('addHabitButton');
const habitList = document.getElementById('habitList');

// Mostrar y ocultar los desplegables
document.querySelectorAll('.accordion').forEach((accordion) => {
  accordion.addEventListener('click', function() {
    this.classList.toggle('active');
    const panel = this.nextElementSibling;
    panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
  });
});

// Función para agregar un hábito
function addHabit() {
  const habitName = habitInput.value.trim();
  
  if (habitName) {
    const habitDiv = document.createElement('div');
    habitDiv.classList.add('habit');
    habitDiv.innerHTML = `
      <h3>${habitName}</h3>
      <div class="habit-dates">
        ${[...Array(21).keys()].map(i => {
          return `<span class="date" data-habit="${habitName}">${i + 1}</span>`;
        }).join('')}
      </div>
      <button class="delete-btn" onclick="deleteHabit('${habitName}')">Eliminar</button>
    `;
    habitList.appendChild(habitDiv);

    // Limpiar el campo de entrada
    habitInput.value = '';
    
    // Guardar el hábito en la memoria
    saveHabits();
  } else {
    alert('Por favor ingresa un nombre para el hábito');
  }
}

// Función para eliminar un hábito
function deleteHabit(habitName) {
  const habits = JSON.parse(localStorage.getItem('habits'));
  const updatedHabits = habits.filter(habit => habit.habitName !== habitName);
  localStorage.setItem('habits', JSON.stringify(updatedHabits));

  // Eliminar el hábito de la interfaz
  const habitDiv = document.querySelector(`.habit h3:contains('${habitName}')`).parentNode;
  habitList.removeChild(habitDiv);
}

// Evento para agregar el hábito cuando se hace clic en el botón
addHabitButton.addEventListener('click', addHabit);

// Función para guardar los hábitos en localStorage
function saveHabits() {
  const habits = [];
  const habitItems = document.querySelectorAll('.habit');
  habitItems.forEach(habitItem => {
    const habitName = habitItem.querySelector('h3').textContent;
    const dates = habitItem.querySelectorAll('.date');
    const completedDates = [];
    dates.forEach(date => {
      if (date.classList.contains('completed')) {
        completedDates.push(date.textContent);
      }
    });
    habits.push({ habitName, completedDates });
  });
  localStorage.setItem('habits', JSON.stringify(habits));
}

// Función para cargar los hábitos desde localStorage
function loadHabits() {
  const habits = JSON.parse(localStorage.getItem('habits'));
  if (habits) {
    habits.forEach(habit => {
      const habitDiv = document.createElement('div');
      habitDiv.classList.add('habit');
      habitDiv.innerHTML = `
        <h3>${habit.habitName}</h3>
        <div class="habit-dates">
          ${[...Array(21).keys()].map(i => {
            const completed = habit.completedDates.includes((i + 1).toString()) ? 'completed' : '';
            return `<span class="date ${completed}" data-habit="${habit.habitName}">${i + 1}</span>`;
          }).join('')}
        </div>
        <button class="delete-btn" onclick="deleteHabit('${habit.habitName}')">Eliminar</button>
      `;
      habitList.appendChild(habitDiv);
    });
  }
}

// Cargar hábitos al cargar la página
document.addEventListener('DOMContentLoaded', loadHabits);

// Marcar días como completados
habitList.addEventListener('click', function(event) {
  if (event.target.classList.contains('date')) {
    event.target.classList.toggle('completed');
    saveHabits();
  }
});
// Función para mostrar un mensaje de alerta
function showAlert(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'alert';
  alertBox.textContent = message;
  document.body.appendChild(alertBox);
  
  setTimeout(() => {
    alertBox.remove();
  }, 3000);
}