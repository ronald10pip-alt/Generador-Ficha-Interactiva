export const getOfflineTemplate = (data, base64Image, sortableJSContent) => {
    const renderQuestion = (q, i) => {
        let content = "";
        if (q.type === 'multiple_choice' || q.type === 'true_false') {
            const options = q.type === 'multiple_choice' ? q.options : ["Verdadero", "Falso"];
            content = `
                <div class="options-list">
                    ${options.map((opt, optIdx) => `
                        <div class="option-item" onclick="selectOption(${i}, ${optIdx})">${opt}</div>
                    `).join('')}
                </div>
            `;
        } else if (q.type === 'fill_blanks') {
            const parts = (q.question || "").split('[blank]');
            content = `
                <div class="fill-blanks-container">
                    ${parts[0] || ''} <input type="text" class="fill-blanks-input"> ${parts[1] || ''}
                </div>
            `;
        } else if (q.type === 'ordering') {
            content = `
                <div class="ordering-list">
                    ${(q.items || []).map(item => `
                        <div class="match-item match-item-right" data-item="${item.replace(/"/g, '&quot;')}">
                            <span class="drag-handle">⠿</span>
                            <span>${item}</span>
                        </div>
                    `).join('')}
                </div>
                <p style="font-size: 0.8rem; color: #666; margin-top: 0.5rem;">💡 Arrastra los elementos para ordenarlos.</p>
            `;
        } else if (q.type === 'match') {
            const shuffledRight = [...(q.pairs || [])].sort(() => Math.random() - 0.5);
            content = `
                <div class="match-wrapper">
                    <div class="match-col">
                        <div class="match-col-header">Columna A</div>
                        <div class="match-items-wrap">
                            ${(q.pairs || []).map((p, pi) => `
                                <div class="match-item match-item-left">
                                    <span class="match-label">${pi + 1}.</span>
                                    <span>${p.left}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="match-col">
                        <div class="match-col-header">Columna B &nbsp;— arrastra para ordenar</div>
                        <div class="match-items-wrap match-col-right">
                            ${shuffledRight.map(p => `
                                <div class="match-item match-item-right" data-right="${p.right.replace(/"/g, '&quot;')}">
                                    <span class="drag-handle">⠿</span>
                                    <span>${p.right}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="question-card" id="q-card-${i}" data-q="${i}">
                <div class="question-text">${i + 1}. ${q.type === 'match' ? 'Relaciona las columnas:' : q.type === 'fill_blanks' ? 'Completa la oración:' : (q.type === 'ordering' ? (q.question || 'Ordena los eventos:') : (q.question || ''))}</div>
                ${content}
                <div id="feedback-${i}" class="feedback"></div>
            </div>
        `;
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.config.title} - LectoIA</title>
    <style>
        :root {
            --primary: #2563eb;
            --secondary: #64748b;
            --success: #059669;
            --danger: #dc2626;
            --bg: #f8fafc;
            --text: #1e293b;
            --border: #e2e8f0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: var(--bg); color: var(--text); line-height: 1.6; padding: 2rem; }
        header { text-align: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid var(--border); }
        header h1 { color: var(--primary); font-size: 2rem; margin-bottom: 0.5rem; }
        .container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .reading-panel {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            position: sticky;
            top: 2rem;
            align-self: start;
            max-height: calc(100vh - 4rem);
            overflow-y: auto;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .reading-panel img {
            max-width: 100%;
            max-height: calc(100vh - 7rem);
            object-fit: contain;
            border-radius: 8px;
        }
        @media (max-width: 900px) {
            .container { grid-template-columns: 1fr; gap: 1rem; }
            .reading-panel {
                position: relative;
                top: 0;
                max-height: none;
                overflow-y: visible;
                display: block;
                padding: 1rem;
            }
            .reading-panel img {
                max-height: none;
                width: 100%;
            }
        }
        .activity-panel { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .question-card { margin-bottom: 2rem; padding: 1.5rem; border: 1px solid var(--border); border-radius: 10px; transition: all 0.3s ease; }
        .question-card.correct { border-color: var(--success); background-color: #f0fdf4; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.05); }
        .question-card.incorrect { border-color: var(--danger); background-color: #fef2f2; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.05); }
        .question-text { font-weight: 600; font-size: 1.1rem; margin-bottom: 1rem; }
        .options-list, .ordering-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .option-item { padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; }
        .option-item.selected { background-color: var(--primary); color: white; border-color: var(--primary); }
        .match-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.25rem; }
        .match-col { display: flex; flex-direction: column; gap: 0; }
        .match-col-header { font-size: 0.72rem; font-weight: 700; color: var(--secondary); text-transform: uppercase; padding: 0.4rem 0.75rem; text-align: center; background: #f1f5f9; border-radius: 6px 6px 0 0; border: 2px solid var(--border); border-bottom: none; letter-spacing: 0.04em; }
        .match-items-wrap { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.5rem; background: #fafafa; border: 2px solid var(--border); border-top: none; border-radius: 0 0 8px 8px; min-height: 60px; }
        .match-item { padding: 0.7rem 0.9rem; border: 2px solid var(--border); border-radius: 8px; background: white; min-height: 48px; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; line-height: 1.4; user-select: none; }
        .match-item-left { background: #f0f9ff; border-color: #bae6fd; cursor: default; }
        .match-item-right { cursor: grab; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        .match-item-right:hover { border-color: var(--primary); background: #eff6ff; box-shadow: 0 2px 8px rgba(37,99,235,0.12); }
        .match-item-right:active { cursor: grabbing; }
        .sortable-ghost { opacity: 0.4; background-color: #dbeafe !important; border: 2px dashed var(--primary) !important; }
        .sortable-chosen { box-shadow: 0 8px 16px rgba(0,0,0,0.15) !important; background-color: #eff6ff !important; }
        .sortable-drag { opacity: 0.9; }
        .match-label { font-weight: 700; color: var(--primary); min-width: 20px; font-size: 0.85rem; flex-shrink: 0; }
        .drag-handle { color: #94a3b8; font-size: 1.1rem; flex-shrink: 0; user-select: none; }
        .fill-blanks-input { border: none; border-bottom: 2px solid var(--primary); width: 100px; text-align: center; }
        .feedback { margin-top: 1rem; padding: 1rem; border-radius: 8px; display: none; font-size: 0.95rem; font-weight: 500; line-height: 1.45; }
        .feedback.correct-feedback { background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
        .feedback.incorrect-feedback { background-color: #fef2f2; color: #981b1b; border: 1px solid #fca5a5; }
        .visible { display: block; }
        .footer-actions { margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; }
        .btn { padding: 0.75rem 1.5rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; }
        .btn-primary { background: var(--primary); color: white; }
        .results-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: none; justify-content: center; align-items: center; z-index: 100; }
        .results-card { background: white; padding: 2rem; border-radius: 16px; text-align: center; max-width: 500px; width: 90%; }
    </style>
</head>
<body>
    <header>
        <h1>${data.config.title}</h1>
    </header>
    <div class="container">
        <div class="reading-panel"><img src="${base64Image}" alt="Lectura"></div>
        <div class="activity-panel">
            <div id="questions-container">${data.questions.map((q, i) => renderQuestion(q, i)).join('')}</div>
            <div class="footer-actions">
                <button class="btn btn-primary" onclick="checkAnswers()">Finalizar Evaluación</button>
            </div>
        </div>
    </div>
    <div id="results-overlay" class="results-overlay">
        <div class="results-card">
            <h2 style="color: var(--primary); margin-bottom: 0.5rem;">Evaluación Finalizada</h2>
            <p style="color: var(--secondary); font-size: 0.95rem;">Tu puntuación obtenida es:</p>
            <div style="font-size: 3.5rem; font-weight: 800; color: var(--primary); margin: 1rem 0;" id="score-display">0/0</div>
            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
                <button class="btn btn-primary" onclick="location.reload()">Reiniciar Ficha</button>
                <button class="btn" style="background: var(--secondary); color: white;" onclick="document.getElementById('results-overlay').style.display = 'none'">Ver Corrección</button>
            </div>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    <script>
        const questions = ${JSON.stringify(data.questions)};
        document.querySelectorAll('.ordering-list, .match-col-right').forEach(el => new Sortable(el, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag'
        }));
        function selectOption(qIdx, optIdx) {
            const card = document.getElementById('q-card-' + qIdx);
            card.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
            card.querySelectorAll('.option-item')[optIdx].classList.add('selected');
        }
        function checkAnswers() {
            let score = 0;
            questions.forEach((q, i) => {
                const card = document.getElementById('q-card-' + i);
                const feedback = document.getElementById('feedback-' + i);
                let isCorrect = false;
                if (q.type === 'multiple_choice' || q.type === 'true_false') {
                    const selected = card.querySelector('.option-item.selected');
                    isCorrect = (selected && selected.textContent.trim() === q.correct_answer);
                } else if (q.type === 'fill_blanks') {
                    isCorrect = (card.querySelector('.fill-blanks-input').value.trim().toLowerCase() === q.correct_answer.toLowerCase());
                } else if (q.type === 'ordering') {
                    const items = Array.from(card.querySelectorAll('.ordering-list .match-item')).map(el => el.dataset.item);
                    isCorrect = (JSON.stringify(items) === JSON.stringify(q.correct_order));
                } else if (q.type === 'match') {
                    const items = Array.from(card.querySelectorAll('.match-col-right .match-item-right')).map(el => el.dataset.right);
                    isCorrect = (JSON.stringify(items) === JSON.stringify(q.pairs.map(p => p.right)));
                }
                
                card.classList.remove('correct', 'incorrect');
                
                let feedbackText = '';
                if (isCorrect) {
                    score++;
                    card.classList.add('correct');
                    feedback.className = 'feedback visible correct-feedback';
                    feedbackText = q.feedback_correct || '¡Excelente trabajo! Has respondido correctamente.';
                } else {
                    card.classList.add('incorrect');
                    feedback.className = 'feedback visible incorrect-feedback';
                    feedbackText = q.feedback_incorrect || 'Revisa nuevamente la lectura para responder esta pregunta.';
                }
                
                feedback.innerHTML = '<strong>' + (isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto') + '</strong><br><span style="display: block; margin-top: 0.35rem; font-weight: normal; font-size: 0.92rem;">' + feedbackText + '</span>';
            });
            document.getElementById('score-display').textContent = score + '/' + questions.length;
            document.getElementById('results-overlay').style.display = 'flex';
        }
    </script>
</body>
</html>`;
};
