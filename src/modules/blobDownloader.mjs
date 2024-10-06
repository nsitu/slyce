const downloadBlob = (blob) => {
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'output.webm';
    document.body.appendChild(a);
    a.click();
};

export { downloadBlob };