// Given a blobURL, download it as a file.

const downloadBlob = (blobURL, tileNumber, fileInfo) => {
    let a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobURL;
    let padded = String(tileNumber).padStart(4, '0');
    a.download = `tile-${padded}-${fileInfo.name}.webm`;
    document.body.appendChild(a);
    a.click();
};

export { downloadBlob };

