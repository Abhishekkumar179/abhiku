
const wsuri = "ws://localhost:1234/main";
      var sock = null
      var flag1=false;
      function GetSetSocket(id) {
          this.sock = new WebSocket(wsuri);
          this.sock.onopen = function() {
            flag1=true;
            // console.log("connected! "+flag1);
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
      function expandMessages(from){
        var pop=document.getElementById(from);
        var chatbox=document.getElementById(from).children[1];
        var sendMessageForm=document.getElementById(from).children[2];
        if(!flag){
          chatbox.setAttribute("style","display:flex");
          sendMessageForm.setAttribute("style","display:flex");
          flag=true;
          return;  
        }else{
          pop.setAttribute("style","height:10px")
          chatbox.setAttribute("style","display:none");
          sendMessageForm.setAttribute("style","display:none");
          flag=false;
          return;
        }
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
          
        }
      };
