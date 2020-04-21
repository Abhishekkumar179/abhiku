package controller

import (
	"chatsocketserver/models"
	"io"
	"log"

	"golang.org/x/net/websocket"
)

type User struct {
	Id     int
	Name   string
	Ws     *websocket.Conn
	Ch     chan *models.Message
	DoneCh chan bool
	Server *ServerUserList
}

func (u *User) Listen() {
	go u.listenWrite()
	u.listenRead()
}
func (u *User) WriteMessageReciept(msg *models.Message) {
	updateMsgState := models.Message{msg.MessageType, msg.To, msg.From, msg.Body, msg.File, msg.MessageId, msg.MessageStageId}
	log.Println("writing reciept into from user")
	updateMsgState.MessageType = "0"
	if updateMsgState.MessageStageId == "0" {
		updateMsgState.MessageStageId = "1"
	} else if updateMsgState.MessageStageId == "1" {
		updateMsgState.MessageStageId = "2"
	} else {
		log.Println("unknown stage ")
	}
	log.Println(u.Name, "reciept stage ", updateMsgState.MessageStageId)
	select {
	case u.Ch <- &updateMsgState:
		log.Println(updateMsgState)
	default:
		log.Printf("client %d is disconnected.", u.Id)
	}
}
func (u *User) WriteMessage(msg *models.Message) {
	updateMsgState := models.Message{msg.MessageType, msg.To, msg.From, msg.Body, msg.File, msg.MessageId, msg.MessageStageId}
	// log.Println("writing into to user")
	if updateMsgState.MessageStageId == "0" {
		updateMsgState.MessageStageId = "1"
	} else if updateMsgState.MessageStageId == "1" {
		updateMsgState.MessageStageId = "2"
	} else {
		log.Println("unknown stage ")
	}
	select {
	case u.Ch <- &updateMsgState:
		log.Println(u.Name)
	default:
		log.Printf("client %d is disconnected.", u.Id)
	}
}

func (u *User) listenWrite() {
	log.Println("Listening write to client")
	for {
		select {
		case msg := <-u.Ch:
			log.Println(u.Name, &msg, msg)
			websocket.JSON.Send(u.Ws, msg)
		case <-u.DoneCh:
			u.Server.Del(u)
			u.DoneCh <- true
			return
		}
	}
}

func (u *User) listenRead() {
	log.Println("Listening read from client")
	for {
		select {
		default:
			var msg models.Message
			err := websocket.JSON.Receive(u.Ws, &msg)
			if err == io.EOF {
				log.Println("EOF err: ", err)
				u.DoneCh <- true
			} else if err != nil {
				log.Println("err: ", err)
			} else {
				if msg.MessageType == "0" {
					log.Println("got rcp type")
					u.Server.SendReceipt(&msg)
				} else if msg.MessageType == "1" {
					log.Println("got msg type")
					u.Server.SendMessage(&msg)
				} else {
					log.Println("unknown type!")
				}
			}
		}
	}
}
