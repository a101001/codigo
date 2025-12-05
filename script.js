// =========================================================
// CONFIGURACION INICIAL
// =========================================================
let chartSucesion = null;
let chartVector = null;
let historial = []; 
let ultimaMatriz = []; 
let datosDeArchivo = []; // NUEVA VARIABLE: Almacena los datos leídos del archivo

window.onload = function() {
    iniciarGraficos();
    // Generar los 10 campos de entrada al cargar la página
    generarCamposDePiezas();
};

// =========================================================
// FUNCION DE GENERACIÓN DE CAMPOS DE ENTRADA
// =========================================================
function generarCamposDePiezas() {
    const contenedor = document.getElementById('contenedorPiezas');
    let htmlContent = '';
    let cantidadDeseada = parseInt(document.getElementById('inputCantidad').value);


    for (let i = 1; i <= cantidadDeseada; i++) {
        // Buscar si tenemos datos precargados del archivo para esta pieza
        const data = datosDeArchivo[i - 1] || {};
        
        htmlContent += `
            <div class="row g-1 mb-1 align-items-center">
                <div class="col-2 text-white small">${i}.</div>
                <div class="col-3">
                    <input type="number" id="L${i}" class="form-control form-control-sm" placeholder="L" step="0.01" value="${data.largo !== undefined ? data.largo : ''}">
                </div>
                <div class="col-3">
                    <input type="number" id="A${i}" class="form-control form-control-sm" placeholder="A" step="0.01" value="${data.ancho !== undefined ? data.ancho : ''}">
                </div>
                <div class="col-4">
                    <input type="number" id="P${i}" class="form-control form-control-sm" placeholder="Peso" step="0.1" value="${data.peso !== undefined ? data.peso : ''}">
                </div>
            </div>
        `;
    }
    contenedor.innerHTML = htmlContent;
}

// =========================================================
// FUNCION DE LECTURA DE ARCHIVOS
// =========================================================
function manejarArchivo() {
    const inputArchivo = document.getElementById('inputArchivo');
    const archivo = inputArchivo.files[0];

    if (!archivo) {
        datosDeArchivo = [];
        generarCamposDePiezas(); // Repintar campos vacíos
        return;
    }

    if (archivo.size > 1024 * 10) { // Límite de 10KB
        alert("El archivo es demasiado grande (máx 10KB).");
        inputArchivo.value = ''; 
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const contenido = e.target.result;
            datosDeArchivo = parsearDatosDeArchivo(contenido);
        
            
            // 2. Actualizar la cantidad de piezas a analizar
            document.getElementById('inputCantidad').value = datosDeArchivo.length;
            
            // 3. Rellenar los campos visuales
            generarCamposDePiezas();

            alert(`¡Archivo cargado con éxito! Se encontraron ${datosDeArchivo.length} piezas.`);
            
        } catch (error) {
            alert(`Error al procesar el archivo: ${error.message}`);
            datosDeArchivo = [];
            inputArchivo.value = '';
        }
    };
    reader.readAsText(archivo);
}

function parsearDatosDeArchivo(texto) {
    const lineas = texto.trim().split('\n');
    const datos = [];
    let id = 1;
    
    // El formato esperado es L,A,P por cada línea
    for (const linea of lineas) {
        // Manejar varios separadores (coma, punto y coma, tabulación, espacio)
        const valores = linea.trim().split(/[\s,;]+/).map(v => v.trim()).filter(v => v.length > 0);
        
        if (valores.length === 3) {
            const largo = parseFloat(valores[0]);
            const ancho = parseFloat(valores[1]);
            const peso = parseFloat(valores[2]);

            // Se valida que todos sean números
            if (!isNaN(largo) && !isNaN(ancho) && !isNaN(peso)) {
                 datos.push({
                    id: id++,
                    largo: largo,
                    ancho: ancho,
                    peso: peso
                });
            } else {
                 console.warn(`Línea ${id}: Valores no numéricos detectados. Saltada.`);
            }
           
        } else if (linea.trim() !== "") {
            console.warn(`Línea ${id}: Formato incorrecto. Se esperaban 3 valores, se encontraron ${valores.length}. Saltada.`);
        }
    }

    if (datos.length === 0) {
        throw new Error('El archivo no contiene datos válidos con el formato L, A, P.');
    }

    return datos;
}

// =========================================================
// FUNCION DE LECTURA DE CAMPOS (Incluye lógica de archivo)
// =========================================================
function leerDatosDeCampos(cantidad) {
    let datos = [];
    
    // 1. Prioridad: Si hay datos cargados por archivo, los usamos.
    if (datosDeArchivo.length > 0) {
        datos = datosDeArchivo.slice(0, cantidad);
    } 
    
    // 2. Si no hay datos de archivo o queremos complementar, leemos los inputs manualmente
    if (datos.length < cantidad || datosDeArchivo.length === 0) {
        
        const inicioManual = datosDeArchivo.length > 0 ? datosDeArchivo.length + 1 : 1; 
        
        for (let i = inicioManual; i <= cantidad; i++) {
            const inputL = document.getElementById(`L${i}`);
            const inputA = document.getElementById(`A${i}`);
            const inputP = document.getElementById(`P${i}`);
            
            // Si el input no existe o está vacío, lo saltamos
            if (!inputL || !inputA || !inputP || !inputL.value || !inputA.value || !inputP.value) {
                continue; 
            }

            let largo = parseFloat(inputL.value);
            let ancho = parseFloat(inputA.value);
            let peso = parseFloat(inputP.value);

            if (isNaN(largo) || isNaN(ancho) || isNaN(peso)) {
                throw new Error(`Los valores de la pieza ${i} no son números válidos.`);
            }
            
            // Solo agregamos si la pieza no fue cargada desde el archivo
            if (!datosDeArchivo.find(d => d.id === i)) {
                 datos.push({
                    id: i,
                    largo: largo,
                    ancho: ancho,
                    peso: peso
                });
            }
        }
    }
    
    const datosAAnalizar = datos.slice(0, cantidad);

    if (datosAAnalizar.length === 0) {
        throw new Error('No hay piezas válidas para analizar en los campos o archivo.');
    }

    return datosAAnalizar;
}

// =========================================================
// PRINCIPAL (Analiza la Cantidad Especificada)
// =========================================================
function ejecutarAnalisis() {
    
    // 1. LEER LO QUE EL USUARIO ESCRIBIO
    let largoIdeal = parseFloat(document.getElementById('inputLargo').value);
    let anchoIdeal = parseFloat(document.getElementById('inputAncho').value);
    let pesoIdeal = parseFloat(document.getElementById('inputPeso').value);
    let tolerancia = parseFloat(document.getElementById('inputTolerancia').value);

    // Leemos la cantidad que el usuario quiere analizar 
    let cantidadDeseada = parseInt(document.getElementById('inputCantidad').value);
    
    if (cantidadDeseada < 1 || isNaN(cantidadDeseada)) {
        alert(`La cantidad a analizar debe ser superior a 1.`);
        return;
    }
    
    // 2. OBTENER DATOS DE LOS CAMPOS (Incluye la lógica de archivo)
    let datosIngresados = [];
    try {
        document.getElementById('txtEstado').innerText = "PROCESANDO DATOS...";
        datosIngresados = leerDatosDeCampos(cantidadDeseada); 
    } catch (error) {
        console.error(error);
        alert(`FALLO DE LECTURA: ${error.message}`);
        document.getElementById('txtEstado').innerText = "ERROR";
        // Limpiar tarjetas/tabla al fallar
        document.getElementById('valTotal').innerText = 0;
        document.getElementById('valDefectos').innerText = 0;
        document.getElementById('valError').innerText = "0.00";
        ultimaMatriz = []; 
        llenarTabla([]); 
        return; 
    }
    
    let cantidad = datosIngresados.length; 
    
    let matriz = [];
    let contadorMalas = 0;
    let sumaErrores = 0;

    // 3. ANALIZAR CADA PIEZA REAL
    datosIngresados.forEach(pieza => { 
        
        let largoReal = pieza.largo;
        let anchoReal = pieza.ancho;
        let pesoReal = pieza.peso;
        
        // --- C. MEDIMOS EL ERROR ---
        let difL = Math.abs(largoReal - largoIdeal);
        let difA = Math.abs(anchoReal - anchoIdeal);
        let difP = Math.abs(pesoReal - pesoIdeal); 
        
        // --- D. ¿PASA O NO PASA? ---
        // Condición de falla (regla fija en el código original): Largo difiere más de 0.5 O Ancho difiere más de 0.3
        let esMala = (difL > 0.5 || difA > 0.3); 
        if (esMala) contadorMalas++;

        // Error Total (suma de diferencias absolutas)
        let errorTotal = difL + difA + difP; 
        sumaErrores += errorTotal;

        // --- E. GUARDAR EN LA MATRIZ DE RESULTADOS ---
        matriz.push({
            id: pieza.id, 
            largo: largoReal.toFixed(2),
            ancho: anchoReal.toFixed(2),
            peso: pesoReal.toFixed(2),
            largoIdeal: largoIdeal.toFixed(2), 
            anchoIdeal: anchoIdeal.toFixed(2), 
            pesoIdeal: pesoIdeal.toFixed(2),
            error: errorTotal.toFixed(3),
            estado: esMala // TRUE si es una pieza 'MALA'
        });
    });

    // 4. RESULTADOS FINALES
    let promedioError = sumaErrores / cantidad;
    let porcentajeFalla = (contadorMalas / cantidad) * 100;
    let aprobado = porcentajeFalla <= tolerancia; 

    // 5. ACTUALIZAR PANTALLA
    ultimaMatriz = matriz; 
    
    actualizarTextos(cantidad, contadorMalas, promedioError, aprobado);
    llenarTabla(matriz); 
    
    historial.push(porcentajeFalla);
    
    if(matriz.length > 0) {
        actualizarGraficos(historial, largoIdeal, anchoIdeal, pesoIdeal, matriz[0]);
    }
}

// =========================================================
// FUNCIONES DE PINTADO
// =========================================================
function llenarTabla(datos) {

    if (!datos || datos.length === 0) {
        datos = ultimaMatriz;
    }

    if (!datos || datos.length === 0) return;

    let cuerpoTabla = document.getElementById('tablaBody');
    cuerpoTabla.innerHTML = ""; 

    datos.forEach(fila => {
        
        let largoMostrar = fila.largo;
        let anchoMostrar = fila.ancho;
        let pesoMostrar = fila.peso;
        
        let tr = document.createElement('tr'); 
        
        if(fila.estado) tr.className = "fila-error";

        tr.innerHTML = `
            <td>${fila.id}</td>
            <td>${largoMostrar}</td>
            <td>${anchoMostrar}</td>
            <td>${pesoMostrar}</td>
            <td>${fila.error}</td>
            <td>${fila.estado ? 
                '<span class="badge bg-danger">FALLA</span>' : 
                '<span class="badge bg-success">OK</span>'}
            </td>
        `;
        
        cuerpoTabla.appendChild(tr);
    });
}

function actualizarTextos(total, malas, error, esAprobado) {
    document.getElementById('valTotal').innerText = total;
    document.getElementById('valDefectos').innerText = malas;
    document.getElementById('valError').innerText = error.toFixed(3);

    let etiqueta = document.getElementById('txtEstado');
    let caja = document.getElementById('cardEstado');

    caja.classList.remove('aprobado-bg', 'rechazado-bg');

    if(esAprobado) {
        etiqueta.innerText = "LOTE APROBADO";
        etiqueta.className = "fw-bold mb-0 text-success";
        caja.classList.add('aprobado-bg');
    } else {
        etiqueta.innerText = "LOTE RECHAZADO";
        etiqueta.className = "fw-bold mb-0 text-danger";
        caja.classList.add('rechazado-bg');
    }
}

function iniciarGraficos() {
    let ctx1 = document.getElementById('chartSucesion').getContext('2d');
    chartSucesion = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '% Fallas',
                data: [],
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { min: 0, max: 100 } }
        }
    });

    let ctx2 = document.getElementById('chartVector').getContext('2d');
    chartVector = new Chart(ctx2, {
        type: 'radar',
        data: {
            labels: ['Largo', 'Ancho', 'Peso'],
            datasets: [
                { label: 'Ideal', data: [0,0,0], borderColor: '#198754', borderWidth: 2, fill: false },
                { label: 'Muestra', data: [0,0,0], borderColor: '#dc3545', borderWidth: 2, backgroundColor: 'rgba(220, 53, 69, 0.2)', fill: true }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: { r: { angleLines: { display: false }, suggestedMin: 0 } }
        }
    });
}

function actualizarGraficos(historialData, l, a, p, muestra) {
    // Gráfico de Sucesión
    chartSucesion.data.labels = historialData.map((_, index) => "Lote " + (index + 1));
    chartSucesion.data.datasets[0].data = historialData;
    chartSucesion.update();

    // Gráfico de Radar (Vectores)
    if(muestra) {
        chartVector.data.datasets[0].data = [l, a, p];
        chartVector.data.datasets[1].data = [parseFloat(muestra.largo), parseFloat(muestra.ancho), parseFloat(muestra.peso)];
        
        // Ajustar el máximo del eje del radar para que los datos se vean bien
        let maxVal = Math.max(l, a, p, parseFloat(muestra.largo), parseFloat(muestra.ancho), parseFloat(muestra.peso));
        chartVector.options.scales.r.suggestedMax = maxVal * 1.2;
        
        chartVector.update();
    }
}