package controller

import (
	"chatsocketserver/models"
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"

	"golang.org/x/net/websocket"
)

var databaseLocation = "/home/startele/database"

type ServerUserList struct {
	Users    map[int]*User
	UserChan chan *User
	Delch    chan *User
	Donech   chan bool
	Dbconn   *sql.DB
}

var (
	num            = 0
	user1          = User{Name: "moin"}
	user2          = User{Name: "umesh"}
	user3          = User{Name: "mukesh"}
	channelBufSize = 100
)

func (s *ServerUserList) Del(u *User) {
	//log.Println("delfc")
	s.Delch <- u
}

func (s *ServerUserList) SendReceipt(msg *models.Message) {
	// log.Printf("%#v ",msg)
	originusername := new(User)
	for _, u := range s.Users {
		if u.Name == msg.From {
			originusername = u
			//log.Println("origin from user found")
			go originusername.WriteMessageReciept(msg)
			return
		}
	}
	//log.Println("to user not found")
}

func (s *ServerUserList) SendMessage(msg *models.Message) {
	//log.Println("Sendallfc")
	// log.Printf("%#v ",msg)
	s.MessageStoreToDb(msg)
	fromusername := new(User)
	tousername := new(User)
	for _, u := range s.Users {
		if u.Name == msg.From {
			fromusername = u
			//log.Println("from user found")
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
	//log.Println("to user not found")
}
func (s *ServerUserList) SendFile(msg *models.Message) {
	//log.Println("Sendfile")
	// log.Printf("%#v ",msg)
	s.MessageStoreToDb(msg)
	fromusername := new(User)
	tousername := new(User)
	for _, u := range s.Users {
		if u.Name == msg.From {
			fromusername = u
			//log.Println("from user found")
			break
		}
	}
	for _, u := range s.Users {
		if u.Name == msg.To {
			tousername = u

			rcp := msg
			go fromusername.WriteFileReciept(rcp)
			tousername.WriteFile(msg)
			return
		}
	}
	fromusername.WriteMessageReciept(msg)
	//log.Println("to user not found")
}

func (s *ServerUserList) MessageStoreToDb(msg *models.Message) {
	blob := false
	if msg.File != nil {
		blob = true
	}
	var id int
	err := s.Dbconn.QueryRow("insert into user_messages(user_to,user_from,message_number,message,message_stage_id,blob_file) values($1,$2,$3,$4,$5,$6) returning message_id;", msg.To, msg.From, msg.MessageId, msg.Body, "1", blob).Scan(&id)
	if err != nil {
		log.Println(err)
	}
	if blob {
		userLocation := databaseLocation + "/" + msg.From
		if err := os.MkdirAll(userLocation, 0755); err != nil {
			// log.Println(err)
		} else {
			filename := strings.SplitN(msg.File.Filename, ".", -1)
			fileLocation := userLocation + "/" + filename[0] + ".txt"
			if f, err := os.Create(fileLocation); err != nil {
				// log.Println(err)
			} else {
				defer f.Close()
				for _, value := range msg.File.Filedata {
					if _, err := f.WriteString(value + " "); err != nil {
						// log.Println(err)
					}
				}
				if err := s.Dbconn.QueryRow("insert into user_blobs(mime_type,file_name,file_data_location,message_id) values($1,$2,$3,$4) ;", msg.File.Fileextension, msg.File.Filename, fileLocation, id); err != nil {
					// log.Println(err)
				}
			}
		}
	}
}
func (s *ServerUserList) updateMessageStoreToDb(msg *models.Message) {
	_, err := s.Dbconn.Exec("update user_messages set message_stage_id=$1 where user_to=$2 and user_from=$3 and message_number=$4", msg.MessageStageId, msg.To, msg.From, msg.MessageId)
	if err != nil {
		log.Println(err)
	}
}
func (s *ServerUserList) getDatabaseMessages(msg *models.Message) {
	var rows *sql.Rows
	var err error
	if msg.MessageId == "0" {
		rows, err = s.Dbconn.Query("select message_id,user_to,user_from,message,message_number,message_stage_id,blob_file from user_messages  where (user_to=$1 and user_from=$2) or (user_to=$2 and user_from=$1) order by message_id desc limit 5", msg.To, msg.From)
	} else {
		rows, err = s.Dbconn.Query("select message_id,user_to,user_from,message,message_number,message_stage_id,blob_file from user_messages  where ((user_to=$1 and user_from=$2) or (user_to=$2 and user_from=$1)) and message_number<$3 order by message_id desc limit 5", msg.To, msg.From, msg.MessageId)
	}
	if err != nil {
		log.Println(err)
	}
	defer rows.Close()
	fromusername := new(User)
	var useronline bool
	for _, u := range s.Users {
		if u.Name == msg.From {
			fromusername = u
			//log.Println("from user found")
			useronline = true
			break
		}
	}
	resultstoremsg := make([]*models.Message, 0)
	for rows.Next() {
		storemsg := new(models.Message)
		var blob bool
		var id int
		if err := rows.Scan(&id, &storemsg.To, &storemsg.From, &storemsg.Body, &storemsg.MessageId, &storemsg.MessageStageId, &blob); err != nil {
			log.Println(err)
		}
		if blob {
			var fileLocation string
			storemsg.File = new(models.File)
			err := s.Dbconn.QueryRow("select mime_type,file_name,file_data_location from user_blobs  where message_id=$1 ", id).Scan(&storemsg.File.Fileextension, &storemsg.File.Filename, &fileLocation)
			if err != nil {
				log.Println(err)
			}
			content, err := ioutil.ReadFile(fileLocation)
			cno := string(content)
			storemsg.File.Filedata = strings.Split(cno, " ")
		}
		if storemsg.To == msg.From && storemsg.MessageStageId == "1" {
			storemsg.MessageType = "1"
		} else {
			storemsg.MessageType = msg.MessageType
		}
		// storemsg.MessageStageId="2"
		resultstoremsg = append(resultstoremsg, storemsg)
		// log.Println(len(resultstoremsg))
	}
	if useronline {
		fromusername.sendDatabaseMessages(resultstoremsg)
	}
}

func (s *ServerUserList) sendUsersStatusToNewUser(msg *models.Message) {
	for _, u := range s.Users {
		if u.Name == msg.To {
			u.WriteInfoStatus(msg)
		}
	}
}
func (s *ServerUserList) sendUserStatus(name string, stt string) {
	for _, u := range s.Users {
		if u.Name != name {
			msg := models.Message{MessageType: "7", To: u.Name, From: name, UserStatus: stt}
			u.WriteInfoStatus(&msg)
		}
	}
}

func NewServerUser(dbconn *sql.DB) *ServerUserList {
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
	//log.Println(s.Users)
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
			//log.Println("Can't receive",err)
			break
		}

		var rsp models.MyResponse
		if username == user1.Name || username == user2.Name || username == user3.Name {
			//log.Println("valid user",username)
			u := s.NewUser(username, ws)
			rsp.StatusCode = "200"
			rsp.StatusMessage = "valid user"

			if err := websocket.JSON.Send(ws, rsp); err != nil {
				//log.Println("Can't send",err)
				break
			}
			u.Listen()
		} else {
			rsp.StatusCode = "404"
			rsp.StatusMessage = "invalid user"
			if err := websocket.JSON.Send(ws, rsp); err != nil {
				//log.Println("Can't send",err)
				break
			}
		}
	}
}
func (s *ServerUserList) Controller() {
	http.Handle("/main", websocket.Handler(s.register))
	http.HandleFunc("/allUsers", s.allUsers)
	//log.Println("controller created")
	for {
		select {
		case u := <-s.UserChan:
			s.Users[u.Id] = u
			// var count int
			s.sendUserStatus(u.Name, "true")
			// for _,_=range s.Users{
			// 	count++
			// }
			// log.Println("Now", count, "users connected.")

		case u := <-s.Delch:
			s.sendUserStatus(u.Name, "false")
			delete(s.Users, u.Id)
		}
	}
}
