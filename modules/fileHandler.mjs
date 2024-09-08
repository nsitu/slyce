// fileHandler.mjs

function fileHandler(handler) {
    const dropArea = document.body;
    const fileInput = document.querySelector('#file-input');
    const dropMessage = document.querySelector('#drop-message');
    const browseButton = document.querySelector('#browse-button');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropArea.classList.add('hover');
    }

    function unhighlight(e) {
        dropArea.classList.remove('hover');
    }

    // Handle dropped files
    dropArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer?.files;
        ([...files]).forEach(handler);
    }, false);

    // Setup file input
    browseButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        ([...files]).forEach(handler);
    });
}

export { fileHandler };
