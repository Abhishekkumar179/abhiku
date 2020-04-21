package controller

import (
	"chatsocketserver/models"
	"fmt"
	"log"
	"net/http"

	"github.com/jinzhu/gorm"

	"golang.org/x/net/websocket"
)

type ServerUserList struct {
	Users    map[int]*User
	UserChan chan *User
	Delch    chan *User
	Donech   chan bool
	dbconn   *gorm.DB
}

var (
	num            = 0
	user1          = User{Name: "moin"}
	user2          = User{Name: "umesh"}
	user3          = User{Name: "mukesh"}
	channelBufSize = 100
)

func (s *ServerUserList) Del(u *User) {
	log.Println("delfc")
	s.Delch <- u
}

func (s *ServerUserList) SendReceipt(msg *models.Message) {
	// log.Printf("%#v ",msg)
	originusername := new(User)
	for _, u := range s.Users {
		if u.Name == msg.From {
			originusername = u
			log.Println("origin from user found")
			break
		}
	}
	go originusername.WriteMessageReciept(msg)
	log.Println("to user not found")
}

func (s *ServerUserList) SendMessage(msg *models.Message) {
	log.Println("Sendallfc")
	// log.Printf("%#v ",msg)
	fromusername := new(User)
	tousername := new(User)
	for _, u := range s.Users {
		if u.Name == msg.From {
			fromusername = u
			log.Println("from user found")
			break
		}
	}
	for _, u := range s.Users {
		if u.Name == msg.To {
			tousername = u
			rcp := msg
			go fromusername.WriteMessageReciept(rcp)
			tousername.WriteMessage(msg)
			return
		}
	}
	fromusername.WriteMessageReciept(msg)
	log.Println("to user not found")
}
func NewServerUser(dbconn *gorm.DB) *ServerUserList {
	Users := make(map[int]*User)
	uChan := make(chan *User)
	delch := make(chan *User)
	donech := make(chan bool)

	return &ServerUserList{
		Users,
		uChan,
		delch,
		donech,
		dbconn,
	}
}
func (s *ServerUserList) allUsers(w http.ResponseWriter, r *http.Request) {
	log.Println(s.Users)
	for k, v := range s.Users {
		fmt.Fprintf(w, "%s -> %s\n", k, v)
	}
}
func (s *ServerUserList) NewUser(username string, ws *websocket.Conn) *User {
	for _, u := range s.Users {
		if u.Name == username {
			u.Ws = ws
			return u
		}
	}
	nc := new(User)
	num++
	nc.Id = num
	nc.Name = username
	nc.Ws = ws
	nc.Ch = make(chan *models.Message, channelBufSize)
	nc.DoneCh = make(chan bool)
	nc.Server = s
	s.UserChan <- nc
	return nc
}
func (s *ServerUserList) register(ws *websocket.Conn) {
	for {
		var username string

		if err := websocket.Message.Receive(ws, &username); err != nil {
			log.Println("Can't receive", err)
			break
		}

		var rsp models.MyResponse
		user := models.User{
			Id:   1,
			Name: username,
		}

		if username == "abhi" {
			log.Println("valid user", username)
			if db := s.dbconn.Create(&user); db.Error != nil {
				fmt.Println("error")
			}

			u := s.NewUser(username, ws)
			rsp.StatusCode = "200"
			rsp.StatusMessage = "valid user"

			if err := websocket.JSON.Send(ws, rsp); err != nil {
				log.Println("Can't send", err)
				break
			}
			u.Listen()
		} else {
			rsp.StatusCode = "404"
			rsp.StatusMessage = "invalid user"
			if err := websocket.JSON.Send(ws, rsp); err != nil {
				log.Println("Can't send", err)
				break
			}
		}
	}
}
func (s *ServerUserList) Controller() {
	http.Handle("/main", websocket.Handler(s.register))
	http.HandleFunc("/allUsers", s.allUsers)
	log.Println("controller created")
	for {
		select {
		case u := <-s.UserChan:
			s.Users[u.Id] = u
			var count int
			for _, _ = range s.Users {
				count++
			}
			log.Println("Now", count, "users connected.")

		case u := <-s.Delch:
			delete(s.Users, u.Id)

		}
	}
}
