var express	=	require('express');
var app		=	express();
var path	=	require("path");
var mysql	=	require("mysql");
var http	=	require('http').Server(app);
var io		=	require('socket.io')(http);
var router	=	express.Router();
var cors = require('cors')

app.use(cors());

var pool = mysql.createPool({
      connectionLimit   :   100,
      host              :   '', // database hosts
      user              :   '', // mysql user
      password          :   '', // mysql pass
      database          :   '', // database name
      debug             :   false
});

router.get('/',function(req,res){
	res.sendFile(__dirname + '/index.html');
});

app.use('/',router);

io.on('connection',function(socket){
	socket.on('activity added',function(data){
		addActivity(data.user,data.username,data.comment,function(error,result){
			if(error) {
				io.emit('error');
			} else {
				io.emit("notify everyone",{user : data.user,comment : data.comment});
			}
		});
	});
});

var addActivity = function(user,username,comment,callback) {
	var self = this;
	pool.getConnection(function(err,connection){
		if(err) {
			return callback(true,null);
		} else {
			var date_ob = new Date();
			var day = ("0" + date_ob.getDate()).slice(-2);
			var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
			var year = date_ob.getFullYear();			    
			var hours = date_ob.getHours();
			var minutes = date_ob.getMinutes();
			var seconds = date_ob.getSeconds();
			  
			var dateTime = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;

			var sqlQuery = "INSERT into wp_ntwaslu_activity (activity_time,user_id,activity_id,user_name,activity_type,message,read_user,last_update,notification) VALUES ('"+dateTime+"','"+user+"','"+user+"','"+username+"','message_received','"+comment+"','0','"+Date.now()+"','')";
			
			connection.query(sqlQuery,function(err,rows){
				connection.release();
				if(err) {
					return callback(true,null);
				} else {
					callback(false,"activity added");
				}
			});			
		}
		connection.on('error', function(err) {
			return callback(true,null);
        });
	});
}

http.listen(5959,function(){
    console.log("Listening on 5959");
});