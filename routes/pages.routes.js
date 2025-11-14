const express = require('express');
//const path = require('path');
const pool = require('../models/db');
const router = express.Router();
const bcrypt = require('bcrypt');

// Rutas de páginas
router.get('/', (req, res) => {
    //res.sendFile(path.join(__dirname, '../views', 'login.html'));
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { usuario, contrasena } = req.body;
    console.log(`Usuario: ${usuario}, Contraseña: ${contrasena}`);
    // Aquí va la lógica de autenticación real con PostgreSQL
    try{
        //Buscar usuario
        const result = await pool.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(contrasena, user.contrasena)) {
            req.session.userId = user.id; // Guarda el ID en la sesión
            req.session.usuario = user.usuario;
            res.redirect('/principal');
        } else {
            res.send(`<script>alert('Credenciales incorrectas'); window.location.href = '/';</script>`);
        }

        //Autenticacion exitosa
        //res.sendFile(path.join(__dirname, '../views', 'principal.html'));
    } catch (error) {
        console.error('Error al inicar sesion:', error);
        res.status(500).send('Error interno al iniciar sesion');
    }
});

router.get('/registro', (req, res) => {
    //res.sendFile(path.join(__dirname, '../views', 'registro.html'));
    res.render('registro');
});

/*router.post('/registro', async (req, res) => {
    const { nombre_completo, correo, usuario, contrasena, confirmar_contrasena } = req.body;
    
    if (contrasena !== confirmar_contrasena) {
        return res.send('<h3>Las contraseñas no coinciden</h3>');
    }
    
    try {
        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        
        // Insertar en la base de datos
        await pool.query(
        'INSERT INTO usuarios (nombre_completo, correo, usuario, contrasena) VALUES ($1, $2, $3, $4)',
        [nombre_completo, correo, usuario, hashedPassword]
        );

        res.send(`<h3>Gracias por registrarte, ${usuario}</h3>`);
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).send('<h3>Ocurrió un error al registrar el usuario.</h3>');
    }
});*/

router.get('/principal', (req, res) => {
    // Asegúrate de que el usuario esté logueado antes de renderizar
    if (!req.session.userId) {
        return res.redirect('/');
    }
    res.render('principal', { currentPage: 'principal' });
});
router.get('/api/reto-diario', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM retos ORDER BY fecha_creacion DESC LIMIT 1');
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'No hay retos aún' });
        }
    } catch (err) {
        console.error('Error al obtener el reto diario:', err);
        res.status(500).json({ error: 'Error al obtener el reto' });
    }
});

router.get('/api/usuario', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'No autorizado' });

    try {
        const result = await pool.query('SELECT usuario FROM usuarios WHERE id = $1', [req.session.userId]);
        res.json({
            usuario: result.rows[0]?.usuario,
            id: req.session.userId,
        });
    } catch (err) {
        console.error('Error al obtener usuario:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});
// API para búsqueda de usuarios
router.get('/api/buscar-usuarios', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);
  try {
    const result = await pool.query(
      'SELECT usuario FROM usuarios WHERE usuario ILIKE $1 LIMIT 10',
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error en búsqueda de usuarios:', err);
    res.status(500).json([]);
  }
});

router.get('/perfil', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    res.render('perfil', { currentPage: 'perfil' });
});
router.get('/api/perfil', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    
    try {
        const result = await pool.query(
            'SELECT nombre_completo, correo FROM usuarios WHERE id = $1',
            [req.session.userId]
        );
        const user = result.rows[0];
        res.json(user);
    } catch (err) {
        console.error('Error al cargar perfil:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

router.get('/chats', (req, res) => {
  if (!req.session.userId) {
        return res.redirect('/');
    }
    res.render('chats', { currentPage: 'chats' });
});
router.get('/api/chats', async (req, res) => {
  if (!req.session.userId) return res.status(401).json([]);

  console.log('ID del usuario logueado:', req.session.userId);

  try {
    const result = await pool.query(`
        SELECT u.id, u.nombre_completo, u.usuario,
        (
            SELECT mensaje
            FROM mensajes_chat
            WHERE 
                (usuario_id = $1 AND destinatario_id = u.id)
                OR 
                (usuario_id = u.id AND destinatario_id = $1)
            ORDER BY fecha_envio DESC
            LIMIT 1
        ) AS ultimo_mensaje
        FROM usuarios u
        WHERE u.id IN (
            SELECT DISTINCT 
            CASE 
                WHEN m.usuario_id = $1 THEN m.destinatario_id
                ELSE m.usuario_id
            END
            FROM mensajes_chat m
            WHERE m.usuario_id = $1 OR m.destinatario_id = $1
        )
    `, [req.session.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener chats:', error);
    res.status(500).json([]);
  }
});

router.get('/chat', (req, res) => {
    //const usuarioDestino = req.query.usuario || 'Desconocido';
    if (!req.session.userId) {
        return res.redirect('/');
    }
    // 'chat.ejs' no usa el footer, así que no pasamos la variable
    res.render('chat');
});

//API: Obtener historial de mensajes entre dos usuarios
router.get('/api/chat-historial', async (req, res) => {
    //const { usuarioDestino } = req.query;
    //const usuarioOrigen = req.session.usuario;
    const usuarioDestino = req.query.usuario; // Aquí viene el username del destinatario
    const usuarioOrigenId = req.session.userId; // Aquí debe ser el ID numérico del usuario logueado

    if (!usuarioDestino || !usuarioOrigenId) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    try {
        const result = await pool.query(`
            SELECT mensaje, fecha_envio, usuario_id, destinatario_id
            FROM mensajes_chat
            WHERE 
                (usuario_id = $1 AND destinatario_id = (SELECT id FROM usuarios WHERE usuario = $2))
                OR
                (usuario_id = (SELECT id FROM usuarios WHERE usuario = $2) AND destinatario_id = $1)
            ORDER BY fecha_envio ASC
        `, [usuarioOrigenId, usuarioDestino]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener historial:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

module.exports = router;
