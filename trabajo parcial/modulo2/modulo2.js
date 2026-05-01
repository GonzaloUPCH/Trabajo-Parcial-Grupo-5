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

    // 1. CARGAR PACIENTES (MÓDULO 1)
    const cargarPacientes = () => {
        const datos = JSON.parse(localStorage.getItem('pacientes')) || [];
        pacienteSelect.innerHTML = '<option value="">Seleccione un paciente...</option>';
        datos.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.nombre;
            opt.textContent = p.nombre;
            opt.dataset.alergia = p.alergia || "Ninguna";
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
                opt.value = doc; opt.textContent = doc;
                medicoSelect.appendChild(opt);
            });
        }
    });

    // 3. DETECTAR ALERGIAS
    pacienteSelect.addEventListener('change', (e) => {
        const opt = e.target.selectedOptions[0];
        const alergia = opt.dataset.alergia;
        if (alergia && alergia !== "Ninguna") {
            alergiaInfo.textContent = alergia;
            alertaAlergia.classList.remove('hidden');
        } else {
            alertaAlergia.classList.add('hidden');
        }
    });

    // 4. LÓGICA DE PRIORIDAD
    prioridadSelect.addEventListener('change', () => {
        if (prioridadSelect.value === 'Urgente') {
            justificacionCont.classList.remove('hidden');
            document.getElementById('justificacion').required = true;
        } else {
            justificacionCont.classList.add('hidden');
            document.getElementById('justificacion').required = false;
        }
    });

    // 5. REGISTRAR CITA
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fechaVal = document.getElementById('fecha').value;
        if (fechaVal < new Date().toISOString().split('T')[0]) {
            alert("No se permiten fechas pasadas."); return;
        }

        const nuevaCita = {
            codigo: `CITA${Math.floor(Math.random() * 900) + 100}`,
            paciente: pacienteSelect.value,
            especialidad: especialidadSelect.value,
            medico: medicoSelect.value,
            fecha: fechaVal,
            hora: document.getElementById('hora').value,
            prioridad: prioridadSelect.value,
            motivo: document.getElementById('motivo').value,
            estado: 'Programada'
        };

        let citas = JSON.parse(localStorage.getItem('citas')) || [];
        const conflicto = citas.find(c => c.medico === nuevaCita.medico && c.fecha === nuevaCita.fecha && c.hora === nuevaCita.hora);
        
        if (conflicto) { alert("El médico ya tiene una cita en ese horario."); return; }

        citas.push(nuevaCita);
        localStorage.setItem('citas', JSON.stringify(citas));
        alert("Cita registrada!");
        form.reset();
        renderTable();
    });

    const renderTable = () => {
        const citas = JSON.parse(localStorage.getItem('citas')) || [];
        const tbody = document.getElementById('citas-body');
        tbody.innerHTML = '';
        citas.forEach((c, i) => {
            tbody.innerHTML += `
                <tr>
                    <td>${c.codigo}</td>
                    <td>${c.paciente}</td>
                    <td>${c.especialidad}<br><small>${c.medico}</small></td>
                    <td>${c.fecha} ${c.hora}</td>
                    <td>${c.estado}</td>
                    <td><button onclick="confirmar(${i})">OK</button></td>
                </tr>`;
        });
    };

    window.confirmar = (i) => {
        let citas = JSON.parse(localStorage.getItem('citas'));
        citas[i].estado = 'Confirmada';
        localStorage.setItem('citas', JSON.stringify(citas));
        renderTable();
    };

    cargarPacientes();
    renderTable();
});