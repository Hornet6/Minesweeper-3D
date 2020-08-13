const express = require('express');
const app = express();

var server = app.listen(process.env.PORT || 80, listen);

function listen() {
    var host = server.address().address;
    var port = server.address().port;

    console.log("LISTENING");
}



app.use(express.static("public"));

//var io = require('socket.io')(server);

var socket = require("socket.io");
var io = socket(server);

function makeboard(size,mines){
  if (mines>size*size){
    console.log("TOO MANY MINES")
    return "FAIL"
  }else{
    var b=[]
    for (i=0;i<size;i++){
      var hold=[]
      for (j=0;j<size;j++){
        var hold2=[]
        for (z=0;z<size;z++){
          hold2.push("")
        }
        hold.push(hold2)
      }
      b.push(hold)
    }
    //console.log(b)
    var placed = 0
    while (placed<mines){
      var locx=Math.floor((Math.random() * size));
      var locy=Math.floor((Math.random() * size));
      var locz=Math.floor((Math.random() * size))
      if (b[locz][locx][locy]==""){
        b[locz][locx][locy]="M"
        placed++
      }
    }
    for (var k=0;k<size;k++){
      for (var i=0;i<size;i++){
        for (var j=0;j<size;j++){
          if (b[k][i][j]!="M"){
            var count=0
            for(var x=-1;x<2;x++){
              for(var y=-1;y<2;y++){
                for(var z=-1;z<2;z++){
                  if(!(i+x<0 || i+x>=size || j+y<0 || j+y>=size || k+z<0 || k+z>=size)){
                    if(b[k+z][i+x][j+y]=="M"){
                      count++
                    }
                  }
                }
              }
            }
            b[k][i][j]=count
          }
        }
      }
    }
    return b
  }
}
async function reveal0(id,cords,b,s){
  // could prob remove id from this
  for(var x=-1;x<2;x++){
    for(var y=-1;y<2;y++){
        for(var z=-1;z<2;z++){
          ////////////////////////////////////////////////////////////this is bad
        if(cords.x+x>=0 && cords.x+x<s[id].length && cords.y+y>=0 && cords.y+y<s[id].length && cords.z+z>=0 && cords.z+z<s[id].length){
          if (s[id][cords.z+z][cords.x+x][cords.y+y]===""){
            s[id][cords.z+z][cords.x+x][cords.y+y]=b[id][cords.z+z][cords.x+x][cords.y+y]
            // console.log((b[id][cords.x+x][cords.y+y]))
            // console.log((b[id][cords.x+x][cords.y+y]=="0"))
            if (b[id][cords.z+z][cords.x+x][cords.y+y]=="0"){
              var d={
                x:cords.x+x,
                y:cords.y+y,
                z:cords.z+z
              }
              s=await reveal0(id,d,b,s)
            }
          }
        }
      }
    }
  }
  return s
}
function blank3d(size){
  var b=[]
  for (var i=0;i<size;i++){
    var hold=[]
    for (var j=0;j<size;j++){
      var hold2=[]
      for (var z=0;z<size;z++){
        hold2.push("")
      }
      hold.push(hold2)
    }
    b.push(hold)
  }
  return b
}
function checkwin(id){
  var win = false
  if (flags[id]==0){
    console.log("pass 1")
    win=true
    for (var i=0;i<size;i++){
      for (var j=0;j<size;j++){
        for (var z=0;z<size;z++){
          if (seen[id][i][j][z]===""){
            console.log(i+" "+j+" "+z)
            console.log("fail")
            win = false
          }
        }
      }
    }
  }
  return win
}
/////////////////////////////////////
var size=5
var mines=10
////////////////////////////////////
// for (x of hold){
//   console.log(x.toString())
// }
var boards={}
var seen={}
var alive={}
var flags={}
io.sockets.on('connection',
  async function (socket) {
    flags[socket.id]=mines
    boards[socket.id]=await makeboard(5,mines)
    seen[socket.id]=await blank3d(size)
    alive[socket.id]=true
    socket.emit("update",seen[socket.id],flags[socket.id])
    console.log("We have a new client: " + socket.id);
    socket.on('move',
      async function(data) {
        if (!alive[socket.id]){
          return false
        }
        if (typeof data.x=="undefined" || typeof data.y=="undefined" || typeof data.z=="undefined"){
          return false
        }
        if (data.x>4 || data.y>4 || data.z>4 || data.x<0 || data.y<0 || data.z<0){
          return false
        }
        seen[socket.id][data.z][data.x][data.y]=boards[socket.id][data.z][data.x][data.y]
        if (boards[socket.id][data.z][data.x][data.y]=="M"){
          socket.emit("popup","bang")
          alive[socket.id]=false
          socket.emit("update",boards[socket.id],flags[socket.id])
          return false
        }else if(boards[socket.id][data.z][data.x][data.y]=="0"){
          //reveal all the 0's around it
          //fix for 3d
          seen=await reveal0(socket.id,data,boards,seen)
        }
        // win checks
        
        if (await checkwin(socket.id)){
          console.log("WON")
          socket.emit("popup","STERGE YOUR RANDOMLY GENERATED NUMBER IS 4661221")
        }
        socket.emit("update",seen[socket.id],flags[socket.id])
      } 
    );

    socket.on('reset', async function() {
      boards[socket.id]=await makeboard(5,mines)
      seen[socket.id]=await blank3d(size)
      alive[socket.id]=true
      flags[socket.id]=mines
      socket.emit("update",seen[socket.id],flags[socket.id])
    });
    socket.on('flag', async function(data){
      if (!alive[socket.id]){
        return false
      }
      if (data.x>4 || data.y>4 || data.z>4 || data.x<0 || data.y<0 || data.z<0){
        return false
      }
      if (seen[socket.id][data.z][data.x][data.y]===""){
        seen[socket.id][data.z][data.x][data.y]="F"
        flags[socket.id]--
      }else if(seen[socket.id][data.z][data.x][data.y]==="F"){
        seen[socket.id][data.z][data.x][data.y]="?"
        flags[socket.id]++
      }else if(seen[socket.id][data.z][data.x][data.y]==="?"){
        seen[socket.id][data.z][data.x][data.y]=""
      }
      if (await checkwin(socket.id)){
        socket.emit("popup","STERGE YOUR RANDOMLY GENERATED NUMBER IS 4661221")
      }
      socket.emit("update",seen[socket.id],flags[socket.id])
    })

    socket.on('disconnect', function() {
      //remove their board from boards
      console.log("Client has disconnected: " + socket.id );
      delete boards[socket.id]
      delete seen[socket.id]
      delete alive[socket.id]
    });
}
);

