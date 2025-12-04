const express = require('express');
const pool = require('../models/db');
const router = express.Router();
const { registrarUsuario } = require('../controllers/auth.controller');

router.post('/registro', registrarUsuario);

router.get('/logout', (req, res) => {
    // destruye la sesion de la base de datos y memoria
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.redirect('/principal'); // si falla, que se quede ahí
        }
        // borra la cookie del navegador
        res.clearCookie('connect.sid'); 
        // manda al login
        res.redirect('/');
    });
});

module.exports = router;
