var box = document.getElementById('roomInput')
box.addEventListener('focus', inputFocus)
box.addEventListener('blur', inputBlur)
box.addEventListener('keypress', submit)

function inputFocus() {
    box.style.backgroundColor = 'white';
    box.style.color = 'black';
}

function inputBlur() {
    box.style.backgroundColor = 'black';
    box.style.color = 'white';
}

function submit(key) {
    if (key.which === 13) {
        window.location.href = window.location.href + '@' + box.value
    }
}