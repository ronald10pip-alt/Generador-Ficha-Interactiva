import { getOfflineTemplate } from './template';
import sortableJSContent from 'sortablejs/Sortable.min.js?raw';

export async function downloadActivity(questions, config, base64Image) {

    const questionsArray = Array.isArray(questions) ? questions : (questions && questions.questions ? questions.questions : []);
    const data = { questions: questionsArray, config };
    const htmlContent = getOfflineTemplate(data, base64Image, sortableJSContent);

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanTitle = config.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ_]/g, '');
    const cleanGrade = config.grade.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ_]/g, '');
    a.download = `actividad_${cleanTitle}_${cleanGrade}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
