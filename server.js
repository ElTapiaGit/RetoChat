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
  secret: 'mi_secreto_seguro', // Cámbialo por algo más fuerte en producción
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 día
}));

// Servir archivos estáticos (como CSS) desde /public
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/imgs', express.static(path.join(__dirname, 'public/imgs'))); // si usas imágenes
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// Socket.io: Chat en tiempo real
io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

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
