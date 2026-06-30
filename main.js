// CONFIGURACIÓN
const API_KEY = "AIzaSyCXGG_HbbXQbDAglYdc5evdbUv4ODp4McA"; 
const MODEL_NAME = "gemini-3.1-flash-lite"; 
const URL_API = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

const generateBtn = document.querySelector('#generate');
const copyBtn = document.querySelector('#copy-btn');
const output = document.querySelector('#output');

// Función auxiliar para esperar (pausa)
const wait = (ms) => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry(payload, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(URL_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Si el error es por alta demanda (503) o demasiadas peticiones (429)
            if ((response.status === 503 || response.status === 429) && i < maxRetries - 1) {
                const delay = (i + 1) * 2000; // Aumenta el tiempo de espera en cada intento
                output.textContent = `⏳ Servidores ocupados, reintentando en ${delay/1000}s...`;
                await wait(delay);
                continue; 
            }
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await wait(2000);
        }
    }
}

generateBtn.addEventListener('click', async () => {
    const idea = document.querySelector('#idea').value.trim();
    const tone = document.querySelector('#tone').value;
    const length = document.querySelector('#length').value;

    if (!idea) {
        output.textContent = '⚠️ Por favor, escribe una idea.';
        return;
    }

    // Preparación visual
    output.textContent = '✍️ Pensando y redactando...';
    output.classList.add('loading');
    copyBtn.style.display = 'none';
    generateBtn.disabled = true;

    const payload = {
        contents: [{ parts: [{ text: `Actúa como un redactor experto. Idea: "${idea}". Tono: ${tone}. Extensión: ${length}. Escribe directamente el resultado en español.` }] }]
    };

    try {
        const response = await fetchWithRetry(payload);
        const data = await response.json();

        if (response.ok) {
            const textResult = data.candidates[0].content.parts[0].text;
            output.textContent = textResult;
            output.classList.remove('loading');
            
            // Mostrar botón de copiar con elegancia
            copyBtn.style.display = 'block';
        } else {
            output.textContent = `❌ Error de Google: ${data.error.message}`;
            output.classList.remove('loading');
        }
    } catch (error) {
        output.textContent = '❌ No se pudo conectar con la IA después de varios intentos.';
        output.classList.remove('loading');
    } finally {
        generateBtn.disabled = false;
    }
});

// Lógica del botón de copiar
copyBtn.addEventListener('click', () => {
    const textToCopy = output.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ ¡Copiado!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    });
});