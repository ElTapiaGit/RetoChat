/* public/js/chat.js */

// --- INICIO DEL SCRIPT 1 ---
// Primero, obtenemos el usuario de la URL
const params = new URLSearchParams(window.location.search);
const usuarioDestino = params.get('usuario') || 'Usuario';
document.querySelector('.info-bar h1').textContent = `Chat con ${usuarioDestino}`;

// --- INICIO DEL SCRIPT 3 ---
// Ahora, como 'usuarioDestino' existe en este mismo script,
// el resto del código puede usarla sin problemas.
const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const chatContainer = document.getElementById('chat');

let myId = null;

socket.on('connect', () => {
    myId = socket.id;
    console.log('Conectado al servidor con ID:', socket.id);
});

socket.on('chat message', ({ msg, senderId }) => {
    const mensaje = document.createElement('div');
    if (senderId === myId) {
        mensaje.classList.add('mensaje-yo');
    } else {
        mensaje.classList.add('mensaje-otro');
    }
    mensaje.textContent = msg;
    chatContainer.appendChild(mensaje);
    chatContainer.scrollTop = chatContainer.scrollHeight;
});

let usuarioOrigen = '';
let usuarioOrigenId = 0;

async function obtenerUsuarioActual() {
    const res = await fetch('/api/usuario');
    if (res.ok) {
        const data = await res.json();
        usuarioOrigen = data.usuario;
        usuarioOrigenId = data.id;
    }
}
// Se ejecuta en paralelo (como en tu original)
obtenerUsuarioActual();

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = input.value.trim();
    if (texto !== '') {
        socket.emit('chat message', {
            mensaje: texto,
            usuarioOrigen,
            usuarioDestino, // <-- ¡Ahora 'usuarioDestino' SÍ existe en este ámbito!
        });
        input.value = '';
    }
});

async function cargarHistorial() {
    // Pequeña espera para solucionar la "carrera" de timing
    // Espera a que 'obtenerUsuarioActual' probablemente termine
    while (usuarioOrigenId === 0) {
        await new Promise(resolve => setTimeout(resolve, 50)); 
    }

    const res = await fetch(`/api/chat-historial?usuario=${usuarioDestino}`); // <-- ¡Ahora 'usuarioDestino' SÍ existe en este ámbito!
    const mensajes = await res.json();

    mensajes.forEach(({ mensaje, usuario_id }) => {
        const mensajeElem = document.createElement('div');
        mensajeElem.classList.add(usuario_id === usuarioOrigenId ? 'mensaje-yo' : 'mensaje-otro');
        mensajeElem.textContent = mensaje;
        chatContainer.appendChild(mensajeElem);
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
// Se ejecuta en paralelo (como en tu original)
cargarHistorial();