// status box
const status = document.querySelector('#status-box')

const setStatus = (message) => {
    status.style.display = 'block'
    status.innerHTML = message
}



export { setStatus };
