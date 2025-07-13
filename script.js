// --- CONSTANTES Y VARIABLES GLOBALES ---

const multiplicadorTamFuente = 1;

// Elementos del DOM (buscados una sola vez para mayor eficiencia)
const display = document.getElementById("display");
const salida = document.getElementById("salida");
const contenedor = document.getElementById("contenedor");
const teclado = document.getElementById("teclado");
const divVolver = document.getElementById("divvolver");
const botExp = document.getElementById("botexp");
const botNor = document.getElementById("botnor");
const header = document.getElementsByTagName("header")[0];

const errorMessages = {
    division1: "<p class='error'>El dividendo es cero, por lo tanto el resultado es cero.</p>",
    division2: "<p class='error'>El divisor es cero, no existe solución.</p>",
    division3: "<p class='error'>El dividendo y el divisor son cero, no existe solución.</p>",
    multiplicacion1: "<p class='error'>Multiplicar por cero da como resultado cero.</p>",
    multiplicacion2: "<p class='error'>El resultado es demasiado grande.</p>",
    raiz1: "<p class='error'>La raíz cuadrada de cero es cero.</p>",
    dFactorial1: "<p class='error'>No se puede descomponer el cero.</p>",
};

let w; // Ancho base para cálculos de tamaño
let divext = false; // Estado para división expandida


// --- FUNCIONES DE INICIO Y MANEJO DE LA CALCULADORA ---

function alCargar() {
    document.getElementById("tpan").innerHTML = "Ver<br>Pantalla";
    document.getElementById("trai").innerHTML = "RC";

    w = window.innerHeight / 1.93;

    // Aplicar tamaños dinámicos basados en el ancho 'w'
    contenedor.style.width = `${w}px`;
    contenedor.style.paddingTop = `${(w * 1.56) * 0.04}px`;
    display.style.fontSize = `${w * 0.085}px`;
    display.style.height = `${w * 0.11 * 1.11}px`;
    const cuerpoteclado = document.getElementById("cuerpoteclado");
    cuerpoteclado.style.width = `${0.95 * w}px`;
    cuerpoteclado.style.height = `${0.95 * w}px`;
    teclado.style.fontSize = `${0.1 * w}px`;
    const volver = document.getElementById("volver");
    volver.style.fontSize = `${0.15 * w}px`;
    volver.style.padding = `${0.05 * w}px ${0.03 * w}px`;
    botExp.style.fontSize = `${0.08 * w}px`;
    botExp.style.paddingTop = `${0.05 * w}px`;
    botNor.style.fontSize = `${0.08 * w}px`;
    botNor.style.paddingTop = `${0.05 * w}px`;
    salida.style.fontSize = `${0.26 * w}px`;

    contenedor.style.opacity = "1";
    display.innerHTML = '0';
    activadoBotones('0');

    // Inicialización de los módulos de historial
    HistoryManager.init();
    HistoryPanel.init();
}

function escribir(t) {
    if (t === '/') divext = false;

    if (t === "c") {
        display.innerHTML = "0";
    } else if (t === "del") {
        display.innerHTML = display.innerHTML.slice(0, -1) || "0";
    } else if (t === "primos") {
        desFacPri();
    } else if (t === "raiz") {
        raizCuadrada();
    } else {
        if (display.innerHTML === "0" && t !== ",") {
            display.innerHTML = t;
        } else {
            display.innerHTML += t;
        }
    }
    activadoBotones(display.innerHTML);
}

function activadoBotones(contDisplay) {
    const operador = contDisplay.match(/[\+\-x/]/);
    const numAr = contDisplay.split(operador);
    const ultimoNumero = numAr[numAr.length - 1];
    const demasiadosCaracteres = contDisplay.length >= 21;
    const numeroDemasiadasCifras = ultimoNumero.length >= 15;

    ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9'].forEach(id => {
        document.getElementById(id).disabled = demasiadosCaracteres || numeroDemasiadasCifras;
    });

    document.getElementById("tmas").disabled = !(/^\d+(,\d+){0,1}(\+\d+(,\d+){0,1})*$/.test(contDisplay) && !demasiadosCaracteres);
    document.getElementById("tcal").disabled = !(/^\d+(,\d+){0,1}([\+\/x\-#]\d+(,\d+){0,1})+$/.test(contDisplay));
    const operadoresBasicosHabilitados = /^\d+(,\d+){0,1}$/.test(contDisplay) && !demasiadosCaracteres;
    ['tpor', 'tdiv', 'tmen'].forEach(id => document.getElementById(id).disabled = !operadoresBasicosHabilitados);
    document.getElementById("trai").disabled = !operadoresBasicosHabilitados;
    document.getElementById("tpri").disabled = !(/^\d+$/.test(contDisplay) && contDisplay.length <= 8);
    document.getElementById("tcom").disabled = !(/^(\d+(,\d+){0,1}[\+\/x-])*\d+$/.test(contDisplay) && !demasiadosCaracteres && !ultimoNumero.includes(','));
}

// --- NAVEGACIÓN Y LÓGICA DE LA INTERFAZ ---

function bajarteclado() {
    teclado.style.top = "100%";
    salida.style.top = "0%";
    divVolver.style.top = "0%";
}

function subirteclado() {
    teclado.style.top = "0%";
    salida.style.top = "-100%";
    divVolver.style.top = "-100%";
}

function divideExpandida(esExpandida) {
    divext = esExpandida;
    botExp.style.display = esExpandida ? "none" : "inline-block";
    botNor.style.display = esExpandida ? "inline-block" : "none";
    calcular();
}

// --- FUNCIONES PRINCIPALES DE CÁLCULO ---

function calcular() {
    const entrada = display.innerHTML;
    const operadorMatch = entrada.match(/[\+\-x/]/);
    if (!operadorMatch) return;

    const operador = operadorMatch[0];
    const numAr = entrada.split(operador);

    const numerosAR = numAr.map(numStr => {
        let limpio = numStr.replace(/^0+(?!\b|,)/, '');
        if (limpio.startsWith(',')) limpio = '0' + limpio;
        const posicionComa = limpio.indexOf(",") + 1;
        const numeroDeDecimales = (posicionComa > 0) ? (limpio.length - posicionComa) : 0;
        const valorSinComa = limpio.replace(",", "");
        return [valorSinComa || "0", numeroDeDecimales];
    });

    salida.innerHTML = "";

    switch (operador) {
        case "+": suma(numerosAR); break;
        case "-": resta(numerosAR); break;
        case "x": multiplica(numerosAR); break;
        case "/": divext ? divideExt(numerosAR) : divide(numerosAR); break;
    }
    
    // Guardar en el historial solo si no es un error
    if (!salida.innerHTML.includes("<p class='error'>")) {
        const entry = {
            input: entrada,
            visualHtml: salida.innerHTML
        };
        HistoryManager.add(entry);
    }

    bajarteclado();
}

// --- FUNCIONES DE AYUDA VISUAL ---
function crearCelda(clase, texto, estilos) {
    const celda = document.createElement("div");
    celda.className = clase;
    celda.innerHTML = texto;
    Object.assign(celda.style, estilos);
    salida.appendChild(celda);
}

function crearFlechaLlevada(left, top, width, height) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.style.position = 'absolute';
    svg.style.left = `${left}px`;
    svg.style.top = `${top}px`;
    svg.style.overflow = 'visible';

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    const markerId = "arrowhead-" + Math.random().toString(36).substring(2, 9);
    marker.setAttribute("id", markerId);
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "8");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "5");
    marker.setAttribute("markerHeight", "5");
    marker.setAttribute("orient", "auto-start-reverse");

    const markerPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    markerPath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    markerPath.setAttribute("fill", "#ff5555");
    
    marker.appendChild(markerPath);
    defs.appendChild(marker);
    svg.appendChild(defs);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const startX = width * 0.9, startY = height;
    const controlX = width * 0.1, controlY = height;
    const endX = width * 0.2, endY = height * 0.15;
    
    path.setAttribute("d", `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`);
    path.setAttribute("stroke", "#ff5555");
    path.setAttribute("stroke-width", "2.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("fill", "none");
    path.setAttribute("marker-end", `url(#${markerId})`);

    svg.appendChild(path);
    salida.appendChild(svg);
    
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    path.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
    
    requestAnimationFrame(() => {
        path.style.strokeDashoffset = '0';
    });
}


// --- ALGORITMOS MATEMÁTICOS VISUALES ---

function suma(numerosAR) {
    let maxNumDecimales = 0;
    numerosAR.forEach(num => maxNumDecimales = Math.max(maxNumDecimales, num[1]));

    let numStrings = numerosAR.map(num => num[0].padEnd(num[0].length + maxNumDecimales - num[1], '0'));
    const maxLength = Math.max(...numStrings.map(n => n.length));
    const calcNumbers = numStrings.map(n => n.padStart(maxLength, '0'));

    let tempSum = 0n;
    calcNumbers.forEach(n => tempSum += BigInt(n));
    const resultadoS = tempSum.toString();
    const anchuraSuma = Math.max(resultadoS.length, maxLength + 1);

    const alturaSuma = numerosAR.length + 3;
    const maxDim = Math.max(alturaSuma, anchuraSuma);
    const m = (alturaSuma > anchuraSuma) ? (alturaSuma - anchuraSuma) / 2 : 0;
    const tamCel = 0.95 * w / maxDim;
    const tamFuente = tamCel * multiplicadorTamFuente;

    let llevadas = {};
    let llevadaActual = 0;

    for (let i = maxLength - 1; i >= 0; i--) {
        let sumaColumna = llevadaActual;
        calcNumbers.forEach(numStr => {
            sumaColumna += parseInt(numStr[i]);
        });
        llevadaActual = Math.floor(sumaColumna / 10);

        if (llevadaActual > 0) {
            const displayCol = i - 1 + (anchuraSuma - maxLength);
            if (displayCol >= 0) {
                llevadas[displayCol] = llevadaActual.toString();
                const topInicioFlecha = (1.5 + numerosAR.length - 1 + 0.5) * tamCel;
                const topFinFlecha = 0.8 * tamCel;
                const arrowHeight = topInicioFlecha - topFinFlecha;
                const arrowWidth = tamCel * 0.7;
                const leftPos = (displayCol + m + 0.3) * tamCel;
                crearFlechaLlevada(leftPos, topFinFlecha, arrowWidth, arrowHeight);
            }
        }
    }

    const numerosFinales = numStrings.map(n => n.padStart(anchuraSuma, ' '));
    const resultadoFinal = resultadoS.padStart(anchuraSuma, ' ');
    const topOffset = 1.5;

    for (const col in llevadas) {
        crearCelda("caja", llevadas[col], { left: `${(parseInt(col) + m) * tamCel}px`, top: `${0.1 * tamCel}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente * 0.7}px`, color: "red", textAlign: 'center' });
    }

    numerosFinales.forEach((numStr, i) => {
        for (let j = 0; j < numStr.length; j++) {
            if (numStr[j] !== ' ') {
                crearCelda("caja", numStr[j], { left: `${(j + m) * tamCel}px`, top: `${(i + topOffset) * tamCel}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, color: '#ffff00' });
            }
        }
    });

    const plusCol = anchuraSuma - maxLength - 1;
    const plusRow = topOffset + numerosFinales.length - 1;
    crearCelda("caja", "+", { left: `${(plusCol + m) * tamCel}px`, top: `${plusRow * tamCel}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, color: '#ffff00' });

    let topResultado = (topOffset + numerosFinales.length) * tamCel;
    for (let j = 0; j < resultadoFinal.length; j++) {
        crearCelda("caja", resultadoFinal[j], { left: `${(j + m) * tamCel}px`, top: `${topResultado}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, borderTop: "2px #ddd solid", color: '#00ff00' });
    }
}

function resta(numerosAR) {
    let maxNumDecimales = Math.max(numerosAR[0][1], numerosAR[1][1]);
    let num1Padded = numerosAR[0][0].padEnd(numerosAR[0][0].length + maxNumDecimales - numerosAR[0][1], '0');
    let num2Padded = numerosAR[1][0].padEnd(numerosAR[1][0].length + maxNumDecimales - numerosAR[1][1], '0');

    let minuendoStr, sustraendoStr;
    let esNegativo = false;
    if (BigInt(num1Padded) >= BigInt(num2Padded)) {
        minuendoStr = num1Padded; sustraendoStr = num2Padded;
    } else {
        minuendoStr = num2Padded; sustraendoStr = num1Padded; esNegativo = true;
    }

    const maxLength = Math.max(minuendoStr.length, sustraendoStr.length);
    minuendoStr = minuendoStr.padStart(maxLength, '0');
    sustraendoStr = sustraendoStr.padStart(maxLength, '0');

    let llevadas = {}; let diferenciaArray = []; let llevada = 0;

    for (let i = maxLength - 1; i >= 0; i--) {
        let digitoMinuendo = parseInt(minuendoStr[i]) - llevada;
        let digitoSustraendo = parseInt(sustraendoStr[i]);
        llevada = 0;
        if (digitoMinuendo < digitoSustraendo) {
            llevada = 1;
            digitoMinuendo += 10;
            if (i > 0) { llevadas[i - 1] = "-1"; }
        }
        diferenciaArray[i] = digitoMinuendo - digitoSustraendo;
    }
    
    let diferencia = diferenciaArray.join('').replace(/^0+/, '') || "0";
   
    const displayMaxLength = Math.max(minuendoStr.length, sustraendoStr.length + 1, diferencia.length + (esNegativo ? 1 : 0));
    const minuendoFinal = minuendoStr.padStart(displayMaxLength, ' ');
    const sustraendoFinal = ("-" + sustraendoStr).padStart(displayMaxLength, ' ');
    const diferenciaFinal = (esNegativo ? "-" : "") + diferencia.padStart(displayMaxLength - (esNegativo ? 1 : 0), ' ');

    const alturaResta = 5;
    const maxDim = Math.max(alturaResta, displayMaxLength);
    const m = (alturaResta > displayMaxLength) ? (alturaResta - displayMaxLength) / 2 : 0;
    const tamCel = 0.95 * w / maxDim;
    const tamFuente = tamCel * multiplicadorTamFuente;

    for (const col in llevadas) {
        crearCelda("caja", llevadas[col], { left: `${(parseInt(col) + m) * tamCel}px`, top: `${0.25 * tamCel}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente * 0.7}px`, color: "red", textAlign: 'center' });
    }
    
    const filas = [minuendoFinal, sustraendoFinal, diferenciaFinal];
    const colores = ['#ffff00', '#ffff00', '#00ff00'];

    filas.forEach((numStr, i) => {
         const topOffset = (i <= 1) ? i + 1 : i + 2;
         for (let j = 0; j < numStr.length; j++) {
            if (numStr[j] !== ' ') {
                crearCelda("caja", numStr[j], { left: `${(j + m) * tamCel}px`, top: `${topOffset * tamCel}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, color: colores[i], borderTop: i === 2 ? "2px #ddd solid" : "none" });
            }
        }
    });
}

function multiplica(numerosAR) {
    // Implementación sin cambios, correcta
    const num1 = numerosAR[0][0]; const num2 = numerosAR[1][0]; const numDec1 = numerosAR[0][1]; const numDec2 = numerosAR[1][1];
    const maxNumDecimales = numDec1 + numDec2;

    if (num1 === "0" || num2 === "0") { salida.innerHTML = errorMessages.multiplicacion1; return; }
    const resultadoS = (BigInt(num1) * BigInt(num2)).toString();
    if (resultadoS.length > 20) { salida.innerHTML = errorMessages.multiplicacion2; return; }

    const anchuraMultiplicacion = Math.max(num1.length, num2.length + 1, resultadoS.length);
    const alturaMultiplicacion = (num2.length > 1) ? 3 + num2.length : 3;
    const maxDim = Math.max(alturaMultiplicacion, anchuraMultiplicacion);
    const m = (maxDim - anchuraMultiplicacion) / 2;
    const tamCel = 0.95 * w / maxDim;
    const tamFuente = tamCel * multiplicadorTamFuente;
    
    for (let i = 0; i < num1.length; i++) { crearCelda("caja3", num1[i], { left: `${(anchuraMultiplicacion - num1.length + i + m) * tamCel}px`, top: "0px", width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, }); }
    crearCelda("caja", "x", { left: `${(anchuraMultiplicacion - num2.length - 1 + m) * tamCel}px`, top: `${tamCel}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, color: "#ddd", borderBottom: "2px #ddd solid" });
    for (let i = 0; i < num2.length; i++) { crearCelda("caja3", num2[i], { left: `${(anchuraMultiplicacion - num2.length + i + m) * tamCel}px`, top: `${tamCel}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, borderBottom: "2px #ddd solid" }); }

    let fila = 2;
    if (num2.length > 1) {
        for (let i = num2.length - 1; i >= 0; i--) {
            let resultadoFila = (BigInt(num1) * BigInt(num2[i])).toString();
            let col = num2.length - 1 - i;
            for (let j = 0; j < resultadoFila.length; j++) { crearCelda("caja2", resultadoFila[j], { left: `${(anchuraMultiplicacion - resultadoFila.length + j - col + m) * tamCel}px`, top: `${fila * tamCel}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }); }
            fila++;
        }
    }
    
    const posResultadoY = (num2.length > 1 ? fila : 2) * tamCel;
    for (let i = 0; i < resultadoS.length; i++) { crearCelda("caja4", resultadoS[i], { left: `${(anchuraMultiplicacion - resultadoS.length + i + m) * tamCel}px`, top: `${posResultadoY}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, borderTop: "2px #ddd solid" }); }
}

function divide(numerosAR) {
    salida.innerHTML = "<p class='error'>Visualización de división no implementada.</p>";
}

function divideExt(numerosAR) {
    salida.innerHTML = "<p class='error'>Visualización de división extendida no implementada.</p>";
}

function desFacPri() {
    salida.innerHTML = "";
    const entrada = display.innerHTML;
    let numIzda = parseInt(entrada, 10);
    if (numIzda === 0) { salida.innerHTML = errorMessages.dFactorial1; bajarteclado(); return; }

    //... lógica de descomposición (correcta) ...
    let numIzdaArray = [numIzda]; let numDchaArray = []; let i = 2; let tempNum = numIzda;
    while (i <= tempNum) {
        if (tempNum % i === 0) { numDchaArray.push(i); tempNum /= i; numIzdaArray.push(tempNum); } else { i++; }
    }
    if(numIzdaArray[numIzdaArray.length-1] !== 1 && numIzdaArray.length > 1) { numIzdaArray.pop(); } else if(numIzdaArray.length === 1) { numDchaArray.push(numIzda); numIzdaArray.push(1); }
    const anchoIzda = numIzdaArray[0].toString().length; const anchoDcha = Math.max(...numDchaArray.map(n => n.toString().length));
    const anchuraPrimo = anchoIzda + anchoDcha; const alturaPrimo = numIzdaArray.length;
    const maxDim = Math.max(anchuraPrimo + 1, alturaPrimo);
    const m = (alturaPrimo > anchuraPrimo) ? (alturaPrimo - anchuraPrimo) / 2 : 0;
    const tamCel = 0.95 * w / maxDim; const tamFuente = tamCel * multiplicadorTamFuente;
    numIzdaArray.forEach((num, index) => { /* Dibuja lado izquierdo */ let numStr = num.toString().padStart(anchoIzda, ' '); for (let j = 0; j < numStr.length; j++) { crearCelda("caja2", numStr[j], { left: `${(j + m) * tamCel}px`, top: `${index * tamCel}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, borderRight: (j === numStr.length - 1) ? "2px #ddd solid" : "none", }); } });
    numDchaArray.forEach((num, index) => { /* Dibuja lado derecho */ let numStr = num.toString(); for (let j = 0; j < numStr.length; j++) { crearCelda("caja3", numStr[j], { left: `${(j + anchoIzda + m + 1) * tamCel}px`, top: `${index * tamCel}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, }); } });
    
    // Guardar en el historial
    const entry = { input: entrada, visualHtml: salida.innerHTML };
    HistoryManager.add(entry);
    bajarteclado();
}

function raizCuadrada() {
    salida.innerHTML = "<p class='error'>Visualización de raíz cuadrada no implementada.</p>";
    bajarteclado();
}


// --- MÓDULOS DE HISTORIAL ---

const HistoryManager = (function() {
    const STORAGE_KEY = 'calculatorHistory';
    let history = [];

    function load() {
        try { const storedHistory = localStorage.getItem(STORAGE_KEY); history = storedHistory ? JSON.parse(storedHistory) : []; }
        catch (e) { console.error("Error al cargar el historial:", e); history = []; }
    }
    function save() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); }
        catch (e) { console.error("Error al guardar el historial:", e); }
    }
    function notify() { window.dispatchEvent(new CustomEvent('historyUpdated')); }

    return {
        init: function() { load(); },
        add: function(entry) { history.unshift(entry); save(); notify(); },
        getAll: function() { return [...history]; },
        clear: function() { history = []; save(); notify(); }
    };
})();

// --- MODULO PROFESIONAL PARA CONTROLAR EL PANEL DE HISTORIAL (UI) ---
const HistoryPanel = (function() {
    let panel, list, toggleBtn, clearBtn;

    // Renderiza la lista de historial
    function render() {
        const historyData = HistoryManager.getAll();
        list.innerHTML = ''; // Limpia la lista actual

        if (historyData.length === 0) {
            list.innerHTML = '<li><span class="history-input">El historial está vacío.</span></li>';
            return;
        }

        historyData.forEach((entry, index) => {
            const li = document.createElement('li');
            li.setAttribute('data-history-index', index);
            
            // --- LÓGICA DE EXTRACCIÓN MEJORADA ---
            const resultNodeContainer = document.createElement('div');
            resultNodeContainer.innerHTML = entry.visualHtml;
            let resultText = '';

            // 1. Buscamos todas las celdas de resultado. Las identificamos por tener
            //    una línea superior (border-top) que las separa de la operación.
            const resultCells = resultNodeContainer.querySelectorAll("[style*='border-top']");
            
            if (resultCells.length > 0) {
                // Si encontramos celdas de resultado, unimos su texto.
                resultText = Array.from(resultCells)
                                  .map(cell => cell.textContent)
                                  .join('')
                                  .trim(); // Limpiamos espacios extra
            }
            
            // 2. Si no se encontró un resultado (p. ej., una operación de error), 
            //    buscamos un mensaje de error.
            if (!resultText) {
                resultText = resultNodeContainer.querySelector('p.error')?.textContent || '?';
            }

            // Si el resultado final sigue siendo un string vacío, usamos '?' como último recurso.
            resultText = resultText || '?';
            

            li.innerHTML = `
                <span class="history-input">${entry.input}</span>
                <span class="history-result-preview">= ${resultText}</span>
            `;
            list.appendChild(li);
        });
    }

    // Muestra/oculta el panel
    function toggle() {
        panel.classList.toggle('open');
    }

    // Maneja los clics dentro de la lista (para restaurar una operación)
    function onHistoryItemClick(event) {
        const item = event.target.closest('li[data-history-index]');
        if (!item) return;

        const index = item.dataset.historyIndex;
        const historyEntry = HistoryManager.getAll()[index];
        
        if (historyEntry) {
            display.innerHTML = historyEntry.input;
            salida.innerHTML = historyEntry.visualHtml;
            activadoBotones(historyEntry.input); // Actualiza estado de botones
            bajarteclado(); // Muestra el resultado
            toggle(); // Cierra el panel
        }
    }
    
    // Limpia el historial cuando se pulsa el botón
    function onClearClick() {
         if (confirm("¿Estás seguro de que quieres borrar todo el historial?")) {
            HistoryManager.clear();
        }
    }

    return {
        // Inicializa el panel, busca elementos y añade listeners
        init: function() {
            panel = document.getElementById('history-panel');
            list = document.getElementById('history-list');
            toggleBtn = document.getElementById('history-toggle-btn');
            clearBtn = document.getElementById('clear-history-btn');

            toggleBtn.addEventListener('click', toggle);
            clearBtn.addEventListener('click', onClearClick);
            list.addEventListener('click', onHistoryItemClick);
            
            // Escucha el evento global para saber cuándo renderizar
            window.addEventListener('historyUpdated', render);

            // Renderiza el estado inicial al cargar la página
            render();
        }
    };
})();