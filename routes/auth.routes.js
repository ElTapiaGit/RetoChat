const express = require('express');
const pool = require('../models/db');
const router = express.Router();
const { registrarUsuario } = require('../controllers/auth.controller');

router.post('/registro', registrarUsuario);

module.exports = router;
