{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // Obtenci\'f3n de elementos del DOM\
const taskInput = document.getElementById('taskInput');\
const addTaskButton = document.getElementById('addTaskButton');\
const taskList = document.getElementById('taskList');\
\
// Funci\'f3n para crear una tarea en la lista\
function createTask(taskContent) \{\
  const task = document.createElement('div');\
  task.classList.add('task');\
  task.textContent = taskContent;\
\
  // Event listener para marcar como completada\
  task.addEventListener('click', () => \{\
    task.classList.toggle('completed');\
  \});\
\
  taskList.appendChild(task);\
\}\
\
// Agregar tarea al presionar el bot\'f3n\
addTaskButton.addEventListener('click', () => \{\
  const taskContent = taskInput.value.trim();\
  if (taskContent) \{\
    createTask(taskContent);\
    taskInput.value = ''; // Limpiar el campo de entrada\
  \} else \{\
    alert('Por favor ingresa una tarea');\
  \}\
\});\
}