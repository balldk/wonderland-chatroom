const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io').listen(server)
const path = require('path')
const handlebars = require('express-handlebars')
const PORT = process.env.PORT || 3000

// Middlewares
app.use(express.static(path.join(__dirname + '/../public')))
app.engine('handlebars', handlebars({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')

// route
app.get('/', (req, res) => {
	res.render('index')
})

app.get(/^\/@(.*)/, (req, res) => {
	res.render('chatroom')
})

app.get('/chatroom', (req, res) => {
	res.render('chatroom')
})

// Socket io handler
server.listen(PORT, () => {
	console.log('\nMagic is happening on \x1b[31mhttp://localhost:3000 \n')
})

const connections = {}
const users = {}
let roomName = null
let username = null

io.sockets
.use((socket, next) => {
	roomName = socket.handshake.query.roomName
	username = socket.handshake.query.username
	if (roomName && username && roomName != users[username] && username.indexOf(' ') === -1 && 
	username.length <= 24) {
		next()
	} else if (roomName === users[username]) {
		next(new Error('name exist'))
	} else if (!username){
		next(new Error('Missing username'))
	} else if (username.indexOf(' ') >= 0 || username.length > 24) {
		next(new Error('char error'))
	} else {
		next(new Error('Missing roomName'))
	}
})
.on('connection', socket => {
	socket.join(roomName)
	connections[socket.id] = username
	users[username] = roomName 
	process.stdout.write(`\r\x1b[31mConnections: \x1b[36m${Object.keys(connections).length} \x1b[37m`)

	socket.broadcast.to(roomName).emit('user join', username)

	io.in(roomName).clients((err, usersId) => {
		socket.emit('initial render', usersId.map(user => connections[user]))
	})

	socket.on('disconnect', data => {
		let leftUser = connections[socket.id]
		io.to(roomName).emit('user left', leftUser)
		delete connections[socket.id]
		delete users[leftUser]
		process.stdout.write(`\r\x1b[31mConnections: \x1b[36m${Object.keys(connections).length} \x1b[37m`)
	})

	socket.on('send message', msg => {
		if (msg != '') {
			socket.broadcast.to(roomName).emit('new message', {
				msg: msg,
			username: connections[socket.id]
		})
		}
	})
})
