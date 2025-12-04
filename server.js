const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./models/db'); // Ruta relativa a la bd a Postgresql

const app = express();
const server = createServer(app);
const io = new Server(server); 

app.set('view engine', 'ejs'); // Por defecto, EJS buscará los archivos en la carpeta /views

const PORT = 3000;

// Middleware para analizar formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  store: new pgSession({
    pool: pool, // Usa la conexión a PostgreSQL
    tableName: 'session' // Puedes cambiar el nombre si quieres
  }),
  secret: 'mi_secreto_seguro', // Cámbialo por algo más fuerte en produccion
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 día
}));

// Servir archivos estáticos (como CSS) desde /public
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/imgs', express.static(path.join(__dirname, 'public/imgs'))); // si usas imágenes
app.use('/js', express.static(path.join(__dirname, 'public/js')));

/// EVENTO GLOBAL
// estado global del servidor
let retoGlobal = {
    titulo: 'Iniciando sistema...',
    descripcion: 'Espere un momento',
    codigo: 'LIBRE' // Código interno para el interceptor
};
let tiempoRestante = 60;
// funcion para cambiar el reto (consulta sql)
async function seleccionarNuevoReto() {
    try  {
        //seleccionar un reto aleatorio
        const result = await pool.query('SELECT * FROM retos ORDER BY RANDOM() LIMIT 1');
        if (result.rows.length > 0) {
            const nuevoReto = result.rows[0];

            // AHORA ES MUCHO MÁS LIMPIO:
            // Usamos directamente la columna 'codigo' de la base de datos.
            // Si por alguna razón viene vacía, usamos 'LIBRE' por seguridad.
            const codigoDB = nuevoReto.codigo || 'LIBRE';

            retoGlobal = {
                titulo: nuevoReto.titulo,
                descripcion: nuevoReto.descripcion,
                codigo: codigoDB 
            };
            // 2. CORRECCIÓN CÁLCULO DE TIEMPO:
            // Aseguramos que sea número entero. Si falla, ponemos 5 min por defecto.
            const minutosDB = parseInt(nuevoReto.tiempo_limite);
            const minutosFinal = !isNaN(minutosDB) && minutosDB > 0 ? minutosDB : 5;
            
            tiempoRestante = minutosFinal * 60; 
            
            console.log(`>>> NUEVO RETO: "${retoGlobal.titulo}" | TIEMPO: ${minutosFinal} min (${tiempoRestante} seg) | CÓDIGO: ${retoGlobal.codigo}`);
            
            io.emit('cambio_de_reto', {
                reto: retoGlobal,
                tiempo: tiempoRestante
            });
        } else {
            console.log('⚠️ No hay retos en la BD. Usando modo libre');
            // fallback si la bd esta vacio
            retoGlobal = { titulo: 'Modo Libre', descripcion: 'Esperando retos...', codigo: 'LIBRE' };
            tiempoRestante = 60; // 1 minuto de espera
        }
    } catch (err) {
        console.error('Error al seleccionar nuevo reto:', err);
        // Fallback de seguridad para no romper el bucle
        tiempoRestante = 60;
    }
}
//inicializamos el primer reto al arrancar
seleccionarNuevoReto();
// CORAZON DEL JUEGO: Cronometro cada 1 segundo
setInterval(() => {
    if (tiempoRestante > 0) {
        tiempoRestante--;
        // Opcional: Para ahorrar ancho de banda, no enviamos el tiempo CADA segundo,
        // el cliente puede contarlo solo. Pero sincronizamos cada 10s por si acaso.
        if (tiempoRestante % 10 === 0) {
            io.emit('sincronizar_tiempo', tiempoRestante);
        }
    } else if (tiempoRestante === 0) {
        tiempoRestante = -1; // Bloqueamos para que no entre 2 veces
        console.log('>>> Tiempo agotado. Cambiando reto...');
        seleccionarNuevoReto();
    }
}, 1000);

// Socket.io: (Chat tiempo real + Sincronizacion)
io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);
    // SINCRONIZACION INMEDIATA: 
    // Cuando entra alguien, le mandamos el tiempo ACTUAL (asegurando que sea positivo)
    const tiempoSeguro = tiempoRestante > 0 ? tiempoRestante : 0;
    socket.emit('estado_global_inicial', {
        reto: retoGlobal,
        tiempo: tiempoRestante
    });
    //chat normal
    socket.on('chat message', async (data) => {
        // resivimos tipo, sino viene asumimos undefined
        const { mensaje, usuarioOrigen, usuarioDestino, tipo } = data;

        try{
            //guarda el mensaje en la bd
            await pool.query(`
                INSERT INTO mensajes_chat (usuario_id, destinatario_id, mensaje, tipo)
                VALUES (
                    (SELECT id FROM usuarios WHERE usuario = $1),
                    (SELECT id FROM usuarios WHERE usuario = $2),
                    $3,
                    $4
                )`,
                // Pasamos el valor. Si 'tipo' es null/undefined, guardamos 'texto'
                [usuarioOrigen, usuarioDestino, mensaje, tipo || 'texto']
            );

            console.log(`Mensaje guardado de ${usuarioOrigen} (${tipo || 'texto'}): ${mensaje}`);
        } catch (err) {
            console.error(`Error al guardar mensaje:`, err);
        }
        //reenvia el mensaje al chat
        io.emit('chat message', { 
            msg: mensaje, 
            senderId: socket.id,
            usuarioOrigen,
            usuarioDestino, 
            tipo: tipo || 'texto',
        });
    });

    socket.on('disconnect', () => {
        console.log('Un usuario se desconecto');
    });
});

// Rutas
const authRoutes = require('./routes/auth.routes');
app.use('/', authRoutes);
const pagesRoutes = require('./routes/pages.routes');
app.use('/', pagesRoutes);

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
