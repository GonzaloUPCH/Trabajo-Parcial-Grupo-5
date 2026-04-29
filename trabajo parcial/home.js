// Array para almacenar las citas (se carga del localStorage si existe)
let misCitas = JSON.parse(localStorage.getItem('citas_clinica')) || [];

// Al cargar la página, mostramos las citas iniciales
document.addEventListener('DOMContentLoaded', () => {
    renderizarCitas();
    
    // Escuchar el envío del formulario
    document.getElementById('appointment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        crearCita();
    });
});

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
}

function crearCita() {
    const especialidad = document.getElementById('especialidad').value;
    const fecha = document.getElementById('fecha-cita').value;
    const hora = document.getElementById('hora-cita').value;

    const nuevaCita = {
        id: Date.now(),
        especialidad,
        fecha,
        hora,
        estado: 'Pendiente'
    };

    misCitas.push(nuevaCita);
    localStorage.setItem('citas_clinica', JSON.stringify(misCitas));
    
    document.getElementById('appointment-form').reset();
    alert("Cita guardada correctamente");
    renderizarCitas();
    showSection('inicio');
}

function renderizarCitas() {
    const contenedorInicio = document.getElementById('lista-citas');
    const contenedorHistorial = document.getElementById('cuerpo-historial');
    
    contenedorInicio.innerHTML = '';
    contenedorHistorial.innerHTML = '';

    misCitas.forEach(cita => {
        // Render en el Inicio (Cards)
        contenedorInicio.innerHTML += `
            <div class="card-cita">
                <h3>${cita.especialidad}</h3>
                <p><i class="far fa-calendar"></i> ${cita.fecha}</p>
                <p><i class="far fa-clock"></i> ${cita.hora}</p>
                <small>Estado: <strong>${cita.estado}</strong></small>
            </div>
        `;

        // Render en el Historial (Tabla)
        contenedorHistorial.innerHTML += `
            <tr>
                <td>${cita.fecha}</td>
                <td>${cita.especialidad}</td>
                <td>${cita.estado}</td>
                <td><button onclick="eliminarCita(${cita.id})" style="color:red; cursor:pointer; border:none; background:none;">Eliminar</button></td>
            </tr>
        `;
    });
}

function eliminarCita(id) {
    if(confirm("¿Estás seguro de cancelar esta cita?")) {
        misCitas = misCitas.filter(cita => cita.id !== id);
        localStorage.setItem('citas_clinica', JSON.stringify(misCitas));
        renderizarCitas();
    }
}