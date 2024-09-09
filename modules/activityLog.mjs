// status box
const status = document.querySelector('#activity-log')
const logMessage = (message) => {
    status.style.display = 'block'
    status.innerHTML += `<p>${message}</p>`
}

export { logMessage };
