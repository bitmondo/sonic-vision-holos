 const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static('public'));

io.on('connection', socket => {
  console.log('Nuevo usuario conectado');

  socket.on('videoData', data => {
    socket.broadcast.emit('videoData', data);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));

