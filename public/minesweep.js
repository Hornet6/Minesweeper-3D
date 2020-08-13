var socket;

var storeb =[]
var storeFlag=[]
var rememberhighlight={z:-1,x:-1,y:-1}
var width
var height
var mine = new Image()
mine.src="https://cdn.glitch.com/70ecc5b4-7538-47eb-b406-86fca1585ec1%2Fmine-removebg-preview.png?v=1597151961550"
var flag = new Image()
flag.src="https://cdn.glitch.com/70ecc5b4-7538-47eb-b406-86fca1585ec1%2Fgay_flag-removebg-preview.png?v=1597148015916"

function setup(){
    width = document.getElementById("thecanvas").width
    height = document.getElementById("thecanvas").height
    console.log("PROJECT SET UP")

    socket = io.connect('https://stog2-electric-boogaloo.glitch.me/');

    socket.on("update",
        function(data,flags) {
            storeb=data
            storeFlag=flags
            drawboard(storeb,[],flags)
        }
    );
    socket.on("popup", 
    function(data){
        alert(data);
    }
    );

    thecanvas.oncontextmenu = function (e) {
        e.preventDefault();
    };
    document.body.onmousedown = function(e) { if (e.button === 1) return false; }
}
function drawboard(b,highlight,flagnum){

    var rect = thecanvas.getBoundingClientRect();
    var ctx = thecanvas.getContext("2d");
    ctx.beginPath();
    ctx.rect(0, 0, rect.width, rect.height );
    ctx.fillStyle = "white";
    ctx.fill();

    var size=5
    var totallengthallowed = width-50*(size-1)
    var lengths = totallengthallowed/size

    ctx.fillStyle = "lightblue";
    for (var a of highlight){
      ctx.beginPath()                    
      ctx.rect(lengths/size*a.x+a.z*width/size, lengths/size*a.y,lengths/size,lengths/size)
      ctx.fill()
      ctx.stroke()
    }
    ctx.fillStyle = "black";
    ctx.font = lengths/size+"px Verdana";
    //change 5 here if you make the board bigger
    //the sum of the widths across all the boards
    //console.log("lengths:"+lengths)
    for (var j=0;j<size;j++){
        for (var i=0;i<=size;i++){
            ctx.beginPath();
            ctx.moveTo(lengths/size*i+j*width/size,0);
            ctx.lineTo(lengths/size*i+j*width/size,lengths);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(j*width/size,lengths/size*i);
            ctx.lineTo(j*width/size+lengths,lengths/size*i);
            ctx.stroke();
        }
    }
    for (var i=0;i<size;i++){
        for (var j=0;j<size;j++){
            for (var z=0;z<size;z++){
                if (b[z][i][j] === ""){
                }else{
                  if (b[z][i][j]==="F"){
                    ctx.drawImage(flag, lengths/size*i+z*width/size, lengths/size*j,lengths/size,lengths/size);
                  }else if (b[z][i][j]==="M"){
                    ctx.drawImage(mine, lengths/size*i+z*width/size, lengths/size*j,lengths/size,lengths/size);
                  }else{
                    ctx.fillText(b[z][i][j], lengths/size*i+z*width/size,lengths/size*(j+1));
                  }
                }
            }
        }
    }
    ctx.font=lengths/size*0.8+"px Verdana";
    ctx.fillText("MINES:"+flagnum, 100,height);
}

function getPosition(){
    var rect = thecanvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top; 
    
    var size=5

    var totallengthallowed = width-50*(size-1)
    var lengths = totallengthallowed/size

    var data={}
    var boardnum=Math.floor(x/(width/size))
    if (x-boardnum*width/size-lengths>0){
        console.log("OUT OF RANGE")
    }else{
        data.x=Math.floor((x-boardnum*width/size)/(lengths/size))
        data.y=Math.floor(y/(lengths/size))
        data.z=boardnum
    }

    if (event.button=="0"){
        socket.emit("move", data);
    }else if(event.button=="2"){
        socket.emit("flag",data);
    }else if(event.button=="1"){
      var h=[]
      if (JSON.stringify(data)==JSON.stringify(rememberhighlight)){
        rememberhighlight={z:-1,x:-1,y:-1}
      }else{
        for (var a=-1;a<2;a++){
          for (var b=-1;b<2;b++){
            for (var c=-1;c<2;c++){
              if(data.x+a<0||data.x+a>=size||data.y+b<0||data.y+b>=size||data.z+c<0||data.z+c>=size){
              }else{
                h.push({x:data.x+a,y:data.y+b,z:data.z+c})
              }
            }
          }
        }
        rememberhighlight=data
      }
      drawboard(storeb,h,storeFlag)
    }
}

