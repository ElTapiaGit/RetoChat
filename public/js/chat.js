
document.addEventListener('DOMContentLoaded', () => {
    // 1. Elementos del DOM
    const socket = io();
    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const chatContainer = document.getElementById('chat');
    // Elementos del Header para actualizar el reto
    const nombreRetoElem = document.getElementById('nombre-reto');
    const timerRetoElem = document.getElementById('timer-reto');
    // --- VARIABLES DINÁMICAS ---
    let retoActualCodigo = 'LIBRE'; // Empieza libre hasta que el server diga lo contrario
    let tiempoLocal = 0;
    let intervaloTimer = null;
    
    // Obtener parámetros
    const params = new URLSearchParams(window.location.search);
    const usuarioDestino = params.get('usuario') || 'Usuario';
    const infoBarTitulo = document.querySelector('.info-bar h1');
    if(infoBarTitulo) infoBarTitulo.textContent = `Chat con ${usuarioDestino}`;

    // ESCUCHAR AL GAME MASTER (Eventos Globales)
    // A. Al entrar, sincronizamos
    socket.on('estado_global_inicial', (data) => {
        actualizarEstadoReto(data.reto);
        iniciarTimer(data.tiempo);
    });
    // B. Cuando el reto cambia en vivo
    socket.on('cambio_de_reto', (data) => {
        // Efecto visual: parpadeo del header para avisar cambio
        document.querySelector('.info-bar').style.backgroundColor = '#444'; 
        setTimeout(() => document.querySelector('.info-bar').style.backgroundColor = '', 300);
        
        actualizarEstadoReto(data.reto);
        iniciarTimer(data.tiempo);
    });
    // C. Sincronización fina del reloj
    socket.on('sincronizar_tiempo', (tiempoServidor) => {
        if (Math.abs(tiempoLocal - tiempoServidor) > 2) tiempoLocal = tiempoServidor;
    });
    // --- Funciones para manejar el Reto UI ---

    function actualizarEstadoReto(reto) {
        retoActualCodigo = reto.codigo; // ¡Actualizamos la variable clave!
        
        // Actualizamos texto en el header
        nombreRetoElem.textContent = `${reto.descripcion}`;
        
        // Configurar placeholder del input según el reto (usando Interceptor)
        Interceptor.configurarPlaceholder(retoActualCodigo, input);

        // Feedback visual si es un reto restrictivo
        if (retoActualCodigo !== 'LIBRE') {
            nombreRetoElem.style.color = '#ff9800'; // Naranja
        } else {
            nombreRetoElem.style.color = '#fff'; // Blanco
        }
    }

    function iniciarTimer(segundos) {
        tiempoLocal = segundos;
        actualizarTimerVisual();
        if (intervaloTimer) clearInterval(intervaloTimer);
        
        intervaloTimer = setInterval(() => {
            if (tiempoLocal > 0) {
                tiempoLocal--;
                actualizarTimerVisual();
            } else {
                timerRetoElem.innerText = "Cambio...";
            }
        }, 1000);
    }

    function actualizarTimerVisual() {
        const minutos = Math.floor(tiempoLocal / 60);
        const segundos = tiempoLocal % 60;
        timerRetoElem.innerText = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
        
        // Poner rojo si queda poco tiempo
        if (tiempoLocal < 10) timerRetoElem.style.color = '#ff5252';
        else timerRetoElem.style.color = '#ffeb3b';
    }

    // --- LÓGICA DEL CHAT (Stickers, Mensajes, Etc)
    // --- INICIALIZAR STICKERS ---
    const stickerPanel = document.getElementById('sticker-panel');
    const btnStickers = document.getElementById('toggle-stickers');
    
    // Le pasamos al StickerManager: el panel, el botón, y QUÉ HACER cuando se elige uno
    StickerManager.init(stickerPanel, btnStickers, (urlSticker) => {
        enviarMensaje(urlSticker, 'sticker');
        btnStickers.classList.remove('active'); // Quitamos estilo activo al enviar
    });

    // --- LÓGICA DE USUARIO ---
    let myId = null;
    let usuarioOrigen = '';
    let usuarioOrigenId = 0;

    socket.on('connect', () => {
        myId = socket.id;
        console.log('Conectado ID:', socket.id);
    });

    async function obtenerUsuarioActual() {
        try {
            const res = await fetch('/api/usuario');
            if (res.ok) {
                const data = await res.json();
                usuarioOrigen = data.usuario;
                usuarioOrigenId = data.id;
                // Una vez tenemos el ID, cargamos historial
                cargarHistorial(); 
            }
        } catch (e) { console.error(e); }
    }
    obtenerUsuarioActual();

    // --- ENVÍO DE MENSAJES ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const texto = input.value.trim();
        if (texto === '') return;

        // 1. USAMOS EL INTERCEPTOR
        const esValido = Interceptor.verificar(texto, retoActualCodigo, input);
        
        if (esValido) {
            enviarMensaje(texto, 'texto');
            input.value = '';
        }
    });

    // Función centralizada para enviar
    function enviarMensaje(contenido, tipo) {
        socket.emit('chat message', {
            mensaje: contenido,
            usuarioOrigen,
            usuarioDestino,
            tipo: tipo
        });
    }

    // --- RECEPCIÓN DE MENSAJES ---
    socket.on('chat message', ({ msg, senderId, tipo }) => {
        renderizarMensaje(msg, senderId, tipo || 'texto');
    });

    function renderizarMensaje(msg, senderId, tipo) {
        const mensajeElem = document.createElement('div');
        // 'yo' se usa si quisiéramos renderizado optimista, aunque aquí dependemos del socket
        const esMio = (senderId === myId || senderId === 'yo' || senderId === socket.id); 
        // NOTA: Para el historial, senderId no será socket.id, será el ID de usuario.
        // La lógica de 'esMio' en historial se maneja aparte o hay que unificarla.
        // Para tiempo real, socket.id funciona.
        mensajeElem.classList.add(esMio ? 'mensaje-yo' : 'mensaje-otro');

        if (tipo === 'sticker') {
            mensajeElem.classList.add('sticker-msg');
            const img = document.createElement('img');
            img.src = msg;
            img.onload = scrollAlFondo;
            mensajeElem.appendChild(img);
        } else {
            mensajeElem.textContent = msg;
        }
        
        chatContainer.appendChild(mensajeElem);
        scrollAlFondo();
    }

    function scrollAlFondo() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // --- HISTORIAL ---
    async function cargarHistorial() {
        try {
            const res = await fetch(`/api/chat-historial?usuario=${usuarioDestino}`);
            const mensajes = await res.json();

            mensajes.forEach(({ mensaje, usuario_id, tipo }) => {
                const esMio = (usuario_id === usuarioOrigenId);
                const clase = esMio ? 'mensaje-yo' : 'mensaje-otro';
                const tipoFinal = tipo || 'texto';

                const mensajeElem = document.createElement('div');
                mensajeElem.classList.add(clase);

                if (tipoFinal === 'sticker') {
                    mensajeElem.classList.add('sticker-msg');
                    const img = document.createElement('img');
                    img.src = mensaje;
                    //Hacer scroll cada vez que una imagen termine de cargar
                    img.onload = scrollAlFondo;
                    mensajeElem.appendChild(img);
                } else {
                    mensajeElem.textContent = mensaje;
                }
                chatContainer.appendChild(mensajeElem);
            });
            // Dar un pequeño respiro al navegador antes de hacer el scroll final
            setTimeout(() => {
                scrollAlFondo();
            }, 100);
        } catch (error) { console.error('Error historial', error); }
    }
});