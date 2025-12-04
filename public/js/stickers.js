/* public/js/stickers.js */

const StickerManager = {
    // Aquí pondrás todas las URLs que quieras, ¡sin ensuciar el código principal!
    listado: [
        "https://media.tenor.com/XNYXr6rL2o8AAAAM/duck.gif", 
        "https://media.tenor.com/WlJsOVX2lysAAAAi/cat-tongue-cat.gif", 
        "https://c.tenor.com/2ES7YijqoOwAAAAC/tenor.gif", 
        "https://c.tenor.com/fZG8H-WGgn4AAAAC/tenor.gif", 
        "https://c.tenor.com/hFvfHtYySfcAAAAC/tenor.gif", 
        "https://c.tenor.com/K_BiOjF3FicAAAAd/tenor.gif", 
        "https://c.tenor.com/VwNkC2ZJw5QAAAAd/tenor.gif", 
        "https://media.tenor.com/HWS38y1vUhQAAAAj/squad-military.gif", 
        "https://c.tenor.com/gAZOAL1Dh04AAAAd/tenor.gif", 
        "https://media.tenor.com/6-XDvqplnaQAAAAj/squad-team.gif",
    ],

    panel: null,
    callbackEnviar: null, // Función que se ejecutará al elegir un sticker

    // Configuración inicial
    init: function(panelElement, btnElement, onStickerSelect) {
        this.panel = panelElement;
        this.callbackEnviar = onStickerSelect;

        // Evento del botón toggle
        btnElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel();
            btnElement.classList.toggle('active');
        });

        // Evento cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (this.panel.classList.contains('mostrar') && 
                !this.panel.contains(e.target) && 
                !btnElement.contains(e.target)) {
                this.cerrarPanel(btnElement);
            }
        });
    },

    togglePanel: function() {
        this.panel.classList.toggle('mostrar');
        if (this.panel.classList.contains('mostrar')) {
            this.renderizar();
        }
    },

    cerrarPanel: function(btnElement) {
        this.panel.classList.remove('mostrar');
        if(btnElement) btnElement.classList.remove('active');
    },

    guardarReciente: function(url) {
        let recientes = JSON.parse(localStorage.getItem('stickers_recientes')) || [];
        recientes = recientes.filter(s => s !== url);
        recientes.unshift(url);
        if (recientes.length > 8) recientes.pop();
        localStorage.setItem('stickers_recientes', JSON.stringify(recientes));
    },

    seleccionar: function(url) {
        this.guardarReciente(url);
        this.panel.classList.remove('mostrar');
        // Llamamos a la función del chat principal para que envíe el mensaje
        if (this.callbackEnviar) {
            this.callbackEnviar(url);
        }
    },

    renderizar: function() {
        this.panel.innerHTML = '';
        const recientes = JSON.parse(localStorage.getItem('stickers_recientes')) || [];

        // 1. Sección Recientes
        if (recientes.length > 0) {
            this.crearSeccion('🕒 Recientes', recientes);
        }
        // 2. Sección Todos
        this.crearSeccion('🔥 Populares', this.listado);
    },

    crearSeccion: function(tituloTexto, urls) {
        const titulo = document.createElement('div');
        titulo.className = 'sticker-category';
        titulo.textContent = tituloTexto;
        this.panel.appendChild(titulo);

        const grid = document.createElement('div');
        grid.className = 'sticker-grid';

        urls.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.className = 'sticker-option';
            img.onclick = () => this.seleccionar(url); // Usamos arrow function para mantener el 'this'
            grid.appendChild(img);
        });
        this.panel.appendChild(grid);
    }
};