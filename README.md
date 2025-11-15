
# Reto-Web 

Proyecto Curios de un chat en tiempo real con retos y consignas para romper el hielo, diseñado para ayudar a personas introvertidas a conectar de forma divertida.

##  Descripción

`Reto-Web` no es solo un chat. Es una aplicación web diseñada para ayudar a personas introvertidas y curiosas a conectar de una manera divertida y estructurada.

La aplicación empareja a usuarios y les propone "retos" o consignas (ej. "Hablar solo con emojis", "Contar una historia usando 'gato', 'pato' y 'lobo'") para guiar la conversación y hacerla más amena.

## Características Principales

* **Chat en Tiempo Real:** Comunicación instantánea usando WebSockets (Socket.io).
* **Sistema de Retos:** Consignas diarias y temáticas para iniciar conversaciones.
* **Autenticación de Usuarios:** Registro e inicio de sesión seguros con `bcrypt`.
* **Manejo de Sesiones:** Sesiones persistentes guardadas en PostgreSQL.
* **Historial de Chat:** Las conversaciones se guardan en la base de datos.
* **Búsqueda de Usuarios:** Permite encontrar y empezar chats con otros usuarios.

## 🛠️ Tecnologías Usadas

### Backend
* **Node.js**
* **Express**
* **Socket.io:** Para la comunicación en tiempo real.
* **PostgreSQL:** Base de datos relacional.
* **connect-pg-simple:** Para el manejo de sesiones en la BD.
* **bcrypt:** Para hashear contraseñas.

### Frontend
* **HTML5**
* **CSS3**
* **JavaScript (Vanilla):** Para la lógica del cliente, peticiones (fetch) y la interactividad del DOM.

---

##  Puesta en Marcha Local

Sigue estos pasos para ejecutar el proyecto en tu máquina local.

### 1. Prerrequisitos

* Node.js (v16 o superior)
* PostgreSQL

### 2. Clonar el Repositorio

    ```bash
    git clone [https://github.com/ElTapiaGit/RetoChat.git](https://github.com/ElTapiaGit/RetoChat.git)
    cd reto-web

### 3. Crear `package.json`

Este proyecto asume que ya tienes un `package.json`. Si no lo tienes, créalo:

    ```bash
    npm init -y

### 4. Instalar Dependencias

Instala todas las dependencias que el proyecto necesita.

    ```bash
    npm install express socket.io pg express-session connect-pg-simple bcrypt dotenv ejs





