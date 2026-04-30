let misCitas = JSON.parse(localStorage.getItem("citas_clinica")) || [];
const STORAGE_KEY = "clinica_pacientes_modulo1";
let patients = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let editingCode = null;

document.addEventListener("DOMContentLoaded", () => {
  renderizarCitas();

  const appointmentForm = document.getElementById("appointment-form");
  if (appointmentForm) {
    appointmentForm.addEventListener("submit", function (e) {
      e.preventDefault();
      crearCita();
    });
  }

  initPatientModule();
  showSection("inicio");
});

function showSection(sectionId) {
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });

  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active");
}

function crearCita() {
  const especialidad = document.getElementById("especialidad").value;
  const fecha = document.getElementById("fecha-cita").value;
  const hora = document.getElementById("hora-cita").value;

  if (!especialidad || !fecha || !hora) {
    alert("Completa todos los campos de la cita.");
    return;
  }

  const nuevaCita = {
    id: Date.now(),
    especialidad,
    fecha,
    hora,
    estado: "Pendiente"
  };

  misCitas.push(nuevaCita);
  localStorage.setItem("citas_clinica", JSON.stringify(misCitas));
  document.getElementById("appointment-form").reset();
  alert("Cita guardada correctamente.");
  renderizarCitas();
  showSection("inicio");
}

function renderizarCitas() {
  const contenedorInicio = document.getElementById("lista-citas");
  const contenedorHistorial = document.getElementById("cuerpo-historial");
  if (!contenedorInicio || !contenedorHistorial) return;

  contenedorInicio.innerHTML = "";
  contenedorHistorial.innerHTML = "";

  if (misCitas.length === 0) {
    contenedorInicio.innerHTML = `
      <div class="card-cita">
        <h3>Sin citas registradas</h3>
        <p>Aún no has agendado citas.</p>
      </div>
    `;

    contenedorHistorial.innerHTML = `
      <tr>
        <td colspan="5">No hay citas registradas.</td>
      </tr>
    `;
    return;
  }

  misCitas.forEach((cita) => {
    contenedorInicio.innerHTML += `
      <div class="card-cita">
        <h3>${cita.especialidad}</h3>
        <p><strong>Fecha:</strong> ${cita.fecha}</p>
        <p><strong>Hora:</strong> ${cita.hora}</p>
        <p><strong>Estado:</strong> ${cita.estado}</p>
      </div>
    `;

    contenedorHistorial.innerHTML += `
      <tr>
        <td>${cita.fecha}</td>
        <td>${cita.especialidad}</td>
        <td>${cita.hora}</td>
        <td>${cita.estado}</td>
        <td><button class="btn-action" onclick="eliminarCita(${cita.id})">Eliminar</button></td>
      </tr>
    `;
  });
}

function eliminarCita(id) {
  misCitas = misCitas.filter((cita) => cita.id !== id);
  localStorage.setItem("citas_clinica", JSON.stringify(misCitas));
  renderizarCitas();
}

function initPatientModule() {
  const form = document.getElementById("patientForm");
  if (!form) return;

  const codigoPaciente = document.getElementById("codigoPaciente");
  const edadInput = document.getElementById("edad");
  const nombresInput = document.getElementById("nombres");
  const apellidosInput = document.getElementById("apellidos");
  const tipoDocumentoInput = document.getElementById("tipoDocumento");
  const documentoInput = document.getElementById("documento");
  const fechaNacimientoInput = document.getElementById("fechaNacimiento");
  const telefonoInput = document.getElementById("telefono");
  const correoInput = document.getElementById("correo");
  const direccionInput = document.getElementById("direccion");
  const apoderadoInput = document.getElementById("apoderado");
  const otroAlergiaWrap = document.getElementById("otroAlergiaWrap");
  const otroAlergiaInput = document.getElementById("otroAlergia");
  const emergenciaNombreInput = document.getElementById("emergenciaNombre");
  const emergenciaParentescoInput = document.getElementById("emergenciaParentesco");
  const emergenciaTelefonoInput = document.getElementById("emergenciaTelefono");
  const searchInput = document.getElementById("searchInput");
  const patientList = document.getElementById("patientList");
  const patientCount = document.getElementById("patientCount");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const modeBadge = document.getElementById("modeBadge");
  const alertBox = document.getElementById("alertBox");
  const clearBtn = document.getElementById("clearBtn");
  const docHint = document.getElementById("docHint");

  syncDocInputRules();
  setNextPatientCode();
  renderPatients();
  updateAgeAndGuardian();
  updateOtroAlergia();

  tipoDocumentoInput.addEventListener("change", () => {
    syncDocInputRules();
    documentoInput.value = "";
  });

  fechaNacimientoInput.addEventListener("change", updateAgeAndGuardian);
  searchInput.addEventListener("input", renderPatients);
  cancelEditBtn.addEventListener("click", resetFormState);

  clearBtn.addEventListener("click", () => {
    setTimeout(() => {
      resetOnlyFields();
      setNextPatientCode();
      updateAgeAndGuardian();
      updateOtroAlergia();
    }, 0);
  });

  document.querySelectorAll('input[name="alergias"]').forEach((checkbox) => {
    checkbox.addEventListener("change", handleAllergySelection);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    savePatient();
  });

  function normalizeText(value) {
    return value.trim().replace(/\s+/g, " ");
  }

  function onlyDigits(value) {
    return value.replace(/\D/g, "");
  }

  function calculateAge(dateString) {
    if (!dateString) return "";
    const birthDate = new Date(dateString + "T00:00:00");
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  function updateAgeAndGuardian() {
    const dateValue = fechaNacimientoInput.value;
    if (!dateValue) {
      edadInput.value = "";
      apoderadoInput.disabled = true;
      apoderadoInput.value = "";
      return;
    }

    const selectedDate = new Date(dateValue + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      edadInput.value = "";
      apoderadoInput.disabled = true;
      apoderadoInput.value = "";
      return;
    }

    const age = calculateAge(dateValue);
    edadInput.value = `${age} años`;

    if (age < 18) {
      apoderadoInput.disabled = false;
    } else {
      apoderadoInput.disabled = true;
      apoderadoInput.value = "";
    }
  }

  function syncDocInputRules() {
    const type = tipoDocumentoInput.value;

    if (type === "DNI") {
      documentoInput.maxLength = 8;
      documentoInput.inputMode = "numeric";
      docHint.textContent = "Para DNI: 8 dígitos numéricos.";
    } else {
      documentoInput.maxLength = 15;
      documentoInput.inputMode = "text";
      docHint.textContent = "Para otros documentos: entre 6 y 15 caracteres.";
    }
  }

  function handleAllergySelection(event) {
    const selected = event.target.value;
    const allChecks = [...document.querySelectorAll('input[name="alergias"]')];
    const ninguna = allChecks.find((item) => item.value === "Ninguna");
    const other = allChecks.find((item) => item.value === "Otro");

    if (selected === "Ninguna" && event.target.checked) {
      allChecks.forEach((item) => {
        if (item.value !== "Ninguna") item.checked = false;
      });
    }

    if (selected !== "Ninguna" && event.target.checked) {
      ninguna.checked = false;
    }

    if (other.checked) {
      otroAlergiaWrap.style.display = "block";
    } else {
      otroAlergiaWrap.style.display = "none";
      otroAlergiaInput.value = "";
    }
  }

  function updateOtroAlergia() {
    const otherChecked = [...document.querySelectorAll('input[name="alergias"]')]
      .some((item) => item.value === "Otro" && item.checked);

    otroAlergiaWrap.style.display = otherChecked ? "block" : "none";

    if (!otherChecked) {
      otroAlergiaInput.value = "";
    }
  }

  function getSelectedAllergies() {
    return [...document.querySelectorAll('input[name="alergias"]:checked')].map((item) => item.value);
  }

  function setNextPatientCode() {
    if (editingCode) {
      codigoPaciente.value = editingCode;
      return;
    }

    let maxNumber = 0;
    patients.forEach((patient) => {
      const num = parseInt(String(patient.codigo).replace("PAC", ""), 10);
      if (!isNaN(num) && num > maxNumber) maxNumber = num;
    });

    const next = maxNumber + 1;
    codigoPaciente.value = `PAC${String(next).padStart(3, "0")}`;
  }

  function showAlert(message, type = "error") {
    alertBox.textContent = message;
    alertBox.className = `alert show ${type}`;
  }

  function clearAlert() {
    alertBox.textContent = "";
    alertBox.className = "alert";
  }

  function validatePatient(payload) {
    const errors = [];

    if (!payload.codigo) errors.push("El código del paciente es obligatorio.");

    if (!payload.nombres) {
      errors.push("Los nombres son obligatorios.");
    } else if (payload.nombres.length < 2 || payload.nombres.length > 60) {
      errors.push("Los nombres deben tener entre 2 y 60 caracteres.");
    } else if (/^\d+$/.test(payload.nombres)) {
      errors.push("Los nombres no pueden contener solo números.");
    }

    if (!payload.apellidos) {
      errors.push("Los apellidos son obligatorios.");
    } else if (payload.apellidos.length < 2 || payload.apellidos.length > 80) {
      errors.push("Los apellidos deben tener entre 2 y 80 caracteres.");
    } else if (/^\d+$/.test(payload.apellidos)) {
      errors.push("Los apellidos no pueden contener solo números.");
    }

    if (!payload.documento) {
      errors.push("El documento de identidad es obligatorio.");
    } else if (payload.tipoDocumento === "DNI") {
      if (!/^\d{8}$/.test(payload.documento)) {
        errors.push("El DNI debe tener exactamente 8 dígitos numéricos.");
      }
    } else if (!/^[A-Za-z0-9\-]{6,15}$/.test(payload.documento)) {
      errors.push("El documento debe tener entre 6 y 15 caracteres alfanuméricos.");
    }

    const duplicateDoc = patients.some((patient) =>
      patient.documento.toLowerCase() === payload.documento.toLowerCase() &&
      patient.codigo !== editingCode
    );

    if (duplicateDoc) errors.push("El documento de identidad ya está registrado.");

    if (!payload.fechaNacimiento) {
      errors.push("La fecha de nacimiento es obligatoria.");
    } else {
      const birthDate = new Date(payload.fechaNacimiento + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (birthDate > today) errors.push("La fecha de nacimiento no puede ser futura.");
    }

    if (!payload.telefono) {
      errors.push("El teléfono de contacto es obligatorio.");
    } else if (!/^\d{9}$/.test(payload.telefono)) {
      errors.push("El teléfono debe tener 9 dígitos numéricos.");
    }

    if (payload.correo) {
      if (/\s/.test(payload.correo)) {
        errors.push("El correo no debe contener espacios.");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.correo)) {
        errors.push("El correo electrónico no tiene un formato válido.");
      }
    }

    if (payload.direccion && (payload.direccion.length < 5 || payload.direccion.length > 150)) {
      errors.push("La dirección, si se completa, debe tener entre 5 y 150 caracteres.");
    }

    if (!payload.alergias.length) errors.push("Debe seleccionar al menos una alergia.");

    if (payload.alergias.includes("Ninguna") && payload.alergias.length > 1) {
      errors.push("“Ninguna” no puede combinarse con otras alergias.");
    }

    if (payload.alergias.includes("Otro") && !payload.otroAlergia) {
      errors.push("Debe especificar la alergia marcada como “Otro”.");
    }

    if (payload.edad < 18 && (!payload.apoderado || payload.apoderado.length < 3)) {
      errors.push("Si el paciente es menor de edad, el apoderado es obligatorio.");
    }

    if (!payload.emergenciaNombre) {
      errors.push("El nombre del contacto de emergencia es obligatorio.");
    } else if (payload.emergenciaNombre.length < 3) {
      errors.push("El nombre del contacto de emergencia debe tener mínimo 3 caracteres.");
    }

    if (!payload.emergenciaParentesco) {
      errors.push("Debe seleccionar el parentesco del contacto de emergencia.");
    }

    if (!payload.emergenciaTelefono) {
      errors.push("El teléfono del contacto de emergencia es obligatorio.");
    } else if (!/^\d{9}$/.test(payload.emergenciaTelefono)) {
      errors.push("El teléfono de emergencia debe tener 9 dígitos numéricos.");
    }

    return errors;
  }

  function savePatient() {
    clearAlert();

    const nombres = normalizeText(nombresInput.value);
    const apellidos = normalizeText(apellidosInput.value);
    const documento = normalizeText(documentoInput.value);
    const telefono = onlyDigits(telefonoInput.value);
    const correo = correoInput.value.trim();
    const direccion = normalizeText(direccionInput.value);
    const fechaNacimiento = fechaNacimientoInput.value;
    const edad = Number(calculateAge(fechaNacimiento));
    const apoderado = normalizeText(apoderadoInput.value);
    const alergias = getSelectedAllergies();
    const otroAlergia = normalizeText(otroAlergiaInput.value);
    const emergenciaNombre = normalizeText(emergenciaNombreInput.value);
    const emergenciaParentesco = emergenciaParentescoInput.value;
    const emergenciaTelefono = onlyDigits(emergenciaTelefonoInput.value);

    const payload = {
      codigo: codigoPaciente.value,
      nombres,
      apellidos,
      tipoDocumento: tipoDocumentoInput.value,
      documento,
      fechaNacimiento,
      edad,
      telefono,
      correo,
      direccion,
      apoderado,
      alergias,
      otroAlergia,
      emergenciaNombre,
      emergenciaParentesco,
      emergenciaTelefono
    };

    const errors = validatePatient(payload);
    if (errors.length) {
      showAlert(errors[0], "error");
      return;
    }

    const patientRecord = {
      ...payload,
      alergiasTexto: payload.alergias.includes("Otro")
        ? payload.alergias.map((item) => item === "Otro" ? `Otro: ${payload.otroAlergia}` : item)
        : payload.alergias
    };

    if (editingCode) {
      patients = patients.map((patient) => patient.codigo === editingCode ? patientRecord : patient);
      showAlert("Paciente actualizado correctamente.", "success");
    } else {
      patients.push(patientRecord);
      showAlert("Paciente registrado correctamente.", "success");
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    renderPatients();
    resetFormState();
  }

  function renderPatients() {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = patients.filter((patient) => {
      const fullName = `${patient.nombres} ${patient.apellidos}`.toLowerCase();
      return (
        patient.nombres.toLowerCase().includes(term) ||
        patient.apellidos.toLowerCase().includes(term) ||
        patient.documento.toLowerCase().includes(term) ||
        fullName.includes(term)
      );
    });

    patientCount.textContent = `${filtered.length} paciente${filtered.length === 1 ? "" : "s"}`;

    if (!filtered.length) {
      patientList.innerHTML = `
        <article class="empty-state">
          <h3>No hay pacientes para mostrar</h3>
          <p>Registre un paciente o cambie el criterio de búsqueda.</p>
        </article>
      `;
      return;
    }

    patientList.innerHTML = filtered.map((patient) => `
      <article class="patient-card">
        <div class="patient-card-head">
          <div>
            <h3>${patient.nombres} ${patient.apellidos}</h3>
            <p class="meta">${patient.codigo} · ${patient.tipoDocumento}: ${patient.documento}</p>
          </div>
          <span class="tag">${patient.edad} años</span>
        </div>

        <div class="patient-info">
          <div class="patient-info-row"><strong>Teléfono</strong><span>${patient.telefono}</span></div>
          <div class="patient-info-row"><strong>Correo</strong><span>${patient.correo || "No registrado"}</span></div>
          <div class="patient-info-row"><strong>Dirección</strong><span>${patient.direccion || "No registrada"}</span></div>
          <div class="patient-info-row"><strong>Apoderado</strong><span>${patient.apoderado || "No aplica"}</span></div>
          <div class="patient-info-row"><strong>Emergencia</strong><span>${patient.emergenciaNombre} (${patient.emergenciaParentesco}) - ${patient.emergenciaTelefono}</span></div>
        </div>

        <div class="patient-tags">
          ${patient.alergiasTexto.map((item) => `<span class="tag">${item}</span>`).join("")}
        </div>

        <div class="patient-actions">
          <button type="button" class="btn btn-secondary" onclick="window.editPatient('${patient.codigo}')">Editar</button>
        </div>
      </article>
    `).join("");
  }

  function editPatient(code) {
    const patient = patients.find((item) => item.codigo === code);
    if (!patient) return;

    editingCode = patient.codigo;
    modeBadge.textContent = "Modo edición";
    codigoPaciente.value = patient.codigo;
    nombresInput.value = patient.nombres;
    apellidosInput.value = patient.apellidos;
    tipoDocumentoInput.value = patient.tipoDocumento;
    documentoInput.value = patient.documento;
    fechaNacimientoInput.value = patient.fechaNacimiento;
    telefonoInput.value = patient.telefono;
    correoInput.value = patient.correo || "";
    direccionInput.value = patient.direccion || "";
    emergenciaNombreInput.value = patient.emergenciaNombre;
    emergenciaParentescoInput.value = patient.emergenciaParentesco;
    emergenciaTelefonoInput.value = patient.emergenciaTelefono;
    syncDocInputRules();
    updateAgeAndGuardian();
    apoderadoInput.value = patient.apoderado || "";

    document.querySelectorAll('input[name="alergias"]').forEach((checkbox) => {
      checkbox.checked = patient.alergias.includes(checkbox.value);
    });

    otroAlergiaInput.value = patient.otroAlergia || "";
    updateOtroAlergia();
    clearAlert();
    showSection("registro-pacientes");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.editPatient = editPatient;

  function resetOnlyFields() {
    form.reset();
    editingCode = null;
    modeBadge.textContent = "Nuevo registro";
    document.querySelectorAll('input[name="alergias"]').forEach((checkbox) => {
      checkbox.checked = false;
    });
    otroAlergiaWrap.style.display = "none";
    apoderadoInput.disabled = true;
    edadInput.value = "";
    clearAlert();
    syncDocInputRules();
  }

  function resetFormState() {
    resetOnlyFields();
    setNextPatientCode();
  }
}