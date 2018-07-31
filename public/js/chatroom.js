$('textarea#chat-input'),
	function() {
		var offset = this.offsetHeight - this.clientHeight

		var resizeTextarea = function(el) {
			jQuery(el)
				.css('height', 'auto')
				.css('height', el.scrollHeight + offset)
		}
		$(this)
			.on('keyup input', function() {
				resizeTextarea(this)
			})
			.removeAttr('data-autoresize')
	}

let msg = $('#chat-input')
let msgFlow = $('#message-flow')
let username =  prompt('Enter your username')
let noti = 0
let isFocus = true

window.onfocus = function() {
	document.title = window.location.pathname.slice(1) + ' - Wonderland'
	isFocus = true
	noti = 0	
}

window.onblur = function() {
	isFocus = false
	console.log(isFocus)
}

function addMessage(msgType, uName, message) {
	uClass = 'username'
	if (msgType === 'normal') {
		if (uName === username) {
			utext = `[<user class="me">${uName}</user>]~$ `
		} else {
			utext = `[<user class="user">${uName}</user>]~$ `
		}
		divClass = 'msg'
	} else if (msgType === 'error' || msgType === 'info') {
		uClass += ' ' + msgType
		utext = uName
		divClass = `msg ${msgType}`
	}
	msgFlow.append(`
		<div class="${divClass}">
			<p class="${uClass}">${utext}</p>
			<p class="text">${message}</p>
		</div>`)
	
	scrollbar = $('#message-flow')[0]
	scrollbar.scrollTop = scrollbar.scrollHeight
}

socket = io.connect(
	window.location.host,
	{
		query: {
			roomName: `/${window.location.pathname.slice(2)}`,
			username: username
		}
	}
)
socket.on('error', error => {
	if (error === 'Missing username') {
		addMessage('error', '!', 'Username is required to chat')
	} else if (error === 'name exist') {
		addMessage('error', '!', `"${username}" already exists in this room`)
	} else if (error === 'char error') {
		addMessage('error', '!', `Username must consist of up to 24 letters, numbers, and underscores`)
	}
})

socket.on('disconnect', payload => {
	addMessage('error', '!', 'Disconnected, please try again...')
})

socket.on('initial render', users => {
	addMessage('info', '*', `You joined the room`)
	$('#online-users').html(
		users.map(user => {
			return `<p style="margin-top:0" class="user" id="${user}">${user}</p>`
		})
	)
})

socket.on('new message', payload => {
	addMessage('normal', payload.username, payload.msg)
	if (!isFocus){
		noti++
		document.title = `(${noti}) ${window.location.pathname.slice(1)} - Wonderland`
	}
})

socket.on('user left', user => {
	$(`#online-users>#${user}`).remove()
	addMessage('info', '*', `"${user}" left the room`)
})

socket.on('user join', user => {
	$('#online-users').append(`<p class="user" id="${user}">${user}</p>`)
	addMessage('info', '*', `"${user}" joined the room`)
})

msg.keypress(function(e) {
	if (e.which == 13 && !e.shiftKey && socket) {
		e.preventDefault()
		socket.emit('send message', msg.val())
		if (msg.val() != '') {
			addMessage('normal', username, msg.val())
		}
		msg.val('')
	}
})