# 📚 LectoIA — Generador de Fichas Interactivas

Herramienta profesional para crear fichas interactivas de comprensión lectora usando Inteligencia Artificial (Gemini). Descarga fichas HTML autocorregibles, listas para usar sin internet.

---

## ✨ Características Principales

- 🖼️ **Lectura Visual**: Sube una imagen (JPG, PNG) como material de lectura del estudiante
- 🤖 **Super Prompt con IA**: Genera un prompt optimizado para copiar y pegar en **Gemini** (Google)
- 📝 **5 Tipos de Preguntas**:
  - Opción múltiple
  - Verdadero / Falso
  - Relacionar columnas (Columna A ↔ Columna B) — Drag & Drop
  - Completar oraciones (Fill in the blanks)
  - Ordenamiento cronológico / jerárquico — Drag & Drop
- 💾 **Ficha Descargable**: Genera un archivo HTML único y autocontenido que funciona sin internet
- ✅ **Autocorrección Inteligente**: Las fichas se califican solas y dan retroalimentación personalizada al estudiante
- 🔧 **Reparador Automático de JSON**: Corrige automáticamente errores de formato del JSON que devuelve Gemini (comillas, saltos de línea, bloques de código Python, etc.)

---

## 🚀 Cómo Usar (Flujo de Trabajo)

1. Sube la **imagen de la lectura** (afiche, cuento, infografía, etc.)
2. Completa el formulario: título, nivel, tipos y cantidad de preguntas
3. Haz clic en **"Generar y Copiar Super Prompt"**
4. Haz clic en **"Ir a Gemini (Web)"** y pega el prompt
5. Copia el **JSON** que devuelva Gemini (completo, incluyendo bloques de código si los hay)
6. Pégalo en el campo del **Paso Final** y haz clic en **"Descargar Ficha Interactiva"**
7. ¡Listo! Comparte el archivo `.html` descargado con tus estudiantes

---

## 🛠️ Instalación para Desarrolladores

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU-USUARIO/generador-ficha-interactiva.git

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en el navegador
# http://localhost:5173
```

---

## 📁 Estructura del Proyecto

```
generador-ficha-interactiva/
├── src/
│   ├── main.js              # Lógica principal: formulario, prompt, reparador JSON
│   ├── style.css            # Diseño premium del generador
│   └── utils/
│       └── template.js      # Plantilla HTML de la ficha interactiva descargable
├── public/                  # Recursos estáticos
├── index.html               # Página principal del generador
├── package.json
└── vite.config.js
```

---

## 🧰 Tecnologías

| Tecnología | Uso |
|---|---|
| [Vite](https://vitejs.dev/) | Empaquetador y servidor de desarrollo |
| [SortableJS](https://sortablejs.github.io/Sortable/) | Drag & Drop en las fichas |
| Vanilla JS + CSS | Sin frameworks: máximo rendimiento |

---

## 📄 Licencia

MIT — Libre para uso educativo y personal.
