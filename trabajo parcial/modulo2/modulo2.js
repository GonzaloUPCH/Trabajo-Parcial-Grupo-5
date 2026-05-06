document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('appointment-form');
    const pacienteSelect = document.getElementById('paciente');
    const especialidadSelect = document.getElementById('especialidad');
    const medicoSelect = document.getElementById('medico');
    const prioridadSelect = document.getElementById('prioridad');
    const justificacionCont = document.getElementById('justificacion-container');
    const alertaAlergia = document.getElementById('alerta-alergia');
    const alergiaInfo = document.getElementById('alergia-info');

    const doctoresPorEspecialidad = {
        "Medicina General": ["Dr. Alberto Ruiz", "Dra. Elena Solís", "Dr. Ricardo Luna"],
        "Pediatría": ["Dra. Ana Torres", "Dr. Kevin Ramos", "Dra. Lucía Méndez"],
        "Cardiología": ["Dr. Luis Ramírez", "Dra. Sofía Castro", "Dr. Oscar Prado"],
        "Dermatología": ["Dra. Carmen Vega", "Dr. Hugo Ferrand", "Dra. Paola Ortiz"],
        "Traumatología": ["Dr. Javier Ríos", "Dra. Rosa Blanca", "Dr. Sergio Peña"],
        "Odontología": ["Dra. Milagros Paz", "Dr. Andrés Soto", "Dra. Fabiola Vera"]
    };

    // 1. CARGAR PACIENTES DESDE HOME.JS
    // home.js usa la clave "clinica_pacientes_modulo1"
    const cargarPacientes = () => {
        const datos = JSON.parse(localStorage.getItem('clinica_pacientes_modulo1')) || [];

        pacienteSelect.innerHTML = '<option value="">Seleccione un paciente...</option>';

        if (datos.length === 0) {
            const opt = document.createElement('option');
            opt.disabled = true;
            opt.textContent = 'No hay pacientes registrados en el sistema';
            pacienteSelect.appendChild(opt);
            return;
        }

        datos.forEach(p => {
            const opt = document.createElement('option');
            const nombreCompleto = `${p.nombres} ${p.apellidos}`;

            // alergiasTexto es el array con el texto final guardado por home.js
            const alergias = Array.isArray(p.alergiasTexto)
                ? p.alergiasTexto.join(', ')
                : Array.isArray(p.alergias)
                    ? p.alergias.join(', ')
                    : 'Ninguna';

            opt.value = p.codigo;
            opt.textContent = `${nombreCompleto} — ${p.tipoDocumento}: ${p.documento}`;
            opt.dataset.alergia = alergias;
            opt.dataset.nombre = nombreCompleto;
            pacienteSelect.appendChild(opt);
        });
    };

    // 2. ACTUALIZAR MÉDICOS SEGÚN ESPECIALIDAD
    especialidadSelect.addEventListener('change', () => {
        const esp = especialidadSelect.value;
        medicoSelect.innerHTML = '<option value="">Seleccione un médico...</option>';
        if (esp && doctoresPorEspecialidad[esp]) {
            doctoresPorEspecialidad[esp].forEach(doc => {
                const opt = document.createElement('option');
                opt.value = doc;
                opt.textContent = doc;
                medicoSelect.appendChild(opt);
            });
        }
    });

    // 3. DETECTAR ALERGIAS AL SELECCIONAR PACIENTE
    pacienteSelect.addEventListener('change', (e) => {
        const opt = e.target.selectedOptions[0];
        const alergia = opt?.dataset?.alergia || '';

        const tieneAlergia = alergia &&
            alergia !== 'Ninguna' &&
            alergia.trim() !== '' &&
            opt.value !== '';  // que no sea el placeholder

        if (tieneAlergia) {
            alergiaInfo.textContent = alergia;
            alertaAlergia.classList.remove('hidden');
        } else {
            alertaAlergia.classList.add('hidden');
        }
    });

    // 4. LÓGICA DE PRIORIDAD URGENTE
    prioridadSelect.addEventListener('change', () => {
        const justificacionInput = document.getElementById('justificacion');
        if (prioridadSelect.value === 'Urgente') {
            justificacionCont.classList.remove('hidden');
            justificacionInput.required = true;
        } else {
            justificacionCont.classList.add('hidden');
            justificacionInput.required = false;
            justificacionInput.value = '';
        }
    });

    // 5. REGISTRAR CITA
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const fechaVal = document.getElementById('fecha').value;
        const horaVal = document.getElementById('hora').value;
        const motivoVal = document.getElementById('motivo').value;
        const justificacionVal = document.getElementById('justificacion').value;

        // Validar fecha no pasada
        if (fechaVal < new Date().toISOString().split('T')[0]) {
            alert('No se permiten fechas pasadas.');
            return;
        }

        // Validar hora dentro del rango permitido
        if (horaVal < '08:00' || horaVal > '18:00') {
            alert('La hora debe estar entre 08:00 y 18:00.');
            return;
        }

        // Validar justificación de urgencia
        if (prioridadSelect.value === 'Urgente' && justificacionVal.trim().length < 10) {
            alert('La justificación de urgencia debe tener al menos 10 caracteres.');
            return;
        }

        // Validar motivo
        if (motivoVal.trim().length < 10) {
            alert('El motivo de consulta debe tener al menos 10 caracteres.');
            return;
        }

        const optSeleccionada = pacienteSelect.selectedOptions[0];
        const nombrePaciente = optSeleccionada?.dataset?.nombre || pacienteSelect.value;

        const nuevaCita = {
            codigo: `CITA${Math.floor(Math.random() * 900) + 100}`,
            paciente: nombrePaciente,
            especialidad: especialidadSelect.value,
            medico: medicoSelect.value,
            fecha: fechaVal,
            hora: horaVal,
            prioridad: prioridadSelect.value,
            justificacion: justificacionVal,
            motivo: motivoVal,
            estado: 'Programada'
        };

        let citas = JSON.parse(localStorage.getItem('citas')) || [];

        // Validar conflicto de horario con el mismo médico
        const conflicto = citas.find(c =>
            c.medico === nuevaCita.medico &&
            c.fecha === nuevaCita.fecha &&
            c.hora === nuevaCita.hora
        );

        if (conflicto) {
            alert('El médico ya tiene una cita en ese horario. Por favor elija otro horario.');
            return;
        }

        citas.push(nuevaCita);
        localStorage.setItem('citas', JSON.stringify(citas));
        alert('✅ Cita registrada exitosamente.');
        form.reset();
        medicoSelect.innerHTML = '<option value="">Seleccione especialidad primero...</option>';
        alertaAlergia.classList.add('hidden');
        justificacionCont.classList.add('hidden');
        renderTable();
    });

    // 6. RENDERIZAR TABLA DE CITAS
    const renderTable = () => {
        const citas = JSON.parse(localStorage.getItem('citas')) || [];
        const tbody = document.getElementById('citas-body');
        tbody.innerHTML = '';

        if (citas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; color:#888; padding:1.5rem;">
                        No hay citas registradas aún.
                    </td>
                </tr>`;
            return;
        }

        citas.forEach((c, i) => {
            const prioridadColor = {
                'Normal': '#4caf50',
                'Preferencial': '#ff9800',
                'Urgente': '#f44336'
            }[c.prioridad] || '#999';

            tbody.innerHTML += `
                <tr>
                    <td>${c.codigo}</td>
                    <td>${c.paciente}</td>
                    <td>${c.especialidad}<br><small>${c.medico}</small></td>
                    <td>${c.fecha}<br><small>${c.hora}</small></td>
                    <td>
                        <span style="color:${prioridadColor}; font-weight:600;">${c.prioridad}</span>
                        <br><small>${c.estado}</small>
                    </td>
                    <td>
                        <button onclick="confirmar(${i})"
                            style="margin-bottom:4px; display:block;"
                            ${c.estado === 'Confirmada' ? 'disabled' : ''}>
                            ✅ Confirmar
                        </button>
                        <button onclick="eliminarCita(${i})"
                            style="background:#e53935; color:white;">
                            🗑 Eliminar
                        </button>
                    </td>
                </tr>`;
        });
    };

    // 7. CONFIRMAR CITA
    window.confirmar = (i) => {
        let citas = JSON.parse(localStorage.getItem('citas')) || [];
        citas[i].estado = 'Confirmada';
        localStorage.setItem('citas', JSON.stringify(citas));
        renderTable();
    };

    // 8. ELIMINAR CITA
    window.eliminarCita = (i) => {
        if (!confirm('¿Está seguro de eliminar esta cita?')) return;
        let citas = JSON.parse(localStorage.getItem('citas')) || [];
        citas.splice(i, 1);
        localStorage.setItem('citas', JSON.stringify(citas));
        renderTable();
    };

    // INICIALIZAR
    cargarPacientes();
    renderTable();
});