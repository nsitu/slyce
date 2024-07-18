


function dragAndDrop(selector, handler) {

    const dropArea = document.querySelector(selector);

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
    dropArea.addEventListener('drop', handler, false);



}

export { dragAndDrop };
