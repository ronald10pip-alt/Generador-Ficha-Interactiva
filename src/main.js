// Diagnóstico global de errores en pantalla
window.addEventListener('error', (event) => {
    console.error("Global error:", event.error);
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.bottom = '20px';
    errorDiv.style.left = '20px';
    errorDiv.style.right = '20px';
    errorDiv.style.background = '#fee2e2';
    errorDiv.style.border = '2px solid #ef4444';
    errorDiv.style.borderRadius = '12px';
    errorDiv.style.padding = '20px';
    errorDiv.style.color = '#991b1b';
    errorDiv.style.zIndex = '10000';
    errorDiv.style.fontFamily = 'monospace';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.2)';
    errorDiv.innerHTML = `
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">⚠️ Error de Sistema Detectado:</div>
        <div style="font-weight: 600; margin-bottom: 8px;">${event.message}</div>
        <div style="color: #b91c1c; font-size: 11px; margin-bottom: 8px;">Archivo: ${event.filename}:${event.lineno}:${event.colno}</div>
        \${event.error && event.error.stack ? \`<pre style="margin: 0; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 6px; max-height: 120px; overflow: auto; white-space: pre-wrap;">\${event.error.stack}</pre>\` : ''}
        <button onclick="this.parentElement.remove()" style="margin-top: 12px; background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer;">Cerrar</button>
    `;
    document.body.appendChild(errorDiv);
});

import { processFile } from './utils/ocr';
import { downloadActivity } from './utils/generator';

// State
let currentFile = null;
let extractedText = "";
let base64Image = "";
let zoomLevel = 100;

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const imagePreview = document.getElementById('image-preview');
const previewControls = document.getElementById('preview-controls');
const ocrStatus = document.getElementById('ocr-status');
const configForm = document.getElementById('config-form');
const loadingOverlay = document.getElementById('loading-overlay');
const zoomLevelSpan = document.getElementById('zoom-level');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnReplace = document.getElementById('btn-replace');
const btnNewActivity = document.getElementById('btn-new-activity');
const btnGetPrompt = document.getElementById('btn-get-prompt');
const btnProcessManual = document.getElementById('btn-process-manual');
const jsonInput = document.getElementById('json-input');
const totalQCountSpan = document.getElementById('total-q-count');
const totalQWarning = document.getElementById('total-q-warning');
const qCountInputs = document.querySelectorAll('.q-count-input');
const qTypeCheckboxes = document.querySelectorAll('input[name="q-type"]');

// Initialize
function init() {
    console.log("LectoIA Pro Initializing...");
    if (window.updateGradesFallback) window.updateGradesFallback();
    setupQuestionListeners();
    calculateTotalQuestions();
}

function setupQuestionListeners() {
    [...qCountInputs, ...qTypeCheckboxes].forEach(input => {
        input.addEventListener('input', () => {
            calculateTotalQuestions();
        });
    });
}

function calculateTotalQuestions() {
    let total = 0;
    const types = [];
    
    qTypeCheckboxes.forEach(cb => {
        const input = document.querySelector(`input[name="q-count-${cb.value}"]`);
        if (cb.checked) {
            input.disabled = false;
            input.style.opacity = '1';
            const val = parseInt(input.value) || 0;
            total += val;
            types.push({ type: cb.value, count: val });
        } else {
            input.disabled = true;
            input.style.opacity = '0.3';
        }
    });

    totalQCountSpan.textContent = total;
    
    if (total > 10) {
        totalQCountSpan.style.background = 'var(--error)';
        totalQWarning.style.display = 'inline';
        btnGetPrompt.disabled = true;
        btnGetPrompt.style.opacity = '0.5';
        btnGetPrompt.style.cursor = 'not-allowed';
    } else {
        totalQCountSpan.style.background = 'var(--primary)';
        totalQWarning.style.display = 'none';
        btnGetPrompt.disabled = false;
        btnGetPrompt.style.opacity = '1';
        btnGetPrompt.style.cursor = 'pointer';
    }

    return { total, types };
}

btnNewActivity.addEventListener('click', () => {
    if (confirm('¿Deseas borrar todo y crear una nueva ficha?')) {
        resetGenerator();
    }
});

btnGetPrompt.addEventListener('click', async () => {
    try {
        const config = getFormConfig();
        if (!config.title) {
            alert('⚠️ Por favor, ingresa un título para la actividad.');
            document.getElementById('activity-title').focus();
            return;
        }
        
        const superPrompt = generateSuperPrompt(config);
        
        // Intento de copiado robusto
        try {
            await navigator.clipboard.writeText(superPrompt);
            showCopySuccess();
        } catch (err) {
            // Fallback manual si falla el clipboard API
            const textArea = document.createElement("textarea");
            textArea.value = superPrompt;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showCopySuccess();
            } catch (err2) {
                console.error("Fallback copy failed", err2);
                alert("No se pudo copiar automáticamente. Por favor, copia el texto manualmente de la consola (F12).");
                console.log("SUPER PROMPT:\n", superPrompt);
            }
            document.body.removeChild(textArea);
        }
    } catch (err) {
        console.error("Error generating prompt:", err);
        alert("Ocurrió un error al generar el prompt. Revisa la consola.");
    }
});

function showCopySuccess() {
    const originalText = btnGetPrompt.innerHTML;
    btnGetPrompt.innerHTML = '✅ ¡Copiado! Pégalo en Gemini';
    btnGetPrompt.style.background = '#059669';
    
    // Mostrar botón de Gemini y bloquear formulario
    document.getElementById('btn-open-gemini').style.display = 'flex';
    const fieldsets = configForm.querySelectorAll('fieldset');
    fieldsets.forEach(fs => fs.disabled = true);
    configForm.style.opacity = '0.7';

    setTimeout(() => { 
        btnGetPrompt.innerHTML = originalText;
        btnGetPrompt.style.background = '';
    }, 3000);
    alert('🚀 Super Prompt copiado.\n\nLos campos se han bloqueado para asegurar la coherencia. Usa el nuevo botón azul para abrir Gemini y pega tu prompt.');
}

// Función autocurativa avanzada para sanar sintaxis JSON de Gemini
function healJson(jsonStr) {
    // 0. Extracción inteligente de bloques de código markdown
    //    Gemini a veces devuelve: ```python código... ``` ```text JSON... ``` JSON crudo
    //    Estrategia: buscar primero un bloque ```json o ```text y extraer SOLO ese contenido.
    //    Si no hay bloque específico, extraer cualquier bloque de código.
    //    Si no hay bloques, limpiar marcas genéricamente y continuar.
    const specificBlock = jsonStr.match(/```(?:json|text)\s*([\s\S]*?)```/i);
    if (specificBlock) {
        // Usar únicamente el contenido del bloque json/text y descartar el resto (ej. código Python)
        jsonStr = specificBlock[1].trim();
    } else {
        // Sin bloque específico: quitar TODAS las marcas de code fences genéricamente
        jsonStr = jsonStr.replace(/```[a-z]*\s*/gi, '').replace(/```/g, '').trim();
    }
    
    // 1. Reemplazar comillas tipográficas/inteligentes por comillas rectas estándar
    jsonStr = jsonStr.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
    jsonStr = jsonStr.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

    // 2. Limpiar comentarios accidentales de la IA
    jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');
    jsonStr = jsonStr.replace(/(?:^|\s)\/\/.*$/gm, '');

    // 3. Recortar cualquier texto conversacional externo antes o después del bloque JSON principal
    const firstBrace = jsonStr.indexOf('{');
    const firstBracket = jsonStr.indexOf('[');
    let startIdx = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
        startIdx = Math.min(firstBrace, firstBracket);
    } else {
        startIdx = firstBrace !== -1 ? firstBrace : firstBracket;
    }

    const lastBrace = jsonStr.lastIndexOf('}');
    const lastBracket = jsonStr.lastIndexOf(']');
    let endIdx = -1;
    if (lastBrace !== -1 && lastBracket !== -1) {
        endIdx = Math.max(lastBrace, lastBracket);
    } else {
        endIdx = lastBrace !== -1 ? lastBrace : lastBracket;
    }

    if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
        jsonStr = jsonStr.substring(startIdx, endIdx + 1);
    }

    // 4. Máquina de estados para escapar comillas dobles internas y resolver saltos de línea literales
    let openBraces = [];
    let inString = false;
    let escape = false;
    let clean = "";

    for (let i = 0; i < jsonStr.length; i++) {
        let c = jsonStr[i];
        if (inString) {
            if (escape) {
                clean += c;
                escape = false;
            } else if (c === '\\') {
                clean += c;
                escape = true;
            } else if (c === '"') {
                // Verificar si es comilla de cierre de string verdadera analizando el contexto posterior
                let nextChars = jsonStr.slice(i + 1).trim();
                let isBoundary = nextChars.startsWith(':') || 
                                 nextChars.startsWith(',') || 
                                 nextChars.startsWith('}') || 
                                 nextChars.startsWith(']') || 
                                 /^\s*"[^"]+"\s*:/.test(nextChars) ||
                                 nextChars === '';
                if (isBoundary) {
                    inString = false;
                    clean += c;
                } else {
                    // Comilla doble interna: Escaparla correctamente
                    clean += '\\"';
                }
            } else if (c === '\n') {
                // Salto de línea literal dentro de un string de JSON: Escaparlo como \n
                clean += '\\n';
            } else if (c === '\r') {
                // Ignorar retornos de carro para homogeneizar saltos
            } else {
                clean += c;
            }
        } else {
            if (c === '"') {
                inString = true;
                clean += c;
            } else {
                if (c === '{') openBraces.push('}');
                else if (c === '[') openBraces.push(']');
                else if (c === '}') {
                    if (openBraces.length && openBraces[openBraces.length - 1] === '}') openBraces.pop();
                } else if (c === ']') {
                    if (openBraces.length && openBraces[openBraces.length - 1] === ']') openBraces.pop();
                }
                clean += c;
            }
        }
    }

    if (inString) {
        clean += '"';
    }

    // 5. Corregir comas huérfanas antes de llaves o corchetes de cierre
    clean = clean.replace(/,\s*([}\]])/g, '$1');

    // 6. Autocompletar llaves/corchetes no cerrados si el JSON fue truncado
    while (openBraces.length) {
        let closeChar = openBraces.pop();
        clean = clean.trim();
        if (clean.endsWith(',')) {
            clean = clean.slice(0, -1);
        }
        clean += closeChar;
    }

    return clean;
}

btnProcessManual.addEventListener('click', async () => {
    const jsonText = jsonInput.value.trim();
    if (!jsonText) return alert('⚠️ Por favor, pega el código JSON que generó la IA.');
    if (!base64Image) return alert('⚠️ Primero debes subir la imagen de la lectura para la vista previa.');

    try {
        loadingOverlay.style.display = 'flex';
        
        // ─── LIMPIADOR Y REPARADOR ROBUSTO DE JSON ─────────────────────────
        const cleanJson = healJson(jsonText);

        let data;
        try {
            data = JSON.parse(cleanJson);
        } catch (error) {
            console.error("Error al parsear el JSON limpio:\n", cleanJson);
            const pos = error.message.match(/position (\d+)/) || error.message.match(/at (\d+)/);
            const charPos = pos ? parseInt(pos[1]) : null;
            let hint = '';
            if (charPos !== null) {
                const context = cleanJson.substring(Math.max(0, charPos - 50), charPos + 50);
                hint = `\n\nEl error está cerca de:\n...${context}...`;
            }
            throw new Error(
                `El JSON tiene un error de sintaxis que no se pudo reparar automáticamente.\n` +
                `Revisa que no falten comillas o haya caracteres especiales.${hint}`
            );
        }
        // ──────────────────────────────────────────────────────────────────────

        const questions = data.questions || (Array.isArray(data) ? data : null);
        if (!questions || questions.length === 0) throw new Error(
            "No se encontraron preguntas en el JSON. Verifica que el formato tenga la clave 'questions'."
        );

        const config = getFormConfig();
        await downloadActivity(questions, config, base64Image);
        
        loadingOverlay.style.display = 'none';
        alert('✨ ¡Ficha interactiva descargada con éxito!');
        jsonInput.value = '';
    } catch (error) {
        console.error("Error processing JSON:", error);
        alert(`❌ ${error.message}`);
        loadingOverlay.style.display = 'none';
    }
});

function getFormConfig() {
    const { total, types } = calculateTotalQuestions();
    return {
        title: document.getElementById('activity-title').value.trim(),
        educationLevel: document.getElementById('education-level').value,
        grade: document.getElementById('grade').value,
        questionTypes: types.filter(t => t.count > 0),
        totalQuestions: total,
        feedback: true  // Siempre activo — retroalimentación pedagógica incluida por defecto
    };
}

function generateSuperPrompt(config) {
    const typesDescription = config.questionTypes
        .map(t => `  - ${t.count} ${t.count === 1 ? 'pregunta' : 'preguntas'} de tipo "${t.type}"`)
        .join('\n');

    // Build per-type JSON examples (no comments, no pipe-separated values)
    const examplesByType = {
        multiple_choice: `{
      "type": "multiple_choice",
      "question": "¿Qué personaje es el protagonista del texto?",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correct_answer": "Opción A",
      "feedback_correct": "¡Muy bien! El texto dice claramente que...",
      "feedback_incorrect": "Inténtalo de nuevo. Busca en el párrafo que dice..."
    }`,
        true_false: `{
      "type": "true_false",
      "question": "El protagonista vive en el campo.",
      "correct_answer": "Verdadero",
      "feedback_correct": "¡Correcto! El texto menciona que...",
      "feedback_incorrect": "Incorrecto. Lee el párrafo donde dice..."
    }`,
        fill_blanks: `{
      "type": "fill_blanks",
      "question": "El protagonista vivía en una [blank] muy grande.",
      "correct_answer": "casa",
      "feedback_correct": "¡Excelente! La palabra correcta es casa.",
      "feedback_incorrect": "Vuelve a leer el primer párrafo del texto."
    }`,
        match: `{
      "type": "match",
      "question": "Relaciona las columnas:",
      "pairs": [
        {"left": "Elemento A", "right": "Significado A"},
        {"left": "Elemento B", "right": "Significado B"},
        {"left": "Elemento C", "right": "Significado C"},
        {"left": "Elemento D", "right": "Significado D"}
      ],
      "feedback_correct": "¡Perfecto! Uniste todos los elementos correctamente.",
      "feedback_incorrect": "Algunas parejas no son correctas. Revisa el texto."
    }`,
        ordering: `{
      "type": "ordering",
      "question": "Ordena los eventos del texto de primero a último:",
      "items": ["Evento C", "Evento A", "Evento B"],
      "correct_order": ["Evento A", "Evento B", "Evento C"],
      "feedback_correct": "¡Excelente! Ese es el orden correcto.",
      "feedback_incorrect": "El orden no es correcto. Relee el texto para identificar la secuencia."
    }`
    };

    const neededTypes = config.questionTypes.map(t => t.type);
    const examplesBlock = neededTypes
        .filter(t => examplesByType[t])
        .map(t => examplesByType[t])
        .join(',\n    ');

    return `### ROL: EXPERTO EN EVALUACIÓN EDUCATIVA Y COMPRENSIÓN LECTORA
Tu misión es analizar la imagen adjunta y generar una evaluación interactiva de alta calidad.

### CONFIGURACIÓN DE LA FICHA:
- Título: ${config.title}
- Nivel Educativo: ${config.educationLevel}
- Grado: ${config.grade}
- Total de preguntas: ${config.totalQuestions}
- Distribución:
${typesDescription}

### ANÁLISIS PREVIO (hazlo internamente antes de generar):
1. Identifica el nivel léxico del texto (básico, técnico, abstracto o literario).
2. Determina si el texto es narrativo, expositivo, argumentativo o informativo.
3. Ajusta la complejidad exactamente para ${config.grade}.

### REGLAS DE DIFICULTAD Y ESCALABILIDAD PEDAGÓGICA (OBLIGATORIAS):
El grado seleccionado es: **${config.grade} de ${config.educationLevel}**. Las preguntas DEBEN ajustarse con precisión a este nivel. Sigue estas reglas de progresión:

**A. ESCALA INTER-NIVEL (Primaria vs. Secundaria):**
- Las preguntas de Secundaria deben ser considerablemente más complejas que las de Primaria.
- En Primaria: vocabulario sencillo, frases cortas, preguntas literales o de comprensión directa.
- En Secundaria: vocabulario técnico o abstracto, preguntas inferenciales, críticas o de análisis.

**B. ESCALA INTRA-PRIMARIA (dificultad progresiva por grado):**
- 1° de Primaria: preguntas muy simples, vocabulario básico, oraciones muy cortas, respuestas evidentes.
- 2° de Primaria: preguntas simples con vocabulario cotidiano, comprensión directa del texto.
- 3° de Primaria: aparecen preguntas con una pequeña inferencia sencilla.
- 4° de Primaria: combinación de comprensión literal e inferencial básica.
- 5° de Primaria: mayor inferencia, vocabulario más amplio, relaciones causa-efecto simples.
- 6° de Primaria: preguntas que exigen análisis, síntesis y valoración básica del texto.

**C. ESCALA INTRA-SECUNDARIA (dificultad progresiva por grado):**
- 1° de Secundaria: transición de lo literal a lo inferencial, vocabulario contextual.
- 2° de Secundaria: análisis de intenciones del autor, vocabulario técnico moderado.
- 3° de Secundaria: argumentación, comparación de ideas, lenguaje abstracto.
- 4° de Secundaria: evaluación crítica del texto, juicio de valor sustentado.
- 5° de Secundaria: nivel más alto: análisis profundo, síntesis compleja, argumentación académica.

**D. REGLAS GENERALES:**
- Usa únicamente información que esté presente o claramente inferible en el texto.
- Los distractores en opción múltiple deben ser plausibles pero claramente incorrectos según el texto.
- La retroalimentación (feedback_correct e feedback_incorrect) debe ser específica y didáctica, citando o haciendo referencia al contenido del texto.
- Para las preguntas de tipo "match" (Relacionar columnas), genera siempre exactamente 4 parejas o filas para relacionar, haciendo la actividad más didáctica y completa.

### REGLAS CRÍTICAS DE FORMATO JSON (OBLIGATORIAS):
1. Responde ÚNICAMENTE con el objeto JSON, sin explicaciones ni texto adicional.
2. NO incluyas comentarios dentro del JSON (no uses // ni /* */).
3. TODAS las cadenas de texto DEBEN estar entre comillas dobles "...".
4. Esto incluye preguntas con ¿ ¡ tildes y caracteres especiales: siempre entre comillas dobles.
5. No dejes comas al final de listas o antes de un corchete de cierre.
6. EVITA COMILLAS DOBLES INTERNAS: Si necesitas incluir comillas dentro de un texto (ej. nombres de colegios, lemas, citas, fechas, etc.), usa comillas simples ('...') o escápalas estrictamente con barra invertida (\\"). Jamás dejes comillas dobles sin escapar dentro de un valor.
7. Verifica mentalmente que el JSON sea válido antes de responder.

### TIPOS DE PREGUNTAS QUE DEBES GENERAR:
${neededTypes.map(t => `- "${t}"`).join('\n')}

### ESTRUCTURA JSON EXACTA (sigue estos ejemplos):
{
  "questions": [
    ${examplesBlock}
  ]
}

RECUERDA: Genera exactamente ${config.totalQuestions} preguntas con la distribución indicada. El JSON debe ser válido y parseable directamente.`;
}

function resetGenerator() {

    currentFile = null;
    extractedText = "";
    base64Image = "";
    zoomLevel = 100;

    dropZone.style.display = 'flex';
    previewContainer.style.display = 'none';
    previewControls.style.display = 'none';
    ocrStatus.style.display = 'none';
    imagePreview.src = '';
    imagePreview.style.transform = 'scale(1)';
    zoomLevelSpan.textContent = '100%';
    
    // Desbloquear formulario
    const fieldsets = configForm.querySelectorAll('fieldset');
    fieldsets.forEach(fs => fs.disabled = false);
    configForm.style.opacity = '1';
    document.getElementById('btn-open-gemini').style.display = 'none';

    configForm.reset();
    if (window.updateGradesFallback) window.updateGradesFallback();
    calculateTotalQuestions();
    fileInput.value = "";
}

// Event Listeners para Archivos
dropZone.addEventListener('click', (e) => {
    e.preventDefault();
    fileInput.click();
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
    e.target.value = ''; // Reset input to allow selecting the same file again
});
btnReplace.addEventListener('click', (e) => {
    e.preventDefault();
    fileInput.click();
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

async function handleFile(file) {
    if (!file) return;
    console.log("File received:", file.name, file.type);
    currentFile = file;

    dropZone.style.display = 'none';
    previewContainer.style.display = 'flex';
    previewControls.style.display = 'flex';
    ocrStatus.style.display = 'flex';
    ocrStatus.innerHTML = '<div class="spinner"></div><p>Cargando archivo...</p>';

    try {
        // Fast Preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                base64Image = e.target.result;
                imagePreview.src = base64Image;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }

        // Wait dynamically if CDN scripts are still downloading in the background
        if (!window.Tesseract || !window.pdfjsLib) {
            ocrStatus.innerHTML = '<div class="spinner"></div><p>Descargando componentes de lectura de Google CDN...</p>';
            await new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (window.Tesseract && window.pdfjsLib) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            });
        }

        // Run OCR with live progress updates
        ocrStatus.innerHTML = '<div class="spinner"></div><p>Iniciando lectura OCR inteligente...</p>';
        const result = await processFile(file, (progressText) => {
            ocrStatus.innerHTML = `<div class="spinner"></div><p>${progressText}</p>`;
        });
        extractedText = result.text;
        base64Image = result.image;

        imagePreview.src = base64Image;
        imagePreview.style.display = 'block';
        ocrStatus.innerHTML = '<span style="color: var(--success); font-weight: 700;">✅ Texto extraído correctamente</span>';
        setTimeout(() => { ocrStatus.style.display = 'none'; }, 3000);
    } catch (error) {
        console.error("Error en handleFile:", error);
        alert('❌ Error al procesar el archivo. Revisa que sea una imagen o PDF legible.');
        resetGenerator();
    }
}

// Zoom controls
btnZoomIn.addEventListener('click', () => { zoomLevel += 15; updateZoom(); });
btnZoomOut.addEventListener('click', () => { if (zoomLevel > 30) zoomLevel -= 15; updateZoom(); });
function updateZoom() {
    zoomLevelSpan.textContent = `${zoomLevel}%`;
    imagePreview.style.transform = `scale(${zoomLevel / 100})`;
    imagePreview.style.transformOrigin = 'top center';
}

// Start
init();

configForm.addEventListener('submit', (e) => {
    e.preventDefault();
    btnGetPrompt.click();
});
