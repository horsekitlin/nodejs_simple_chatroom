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

class roomClass extends Object{
	constructor(params: object){
		super(params);
		this._MAX = 8;
		this._ID = params.id;
		this._MEMBERS = [];

	}

	addMember(user){
		return new Promise((resolve, reject) => {
			let error = null;
			this._MEMBERS.map(u => {
				if(u.id === user.id){
					reject(new Error('使用者已存在'));
				}
			});
		});

		this._MEMBERS.push(user);

		resolve();
	}
}

let rooms = [];


var user_count = 0;

//當新的使用者連接進來的時候
io.on('connection', function(socket){

console.log(socket.id);
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
			id: room.id,
			message: `建立房間${room.id}成功`
		});
	});

	// TODO 加入房間
	socket.on('adduser', (req) => {
		const checkReq = _.isUndefined(req.roomId) || _.isEmpty(req.roomId);

		let targetRoom = _.find(rooms, (room) => {
			return room.id === roomId;
		});

		if(checkReq){
			socket.emit('error', {
				status: 404,
				message : 'roomId 不可為空'
			});
		}else if(_.isUndefined(targetRoom)){
			socket.emit('error', {
				status: 404,
				message: '房間不存在'
			});
		}else{

			targetRoom.addMember(socket)
			.then(() => {
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

	// TODO 發送房間訊息

	// TODO 發送私密訊息

	//新user
	socket.on('add user',function(msg){
		socket.username = msg;
		console.log("new user:"+msg+" logged.");
		io.emit('add user',{
			username: socket.username
		});
	});

	//監聽新訊息事件
	socket.on('chat message', function(msg){

		console.log(socket.username+":"+msg);

  		//發佈新訊息
		io.emit('chat message', {
			username:socket.username,
			msg:msg
		});
	});

	//left
	socket.on('disconnect',function(){
		console.log(socket.username+" left.");
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