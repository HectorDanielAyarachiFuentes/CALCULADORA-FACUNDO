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


// =======================================================
// --- FUNCIONES DE INICIO Y MANEJO DE LA CALCULADORA ---
// =======================================================

function alCargar() {
    document.getElementById("tpan").innerHTML = "Ver<br>Pantalla";
    document.getElementById("trai").innerHTML = "RC";

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

    ['tmas', 'tmen', 'tpor', 'tdiv', 'trai'].forEach(id => {
        document.getElementById(id).disabled = !puedeAnadirOperador || demasiadosCaracteres;
    });

    const puedeAnadirComa = !ultimoNumero.includes(',') && !tieneOperadorAlFinal && !deshabilitarNumeros;
    document.getElementById("tcom").disabled = !puedeAnadirComa;
    
    const esCalculable = tieneOperadorGeneral && !tieneOperadorAlFinal && !tieneComaAlFinal;
    document.getElementById("tcal").disabled = !esCalculable;

    const esFactorizable = !tieneOperadorGeneral && /^\d+$/.test(contDisplay) && !esSoloCero && contDisplay.length <= 8;
    document.getElementById("tpri").disabled = !esFactorizable;
}

// --- NAVEGACIÓN Y LÓGICA DE LA INTERFAZ ---
function bajarteclado() { teclado.style.top = "100%"; salida.style.top = "0%"; divVolver.style.top = "0%"; }
function subirteclado() { teclado.style.top = "0%"; salida.style.top = "-100%"; divVolver.style.top = "-100%"; }
function divideExpandida(esExpandida) { divext = esExpandida; botExp.style.display = esExpandida ? "none" : "inline-block"; botNor.style.display = esExpandida ? "inline-block" : "none"; calcular(); }


// ======================================
// --- FUNCIONES DE CÁLCULO VISUAL ---
// ======================================
function calcular() {
    const entrada = display.innerHTML; const operadorMatch = entrada.match(/[\+\-x/]/); if (!operadorMatch) return;
    const operador = operadorMatch[0]; const numAr = entrada.split(operador);
    const numerosAR = numAr.map(numStr => { let limpio = numStr.replace(/^0+(?!\b|,)/, ''); if (limpio.startsWith(',')) limpio = '0' + limpio; const p = limpio.indexOf(",")+1; const d = p>0?limpio.length-p:0; const v=limpio.replace(",",""); return [v||"0",d]; });
    salida.innerHTML = "";
    switch (operador) { case "+": suma(numerosAR); break; case "-": resta(numerosAR); break; case "x": multiplica(numerosAR); break; case "/": divext?divideExt(numerosAR):divide(numerosAR); break; }
    if (!salida.innerHTML.includes("<p class='error'>")) { HistoryManager.add({ input: entrada, visualHtml: salida.innerHTML }); }
    bajarteclado();
}
function crearCelda(clase, texto, estilos) { const c=document.createElement("div");c.className=clase;c.innerHTML=texto;Object.assign(c.style,estilos);salida.appendChild(c); }

// --- FUNCIÓN RESTAURADA Y CORREGIDA ---
// Se restaura la función para dibujar las flechas con su animación.
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
        x1 = width * 0.9,
        y1 = height,
        cx = width * 0.1,
        cy = height,
        x2 = width * 0.2,
        y2 = height * 0.15;
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
    requestAnimationFrame(() => {
        h.style.strokeDashoffset = "0";
    });
}

function suma(numerosAR) { let m=0;numerosAR.forEach(n=>m=Math.max(m,n[1]));let s=numerosAR.map(n=>n[0].padEnd(n[0].length+m-n[1],'0')),l=Math.max(...s.map(n=>n.length)),c=s.map(n=>n.padStart(l,'0'));let t=0n;c.forEach(n=>t+=BigInt(n));let r=t.toString(),a=Math.max(r.length,l+1),h=numerosAR.length+3,x=Math.max(h,a),g=(h>a)?(h-a)/2:0,e=0.95*w/x,f=e*multiplicadorTamFuente;let v={},o=0;for(let i=l-1;i>=0;i--){let u=o;c.forEach(n=>{u+=parseInt(n[i])});o=Math.floor(u/10);if(o>0){let d=i-1+(a-l);if(d>=0){v[d]=o.toString();let p=1.5+numerosAR.length-1+0.5,q=.8,z=p*e-q*e,y=e*.7,_=(d+g+.3)*e;crearFlechaLlevada(_,q*e,y,z)}}}let n=s.map(n=>n.padStart(a,' ')),j=r.padStart(a,' ');let b=1.5;for(const d in v){crearCelda("caja",v[d],{left:`${(parseInt(d)+g)*e}px`,top:`.1em`,width:`${e}px`,height:`${e}px`,fontSize:f*.7+'px',color:"red",textAlign:'center'})}n.forEach((p,q)=>{for(let i=0;i<p.length;i++){if(p[i]!==' '){crearCelda("caja",p[i],{left:`${(i+g)*e}px`,top:`${(q+b)*e}px`,width:`${e}px`,height:`${e}px`,fontSize:f+'px',color:'#ffff00'})}}});let k=a-l-1,i=b+n.length-1;crearCelda("caja","+",{left:`${(k+g)*e}px`,top:`${i*e}px`,width:`${e}px`,height:`${e}px`,fontSize:f+'px',color:'#ffff00'});let p=(b+n.length)*e;for(let q=0;q<j.length;q++){crearCelda("caja",j[q],{left:`${(q+g)*e}px`,top:`${p}px`,width:`${e}px`,height:`${e}px`,fontSize:f+'px',borderTop:"2px #ddd solid",color:'#00ff00'})}}

function resta(numerosAR) {
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
    let n1 = numerosAR[0][0], n2 = numerosAR[1][0];
    if (n1 === "0" || n2 === "0") {
        salida.innerHTML = errorMessages.multiplicacion1;
        return;
    }
    let r = (BigInt(n1) * BigInt(n2)).toString();
    if (r.length > 20) {
        salida.innerHTML = errorMessages.multiplicacion2;
        return;
    }
    const h = 3;
    let a = Math.max(n1.length, n2.length + 1, r.length),
        m = Math.max(h, a),
        g = (m - a) / 2,
        e = 0.95 * w / m,
        f = e * multiplicadorTamFuente;
    for (let i = 0; i < n1.length; i++) {
        crearCelda("caja3", n1[i], { left: `${(a - n1.length + i + g) * e}px`, top: "0px", width: `${e}px`, height: `${e}px`, fontSize: f + 'px' });
    }
    crearCelda("caja", "x", { left: `${(a - n2.length - 1 + g) * e}px`, top: `${e}px`, width: `${e}px`, height: `${e}px`, fontSize: f + 'px', color: "#ddd"});
    for (let i = 0; i < n2.length; i++) {
        crearCelda("caja3", n2[i], { left: `${(a - n2.length + i + g) * e}px`, top: `${e}px`, width: `${e}px`, height: `${e}px`, fontSize: f + 'px'});
    }
    let p = 2 * e;
    for (let i = 0; i < r.length; i++) {
        crearCelda("caja4", r[i], { left: `${(a - r.length + i + g) * e}px`, top: `${p}px`, width: `${e}px`, height: `${e}px`, fontSize: f + 'px', borderTop: "2px #ddd solid" });
    }
}
function divide(numerosAR){salida.innerHTML="<p class='error'>Visualización de división no implementada.</p>"}
function divideExt(numerosAR){salida.innerHTML="<p class='error'>Visualización de división extendida no implementada.</p>"}

function desFacPri() {
    salida.innerHTML = ""; const entrada = display.innerHTML; let numIzda = parseInt(entrada, 10);
    if (isNaN(numIzda) || numIzda === 0) { salida.innerHTML = errorMessages.dFactorial1; bajarteclado(); return; }
    let numIzdaArray=[numIzda],numDchaArray=[],i=2,tempNum=numIzda;
    while(i<=tempNum){if(tempNum%i===0){numDchaArray.push(i);tempNum/=i;numIzdaArray.push(tempNum)}else{i++}}
    if(numIzdaArray[numIzdaArray.length-1]!==1&&numIzdaArray.length>1){numIzdaArray.pop()}else if(numIzdaArray.length===1){numDchaArray.push(numIzda);numIzdaArray.push(1)}
    const aI=numIzdaArray[0].toString().length,aD=Math.max(...numDchaArray.map(n=>n.toString().length)),aP=aI+aD,hP=numIzdaArray.length,mD=Math.max(aP+1,hP),m=(hP>aP)?(hP-aP)/2:0,tC=0.95*w/mD,tF=tC*multiplicadorTamFuente;
    numIzdaArray.forEach((n,i)=>{let s=n.toString().padStart(aI,' ');for(let j=0;j<s.length;j++){crearCelda("caja2",s[j],{left:`${(j+m)*tC}px`,top:`${i*tC}px`,width:`${tC}px`,height:`${tC}px`,fontSize:`${tF}px`,borderRight:j===s.length-1?"2px #ddd solid":"none"})}});
    numDchaArray.forEach((n,i)=>{let s=n.toString();for(let j=0;j<s.length;j++){crearCelda("caja3",s[j],{left:`${(j+aI+m+1)*tC}px`,top:`${i*tC}px`,width:`${tC}px`,height:`${tC}px`,fontSize:`${tF}px`})}});
    HistoryManager.add({ input: entrada, visualHtml: salida.innerHTML }); bajarteclado();
}
function raizCuadrada() {salida.innerHTML="<p class='error'>Visualización de raíz cuadrada no implementada.</p>"; bajarteclado(); }

// ===================================
// --- MÓDulos DE HISTORIAL ---
// ===================================
const HistoryManager=(function(){const e="calculatorHistory";let t=[];function n(){try{const o=localStorage.getItem(e);t=o?JSON.parse(o):[]}catch(o){console.error("Error al cargar historial:",o);t=[]}}function o(){try{localStorage.setItem(e,JSON.stringify(t))}catch(o){console.error("Error al guardar historial:",o)}}function r(e,n){window.dispatchEvent(new CustomEvent(e,{detail:n}))}return{init:function(){n()},add:function(e){const n=t.findIndex(t=>t.input===e.input);-1<n?(alert("¡Oye, chamaco! Esa operación ya está en tu historial."),r("history:duplicate",{index:n})):(t.unshift(e),o(),r("history:updated"))},getAll:function(){return[...t]},clear:function(){t=[];o();r("history:updated")}}})();
const HistoryPanel=(function(){let e,t,n,o;function r(){const a=HistoryManager.getAll();t.innerHTML="";if(0===a.length){t.innerHTML='<li><span class="history-input">El historial está vacío.</span></li>';return}a.forEach((a,c)=>{const i=document.createElement("li");i.setAttribute("data-history-index",c);const s=document.createElement("div");s.innerHTML=a.visualHtml;const d=s.querySelectorAll("[style*='border-top']");let l=0<d.length?Array.from(d).map(e=>e.textContent).join("").trim():"";l=l||s.querySelector("p.error")?.textContent||"?";i.innerHTML=`<span class="history-input">${a.input}</span><span class="history-result-preview">= ${l}</span>`;t.appendChild(i)})}function a(){e.classList.toggle("open")}function c(c){const i=c.target.closest("li[data-history-index]");if(!i)return;const s=i.dataset.historyIndex,d=HistoryManager.getAll()[s];d&&(display.innerHTML=d.input,salida.innerHTML=d.visualHtml,activadoBotones(d.input),bajarteclado(),a())}function i(){confirm("¿Seguro que quieres borrar todo el historial?")&&HistoryManager.clear()}function s(t){const{index:r}=t.detail;e.classList.contains("open")||a();const c=list.querySelector(`li[data-history-index="${r}"]`);c&&(c.classList.remove("history-item-highlight"),void c.offsetWidth,c.classList.add("history-item-highlight"))}return{init:function(){e=document.getElementById("history-panel");t=document.getElementById("history-list");n=document.getElementById("history-toggle-btn");o=document.getElementById("clear-history-btn");n.addEventListener("click",a);o.addEventListener("click",i);t.addEventListener("click",c);window.addEventListener("history:updated",r);window.addEventListener("history:duplicate",s);r()}}})();