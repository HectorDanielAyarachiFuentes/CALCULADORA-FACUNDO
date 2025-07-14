// =======================================================
// --- CONSTANTES, VARIABLES GLOBALES Y ELEMENTOS DOM ---
// =======================================================
const multiplicadorTamFuente = 1;

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

// Objeto para almacenar el estado de la última división calculada.
let lastDivisionState = {
    operacionInput: '', // Ej. "6325/2"
    numerosAR: null,    // El array de operandos procesado por 'calcular'
    tipo: ''            // 'division'
};


// =======================================================
// --- FUNCIONES DE INICIO Y MANEJO DE LA CALCULADORA ---
// =======================================================

function alCargar() {
    document.getElementById("tpan").innerHTML = "Ver<br>Pantalla";
    document.getElementById("trai").innerHTML = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        style="width: 1.2em; height: 1.2em;">
          <path d="M4 12h2l4 8 4-16h8"></path>
      </svg>
    `;
    w = window.innerHeight / 1.93;

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
    HistoryManager.init();
    HistoryPanel.init();

    // NUEVO: Ocultar los botones de expansión al cargar la página
    hideDivExpansionButtons();
}

function escribir(t) {
    if (t === '/') {
        divext = false; // Resetear divext al iniciar una nueva división
    } else if (['+', '-', 'x', 'primos', 'raiz', 'c', 'del', ','].includes(t) || !isNaN(parseInt(t))) {
        // NUEVO: Si se escribe cualquier otra cosa (no una división), oculta los botones de expansión
        hideDivExpansionButtons();
    }


    if (t === "c") {
        display.innerHTML = "0";
    } else if (t === "del") {
        display.innerHTML = display.innerHTML.slice(0, -1) || "0";
    } else if (t === "primos") {
        desFacPri();
        return;
    } else if (t === "raiz") {
        raizCuadrada();
        return;
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
    const esSoloCero = contDisplay === '0';
    const tieneOperadorAlFinal = /[\+\-x/]$/.test(contDisplay);
    const tieneComaAlFinal = /,$/.test(contDisplay);
    const partes = contDisplay.split(/[\+\-x/]/);
    const ultimoNumero = partes[partes.length - 1];
    const demasiadosCaracteres = contDisplay.length >= 21;
    const ultimoNumeroDemasiadoLargo = ultimoNumero.length >= 15;

    const deshabilitarNumeros = demasiadosCaracteres || ultimoNumeroDemasiadoLargo;
    ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9'].forEach(id => {
        document.getElementById(id).disabled = deshabilitarNumeros;
    });

    const tieneOperadorGeneral = /[\+\-x/]/.test(contDisplay);
    const puedeAnadirOperador = !esSoloCero && !tieneOperadorGeneral && !tieneComaAlFinal;

    ['tmas', 'tmen', 'tpor', 'tdiv'].forEach(id => {
        document.getElementById(id).disabled = !puedeAnadirOperador || demasiadosCaracteres;
    });

    const esNumeroSolo = /^\d+$/.test(contDisplay) && !esSoloCero && !tieneOperadorGeneral; // Solo un número y no hay operadores
    document.getElementById("tpri").disabled = !esNumeroSolo;
    document.getElementById("trai").disabled = !esNumeroSolo;


    const puedeAnadirComa = !ultimoNumero.includes(',') && !tieneOperadorAlFinal && !deshabilitarNumeros;
    document.getElementById("tcom").disabled = !puedeAnadirComa;

    const esCalculable = tieneOperadorGeneral && !tieneOperadorAlFinal && !tieneComaAlFinal;
    document.getElementById("tcal").disabled = !esCalculable;
}

// NUEVO: Funciones auxiliares para controlar la visibilidad de los botones de expansión
function showDivExpansionButtons() {
    botExp.style.display = divext ? "none" : "inline-block";
    botNor.style.display = divext ? "inline-block" : "none";
}

function hideDivExpansionButtons() {
    botExp.style.display = "none";
    botNor.style.display = "none";
}

// --- NAVEGACIÓN Y LÓGICA DE LA INTERFAZ ---
function bajarteclado() { teclado.style.top = "100%"; salida.style.top = "0%"; divVolver.style.top = "0%"; }
function subirteclado() { teclado.style.top = "0%"; salida.style.top = "-100%"; divVolver.style.top = "-100%"; }

function divideExpandida(esExpandida) {
    divext = esExpandida;

    showDivExpansionButtons(); // Asegura que se muestren con el estado correcto

    if (!lastDivisionState.numerosAR || lastDivisionState.tipo !== 'division') {
        console.warn("No hay una división previa para expandir/normalizar. Realiza una división primero.");
        salida.innerHTML = "<p class='error'>Primero realiza una división para usar esta función.</p>";
        bajarteclado();
        return;
    }

    if (divext) {
        divideExt(lastDivisionState.numerosAR);
    } else {
        divide(lastDivisionState.numerosAR);
    }
    bajarteclado();
}


// ======================================
// --- FUNCIONES DE CÁLCULO VISUAL ---
// ======================================

function calcular() {
    const entrada = display.innerHTML;
    const operadorMatch = entrada.match(/[\+\-x/]/);

    if (!operadorMatch) {
        salida.innerHTML = "<p class='error'>Operación inválida.</p>";
        bajarteclado();
        hideDivExpansionButtons(); // Ocultar si no es una operación válida
        return;
    }

    const operador = operadorMatch[0];
    const numAr = entrada.split(operador);

    const numerosAR = numAr.map(numStr => {
        let limpio = numStr.replace(/^0+(?!\b|,)/, '');
        if (limpio === '') limpio = '0';
        if (limpio.startsWith(',')) limpio = '0' + limpio;
        const p = limpio.indexOf(",") + 1;
        const d = p > 0 ? limpio.length - p : 0;
        const v = limpio.replace(",", "");
        return [v || "0", d];
    });

    salida.innerHTML = "";

    let operacionGuardadaEnHistorial = false;

    switch (operador) {
        case "+":
            suma(numerosAR);
            operacionGuardadaEnHistorial = true;
            hideDivExpansionButtons(); // No es una división
            break;
        case "-":
            resta(numerosAR);
            operacionGuardadaEnHistorial = true;
            hideDivExpansionButtons(); // No es una división
            break;
        case "x":
            multiplica(numerosAR);
            operacionGuardadaEnHistorial = true;
            hideDivExpansionButtons(); // No es una división
            break;
        case "/":
            lastDivisionState.operacionInput = entrada;
            lastDivisionState.numerosAR = numerosAR;
            lastDivisionState.tipo = 'division';
            lastDivisionState.isExpanded = divext;

            if (divext) {
                divideExt(numerosAR);
            } else {
                divide(numerosAR);
            }

            if (!salida.innerHTML.includes("<p class='error'>")) {
                operacionGuardadaEnHistorial = true;
                showDivExpansionButtons(); // Mostrar los botones si es una división exitosa
            } else {
                hideDivExpansionButtons(); // Ocultar si hay un error en la división
            }
            break;
    }

    if (operacionGuardadaEnHistorial) {
        HistoryManager.add({ input: entrada, visualHtml: salida.innerHTML });
    }

    bajarteclado();
    activadoBotones(display.innerHTML); // Volver a evaluar el estado de los botones
}

function formatResultForDisplay(htmlContent) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const resultCells = tempDiv.querySelectorAll('.caja4');
    if (resultCells.length > 0) {
        return Array.from(resultCells).map(cell => cell.textContent).join('').replace(/\s/g, '');
    } else {
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        return textContent.replace(/[\n\r\t]/g, '').trim();
    }
}


function crearCelda(clase, texto, estilos) {
    const celda = document.createElement("div");
    celda.className = clase;
    celda.innerHTML = texto;
    Object.assign(celda.style, estilos);
    salida.appendChild(celda);
}

function crearFlechaLlevada(left, top, width, height) {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("width", width);
    s.setAttribute("height", height);
    s.style.position = "absolute";
    s.style.left = `${left}px`;
    s.style.top = `${top}px`;
    s.style.overflow = "visible";
    const d = document.createElementNS("http://www.w3.org/2000/svg", "defs"),
        m = document.createElementNS("http://www.w3.org/2000/svg", "marker"),
        i = "arrowhead-" + Math.random().toString(36).substring(2, 9);
    m.setAttribute("id", i);
    m.setAttribute("viewBox", "0 0 10 10");
    m.setAttribute("refX", 8);
    m.setAttribute("refY", 5);
    m.setAttribute("markerWidth", 5);
    m.setAttribute("markerHeight", 5);
    m.setAttribute("orient", "auto-start-reverse");
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    p.setAttribute("fill", "#ff5555");
    m.appendChild(p);
    d.appendChild(m);
    s.appendChild(d);
    const h = document.createElementNS("http://www.w3.org/2000/svg", "path"),
        x1 = width * 0.9, y1 = height, cx = width * 0.1, cy = height, x2 = width * 0.2, y2 = height * 0.15;
    h.setAttribute("d", `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
    h.setAttribute("stroke", "#ff5555");
    h.setAttribute("stroke-width", 2.5);
    h.setAttribute("stroke-linecap", "round");
    h.setAttribute("fill", "none");
    h.setAttribute("marker-end", `url(#${i})`);
    s.appendChild(h);
    salida.appendChild(s);
    const l = h.getTotalLength();
    h.style.strokeDasharray = l;
    h.style.strokeDashoffset = l;
    h.style.transition = "stroke-dashoffset .8s cubic-bezier(0.68, -0.55, 0.27, 1.55)";
    requestAnimationFrame(() => { h.style.strokeDashoffset = "0"; });
}

function suma(numerosAR) {
    salida.innerHTML = "";
    let maxDecimales = 0;
    numerosAR.forEach(n => maxDecimales = Math.max(maxDecimales, n[1]));
    let operandos = numerosAR.map(n => n[0].padEnd(n[0].length + maxDecimales - n[1], '0'));

    let longitudMaxOperandos = Math.max(...operandos.map(n => n.length));
    let operandosCalculo = operandos.map(n => n.padStart(longitudMaxOperandos, '0'));
    let total = 0n;
    operandosCalculo.forEach(n => total += BigInt(n));
    let resultado = total.toString();

    let anchoGrid = Math.max(resultado.length, longitudMaxOperandos + 1);
    let altoGrid = numerosAR.length + 3;
    let dimensionMax = Math.max(altoGrid, anchoGrid);
    let offsetHorizontal = (dimensionMax > anchoGrid) ? (dimensionMax - anchoGrid) / 2 : 0;
    let tamCelda = 0.95 * w / dimensionMax;
    let tamFuente = tamCelda * multiplicadorTamFuente;

    let llevadas = {};
    let carry = 0;
    for (let i = longitudMaxOperandos - 1; i >= 0; i--) {
        let sumaColumna = carry;
        operandosCalculo.forEach(n => { sumaColumna += parseInt(n[i] || '0') });
        carry = Math.floor(sumaColumna / 10);
        if (carry > 0) {
            let posLlevada = i - 1 + (anchoGrid - longitudMaxOperandos);
            if (posLlevada >= 0) {
                llevadas[posLlevada] = carry.toString();
                let topFlecha = 1.5 + numerosAR.length - 1 + 0.5;
                let topLlevada = .8;
                let altoFlecha = topFlecha * tamCelda - topLlevada * tamCelda;
                let anchoFlecha = tamCelda * .7;
                let leftFlecha = (posLlevada + offsetHorizontal + .3) * tamCelda;
                crearFlechaLlevada(leftFlecha, topLlevada * tamCelda, anchoFlecha, altoFlecha);
            }
        }
    }

    let yOffsetBase = 1.5;
    for (const pos in llevadas) {
        crearCelda("caja", llevadas[pos], {
            left: `${(parseInt(pos) + offsetHorizontal) * tamCelda}px`, top: `.1em`,
            width: `${tamCelda}px`, height: `${tamCelda}px`,
            fontSize: tamFuente * .7 + 'px', color: "red", textAlign: 'center'
        });
    }

    operandos.forEach((numStr, index) => {
        for (let i = 0; i < numStr.length; i++) {
            crearCelda("caja3", numStr[i], {
                left: `${(anchoGrid - numStr.length + i + offsetHorizontal) * tamCelda}px`,
                top: `${(index + yOffsetBase) * tamCelda}px`,
                width: `${tamCelda}px`, height: `${tamCelda}px`,
                fontSize: `${tamFuente}px`, color: '#ffff00'
            });
        }
    });

    let yResultado = (yOffsetBase + operandos.length) * tamCelda;
    for (let i = 0; i < resultado.length; i++) {
        crearCelda("caja4", resultado[i], {
            left: `${(anchoGrid - resultado.length + i + offsetHorizontal) * tamCelda}px`,
            top: `${yResultado}px`,
            width: `${tamCelda}px`, height: `${tamCelda}px`,
            fontSize: `${tamFuente}px`, borderTop: "2px #ddd solid", color: '#00ff00'
        });
    }
}

function resta(numerosAR) {
    salida.innerHTML = "";
    let m = Math.max(numerosAR[0][1], numerosAR[1][1]);
    let n1 = numerosAR[0][0].padEnd(numerosAR[0][0].length + m - numerosAR[0][1], '0');
    let n2 = numerosAR[1][0].padEnd(numerosAR[1][0].length + m - numerosAR[1][1], '0');
    let r = (BigInt(n1) - BigInt(n2)).toString();
    const h = 3;
    let a = Math.max(n1.length, n2.length + 1, r.length);
    let m_grid = Math.max(h, a);
    let g = (m_grid - a) / 2;
    let e = 0.95 * w / m_grid;
    let f = e * multiplicadorTamFuente;

    for (let i = 0; i < n1.length; i++) {
        crearCelda("caja3", n1[i], { left: `${(a - n1.length + i + g) * e}px`, top: "0px", width: `${e}px`, height: `${e}px`, fontSize: f + 'px', color: '#ffff00' });
    }
    crearCelda("caja", "-", { left: `${(a - n2.length - 1 + g) * e}px`, top: `${e}px`, width: `${e}px`, height: `${e}px`, fontSize: f + 'px', color: "#ffff00" });
    for (let i = 0; i < n2.length; i++) {
        crearCelda("caja3", n2[i], { left: `${(a - n2.length + i + g) * e}px`, top: `${e}px`, width: `${e}px`, height: `${e}px`, fontSize: f + 'px', color: '#ffff00' });
    }
    let topPosResult = 2 * e;
    for (let i = 0; i < r.length; i++) {
        crearCelda("caja4", r[i], { left: `${(a - r.length + i + g) * e}px`, top: `${topPosResult}px`, width: `${e}px`, height: `${e}px`, fontSize: f + 'px', borderTop: "2px #ddd solid", color: '#00ff00' });
    }
}

function multiplica(numerosAR) {
    salida.innerHTML = "";
    const num1 = numerosAR[0][0];
    const num2 = numerosAR[1][0];
    const numDec1 = numerosAR[0][1];
    const numDec2 = numerosAR[1][1];
    const maxNumDecimales = numDec1 + numDec2;

    if (num1 === "0" || num2 === "0") {
        salida.innerHTML = errorMessages.multiplicacion1; return;
    }

    const resultadoS = (BigInt(num1) * BigInt(num2)).toString();
    if (resultadoS.length > 20) {
        salida.innerHTML = errorMessages.multiplicacion2; return;
    }

    const anchuraMultiplicacion = Math.max(num1.length, num2.length + 1, resultadoS.length);
    const alturaMultiplicacion = (num2.length > 1) ? 3 + num2.length : 3;
    const maxDim = Math.max(alturaMultiplicacion, anchuraMultiplicacion);
    const m = (maxDim - anchuraMultiplicacion) / 2;
    const tamCel = 0.95 * w / maxDim;
    const tamFuente = tamCel * multiplicadorTamFuente;

    for (let i = 0; i < num1.length; i++) {
        crearCelda("caja3", num1[i], {
            left: `${(anchuraMultiplicacion - num1.length + i + m) * tamCel}px`, top: "0px",
            width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`,
        });
    }
    if (numDec1 > 0) crearCelda("caja", ",", { right: `${(numDec1 + m - 0.5) * tamCel}px`, top: "0px", width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` });

    crearCelda("caja", "x", {
        left: `${(anchuraMultiplicacion - num2.length - 1 + m) * tamCel}px`, top: `${tamCel}px`,
        width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, color: "#ddd", borderBottom: "2px #ddd solid"
    });
    for (let i = 0; i < num2.length; i++) {
        crearCelda("caja3", num2[i], {
            left: `${(anchuraMultiplicacion - num2.length + i + m) * tamCel}px`, top: `${tamCel}px`,
            width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, borderBottom: "2px #ddd solid"
        });
    }
    if (numDec2 > 0) crearCelda("caja", ",", { right: `${(numDec2 + m - 0.5) * tamCel}px`, top: `${tamCel}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` });

    let fila = 2;
    if (num2.length > 1) {
        for (let i = num2.length - 1; i >= 0; i--) {
            let resultadoFila = (BigInt(num1) * BigInt(num2[i])).toString();
            let col = num2.length - 1 - i;
            for (let j = 0; j < resultadoFila.length; j++) {
                crearCelda("caja2", resultadoFila[j], {
                    left: `${(anchuraMultiplicacion - resultadoFila.length + j - col + m) * tamCel}px`, top: `${fila * tamCel}px`,
                    width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`,
                    borderTop: (i === num2.length - 1) ? "2px #ddd solid" : "none"
                });
            }
            fila++;
        }
    }

    const posResultadoY = (num2.length > 1 ? fila : 2) * tamCel;
    for (let i = 0; i < resultadoS.length; i++) {
        crearCelda("caja4", resultadoS[i], {
            left: `${(anchuraMultiplicacion - resultadoS.length + i + m) * tamCel}px`, top: `${posResultadoY}px`,
            width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, borderTop: "2px #ddd solid"
        });
    }
    if (maxNumDecimales > 0) crearCelda("caja", ",", { right: `${(maxNumDecimales + m - 0.5) * tamCel}px`, top: `${posResultadoY}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` });
}

function divide(numerosAR) {
    salida.innerHTML = "";
    // Se asegura que los botones estén en el estado "normal" (DIV EXPAND. visible)
    // Esto lo maneja showDivExpansionButtons() en calcular() y divideExpandida().
    // botExp.style.display = "inline-block"; // Ya no se controla aquí directamente
    // botNor.style.display = "none";

    let num1Str = numerosAR[0][0], num2Str = numerosAR[1][0];
    let numDec1 = numerosAR[0][1], numDec2 = numerosAR[1][1];

    if (BigInt(num2Str) === 0n) {
        salida.innerHTML = BigInt(num1Str) === 0n ? errorMessages.division3 : errorMessages.division2;
        return;
    }
    if (BigInt(num1Str) === 0n) {
        salida.innerHTML = errorMessages.division1;
        return;
    }

    if (numDec2 > numDec1) {
        num1Str = num1Str.padEnd(num1Str.length + (numDec2 - numDec1), '0');
        numDec1 = numDec2;
    }
    let decimalesDividendo = numDec1 - numDec2;
    let resultado = (BigInt(num1Str) / BigInt(num2Str)).toString();

    while (resultado.length < decimalesDividendo + 1) {
        resultado = "0" + resultado;
    }

    const longitudSalida = 1 + Math.max(num1Str.length + num2Str.length, num1Str.length + resultado.length);
    const tamCel = 0.95 * w / longitudSalida;
    const tamFuente = tamCel * multiplicadorTamFuente;

    let d = "";
    let fila = 0;
    const numAr = [ [num1Str, fila, num1Str.length] ];
    fila++;

    for (let col = 0; col < num1Str.length; col++) {
        d += num1Str[col];
        if (BigInt(d) >= BigInt(num2Str)) {
            d = (BigInt(d) % BigInt(num2Str)).toString();
            if (col + 1 < num1Str.length) {
                let numero = d + num1Str[col + 1];
                if (numero.length < num2Str.length + 1) numero = "0" + numero;
                numAr.push([numero, fila, col + 2]);
            } else {
                numAr.push([d.toString(), fila, col + 1]);
            }
            fila++;
        }
    }

    numAr.forEach((item, i) => {
        const num = item[0], filaActual = item[1], colFin = item[2];
        for (let j = 0; j < num.length; j++) {
            const col = colFin - num.length + j;
            crearCelda(i === 0 ? "caja" : "caja2", num[j], {
                left: `${col * tamCel}px`, top: `${filaActual * tamCel}px`,
                width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`,
            });
        }
    });
    if (decimalesDividendo > 0) {
        crearCelda("caja", ",", {
            left: `${(num1Str.length - decimalesDividendo - 0.5) * tamCel}px`, top: "0px",
            width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`,
        });
    }

    const inicioNum2 = 1 + num1Str.length;
    for (let i = 0; i < num2Str.length; i++) {
        crearCelda("caja3", num2Str[i], {
            left: `${(inicioNum2 + i) * tamCel}px`, top: "0px",
            width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`,
            borderLeft: i === 0 ? "2px #ddd solid" : "none",
            borderBottom: "2px #ddd solid",
        });
    }

    const inicioResultado = 1 + num1Str.length;
    for (let i = 0; i < resultado.length; i++) {
        crearCelda("caja4", resultado[i], {
            left: `${(inicioResultado + i) * tamCel}px`, top: `${tamCel}px`,
            width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`,
            borderTop: "2px #ddd solid",
        });
    }
    if (decimalesDividendo > 0) {
        crearCelda("caja", ",", {
            left: `${(inicioResultado + resultado.length - decimalesDividendo - 0.5) * tamCel}px`, top: `${tamCel}px`,
            width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`,
        });
    }
}

function divideExt(numerosAR) {
    salida.innerHTML = "";
    // Se asegura que los botones estén en el estado "expandido" (DIV NORMAL visible)
    // Esto lo maneja showDivExpansionButtons() en calcular() y divideExpandida().
    // botExp.style.display = "none"; // Ya no se controla aquí directamente
    // botNor.style.display = "inline-block";

    let num1Str = numerosAR[0][0], num2Str = numerosAR[1][0];
    let numDec1 = numerosAR[0][1], numDec2 = numerosAR[1][1];

    if (BigInt(num2Str) === 0n) {
        salida.innerHTML = BigInt(num1Str) === 0n ? errorMessages.division3 : errorMessages.division2;
        return;
    }
    if (BigInt(num1Str) === 0n) {
        salida.innerHTML = errorMessages.division1;
        return;
    }

    if (numDec2 > numDec1) {
        num1Str = num1Str.padEnd(num1Str.length + (numDec2 - numDec1), '0');
        numDec1 = numDec2;
    }
    let decimalesDividendo = numDec1 - numDec2;
    let resultado = (BigInt(num1Str) / BigInt(num2Str)).toString();
    while (resultado.length < decimalesDividendo + 1) {
        resultado = "0" + resultado;
    }

    const longitudSalida = 2 + Math.max(num1Str.length + num2Str.length, num1Str.length + resultado.length);
    const tamCel = 0.95 * w / longitudSalida;
    const tamFuente = tamCel * multiplicadorTamFuente;

    const restas = [], posUltCif = [];
    let dividendoParcialStr = "";

    for (let i = 0; i < num1Str.length; i++) {
        dividendoParcialStr += num1Str[i];
        let cocienteParcialStr = (BigInt(dividendoParcialStr) / BigInt(num2Str)).toString();

        if (BigInt(cocienteParcialStr) > 0 || (cocienteParcialStr === '0' && i > 0)) {
            let aRestar = (BigInt(cocienteParcialStr) * BigInt(num2Str)).toString();
            restas.push(aRestar);
            posUltCif.push(i + 1);
            dividendoParcialStr = (BigInt(dividendoParcialStr) % BigInt(num2Str)).toString();
        }
    }

    crearCelda("caja", num1Str, {
        left: `${tamCel}px`, top: `0px`,
        width: `${num1Str.length * tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`,
        textAlign: 'right'
    });

    let topOffset = 1, restoAnterior = "";
    for (let i = 0; i < restas.length; i++) {
        let aRestarStr = "-" + restas[i];
        let colResta = (posUltCif[i] + 1 - aRestarStr.length) * tamCel;

        crearCelda("caja3 ra", aRestarStr, {
            left: `${colResta}px`, top: `${topOffset * tamCel}px`,
            width: `${aRestarStr.length * tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`,
            textAlign: 'right'
        });
        topOffset++;

        let dividendoParcial = restoAnterior + num1Str.substring(i === 0 ? 0 : posUltCif[i - 1], posUltCif[i]);
        let restoActual = (BigInt(dividendoParcial) - BigInt(restas[i])).toString();
        let colResto = (posUltCif[i] + 1 - restoActual.length) * tamCel;

        crearCelda("caja2", restoActual, {
            left: `${colResto}px`, top: `${topOffset * tamCel}px`,
            width: `${restoActual.length * tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`,
            textAlign: 'right', borderTop: '2px #ddd solid'
        });
        restoAnterior = restoActual;
    }

    if (decimalesDividendo > 0) {
        crearCelda("caja", ",", {
            left: `${(num1Str.length - decimalesDividendo + 0.5) * tamCel}px`, top: "0px",
            width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`,
        });
    }

    const inicioNum2 = 2 + num1Str.length;
    for (let i = 0; i < num2Str.length; i++) {
        crearCelda("caja3", num2Str[i], {
            left: `${(inicioNum2 + i) * tamCel}px`, top: "0px",
            width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`,
            borderLeft: i === 0 ? "2px #ddd solid" : "none", borderBottom: "2px #ddd solid",
        });
    }
    const inicioResultado = 2 + num1Str.length;
    for (let i = 0; i < resultado.length; i++) {
        crearCelda("caja4", resultado[i], {
            left: `${(inicioResultado + i) * tamCel}px`, top: `${tamCel}px`,
            width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, borderTop: "2px #ddd solid",
        });
    }
    if (decimalesDividendo > 0) {
        crearCelda("caja", ",", {
            left: `${(inicioResultado + resultado.length - decimalesDividendo - 0.5) * tamCel}px`, top: `${tamCel}px`,
            width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`,
        });
    }
}

function desFacPri() {
    salida.innerHTML = "";
    const entrada = display.innerHTML;
    let numIzda = parseInt(entrada, 10);
    if (isNaN(numIzda) || numIzda === 0) {
        salida.innerHTML = errorMessages.dFactorial1;
        bajarteclado();
        hideDivExpansionButtons(); // Ocultar si no es una operación de división
        return;
    }
    let numIzdaArray = [numIzda], numDchaArray = [], i = 2, tempNum = numIzda;
    while (i <= tempNum) {
        if (tempNum % i === 0) {
            numDchaArray.push(i);
            tempNum /= i;
            numIzdaArray.push(tempNum);
        } else {
            i++;
        }
    }
    if (numIzdaArray[numIzdaArray.length - 1] !== 1 && numIzdaArray.length > 1) {
        numIzdaArray.pop();
    } else if (numIzdaArray.length === 1) {
        numDchaArray.push(numIzda);
        numIzdaArray.push(1);
    }
    const aI = numIzdaArray[0].toString().length,
        aD = Math.max(...numDchaArray.map(n => n.toString().length)),
        aP = aI + aD,
        hP = numIzdaArray.length,
        mD = Math.max(aP + 1, hP),
        m = (hP > aP) ? (hP - aP) / 2 : 0,
        tC = 0.95 * w / mD,
        tF = tC * multiplicadorTamFuente;
    numIzdaArray.forEach((n, i) => {
        let s = n.toString().padStart(aI, ' ');
        for (let j = 0; j < s.length; j++) {
            crearCelda("caja2", s[j], { left: `${(j + m) * tC}px`, top: `${i * tC}px`, width: `${tC}px`, height: `${tC}px`, fontSize: `${tF}px`, borderRight: j === s.length - 1 ? "2px #ddd solid" : "none" });
        }
    });
    numDchaArray.forEach((n, i) => {
        let s = n.toString();
        for (let j = 0; j < s.length; j++) {
            crearCelda("caja3", s[j], { left: `${(j + aI + m + 1) * tC}px`, top: `${i * tC}px`, width: `${tC}px`, height: `${tC}px`, fontSize: `${tF}px` });
        }
    });
    HistoryManager.add({ input: entrada, visualHtml: salida.innerHTML });
    bajarteclado();
    hideDivExpansionButtons(); // Ocultar si no es una operación de división
}

// ===================================================================
// --- MÓDULOS DE HISTORIAL ---
// ===================================================================

const HistoryManager = (function() {
    const HISTORY_KEY = "calculatorHistory";
    let history = [];

    function loadHistory() {
        try {
            const storedHistory = localStorage.getItem(HISTORY_KEY);
            history = storedHistory ? JSON.parse(storedHistory) : [];
        } catch (error) {
            console.error("Error al cargar el historial desde localStorage:", error);
            history = [];
        }
    }

    function saveHistory() {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error("Error al guardar el historial en localStorage:", error);
        }
    }

    function dispatchEvent(eventName, detail) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    return {
        init: function() { loadHistory(); },
        add: function(entry) {
            const existingIndex = history.findIndex(item => item.input === entry.input);
            if (existingIndex > -1) {
                alert("¡Oye, chamaco! Esa operación ya está en tu historial.");
                dispatchEvent("history:duplicate", { index: existingIndex });
            } else {
                history.unshift(entry);
                saveHistory();
                dispatchEvent("history:updated");
            }
        },
        getAll: function() { return [...history]; },
        clear: function() {
            history = [];
            saveHistory();
            dispatchEvent("history:updated");
        }
    };
})();

const HistoryPanel = (function() {
    let panelElement, listElement, toggleButton, clearButton;

    function renderHistory() {
        const historyEntries = HistoryManager.getAll();
        listElement.innerHTML = "";

        if (historyEntries.length === 0) {
            listElement.innerHTML = '<li><span class="history-input">El historial está vacío.</span></li>';
            return;
        }

        historyEntries.forEach((entry, index) => {
            const listItem = document.createElement("li");
            listItem.setAttribute("data-history-index", index);

            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = entry.visualHtml;

            const resultCells = tempDiv.querySelectorAll('.caja4');
            let resultText;

            if (resultCells.length > 0) {
                resultText = Array.from(resultCells).map(cell => cell.textContent).join('').trim();
            } else {
                resultText = tempDiv.textContent.trim();
            }

            resultText = resultText || "?";

            listItem.innerHTML = `<span class="history-input">${entry.input}</span><span class="history-result-preview">= ${resultText}</span>`;
            listElement.appendChild(listItem);
        });
    }

    function togglePanel() { panelElement.classList.toggle("open"); }

    function handleItemClick(event) {
        const clickedItem = event.target.closest("li[data-history-index]");
        if (!clickedItem) return;
        const index = clickedItem.dataset.historyIndex;
        const historyEntry = HistoryManager.getAll()[index];
        if (historyEntry) {
            display.innerHTML = historyEntry.input;
            salida.innerHTML = historyEntry.visualHtml;

            // NUEVO: Al cargar del historial, se evalúa si es una división
            const esDivision = historyEntry.input.includes('/');
            if (esDivision) {
                const numAr = historyEntry.input.split('/');
                const numerosAR = numAr.map(numStr => {
                    let limpio = numStr.replace(/^0+(?!\b|,)/, '');
                    if (limpio === '') limpio = '0';
                    if (limpio.startsWith(',')) limpio = '0' + limpio;
                    const p = limpio.indexOf(",") + 1;
                    const d = p > 0 ? limpio.length - p : 0;
                    const v = limpio.replace(",", "");
                    return [v || "0", d];
                });
                lastDivisionState.operacionInput = historyEntry.input;
                lastDivisionState.numerosAR = numerosAR;
                lastDivisionState.tipo = 'division';

                // Determinar el estado de 'divext' para la visualización del historial
                // Por defecto, mostrará la división normal al cargar del historial,
                // a menos que quieras guardar el estado de expansión en el historial también.
                divext = false; // Asumimos visualización normal al cargar del historial
                showDivExpansionButtons(); // Mostrar los botones de expansión
                divide(lastDivisionState.numerosAR); // Redibujar la división en modo normal
            } else {
                // Si no es una división, ocultar los botones de expansión
                lastDivisionState.operacionInput = '';
                lastDivisionState.numerosAR = null;
                lastDivisionState.tipo = '';
                hideDivExpansionButtons();
            }

            activadoBotones(historyEntry.input);
            bajarteclado();
            togglePanel();
        }
    }

    function handleClearClick() {
        if (confirm("¿Seguro que quieres borrar todo el historial?")) {
            HistoryManager.clear();
            hideDivExpansionButtons(); // Ocultar si se borra el historial y no hay más divisiones
        }
    }

    function handleDuplicate(event) {
        const { index } = event.detail;
        if (!panelElement.classList.contains("open")) {
            togglePanel();
        }
        const itemToHighlight = listElement.querySelector(`li[data-history-index="${index}"]`);
        if (itemToHighlight) {
            itemToHighlight.classList.remove("history-item-highlight");
            void itemToHighlight.offsetWidth;
            itemToHighlight.classList.add("history-item-highlight");
        }
    }

    return {
        init: function() {
            panelElement = document.getElementById("history-panel");
            listElement = document.getElementById("history-list");
            toggleButton = document.getElementById("history-toggle-btn");
            clearButton = document.getElementById("clear-history-btn");
            toggleButton.addEventListener("click", togglePanel);
            clearButton.addEventListener("click", handleClearClick);
            listElement.addEventListener("click", handleItemClick);
            window.addEventListener("history:updated", renderHistory);
            window.addEventListener("history:duplicate", handleDuplicate);
            renderHistory();
        }
    };
})();

// =======================================================
// --- FUNCIÓN DE RAÍZ CUADRADA (CORREGIDA Y SIMPLIFICADA) ---
// =======================================================
function raizCuadrada() {
    salida.innerHTML = "";
    const entrada = display.innerHTML;
    const numero = parseInt(entrada, 10);

    if (entrada.includes('+') || entrada.includes('-') || entrada.includes('x') || entrada.includes('/')) {
        salida.innerHTML = "<p class='error'>Esta función solo acepta un número simple.</p>";
        bajarteclado();
        hideDivExpansionButtons();
        return;
    }

    if (isNaN(numero) || entrada.includes(',')) {
        salida.innerHTML = "<p class='error'>La raíz cuadrada solo funciona con números enteros.</p>";
        bajarteclado();
        hideDivExpansionButtons();
        return;
    }
    if (numero === 0) {
        salida.innerHTML = errorMessages.raiz1;
        HistoryManager.add({ input: `√(${entrada})`, visualHtml: salida.innerHTML });
        bajarteclado();
        hideDivExpansionButtons();
        return;
    }
     if (numero < 0) {
        salida.innerHTML = "<p class='error'>No se puede calcular la raíz de un número negativo.</p>";
        bajarteclado();
        hideDivExpansionButtons();
        return;
    }

    const resultado = Math.sqrt(numero);

    if (resultado % 1 !== 0) {
        salida.innerHTML = "<p class='error'>Este número no tiene una raíz cuadrada entera exacta.</p>";
        bajarteclado();
        hideDivExpansionButtons();
        return;
    }

    const htmlResultado = `<p>${resultado}</p>`;
    salida.innerHTML = htmlResultado;

    HistoryManager.add({
        input: `√(${entrada})`,
        visualHtml: htmlResultado
    });

    bajarteclado();
    hideDivExpansionButtons(); // Ocultar después de calcular la raíz
}