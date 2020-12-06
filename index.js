const express = require('express')
const cors = require('cors')
const path = require('path')

class Server {
  constructor() {
    // Set up express server and socket
    this.app = express()
    this.http = require('http').createServer(this.app)
    this.io = require('socket.io')(this.http)
  }

  register = () => {
    this.app.use(express.static(path.join(__dirname, 'public')))
    this.app.use(cors())
    this.app.get('/', (req, res) => {
      res.sendFile(__dirname + '/index.html')
    })
    
    this.io.on('connection', (socket) => {
      console.log('a user connected')
  
      socket.on('userconnect', data => {
        let mesh = {
          id: socket.id,
          pos: data.pos,
          rot: data.rot,
          name: data.name
        }
        socket.broadcast.emit('userconnect', mesh)
      })

      socket.on('disconnect', () => {
        socket.broadcast.emit('userdisconnect', socket.id)
        console.log('user disconnected')
      })
    
      socket.on('move', (data) => {
        socket.broadcast.emit('move', {
          id: socket.id, 
          pos: data.pos,
          rot: data.rot,
          name: data.name
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
