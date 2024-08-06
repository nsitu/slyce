// status box
const status = document.createElement('div')
document.body.appendChild(status)
const setStatus = (message) => {
    status.innerHTML = message
}

export { setStatus };
