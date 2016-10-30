import Express from 'express';
import httpModule from 'http';
import socketIO from 'socket.io';
import _ from 'lodash';

const randomstring = require("randomstring");

const app = Express();
const http = httpModule.Server(app);
const io = socketIO(http);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

function DisconnectRoom(rooms: Array, socket: Object){
	const roomId = socket.id;

	let targetRoom = _.find(rooms, (room) => {
		return room.id === roomId;
	});
	console.log(targetRoom.id);
	socket.leave(targetRoom.id);
}

function checkRoomId(rooms: Array, roomId: string){
	let checkReq = _.isUndefined(roomId) || _.isEmpty(roomId),
		resp = {
			error: null,
			success: false
		};

	let targetRoom = _.find(rooms, (room) => {
		return room.id === roomId;
	});

	if(checkReq){
		resp.error = {
			status: 404,
			message : 'roomId 不可為空'
		};
	}else if(_.isUndefined(targetRoom)){
		resp.error = {
			status: 404,
			message: '房間不存在'
		};
	}else{
		resp.success = true;
		resp.targetRoom = targetRoom;
	}

	return resp;
}

class roomClass{
	constructor(params: object){

		this._MAX = 8;
		this._ID = params.id;
		this._MEMBERS = [];

	}

	get id(){
		return this._ID;
	}

	addMember(user){
		return new Promise((resolve, reject) => {
			let error = null;
			this._MEMBERS.map(u => {
				if(u.id === user.id){
					reject(new Error('使用者已存在'));
				}
			});
			this._MEMBERS.push(user);

			resolve();
		});
	}

	removeMember(user){
		let error = null;
		
		return _.remove(this._MEMBERS, (member) => {
			return member.id === user.id;
		});
	}
}

let rooms = [];


var user_count = 0;

//當新的使用者連接進來的時候
io.on('connection', function(socket){
	
	//回傳個人的socket.id
	socket.emit('getuid', {
		uid: socket.id
	});

	// TODO 建立房間
	socket.on('createroom', (data) => {
		const roomID = randomstring.generate();
		const params = {
			id: roomID,
		};

		const room = new roomClass(params);
		rooms.push(room);
		socket.emit('success', {
			status: 200,
			roomId: room.id,
			message: `建立房間${room.id}成功`
		});
	});

	// TODO 加入房間
	socket.on('joinroom', (req) => {
		const checkResult = checkRoomId(rooms, req.roomId);
		
		if(checkResult.error){
			socket.emit('errorStatus', checkResult.error);
		}else{

			checkResult.targetRoom.addMember(socket)
			.then(() => {
				socket.join(req.roomId);

				socket.emit('success', {
					status: 200,
					message: `使用者${socket.id}已加入成功`
				});
			}).catch(error => {	
				socket.emit('error', {
					status: 404,
					message : error.message
				});
			});
		}
	});

	// TODO 離開房間
	socket.on('leaveroom', (req) => {
		
		const checkResult = checkRoomId(rooms, req.roomId);
		
		if(checkResult.error){
			socket.emit('errorStatus', checkResult.error);
		}else{
			checkResult.targetRoom.removeMember(socket);
			socket.leave(req.roomId);
			socket.emit('success', {
				status: 200,
				message: `${socket.id}已經離開房間`
			});
		}
	});
	// TODO 發送房間訊息

	socket.on('localmessage', (req) => {
		
		const checkResult = checkRoomId(rooms, req.roomId);
		
		if(checkResult.error){
			socket.emit('errorStatus', checkResult.error);
		}else{
			io.to(req.roomId).emit('localmessage', req.params);
		}
	});

	//left
	socket.on('disconnect',function(){
		DisconnectRoom(rooms, socket.id);
		io.emit('user left',{
			username:socket.username
		});
	});


});

//指定port
http.listen(process.env.PORT || 3000, function(){
	console.log('listening on *:3000');
});

//Nodejs 奇怪的錯誤防止Process 死掉
process.on('uncaughtException', function (err) {
  console.log(err);
})