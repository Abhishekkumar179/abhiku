
const wsuri = "ws://localhost:1234/main";
      var sock = null
      var flag1=false;
      function GetSetSocket(id) {
          this.sock = new WebSocket(wsuri);
          this.sock.onopen = function() {
            flag1=true;
            
            console.log(sock["url"]);
            if(!id){
              alert("id not set"+id);
            }
            registerSend(id);
            };
          this.sock.onclose = function(e) {
            console.log("getsock connection closed: " + e.code );
          };
          this.sock.addEventListener('close', refreshGetSetSocket);
          sock.onerror = function(error) {
            console.log('WebSocket Error: ' + error);
          };
          return this.sock;
      }
      const refreshGetSetSocket = (event) =>{
          if (this.sock) {
              console.error('Disconnected.');
          }
          this.sock = new WebSocket(wsuri);
          this.sock.onopen = function() {
            flag1=true;
            console.log("reconnected! "+flag1);
            console.log(this.sock);
            console.log(sock);
            validateForm();
            };
          this.sock.addEventListener('close', refreshGetSetSocket);
      }
      function sockThrowDataToServer(data){
        sock.send(data);
        
      }
      function registerSend(name){
        
        recieveRegisterMessages();
        sockThrowDataToServer(name);
      }
      function recieveRegisterMessages(){        
        sock.onmessage = function(e){
            var rsp=JSON.parse(e.data);
            if(rsp["statusmsg"]=="invalid user"){
              window.location.assign("invaliduser");
              alert("INVALID USER");
              return;
            }else{
            recieveMessages();
            }
          };
          sock.onerror = function(error) {
            console.log('WebSocket Error: ' + error);
          };
      }
      function validateForm(){
        var x = document.getElementById("telemo-chat").getAttribute("name");
        if(!x){
         
          return;
        }
       
        registerSend(x);
      }
      var finalfile=null;
      var file=null;
      function sendMessage(x){
        var y =userId;
        var sendMsgEle=document.getElementById(x).children[2];
        var z = sendMsgEle.children[0].children[0].value;
        sendMsgEle.children[0].children[0].value="";
        if(!x){
          alert("PLEASE INPUT CONTACT TO");
          return;
        }
        var msg;
        if(!z){
          if(finalfile){
            msg={"message_type":"2","to":x,"from":y,"body":"","file":finalfile,"message_id":"","message_stage_id":""}
           
          }else{
            
            return;
          }
        }else{
          if(!finalfile){
            msg={"message_type":"1","to":x,"from":y,"body":z,"message_id":"","message_stage_id":""};
            
            finalfile="";
          }else{
            msg={"message_type":"2","to":x,"from":y,"body":z,"file":finalfile,"message_id":"","message_stage_id":""};
          }
        }
        addMessageToContact(msg);
        recieveMessages();
        finalfile=null;
        sock.onerror = function(error) {
          console.log('WebSocket Error: ' + error);
        };
      }

      function sendfilerequest(rsp){
        
        rsp["file"]={"filemessagetype":"file","filename":file.name,"fileextension":file.type,"filesize":file.size,"filerequest":false};
        sockThrowDataToServer(JSON.stringify(rsp));
      }
      function recievefilerequest(rsp){
        if(rsp.file["filerequest"]==true){
            console.log('recieved from server');
            sendfile(rsp);
        }else{
          console.log("server not accepting file request");
          file=null;
        }
      }
      var sliceSize=null,start=null,fjrnst=null,sendfileslicesize=null,end=null;
      function sendfile(rsp){
            size = file.size;
            sliceSize = 25000;
            start = 0;
            fjrnst="ini";
            setTimeout(loop(rsp), 1);
        }
        function loop(rsp){
            end = start + sliceSize;
            if (size - end < 0) {
              end = size;
              fjrnst="end";
            }
           
            var s = file.slice(start, end);
            var filereader = new FileReader();
            filereader.readAsArrayBuffer(s);
            filereader.onerror=function(e){
                alert(e);
                filereader.abort();
                return;
            }
            filereader.onload = function(e){
                var arrayBuffer = e.target.result;
                var slicedfile = new Uint8Array(arrayBuffer);
                fileslice(rsp,slicedfile,fjrnst);
            }
        }
        var sliceretry=0;
        function fileslice(rsp,slice,fjrnst){
            rsp["message_type"]="3";
            if(sliceretry<3){
                rsp["file"]={"filejourneystate":fjrnst,"sliceresponse":false,"filesliceddata":slice.toString()};
                sockThrowDataToServer(JSON.stringify(rsp));
            }
        }
         function recievesliceconfirmation(rsp){
            
            if(rsp.file["sliceresponse"]==true){
                sliceretry=0;
                if (end < size) {
                  start += sliceSize;
                  setTimeout(loop(rsp), 1);
                }else{
                    console.log("send ended");
                }
            }else {
                console.log("error do file abort");
            }
        }
        var downloadfilersp=null;
        function recievefilepacket(rsp){
          if(!downloadfilersp){
            rsp.file["filedata"]=rsp.file["filedata"].toString()
            downloadfilersp=rsp;
          }else{
            downloadfilersp.file["filedata"]=downloadfilersp.file["filedata"]+','+rsp.file["filedata"];
          }
          if(rsp.file["filejourneystate"]=="end"){
            downloadfilersp.file["filejourneystate"]="end";
            addMessageToContact(downloadfilersp);
          }

        }


      var sidenames= [];
      function addContact(){
        
        var x = document.getElementById("addContactForm").children[0].value;
        for (i = 0; i < sidenames.length; i++){
          if(sidenames[i]==x){
            alert("same contact exits!");
            return;
          }
        }
        var y = document.getElementById("telemo-chat").getAttribute("name");
        document.getElementById("addContactForm").children[0].value=""
        if(!x){
          alert("PLEASE INPUT CONTACT TO");
          return;
        }
        var ctt={"to":y,"from":x,"body":""};
        addMessageToContact(ctt);
        recieveMessages();
      }
      function recieveMessages(){
        sock.onmessage = function(e){
          var rsp=JSON.parse(e.data);
          
          if(rsp["message_type"]==1){
            console.log("got new message");
            addMessageToContact(rsp);
          }else if(rsp["message_type"]==2){
            recievefilerequest(rsp);
          }else if(rsp["message_type"]==3){
            recievesliceconfirmation(rsp);
          }else if(rsp["message_type"]==4){
            recievefilepacket(rsp);
          }else if(rsp["message_type"]==5){
            
          }else{
            console.log("got receipt");
            addReceiptToMessage(rsp);
          }
        };
        sock.onerror = function(error) {
          console.log('WebSocket Error: ' + error);
        };
      }
      function addReceiptToMessage(rsp){
        var x=document.getElementById(rsp["to"]).children[1].querySelector('[name="sent"][id='+'"'+rsp["message_id"]+'"'+']');
        console.log(rsp);
        var tick=document.createElement("IMG");
        tick.setAttribute("src","tick.png");
        countT=x.children[0].getElementsByTagName("IMG").length;
        if(rsp["message_stage_id"]==1){
          x.children[0].appendChild(tick);
        }else if(rsp["message_stage_id"]==2){
          x.children[0].appendChild(tick);
        }
        console.log(countT);
      }
      var total_popups=0;
      var popups=[];

      function addMessageToContact(rsp){
        var to=rsp["to"];
        var from=rsp["from"];
        var message="";
        if(rsp["body"]){
          message=rsp["body"];
        }
        var fsendmethod=false;
        if(document.getElementById("telemo-chat").getAttribute("name")!=rsp["to"]){
          var temp=to;
          to=from;
          from=temp;
        }
        for (i = 0; i < popups.length; i++){
          if(popups[i]==from){
            var h = document.getElementById(from).children[1];
            var newMessageNode=document.createElement('DIV');
            var newMessageData=document.createElement("DIV");
            var newMessageText=document.createElement('P');
            newMessageNode.className="messageNode";
            newMessageData.setAttribute("name","messageData");
            newMessageText.className="messageText";
            if(document.getElementById("telemo-chat").getAttribute("name")!=rsp["to"]){
              newMessageNode.setAttribute("name","sent");
              newMessageData.className="sentData";
              var newid=parseInt(document.getElementById(from).children[1].id);
              newMessageNode.setAttribute("id",++newid);
              document.getElementById(from).children[1].id=newMessageNode.id
              newMessageText.innerText=message;
              newMessageData.appendChild(newMessageText);
              if(rsp["file"]){
                fsendmethod=true;
                var filedata = document.createElement('DIV');
                filedata.className="filedata";
                var newfile=JSON.parse(rsp["file"]);
                var bty=newfile["filedata"].split(',');
                for(var i=0;i<bty.length;i++){
                  bty[i]=parseInt(bty[i]);
                }
                var uint8Array = new Uint8Array(bty);
                var newfileobj= new Blob([uint8Array],{type:newfile["fileextension"]});
                if(((newfile["fileextension"]).match(/image/))=="image"){
                  var newfilelink = document.createElement('a');
                  var newfileimglink = document.createElement('img');
                  newfilelink.innerHTML="&#8681";
                  newfilelink.download = newfile["filename"];
                  newfilelink.href = URL.createObjectURL(newfileobj);
                  newfileimglink.src = URL.createObjectURL(newfileobj);
                  var filename = document.createElement('P');
                  filename.className="filename";
                  filename.appendChild(newfileimglink);
                }else{
                  var newfilelink = document.createElement('a');
                  newfilelink.innerHTML="&#8681";
                  newfilelink.download = newfile["filename"];
                  newfilelink.href = URL.createObjectURL(newfileobj);
                  var filename = document.createElement('P');
                  filename.className="filename";
                  filename.innerHTML=newfile["filename"];
                }
                filedata.appendChild(newfilelink);
                filedata.appendChild(filename);
                newMessageData.appendChild(filedata);
              }
              h.appendChild(document.createElement("br"));
              newMessageNode.appendChild(newMessageData);
              h.appendChild(newMessageNode);
              document.getElementById("sendMessageInputBox").value="";
              rsp["message_id"]=""+newid+"";
              rsp["message_stage_id"]="0";
              document.getElementById("fileSelectbutton").innerHTML="&#128279";
              document.getElementById("imgSelectbutton").innerHTML="&#128206";
              if(fsendmethod){
                sendfilerequest(rsp);
              }else{
                rsp=JSON.stringify(rsp)
                updateScroll(from);
                sockThrowDataToServer(rsp);
              }
            }else{
              newMessageNode.setAttribute("name","recieved");
              newMessageData.className="recievedData";
              newMessageNode.setAttribute("id",rsp["message_id"]);
              newMessageText.innerText=message;
              newMessageData.appendChild(newMessageText);
              if(rsp["file"]){
                
                var filedata = document.createElement('DIV');
                filedata.className="filedata";
                var newfile=rsp["file"];
                rsp["file"]=null;
                var bty=newfile["filedata"].split(',');
                for(var i=0;i<bty.length;i++){
                  bty[i]=parseInt(bty[i]);
                }
                var uint8Array = new Uint8Array(bty);
                var newfileobj= new Blob([uint8Array],{type:newfile["fileextension"]});
                if(((newfile["fileextension"]).match(/image/))=="image"){
                  var newfilelink = document.createElement('a');
                  var newfileimglink = document.createElement('img');
                  newfilelink.innerHTML="&#8681";
                  newfilelink.download = newfile["filename"];
                  newfilelink.href = URL.createObjectURL(newfileobj);
                  newfileimglink.src = URL.createObjectURL(newfileobj);
                  var filename = document.createElement('P');
                  filename.className="filename";
                  filename.appendChild(newfileimglink);
                }else{
                  var newfilelink = document.createElement('a');
                  newfilelink.innerHTML="&#8681";
                  newfilelink.download = newfile["filename"];
                  newfilelink.href = URL.createObjectURL(newfileobj);
                  var filename = document.createElement('P');
                  filename.className="filename";
                  filename.innerHTML=newfile["filename"];
                }
                filedata.appendChild(newfilelink);
                filedata.appendChild(filename);
                newMessageData.appendChild(filedata);
              }
              h.appendChild(document.createElement("br"));
              newMessageNode.appendChild(newMessageData);
              h.appendChild(newMessageNode);
              rsp["message_type"]="0";
              rsp["message_stage_id"]="1";
              rsp=JSON.stringify(rsp)
              downloadfilersp=null;
              updateScroll(from);
              sockThrowDataToServer(rsp);
            }
            document.getElementById("uploadInput").value=null;
            document.getElementById("uploadInputImg").value=null;
            
            return;
          }
        }
      }
      
      //this function can remove a array element.
      Array.remove = function(array, from, to) {
          var rest = array.slice((to || from) + 1 || array.length);
          array.length = from < 0 ? array.length + from : from;
          return array.push.apply(array, rest);
      };
    
      var total_popups=0;
      var popups = [];
      function close_popup(id){
        for(var iii = 0; iii < popups.length; iii++){
          if(id == popups[iii]){
            Array.remove(popups, iii);
            document.getElementById(id).remove();;
            calculate_popups();
            return;
          }
        } 
      }
      var flag=false;
      function display_popups(){
        var right = 220;
        var iii = 0;
        for(iii; iii < total_popups; iii++){
          if(popups[iii] != undefined){
            var element = document.getElementById(popups[iii]);
            element.style.right = right + "px";
            right = right + 320;
            element.style.display = "block";
          }
        }
        for(var jjj = iii; jjj < popups.length; jjj++){
          var element = document.getElementById(popups[jjj]);
          element.style.display = "none";
        }
      }
      
      function register_popup(id, name){
        for(var iii = 0; iii < popups.length; iii++){ 
          if(id == popups[iii]){
            Array.remove(popups, iii);
            popups.unshift(id);
            calculate_popups();
            return;
          }
        }       
        var newid=0;
        var mydiv=document.createElement("DIV");
        mydiv.className="popup-box";
        mydiv.setAttribute("id",id);
        var headDiv=document.createElement("DIV");
        headDiv.className="popup-head";
        var popupprofileimg=document.createElement("DIV");
        popupprofileimg.className="popupprofileimg";
        var popupprofileimgele=document.createElement("IMG");
        popupprofileimgele.setAttribute("src","popupprofileimg.png");
        popupprofileimg.appendChild(popupprofileimgele);
        var popupheadname=document.createElement("DIV");
        popupheadname.className="popupheadname";
        var nameTag=document.createElement('A');
        nameTag.setAttribute('href','javascript:expandMessages('+'\''+id+'\''+');');
        nameTag.innerText = name;
        popupheadname.appendChild(nameTag);
        var closepop= document.createElement("DIV");
        closepop.className="closepop";
        var closepopTag=document.createElement('A');
        closepopTag.setAttribute('href','javascript:close_popup('+'\''+id+'\''+');');
        closepopTag.innerText = "X";
        closepop.appendChild(closepopTag);
        var chatbox= document.createElement("DIV");
        chatbox.className="chat-box";
        chatbox.setAttribute("id",newid);
        chatbox.setAttribute("scrollCheck", false);
        chatbox.addEventListener("scroll", function(event){
          chatbox.setAttribute("scrollCheck",true);
        });
        var startMessageNode=document.createElement("DIV");
        startMessageNode.className="startMessageNode";
        startMessageNode.setAttribute("id",newid++);
        var startMessageData=document.createElement('P');
        startMessageData.className="startMessageData";
        startMessageData.innerText="DROP MESSAGES HERE..";
        startMessageNode.appendChild(startMessageData);
        chatbox.appendChild(startMessageNode);
        var sendMessageBox=document.createElement("DIV");
        sendMessageBox.className="sendMessageBox";
        var basicsendMessageBox=document.createElement("DIV");
        basicsendMessageBox.className="basicsendMessageBox";
        var sendMessageInputBox=document.createElement("INPUT");
        sendMessageInputBox.setAttribute("id","sendMessageInputBox");
        sendMessageInputBox.setAttribute("type","text");
        sendMessageInputBox.setAttribute("placeholder","message here..");
        sendMessageInputBox.addEventListener("keyup", function(event) {
          if (event.keyCode === 13) {
            event.preventDefault();
            sendMessageInputBox.nextSibling.click();
          }
        });
        var sendMessageButtonTag=document.createElement("A");
        sendMessageButtonTag.setAttribute('href','javascript:sendMessage('+'\''+id+'\''+');');
        sendMessageButtonTag.innerText=">";
        basicsendMessageBox.appendChild(sendMessageInputBox);
        basicsendMessageBox.appendChild(sendMessageButtonTag);
        var complimentarysendMessageBox=document.createElement("DIV");
        complimentarysendMessageBox.className="complimentarysendMessageBox";
        var uploadInput=document.createElement("INPUT");
        uploadInput.setAttribute("id","uploadInput");
        uploadInput.setAttribute("type","file");
        uploadInput.setAttribute("accept",".doc,.docx,.txt,.odt,.pdf,.rtf,.tex,.wpd,.c,.class,.cpp,.cs,.h,.java,.pl,.sh,.swift,.vb,.xhtml,.rss,.py,.php,.part,.htm,.html,.cgi,.pl,.cer,.otf,.ttf,.fon,.fnt,.py,.jar,.exe,.bin,.bat,.apk,.cgi,.com,.msi,.wsf,.tar,.xml,.log,.db,.mdb,.sav,.sql,.dat,.csv,.zip,.z,.tar.gz,.rpm,.rar,.pkg,.deb,.arj,.7z");
        uploadInput.setAttribute("hidden","hidden");
        var fileSelectbutton=document.createElement("BUTTON");
        fileSelectbutton.setAttribute("id","fileSelectbutton");
        fileSelectbutton.innerHTML="&#128279";
        var uploadInputImg=document.createElement("INPUT");
        uploadInputImg.setAttribute("id","uploadInputImg");
        uploadInputImg.setAttribute("type","file");
        uploadInputImg.setAttribute("accept","image/*");
        uploadInputImg.setAttribute("hidden","hidden");
        var imgSelectbutton=document.createElement("BUTTON");
        imgSelectbutton.setAttribute("id","imgSelectbutton");
        imgSelectbutton.innerHTML="&#128206";
        complimentarysendMessageBox.appendChild(uploadInput);
        complimentarysendMessageBox.appendChild(fileSelectbutton);
        complimentarysendMessageBox.appendChild(uploadInputImg);
        complimentarysendMessageBox.appendChild(imgSelectbutton);
        fileSelectbutton.addEventListener("click",function(){ uploadInput.click(); });
        imgSelectbutton.addEventListener("click",function(){ uploadInputImg.click(); });
        uploadInput.addEventListener("change",function(){
                  if(uploadInput.value) {
                    imgSelectbutton.innerHTML="&#128206";
                    fileSelectbutton.innerHTML="&#128210";
                    file=uploadInput.files[0];
                    var reader = new FileReader();
                    var rawData = new ArrayBuffer();            
                    reader.loadend = function() {
                    }
                    reader.onload = function(e) {
                        rawData = e.target.result;
                        var bytesfile = new Uint8Array(rawData);
                        finalfile='{"filename":"'+file.name+'","fileextension":"'+file.type+'","filesize":'+file.size+',"filedata":"'+bytesfile+'"}';
                        
                    }
                    reader.readAsArrayBuffer(file);
                  }else{
                    fileSelectbutton.innerHTML="&#128279";
                    finalfile=null;
                  }
                });
        uploadInputImg.addEventListener("change",function(){
          if(uploadInputImg.value){
            fileSelectbutton.innerHTML="&#128279";
            imgSelectbutton.innerHTML="&#10024";
            file=uploadInputImg.files[0];
            var reader = new FileReader();
            var rawData = new ArrayBuffer();            
            reader.loadend = function() {
            }
            reader.onload = function(e) {
                rawData = e.target.result;
                var bytesfile = new Uint8Array(rawData);
                finalfile='{"filename":"'+file.name+'","fileextension":"'+file.type+'","filesize":'+file.size+',"filedata":"'+bytesfile+'"}';
                
            }
            reader.readAsArrayBuffer(file);
          }else{
            imgSelectbutton.innerHTML="&#128206";
            finalfile=null;
          }
        });
        sendMessageBox.appendChild(basicsendMessageBox);
        sendMessageBox.appendChild(complimentarysendMessageBox);
        headDiv.appendChild(popupprofileimg);
        headDiv.appendChild(popupheadname);
        headDiv.appendChild(closepop);
        mydiv.appendChild(headDiv);
        mydiv.appendChild(chatbox);
        mydiv.appendChild(sendMessageBox);
        document.getElementsByTagName("body")[0].appendChild(mydiv);  
        popups.unshift(id);
        calculate_popups();
         
      }

      function updateScroll(from){
       
         var scrollCheck=document.querySelector(".chat-box")
         scrollCheck.maxScrollTop = scrollCheck.scrollHeight - scrollCheck.offsetHeight

        if (scrollCheck.maxScrollTop - scrollCheck.scrollTop <= scrollCheck.offsetHeight) {
        scrollCheck.scrollTop = scrollCheck.scrollHeight
        } else {
        alert("new message")
        }
         
      }

      function calculate_popups(){
        var width = window.innerWidth;
        if(width < 540)
        {
          total_popups = 0;
        }else{
          width =width-200;
          total_popups = parseInt(width/320);
        }
        display_popups();
      }
      
      window.addEventListener("resize", calculate_popups);
      window.addEventListener("load", calculate_popups);
      
      class TelemoChatApi{
        constructor(userId,opts){
          this.usrId=userId;
          this.opts=opts;
        }
        static StartSocket(api){
          console.log(api);
          sock=GetSetSocket(api.usrId);
          
          api.opts["chatContainer"].setAttribute("name",api.usrId);
          api.opts["chatContainer"].style.width=api.opts["width"];
          api.opts["chatContainer"].style.height=api.opts["height"];
          if(api.usrId=="moin"){
            console.log(api.usrId);
            api.opts["chatContainer"].children[0].children[0].children[0].setAttribute("href","javascript:register_popup('umesh','umesh');");
            api.opts["chatContainer"].children[0].children[0].children[0].children[0].textContent="umesh";
          }else{
            console.log("user 2");
            console.log(api.usrId);  
            api.opts["chatContainer"].children[0].children[0].children[0].setAttribute("href","javascript:register_popup('moin','moin');");
            api.opts["chatContainer"].children[0].children[0].children[0].children[0].textContent="moin";

          }
        }
      };
