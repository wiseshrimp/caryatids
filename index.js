const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')

class Server {
  constructor() {
    // Set up express server and socket
    this.app = express()
    this.http = require('http').createServer(this.app)
    this.io = require('socket.io')(this.http)
    this.sockets = []

  }

  register = () => {
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.app.use(express.static(path.join(__dirname, 'public')))
    this.app.use(cors())
    this.app.get('/', (req, res) => {
      res.sendFile(__dirname + '/index.html')
    })
    
    this.io.on('connection', (socket) => {
      console.log('a user connected')
      this.sockets.push({
        id: socket.id,
        pos: {x: 0, y: 0, z: 20},
        rot: {x: 0, y: 0, z: 0}
      })
      socket.emit('initialload', this.sockets)
  
      socket.on('userconnect', data => {
        let mesh = {
          id: socket.id,
          pos: data.pos,
          rot: data.rot
        }
        socket.broadcast.emit('userconnect', mesh)
      })

      socket.on('disconnect', () => {
        socket.broadcast.emit('userdisconnect', socket.id)
        let idx = this.sockets.findIndex(mesh => mesh.id === socket.id)
        this.sockets = this.sockets.splice(idx, 1)
        console.log('user disconnected')
      })
    
      socket.on('move', (data) => {

        socket.broadcast.emit('move', {
          id: socket.id, 
          pos: data.pos,
          rot: data.rot
        })
      })

    })
  }


  run = async () => {
    try {
      this.register()
      this.http.listen(process.env.PORT || 8080, function(){
        console.log('listening on *:3000')
      })
    } catch (err) {
      console.error('Error running server: ', err)
    }
  }
}

(new Server()).run()
