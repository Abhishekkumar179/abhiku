package controller
import(
	"log"
	"golang.org/x/net/websocket"
	"io"
	"chatsocketserver/models"
	// "fmt"
)
type User struct {
	Id     int
	Name   string
	Ws     *websocket.Conn
	Ch     chan *models.Message
	DoneCh chan bool
	Server *ServerUserList
	Syncsend bool
}

func (u *User)Listen(){
	go u.listenWrite()
	u.listenRead()
}
func (u *User) sendDatabaseMessages(resultstoremsg []*models.Message){
	for _,value:=range resultstoremsg{
		for u.Syncsend{
		}
		u.Syncsend=true
		if value.File!=nil{
			u.WriteFile(value)
		}else{
			select{
				case u.Ch<-value:
					// log.Printf("database messages %v",value)
				default:
					log.Printf("client %v is disconnected.", u.Name)
			}	
		}
	}
}
func (u *User) WriteMessageReciept(msg *models.Message){
	updateMsgState:=models.Message{MessageType:msg.MessageType,To:msg.To,From:msg.From,Body:msg.Body,File:msg.File,MessageId:msg.MessageId,MessageStageId:msg.MessageStageId}
	// log.Println("writing reciept into from user")
	updateMsgState.MessageType="0"
	if updateMsgState.MessageStageId=="0"{
		updateMsgState.MessageStageId="1"
	}else if updateMsgState.MessageStageId=="1"{
		updateMsgState.MessageStageId="2"
	}else{
		//log.Println("unknown stage ");
	}
	//log.Println(u.Name,"reciept stage ")
	select{
	case u.Ch <- &updateMsgState:
		//log.Println(updateMsgState)
	default:
		log.Printf("client %v is disconnected.", u.Name)
	}
	u.Server.updateMessageStoreToDb(&updateMsgState);
}
func (u *User) WriteMessage(msg *models.Message) {
	updateMsgState:=models.Message{MessageType:msg.MessageType,To:msg.To,From:msg.From,Body:msg.Body,File:msg.File,MessageId:msg.MessageId,MessageStageId:msg.MessageStageId}
	// //log.Println("writing into to user")
	if updateMsgState.MessageStageId=="0"{
		updateMsgState.MessageStageId="1"
	}else if updateMsgState.MessageStageId=="1"{
		updateMsgState.MessageStageId="2"
	}else{
		//log.Println("unknown stage ");
	}
	select {
	case u.Ch <- &updateMsgState:
		//log.Println(u.Name)
	default:
		log.Printf("client %v is disconnected.", u.Name)
	}
}
func (u *User) WriteFileReciept(msg *models.Message){
	updateMsgState:=models.Message{MessageType:msg.MessageType,To:msg.To,From:msg.From,MessageId:msg.MessageId,MessageStageId:msg.MessageStageId}
	updateMsgState.MessageType="0"
	if updateMsgState.MessageStageId=="0"{
		updateMsgState.MessageStageId="1"
	}else if updateMsgState.MessageStageId=="1"{
		updateMsgState.MessageStageId="2"
	}else{
		//log.Println("unknown stage ");
	}
	//log.Println(u.Name,"file reciept stage ")
	select{
	case u.Ch <- &updateMsgState:
		//log.Println(updateMsgState)
	default:
		log.Printf("client %v is disconnected.", u.Name)
	}
}
func (u *User) WriteFile(msg *models.Message) {
	// //log.Println("writing into to user")
	// updateMsgState.MessageType="4"
	// updateMsgState.MessageStageId="1"
	// updateMsgState.File.Filejourneystate="start"
	// updateMsgState.File.Sliceresponse="false"
	// if err := websocket.JSON.Send(u.Ws, &updateMsgState); err != nil {
 //        	log.Println(err);
 //    }
 	if msg.MessageStageId!="2" && u.Name==msg.To{
 		msg.MessageType="4"
 	}else {
 		msg.MessageType="6"
 	}
 	var Fjrnst="start"
	for i,value:=range msg.File.Filedata{
		if i==(len(msg.File.Filedata)-1){
		 	Fjrnst="end"
		}
		updateMsgState:=models.Message{
			MessageType:msg.MessageType,
			To:msg.To,
			From:msg.From,
			Body:msg.Body,
			File:&models.File{
					Filename: msg.File.Filename,
					Fileextension: msg.File.Fileextension,
					Filesize: msg.File.Filesize,
					Filedata:make([]string,0),
					// Filesliceddata: value,
					Filejourneystate: Fjrnst,
				},
			MessageId:msg.MessageId,
			MessageStageId:msg.MessageStageId,
		}
		updateMsgState.File.Filedata=append(updateMsgState.File.Filedata,value)
		if err := websocket.JSON.Send(u.Ws, &updateMsgState); err != nil {
        	//log.Println(err);
        }
		
	}
	u.Syncsend=false;
	return;
	//log.Println("end write file");
}
func (u *User) WriteInfoStatus(msg *models.Message) {
	select {
	case u.Ch <- msg:
		//log.Println(u.Name)
	default:
		log.Printf("client %v is disconnected.", u.Name)
	}
}
func (u *User) listenWrite() {
	//log.Println("Listening write to client")
	for {
		select {
		case msg := <-u.Ch:
			//log.Println(u.Name,&msg,msg)
			websocket.JSON.Send(u.Ws, msg)
			u.Syncsend=false;
		case <-u.DoneCh:
			u.Server.Del(u)
			u.DoneCh <- true
			return
		}
	}
}

func (u *User) listenRead(){
	//log.Println("Listening read from client")
	for {
		select {
		default:
			var msg models.Message
			err := websocket.JSON.Receive(u.Ws, &msg)
			if err == io.EOF {
				// log.Println("EOF err: ",err)
				u.DoneCh <- true
			} else if err != nil {
				// log.Println("err: ",err)
			} else {
				if(msg.MessageType=="0"){
					//log.Println("got rcp type")
					u.Server.SendReceipt(&msg)
				}else if(msg.MessageType=="1"){
					//log.Println("got msg type")
					u.Server.SendMessage(&msg)
				}else if(msg.MessageType=="2"){
					filerequest(u,&msg)
				}else if(msg.MessageType=="3"){
					fileslicing(u,&msg)
				}else if(msg.MessageType=="5"){
					u.Server.getDatabaseMessages(&msg)
				}else if(msg.MessageType=="77"){
					u.Server.sendUsersStatusToNewUser(&msg)
				}
			}
		}
	}
}
var newfile *models.File
func filerequest(u *User, msg *models.Message) {
    if msg.File.Filemessagetype=="file"{
    	msg.File.FileRequest=true
        //log.Println("%v",msg);
        newfile=new(models.File);
        newfile.Filename=msg.File.Filename
        newfile.Fileextension=msg.File.Fileextension
		newfile.Filesize=msg.File.Filesize
		newfile.Filedata=make([]string,0)
        if err := websocket.JSON.Send(u.Ws, &msg); err != nil {
        	//log.Println(err);
        }
		//log.Println("newfile");
    }else{
        //log.Println("not a file",msg);
    }
}
func fileslicing(u *User, msg *models.Message){
    if msg.File.Filejourneystate=="ini"{
    	newfile.Filedata=append(newfile.Filedata,msg.File.Filesliceddata)
        msg.File.Sliceresponse=true
        if err := websocket.JSON.Send(u.Ws, &msg); err != nil {
        	//log.Println("err:",err)
        }
    	//log.Println("ini")
    }else if msg.File.Filejourneystate=="end"{
    	newfile.Filedata=append(newfile.Filedata,msg.File.Filesliceddata)
        msg.File.Sliceresponse=true
        if err := websocket.JSON.Send(u.Ws, &msg); err != nil {
        	//log.Println("err:",err)
        }else{
        	//log.Println("sending last response")
        	msg.File=newfile;
        	//log.Println("end")
        	u.Server.SendFile(msg)
	    }
    }else{
    	//log.Println("s");
    }
    
}