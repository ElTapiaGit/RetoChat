const pool = require('../models/db');
const bcrypt = require('bcrypt'); // Para proteger la contraseña

const registrarUsuario = async (req, res) => {
  const { nombre_completo, correo, usuario, contrasena, confirmar_contrasena } = req.body;

  // Validar contraseñas iguales
  if (contrasena !== confirmar_contrasena) {
    return res.send('<script>alert("Las contraseñas no coinciden"); window.history.back();</script>');
  }

  try {
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insertar en la base de datos
    const result = await pool.query(
      'INSERT INTO usuarios (nombre_completo, correo, usuario, contrasena) VALUES ($1, $2, $3, $4) RETURNING id',
      [nombre_completo, correo, usuario, hashedPassword]
    );

    console.log('Usuario registrado con ID:', result.rows[0].id);
    res.send(`<script>alert("Usuario registrado exitosamente"); window.location.href = "/";</script>`);
  } catch (err) {
    console.error('Error registrando usuario:', err);
    let errorMessage = 'Error al registrar.';

    if (err.code === '23505') {
      errorMessage = 'Correo o usuario ya están registrados';
    }

    res.send(`<script>alert("${errorMessage}"); window.history.back();</script>`);
  }
};

module.exports = { registrarUsuario };
