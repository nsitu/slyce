// Given a blobURL, download it as a file.

const downloadBlob = (blobURL) => {
    let a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobURL;
    a.download = 'output.webm';
    document.body.appendChild(a);
    a.click();
};

export { downloadBlob };

