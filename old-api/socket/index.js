// sockets.js
var socketio = require('socket.io');
const model = require('../models');

module.exports.listen = function(app){
    io = socketio.listen(app);

    users = io.of('/users');
    users.on('connection', function(socket){
        
    });
    
    io.on("connection", (userSocket) => {
        console.log('connected');
        userSocket.on("join_activity_rooms", async (data) => {
            console.log("User id is: " + data);
            activities = await model.Activity.findAll({ attributes: ['title'], include: [{model: model.UserActivity, where: {userId: data}}]});
            activities.map( activity =>{
                console.log(activity.dataValues.title);
                userSocket.join(activity.dataValues.title);
                io.in(activity.dataValues.title).emit('joined_room', 'joined ' + activity.dataValues.title + ' room');
            })
        });
        userSocket.on("join_activity_room", async (response) => {
            console.log(response)
            activity = await model.Activity.findOne({attributes: ['title'], where: {title: response}});
            userSocket.join(activity.dataValues.title);
            io.in(activity.dataValues.title).emit('joined_room', 'joined' + activity.dataValues.title + ' room');

        })
        userSocket.on("send_note", async (response) => {
            activity = await model.Activity.findOne({attributes: ['id'], where: {title: response.activity}});
            let note = await model.Note.create({
                senderId: response.sender,
                activityId: activity.dataValues.id,
                body: response.message,
                status: 'pending'
            });
            let payload = {
                id: note.dataValues.id,
                senderId: note.dataValues.senderId,
                activityId: note.dataValues.activityId,
                body: note.dataValues.body,
                timestamp: note.dataValues.createdAt.valueOf()
            }
            io.in(response.activity).emit('receive_note', payload);
        })
    });

    return io;
    
}