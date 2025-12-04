/* public/js/evento-global.js */

document.addEventListener('DOMContentLoaded', () => {
    // Iniciamos la conexión Socket solo para este módulo
    const socket = io();

    // Elementos del DOM específicos del RETO
    const tituloElem = document.getElementById('reto-titulo');
    const descElem = document.getElementById('reto-descripcion');
    const timerElem = document.getElementById('reto-timer');
    const badgeElem = document.getElementById('reto-badge');
    
    let tiempoLocal = 0;
    let intervaloLocal = null;

    // --- 1. CONEXIÓN INICIAL ---
    socket.on('estado_global_inicial', (data) => {
        // console.log('📡 Sincronizado:', data);
        actualizarInterfaz(data.reto);
        sincronizarReloj(data.tiempo);
    });

    // --- 2. CAMBIO DE RETO ---
    socket.on('cambio_de_reto', (data) => {
        // console.log('🔄 Cambio de juego:', data);
        
        // Efecto visual de parpadeo en el contenedor
        const container = document.querySelector('.reto-container');
        if(container) {
            container.style.transition = 'opacity 0.3s';
            container.style.opacity = '0.5';
            setTimeout(() => container.style.opacity = '1', 300);
        }

        actualizarInterfaz(data.reto);
        sincronizarReloj(data.tiempo);
    });

    // --- 3. SINCRONIZACIÓN FINA ---
    socket.on('sincronizar_tiempo', (tiempoServidor) => {
        // Si nuestro reloj local se desvió más de 2 segundos, lo corregimos
        if (Math.abs(tiempoLocal - tiempoServidor) > 2) {
            tiempoLocal = tiempoServidor;
        }
    });

    // --- FUNCIONES INTERNAS ---

    function actualizarInterfaz(reto) {
        if(!tituloElem) return;

        // Texto principal
        tituloElem.innerText = reto.titulo; 
        descElem.innerText = reto.descripcion; 
        
        // Configuración del Badge (Etiqueta de estado)
        if (reto.codigo === 'SOLO_EMOJIS') {
            badgeElem.innerText = '🤫 Silencio';
            badgeElem.style.backgroundColor = '#ffb703'; // Amarillo
            badgeElem.style.color = '#000';
        } else {
            badgeElem.innerText = '🗣️ Libre';
            badgeElem.style.backgroundColor = '#83c5be'; // Verde agua
            badgeElem.style.color = '#000';
        }
        
        // Re-inyectamos el badge dentro del H1
        tituloElem.appendChild(badgeElem); 
    }

    function sincronizarReloj(segundos) {
        tiempoLocal = segundos;
        actualizarTimerVisual();

        // Reiniciamos el intervalo para evitar duplicados
        if (intervaloLocal) clearInterval(intervaloLocal);
        
        intervaloLocal = setInterval(() => {
            if (tiempoLocal > 0) {
                tiempoLocal--;
                actualizarTimerVisual();
            } else {
                if(timerElem) timerElem.innerText = "Cambiando...";
            }
        }, 1000);
    }

    function actualizarTimerVisual() {
        if(!timerElem) return;

        const minutos = Math.floor(tiempoLocal / 60);
        const segundos = tiempoLocal % 60;
        
        // Formato 00:00
        const minStr = minutos.toString().padStart(2, '0');
        const segStr = segundos.toString().padStart(2, '0');
        
        timerElem.innerText = `${minStr}:${segStr}`;
        
        // Poner en rojo si queda poco tiempo (< 10 seg)
        if (tiempoLocal < 10) {
            timerElem.style.color = '#e63946';
            timerElem.style.borderColor = '#e63946';
        } else {
            timerElem.style.color = '#e63946'; // Color base
            timerElem.style.borderColor = '#ddd';
        }
    }
});