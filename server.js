const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { Socket } = require('engine.io');
const formatMessage =  require('./utils/messages');
const {userJoin, getCurrentUser,userLeave, getRoomUsers} =  require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Set static folder
app.use(express.static(path.join(__dirname,'public')));

const botname = 'Admin Voice';

//Run when client connect
io.on('connection', socket => {
    socket.on('joinRoom', ({username, room }) =>{
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //welcome user
        socket.emit('message',  formatMessage(botname, 'Welcome to this chatting app'));

        //Broadcast when user connect
        socket.broadcast.to(user.room).emit('message',  formatMessage(botname,`${user.username} has joined the chat`));
        
        //Send User and room info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users: getRoomUsers(user.room)
        });
    });

    //Listen to chatMessage
    socket.on('chatMessage', msg =>{
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message',  formatMessage(user.username,msg));
    });

    //Run when user disconnect
    socket.on('disconnect', () =>{
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message', formatMessage(botname, `${user.username} has existed the chat`));

            //Send User and room info
            io.to(user.room).emit('roomUsers',{
            room:user.room,
            users: getRoomUsers(user.room)
        });
        }
        
    });

    
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log('Server running on port ${PORT}'));