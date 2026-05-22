// Configurar worker de PDF.js de forma dinámica
function initPdfjs() {
    const pdfjs = window.pdfjsLib;
    if (pdfjs && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    return pdfjs;
}

export async function processFile(file, onProgress) {
    const tesseract = window.Tesseract;
    const pdfjs = initPdfjs();
    
    if (!tesseract || !pdfjs) {
        throw new Error('Librerías de procesamiento no cargadas.');
    }
    
    if (file.type === 'application/pdf') {
        return await processPDF(file, onProgress);
    } else {
        return await processImage(file, onProgress);
    }
}

async function processImage(file, onProgress) {
    const tesseract = window.Tesseract;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUrl = e.target.result;
            try {
                const result = await tesseract.recognize(dataUrl, 'spa', {
                    logger: m => {
                        if (onProgress && typeof onProgress === 'function') {
                            if (m.status === 'recognizing text') {
                                onProgress(`Reconociendo texto: ${Math.round(m.progress * 100)}%`);
                            } else if (m.status === 'loading spa.traineddata' || m.status === 'loading language traineddata') {
                                onProgress(`Descargando diccionario español: ${Math.round(m.progress * 100)}%`);
                            } else if (m.status === 'initializing api') {
                                onProgress('Inicializando motor de lectura...');
                            }
                        }
                    }
                });
                resolve({
                    text: result.data.text,
                    image: dataUrl
                });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function processPDF(file, onProgress) {
    const tesseract = window.Tesseract;
    const pdfjs = initPdfjs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    let firstPageImage = null;

    for (let i = 1; i <= pdf.numPages; i++) {
        if (onProgress) {
            onProgress(`Procesando página ${i} de ${pdf.numPages}...`);
        }
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        if (i === 1) firstPageImage = dataUrl;

        const result = await tesseract.recognize(dataUrl, 'spa', {
            logger: m => {
                if (onProgress && typeof onProgress === 'function' && m.status === 'recognizing text') {
                    onProgress(`Pág. ${i}/${pdf.numPages} - Reconociendo: ${Math.round(m.progress * 100)}%`);
                }
            }
        });
        fullText += result.data.text + "\n\n";
    }

    return {
        text: fullText,
        image: firstPageImage
    };
}

