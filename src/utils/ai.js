import OpenAI from 'openai';

export async function generateQuestions(text, config, apiKey) {
    const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });

    const prompt = `
### ROL: EXPERTO EN EVALUACIÓN EDUCATIVA Y COMPRENSIÓN LECTORA
Tu misión es generar una evaluación interactiva basada ÚNICAMENTE en el texto proporcionado.

### TEXTO DE REFERENCIA (FUENTE DE VERDAD ABSOLUTA):
"""
${text}
"""

### REGLAS DE ORO CONTRA ALUCINACIONES:
1. **GROUNDING ESTRICTO:** No uses información que no esté en el texto. Si el texto no menciona un tema, no preguntes sobre él.
2. **EVIDENCIA TEXTUAL:** Para cada pregunta, debes ser capaz de citar la parte del texto que la sustenta.
3. **DISTRACCIÓN LÓGICA:** Los distractores en opción múltiple deben ser ideas que aparezcan en el texto pero que no respondan a la pregunta específica.
4. **NIVELES COGNITIVOS:**
   - Literal: Información explícita (¿Qué?, ¿Quién?, ¿Cuándo?).
   - Inferencial: Conclusiones lógicas (¿Por qué?, ¿Qué significa...?, ¿Qué pasaría si...?).
   - Crítico: Opinión fundamentada en el texto (¿Qué opinas de...?, ¿Cuál es el propósito del autor?).

### CONFIGURACIÓN:
- Título: ${config.title}
- Nivel Educativo: ${config.educationLevel}
- Grado: ${config.grade}
- Nivel de dificultad: ${config.level}
- Área: ${config.area}
- Preguntas: ${config.questionCount}
- Tipos: ${config.questionTypes.join(', ')}

### INSTRUCCIONES DE DIFICULTAD:
1. **DIFICULTAD ESCALADA:** Ajusta estrictamente la complejidad de las preguntas según el Nivel Educativo, el Grado y el Nivel de Dificultad:
   - **PRIMARIA:** Usa un lenguaje sencillo y directo. Las preguntas de 1° a 3° deben ser muy concretas. De 4° a 6° aumenta gradualmente la abstracción.
   - **SECUNDARIA:** Las preguntas deben ser SIGNIFICATIVAMENTE más difíciles que las de primaria. Deben exigir mayor análisis, inferencia y vocabulario técnico. La complejidad debe subir de 1° a 5°.
   - **NIVEL DE COMPLEJIDAD:** Si se selecciona "${config.level}", asegúrate de que el rigor de las preguntas coincida con ese estándar (Básico = directo, Intermedio = analítico, Avanzado = complejo/crítico).
   - **COHERENCIA:** Una pregunta para 5° de Secundaria debe ser mucho más retadora que una para 1° de Primaria.

### ESPECIFICACIONES TÉCNICAS POR TIPO:
- **multiple_choice**: JSON debe tener "options" (4 items) y "correct_answer" (debe ser idéntica a una de las opciones).
- **true_false**: "correct_answer" debe ser "Verdadero" o "Falso". No necesita "options".
- **fill_blanks**: La "question" DEBE incluir el marcador "[blank]" donde va la palabra. Ejemplo: "El sol es de color [blank].". "correct_answer" es la palabra exacta.
- **match**: Debe tener "pairs" (lista de objetos {left, right}).
- **ordering**: Debe tener "items" (desordenados) y "correct_order" (lista en orden correcto).

### FORMATO DE SALIDA (JSON):
{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice | true_false | fill_blanks | match | ordering",
      "question": "Texto de la pregunta...",
      "options": ["op1", "op2", "op3", "op4"], 
      "correct_answer": "...",
      "pairs": [{"left": "...", "right": "..."}],
      "items": ["...", "..."],
      "correct_order": ["...", "..."],
      "cognitive_level": "Literal/Inferencial/Crítico",
      "justification": "Explica brevemente qué parte del texto sustenta esta pregunta para evitar alucinaciones.",
      "feedback_correct": "...",
      "feedback_incorrect": "..."
    }
  ]
}

### REGLAS FINALES:
- No salgas del formato JSON.
- Genera exactamente ${config.questionCount} preguntas variando los niveles cognitivos.
- El lenguaje y complejidad deben ser adecuados para estudiantes de ${config.grade}.
`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // O gpt-3.5-turbo si se prefiere
            messages: [
                { role: "system", content: "Eres un asistente especializado en generación de contenido educativo interactivo." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        console.error("Error calling OpenAI:", error);
        throw error;
    }
}
