

const wsuri = "ws://localhost:1234/main";
      var sock = null
      var flag1=false;
      function GetSetSocket(id) {
          this.sock = new WebSocket(wsuri);
          this.sock.onopen = function() {
            flag1=true;
             console.log("connected! "+flag1);
            console.log(sock["url"]);
            if(!id){
              // alert("id not set"+id);
              return;
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
        // return;
      }
      function registerSend(name){
       // alert("sending: "+name);
        recieveRegisterMessages();
        sockThrowDataToServer(name);
      }
      function recieveRegisterMessages(){
        sock.onmessage = function(e){
            var rsp=JSON.parse(e.data);
            if(rsp["statusmsg"]=="invalid user"){
              alert("INVALID USER");
            }else{
              // flag1=true;
              // alert("START MESSAGING");
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
          // alert("PLEASE REGISTER YOURSELF");
          return;
        }
        // alert("wait");
        registerSend(x);
      }
      var finalfile=null;
      function sendMessage(x){
        var y =userId;
        var sendMsgEle=document.getElementById(x).children[2];
        var z = sendMsgEle.children[0].children[0].value;
        sendMsgEle.children[0].children[0].value="";
        if(!x){
          alert("PLEASE INPUT CONTACT TO");
          return;
        }
        if(!z){
          if(finalfile){

          }else{
            return;
          }
        }
        if(!finalfile){
          finalfile="";
        }
        var msg={"message_type":"1","to":x,"from":y,"body":z,"file":finalfile,"message_id":"","message_stage_id":""};
        addMessageToContact(msg);
        // sockThrowDataToServer(msg);
        // this.sock.send(msg);
        recieveMessages();
        finalfile=null;
        sock.onerror = function(error) {
          console.log('WebSocket Error: ' + error);
        };
      }
      function popupboxInitEventlistener(){
        const uploadInput=document.getElementById("uploadInput");
        const fileSelectbutton=document.getElementById("fileSelectbutton");
        fileSelectbutton.addEventListener("click",function(){ uploadInput.click(); });
        uploadInput.addEventListener("change",function(){
          if(uploadInput.value){
            var filename=uploadInput.value.match(/[\/\\]([\w\d\s\.\-\(\)]+)$/)[1];
            var fileextension = filename.match(/\.[0-9a-z]+$/i);
            console.log(filename);
            console.log(fileextension);
            fileSelectbutton.innerHTML="&#128210";
            var file=uploadInput.files[0];
            console.log(file.name);
            console.log(file.type);
            console.log(file.size);
            var reader = new FileReader();
            var rawData = new ArrayBuffer();            
            reader.loadend = function() {
            }
            reader.onload = function(e) {
                rawData = e.target.result;
                var bytesfile = new Uint8Array(rawData);
                console.log(bytesfile);
                finalfile='{"filename":"'+file.name+'","fileextension":"'+file.type+'","filesize":'+file.size+',"filedata":"'+bytesfile+'"}';
                // alert("the File has been transferred.")
            }
            reader.readAsArrayBuffer(file);
          }else{
            fileSelectbutton.innerHTML="&#128279";
            finalfile=null;
          }
        });
        const sndmsginbox=document.getElementById("sendMessageInputBox");
        sndmsginbox.addEventListener("keyup", function(event) {
        if (event.keyCode === 13) {
          event.preventDefault();
          sndmsginbox.nextSibling.click();
        }
        });
      }
      var sidenames= [];
      function addContact(){
        // alert(sidenames);
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
          // console.log(rsp);
          if(rsp["message_type"]==1){
            console.log("got new message");
            addMessageToContact(rsp);
          }else {
            console.log("got receipt");
            addReceiptToMessage(rsp);
          }
        };
        sock.onerror = function(error) {
          console.log('WebSocket Error: ' + error);
        };
      }
      function addReceiptToMessage(rsp){
        console.log(rsp);
        var x=document.getElementById(rsp["to"]).children[1].querySelector('[name="sent"][id='+'"'+rsp["message_id"]+'"'+']');
        // console.log(x);
        var tick=document.createElement("IMG");
        tick.setAttribute("src","tick.png");
        countT=x.children[0].getElementsByTagName("IMG").length;
        console.log(countT);
        if((rsp["message_stage_id"]==1)&&(countT==0)){
          x.children[0].appendChild(tick);
          console.log("append one tick");
        }else if((rsp["message_stage_id"]==2)&&(countT==1)){
          x.children[0].appendChild(tick);
          console.log("append two tick")
        }else {
          console.log("numberofticks ",countT);
        }
      }
      var total_popups=0;
      var popups=[];

      function addMessageToContact(rsp){
        var to=rsp["to"];
        var from=rsp["from"];
        if(rsp["body"]){
          var message=rsp["body"];
        }
        console.log(rsp);
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
                var filedata = document.createElement('DIV');
                filedata.className="filedata";
                var newfile=JSON.parse(rsp["file"]);
                // console.log(newfile["filedata"]);
                var bty=newfile["filedata"].split(',');
                for(var i=0;i<bty.length;i++){
                  bty[i]=parseInt(bty[i]);
                }
                var uint8Array = new Uint8Array(bty);
                var txt=new TextDecoder().decode(uint8Array) ;
                console.log(txt);
                var newfileobj= new Blob([txt],{type:newfile["fileextension"]});
                var newfilelink = document.createElement('a');
                newfilelink.innerHTML="&#8681";
                newfilelink.download = newfile["filename"];
                newfilelink.href = URL.createObjectURL(newfileobj);
                var filename = document.createElement('P');
                filename.className="filename";
                filename.innerHTML=newfile["filename"];
                filedata.appendChild(newfilelink);
                filedata.appendChild(filename);
                newMessageData.appendChild(filedata);
              }
              h.appendChild(document.createElement("br"));
              newMessageNode.appendChild(newMessageData);
              h.appendChild(newMessageNode);
              console.log("appended message node is ");
              console.log(newMessageNode);
              document.getElementById("sendMessageInputBox").value="";
              rsp["message_id"]=""+newid+"";
              rsp["message_stage_id"]="0";
              rsp=JSON.stringify(rsp)
              console.log("sending message "+rsp);
              document.getElementById("fileSelectbutton").innerHTML="&#128279";
              sockThrowDataToServer(rsp);
            }else{
              console.log("this will work when you recieve a message from a user in who already has a pop");
              newMessageNode.setAttribute("name","recieved");
              newMessageData.className="recievedData";
              newMessageNode.setAttribute("id",rsp["message_id"]);
              newMessageText.innerText=message;
              newMessageData.appendChild(newMessageText);
              if(rsp["file"]){
                var filedata = document.createElement('DIV');
                filedata.className="filedata";
                var newfile=JSON.parse(rsp["file"]);
                var bty=newfile["filedata"].split(',');
                for(var i=0;i<bty.length;i++){
                  bty[i]=parseInt(bty[i]);
                }
                var uint8Array = new Uint8Array(bty);
                var txt=new TextDecoder().decode(uint8Array);
                console.log(txt);
                var newfileobj= new Blob([txt],{type:newfile["fileextension"]});
                var newfilelink = document.createElement('a');
                newfilelink.innerHTML="&#8681";
                newfilelink.download = newfile["filename"];
                newfilelink.href = URL.createObjectURL(newfileobj);
                var filename = document.createElement('P');
                filename.className="filename";
                filename.innerHTML=newfile["filename"];
                filedata.appendChild(newfilelink);
                filedata.appendChild(filename);
                newMessageData.appendChild(filedata);
              }
              h.appendChild(document.createElement("br"));
              newMessageNode.appendChild(newMessageData);
              h.appendChild(newMessageNode);
              rsp["message_type"]="0";
              rsp["message_stage_id"]="1";
              rsp["file"]=null;
              rsp=JSON.stringify(rsp)
              console.log("sending read receipts",rsp);
              sockThrowDataToServer(rsp);
            }
            var c = document.body.children;
            // var abc4;
            // for(abc4=0;abc4<c.length;abc4++){
            //   if(c[abc4].id==from){
            //     c[abc4].children[1].appendChild(newMessageNode);
            //   }
            // }
            return;
          }
        }
        // sidenames.unshift(from);
        // var newid=0;
        // var mydiv=document.createElement("DIV");
        // mydiv.className="popup-box";
        // mydiv.setAttribute("id",from);
        // var headDiv=document.createElement("DIV");
        // headDiv.className="popup-head";
        // var aTag=document.createElement('A');
        // aTag.setAttribute('href','javascript:expandMessages('+'\''+from+'\''+');');
        // aTag.innerText = from;
        // var chatbox= document.createElement("DIV");
        // chatbox.className="chat-box";
        // chatbox.setAttribute("id",newid);
        // var startMessageNode=document.createElement("DIV");
        // startMessageNode.className="startMessageNode";
        // startMessageNode.setAttribute("id",newid++)
        // var startMessageData=document.createElement('P');
        // startMessageData.className="startMessageData";
        // startMessageData.innerText="DROP MESSAGES HERE..";
        // startMessageNode.appendChild(startMessageData);
        // chatbox.appendChild(startMessageNode);
        // if(message){
        //   var newMessageNode=document.createElement('DIV');
        //   var newMessageData=document.createElement("DIV");
        //   var newMessageText=document.createElement('P');
        //   newMessageNode.className="messageNode";
        //   newMessageData.setAttribute("name","messageData");
        //   newMessageText.className="messageText";
        //   if(document.getElementById("telemo-chat").getAttribute("name")!=rsp["to"]){
        //     console.log("this will never work");
        //     newMessageNode.setAttribute("name","sent");
        //     newMessageData.className="sentData";
        //     newMessageNode.setAttribute("id",newid++)
        //     newMessageText.innerText=message;
        //     // var newSentTick=document.createElement("IMG");
        //     // newSentTick.setAttribute("src","tick.png");
        //     newMessageData.appendChild(newMessageText);
        //     // newMessageData.appendChild(newSentTick);
        //     newMessageNode.appendChild(newMessageData);
        //     chatbox.appendChild(newMessageNode);
        //   }else{
        //     console.log("this will work when you recieve a message from a user not in contactlist");
        //     newMessageNode.setAttribute("name","recieved");
        //     newMessageData.className="recievedData";
        //     newMessageNode.setAttribute("id",rsp["message_id"]);
        //     newMessageText.innerText=message;
        //     newMessageData.appendChild(newMessageText);
        //     newMessageNode.appendChild(newMessageData);
        //     chatbox.appendChild(newMessageNode);
        //     rsp["message_type"]="0";
        //     rsp["message_stage_id"]="1";
        //     rsp=JSON.stringify(rsp)
        //     console.log("sending read receipts",rsp);
        //     sockThrowDataToServer(rsp);
        //   }
        // }
        // chatbox.style.display="none";
        // var sendMessageForm=document.createElement("DIV");
        // sendMessageForm.className="sendMessage";
        // sendMessageForm.setAttribute("style","display:none");
        // var sendMessageElement=document.createElement("INPUT");
        // sendMessageElement.setAttribute("id","sendMessageInputBox");
        // sendMessageElement.setAttribute("type","text");
        // sendMessageElement.setAttribute("placeholder","message here..");
        // var sendMessageButtonTag=document.createElement("A");
        // sendMessageButtonTag.setAttribute('href','javascript:sendMessage('+'\''+from+'\''+');');
        // sendMessageButtonTag.innerText=">";
        // sendMessageForm.appendChild(sendMessageElement);
        // sendMessageForm.appendChild(sendMessageButtonTag);
        // headDiv.appendChild(aTag);
        // mydiv.appendChild(headDiv);
        // mydiv.appendChild(chatbox);
        // mydiv.appendChild(sendMessageForm);
        // document.getElementById("telemo-chat-list").appendChild(mydiv);
        // document.getElementById("message").value="";
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
      // function expandMessages(from){
      //   var pop=document.getElementById(from);
      //   var chatbox=document.getElementById(from).children[1];
      //   var sendMessageForm=document.getElementById(from).children[2];
      //   if(!flag){
      //     chatbox.setAttribute("style","display:flex");
      //     sendMessageForm.setAttribute("style","display:flex");
      //     flag=true;
      //     return;  
      //   }else{
      //     pop.setAttribute("style","height:10px")
      //     chatbox.setAttribute("style","display:none");
      //     sendMessageForm.setAttribute("style","display:none");
      //     flag=false;
      //     return;
      //   }
      //   console.log("not yet implemented");
      // };
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
        var startMessageNode=document.createElement("DIV");
        startMessageNode.className="startMessageNode";
        startMessageNode.setAttribute("id",newid++)
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
        complimentarysendMessageBox.appendChild(uploadInput);
        complimentarysendMessageBox.appendChild(fileSelectbutton);
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
        popupboxInitEventlistener();
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
    // alert("telechat "+api.usrId);
    console.log(api.opts);
          api.opts["chatContainer"].setAttribute("name",api.usrId);
          //api.opts["chatContainer"].children[0].innerHTML=api.opts["chatName"];
          api.opts["chatContainer"].style.width=api.opts["width"];
          api.opts["chatContainer"].style.height=api.opts["height"];
          // if(api.usrId=="moin"){
          //   console.log(api.usrId);
          //   api.opts["chatContainer"].children[0].children[0].children[0].setAttribute("href","javascript:register_popup('umesh','umesh');");
          //   api.opts["chatContainer"].children[0].children[0].children[0].children[0].textContent="umesh";
            
          // }else{
          //   console.log("user 2");
          //   console.log(api.usrId);  
          //   api.opts["chatContainer"].children[0].children[0].children[0].setAttribute("href","javascript:register_popup('moin','moin');");
          //   api.opts["chatContainer"].children[0].children[0].children[0].children[0].textContent="moin";
      

          // }
        }
      };
