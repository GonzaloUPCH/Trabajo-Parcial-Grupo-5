// Carga de datos de localStorage
let citas = JSON.parse(localStorage.getItem("citas_clinica")) || [];
let pacientes = JSON.parse(localStorage.getItem("clinica_pacientes_modulo1")) || [];

// 1. Mapeo de prioridad (Pauta: Emergencia > Urgente > Rutina)
const PESO_PRIORIDAD = { "Emergencia": 1, "Urgente": 2, "Rutina": 3 };

document.addEventListener("DOMContentLoaded", () => {
    cargarFiltros();
    renderizarSalaEspera();
    
    document.getElementById("busqueda").addEventListener("input", renderizarSalaEspera);
    document.getElementById("filtro-especialidad").addEventListener("change", renderizarSalaEspera);
    document.getElementById("filtro-medico").addEventListener("change", renderizarSalaEspera);
});

function renderizarSalaEspera() {
    const tbody = document.getElementById("cuerpo-tabla-espera");
    const buscar = document.getElementById("busqueda").value.toLowerCase();
    const filtroEsp = document.getElementById("filtro-especialidad").value;
    const filtroMed = document.getElementById("filtro-medico").value;

    tbody.innerHTML = "";

    // FILTRADO Y ORDENAMIENTO (Regla: Prioridad igual -> El que llegó antes)
    let filtradas = citas.filter(cita => {
        const pMatch = cita.paciente.toLowerCase().includes(buscar) || cita.pacienteCod.includes(buscar);
        const eMatch = filtroEsp === "" || cita.especialidad === filtroEsp;
        const mMatch = filtroMed === "" || cita.medico === filtroMed;
        // No mostrar canceladas ni atendidas en esta lista de espera
        return pMatch && eMatch && mMatch && cita.estado !== "Cancelada" && cita.estado !== "Atendido";
    }).sort((a, b) => {
        if (PESO_PRIORIDAD[a.prioridad] !== PESO_PRIORIDAD[b.prioridad]) {
            return PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad];
        }
        return a.horaLlegada.localeCompare(b.horaLlegada);
    });

    filtradas.forEach(cita => {
        // Buscar alergias del paciente (Pauta)
        const pacInfo = pacientes.find(p => p.codigo === cita.pacienteCod);
        const alergias = pacInfo ? pacInfo.alergiasTexto.join(", ") : "Ninguna";

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>
                <strong>${cita.prioridad}</strong>
                ${cita.prioridad !== 'Rutina' ? `<br><small>Motivo: ${cita.justificacion}</small>` : ''}
            </td>
            <td>${cita.horaLlegada || 'No registrado'}</td>
            <td>
                ${cita.paciente}
                ${alergias !== "Ninguna" ? `<div class="alerta-alergia">⚠️ Alergias: ${alergias}</div>` : ''}
            </td>
            <td>${cita.medico}<br><small>${cita.especialidad}</small></td>
            <td><span class="badge ${cita.estado.toLowerCase().replace(" ", "")}">${cita.estado}</span></td>
            <td>${generarBotones(cita)}</td>
        `;
        tbody.appendChild(fila);
    });
}

function generarBotones(cita) {
    // Validaciones de la pauta (No atender citas canceladas, etc.)
    if (cita.estado === "Pendiente") {
        return `<button onclick="actualizarEstado(${cita.id}, 'En Espera')">Registrar Llegada</button>`;
    }
    if (cita.estado === "En Espera") {
        return `
            <button class="btn-atender" onclick="actualizarEstado(${cita.id}, 'En Atención')">Atender</button>
            <button class="btn-ausente" onclick="actualizarEstado(${cita.id}, 'No asistió')">No asistió</button>
        `;
    }
    if (cita.estado === "En Atención") {
        return `<button class="btn-finalizar" onclick="pasarAModulo4(${cita.id})">Finalizar Atención</button>`;
    }
    return "";
}

function actualizarEstado(id, nuevoEstado) {
    citas = citas.map(c => {
        if (c.id === id) {
            // Registrar hora de llegada si pasa a "En Espera" (Pauta)
            if (nuevoEstado === "En Espera") {
                c.horaLlegada = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
            return { ...c, estado: nuevoEstado };
        }
        return c;
    });
    localStorage.setItem("citas_clinica", JSON.stringify(citas));
    renderizarSalaEspera();
}

function pasarAModulo4(id) {
    // Solo permitir si el estado es 'En Atención'
    const cita = citas.find(c => c.id === id);
    if (cita.estado === "En Atención") {
        localStorage.setItem("cita_para_historial", JSON.stringify(cita));
        window.location.href = "modulo4.html";
    }
}

function cargarFiltros() {
    const selectEsp = document.getElementById("filtro-especialidad");
    const especialidades = [...new Set(citas.map(c => c.especialidad))];
    especialidades.forEach(e => {
        const opt = new Option(e, e);
        selectEsp.add(opt);
    });
}