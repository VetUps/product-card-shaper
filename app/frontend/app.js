const API_URL = 'http://localhost:8000';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const dropZonePrompt = document.getElementById('dropZonePrompt');
const filePreview = document.getElementById('filePreview');
const fileNameEl = document.getElementById('fileName');
const fileSizeEl = document.getElementById('fileSize');
const btnRemoveFile = document.getElementById('btnRemoveFile');

const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');

const btnSubmit = document.getElementById('btnSubmit');
const submitSpinner = document.getElementById('submitSpinner');
const btnSubmitText = document.getElementById('btnSubmitText');

const responseSection = document.getElementById('responseSection');
const responseCodeOutput = document.getElementById('responseCodeOutput');
const btnCopyResponse = document.getElementById('btnCopyResponse');
const copyButtonText = document.getElementById('copyButtonText');
const iconCopy = document.getElementById('iconCopy');
const iconCheck = document.getElementById('iconCheck');

let currentFile = null;
let lastResponseData = null;
let copyTimeoutId = null;

// Drag & Drop события
['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    window.addEventListener(eventName, preventDefaults, false);
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
});

['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
});

dropZone.addEventListener('click', (e) => {
    if (e.target.closest('#btnRemoveFile')) return;
    fileInput.click();
});

dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        handleFileSelection(e.target.files[0]);
    }
});

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
        handleFileSelection(dt.files[0]);
    }
});

btnRemoveFile.addEventListener('click', (e) => {
    e.stopPropagation();
    resetFileSelection();
    hideError();
});

function formatBytes(bytes) {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function handleFileSelection(file) {
    hideError();

    const isJsonExtension = file.name.toLowerCase().endsWith('.json');
    if (!isJsonExtension && file.type !== 'application/json') {
        showError('Некорректный формат файла. Требуется .json');
        resetFileSelection();
        return;
    }

    try {
        const text = await file.text();
        JSON.parse(text);
        currentFile = file;

        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);

        dropZonePrompt.classList.add('hidden');
        filePreview.classList.remove('hidden');
        btnSubmit.disabled = false;
    } catch {
        showError('Файл содержит некорректный JSON');
        resetFileSelection();
    }
}

function resetFileSelection() {
    currentFile = null;
    fileInput.value = '';
    dropZonePrompt.classList.remove('hidden');
    filePreview.classList.add('hidden');
    btnSubmit.disabled = true;
}

function showError(message) {
    errorText.textContent = message;
    errorBox.classList.remove('hidden');
}

function hideError() {
    errorBox.classList.add('hidden');
    errorText.textContent = '';
}

// Отправка файла на сервер
btnSubmit.addEventListener('click', async () => {
    if (!currentFile) return;

    hideError();
    responseSection.classList.add('hidden');
    setLoadingState(true);

    try {
        const formData = new FormData();
        formData.append('file', currentFile, currentFile.name);

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            let detail = '';
            try {
                const errJson = await response.json();
                if (typeof errJson.detail === 'string') {
                    detail = errJson.detail;
                } else if (typeof errJson.message === 'string') {
                    detail = errJson.message;
                } else if (typeof errJson.error === 'string') {
                    detail = errJson.error;
                }
            } catch {
                // Игнорируем ошибку парсинга тела
            }

            const statusLabel = `HTTP ${response.status}${response.statusText ? ' ' + response.statusText : ''}`;
            showError(detail ? `${statusLabel}: ${detail}` : `Ошибка сервера (${statusLabel})`);
            return;
        }

        const data = await response.json();
        lastResponseData = data;
        displayResponse(data);
    } catch {
        showError('Ошибка соединения с сервером');
    } finally {
        setLoadingState(false);
    }
});

function setLoadingState(isLoading) {
    btnSubmit.disabled = isLoading;
    dropZone.classList.toggle('disabled', isLoading);

    if (isLoading) {
        submitSpinner.classList.remove('hidden');
        btnSubmitText.textContent = 'Отправка...';
    } else {
        submitSpinner.classList.add('hidden');
        btnSubmitText.textContent = 'Отправить';
        btnSubmit.disabled = !currentFile;
    }
}

function displayResponse(data) {
    const formattedJson = JSON.stringify(data, null, 2);
    responseCodeOutput.innerHTML = highlightJson(formattedJson);
    responseSection.classList.remove('hidden');
}

function highlightJson(json) {
    const escaped = json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return escaped.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                cls = /:$/.test(match) ? 'json-key' : 'json-string';
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        }
    );
}

// Копирование результата
btnCopyResponse.addEventListener('click', async () => {
    if (!lastResponseData) return;

    try {
        const textToCopy = JSON.stringify(lastResponseData, null, 2);
        await navigator.clipboard.writeText(textToCopy);

        copyButtonText.textContent = 'Скопировано';
        iconCopy.classList.add('hidden');
        iconCheck.classList.remove('hidden');
        btnCopyResponse.classList.add('copied');

        if (copyTimeoutId) clearTimeout(copyTimeoutId);
        copyTimeoutId = setTimeout(() => {
            copyButtonText.textContent = 'Копировать';
            iconCopy.classList.remove('hidden');
            iconCheck.classList.add('hidden');
            btnCopyResponse.classList.remove('copied');
        }, 2000);
    } catch {
        showError('Не удалось скопировать в буфер обмена');
    }
});
