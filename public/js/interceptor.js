
const Interceptor = {
    verificar: function(texto, retoActual, inputElement) {
        
        // --- CASO 1: SOLO EMOJIS ---
        if (retoActual === 'SOLO_EMOJIS') {
            // Regex: Busca cualquier letra (a-z) o número (0-9)
            const contieneTextoProhibido = /[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚüÜ]/.test(texto);

            if (contieneTextoProhibido) {
                this.mostrarAlerta(inputElement, '¡Ups! El reto es solo Emojis. No uses letras ni números 🤫');
                return false; // Bloqueado
            }
        }

        // --- CASO 2: LIBRE (Tu reto de "Historia Favorita") ---
        // Aquí no hay restricciones técnicas, solo dejamos pasar el mensaje.
        if (retoActual === 'LIBRE') {
            return true; 
        }
        // Por defecto, si no reconocemos el reto, dejamos pasar el mensaje
        return true; // Aprobado
    },

    mostrarAlerta: function(input, mensaje) {
        // Usamos un alert nativo por ahora, pero podrías usar una librería como SweetAlert luego
        alert(mensaje);
        input.style.border = '2px solid red';
        input.style.backgroundColor = '#fff0f0'; // Un rojo muy suave de fondo
        setTimeout(() => {
            input.style.border = 'none';
            input.style.backgroundColor = 'white';
        }, 2000);
    },

    configurarPlaceholder: function(retoActual, input) {
        // Cambiamos el texto de ayuda según el reto
        if (retoActual === 'SOLO_EMOJIS') {
            input.placeholder = "🤫 Solo emojis (ej: 👋😂❤️)...";
            input.title = "No puedes escribir letras ni números";
        } 
        else if (retoActual === 'LIBRE') {
            input.placeholder = "Escribe tu mensaje aquí...";
            input.title = "Chat libre";
        }
        else {
            // Fallback por si acaso
            input.placeholder = "Escribe tu mensaje...";
        }
    }
};