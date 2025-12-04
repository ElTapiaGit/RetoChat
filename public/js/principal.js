// Espera a que todo el contenido del DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    // para el script del nombre de usuario
    async function cargarNombreUsuario() {
        try {
        const res = await fetch('/api/usuario');
        if (!res.ok) throw new Error('No autorizado');
        const data = await res.json();
        const userName = document.createElement('span');
        userName.textContent = ` ${data.usuario}`;
        document.querySelector('.encabezado').appendChild(userName);
        } catch (err) {
        console.error(err);
        }
    }
    cargarNombreUsuario();

    //  Script para el modal de invitar amigo 
    const btnInvitar = document.querySelector('.acciones button:nth-child(3)');
    const modal = document.getElementById('modal-invitar');
    const cerrar = document.querySelector('.cerrar');
    
    // Verifica que los elementos existan antes de añadir listeners
    if (btnInvitar && modal && cerrar) {
        btnInvitar.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
    
        cerrar.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    
        // Cierra si el usuario hace clic fuera del modal
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
            modal.style.display = 'none';
            }
        });
    }

    /*/ script para cargar reto diario
    async function cargarRetoDiario() {
      try {
        const res = await fetch('/api/reto-diario');
        if (!res.ok) throw new Error('No se pudo cargar el reto');
        const data = await res.json();

        document.querySelector('.reto-container h1').textContent = data.titulo;
        document.querySelector('.reto-container p').innerHTML = data.descripcion;
        document.querySelector('.reto-container p + p').innerHTML = `<strong>Tiempo límite:</strong> ${data.tiempo_limite} minutos`;
      } catch (err) {
        console.error(err);
        // Evitamos usar alert() para errores
        console.error('Error al cargar el reto diario.');
      }
    }
    cargarRetoDiario();*/

    //script para el modal de buscar usuario
    const btnBuscar = document.querySelector('.acciones button:nth-child(1)');
    const modalBuscar = document.getElementById('modal-buscar');
    const cerrarBuscar = document.querySelector('.cerrar-buscar');
    const inputBusqueda = document.getElementById('input-busqueda');
    const resultadosBusqueda = document.getElementById('resultados-busqueda');

    if (btnBuscar && modalBuscar && cerrarBuscar && inputBusqueda && resultadosBusqueda) {
        btnBuscar.addEventListener('click', () => {
          modalBuscar.style.display = 'flex';
        });
    
        cerrarBuscar.addEventListener('click', () => {
          modalBuscar.style.display = 'none';
        });
        window.addEventListener('click', (e) => {
          if (e.target === modalBuscar) {
            modalBuscar.style.display = 'none';
          }
        });

        // Búsqueda
        inputBusqueda.addEventListener('input', async () => {
          const query = inputBusqueda.value.trim();
          resultadosBusqueda.innerHTML = '';
    
          if (query.length === 0) return;
    
          try {
            const res = await fetch(`/api/buscar-usuarios?q=${encodeURIComponent(query)}`);
            const data = await res.json();
    
            if (data.length === 0) {
              resultadosBusqueda.innerHTML = '<p>No hay resultados de búsqueda del usuario.</p>';
              return;
            }
    
            data.forEach(usuario => {
              const item = document.createElement('div');
              item.classList.add('resultado-item');
              item.innerHTML = `
                <img src="/imgs/user.png" alt="Perfil">
                <span class="nameuser">${usuario.usuario}</span>
              `;
              item.addEventListener('click', () => {
                window.location.href = `/chat?usuario=${encodeURIComponent(usuario.usuario)}`;
              });
              resultadosBusqueda.appendChild(item);
            });
          } catch (err) {
            console.error('Error al buscar:', err);
          }
        });
    }
});
