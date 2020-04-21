package main

import (
	contr "chatsocketserver/controller"
	db "chatsocketserver/database"
	"log"
	"net/http"
)

func main() {
	log.SetFlags(log.Lshortfile)
	db := db.NewDatabase()
	contr.NewServerUser(db)
	newServerUser := contr.NewServerUser(db)
	go newServerUser.Controller()
	http.Handle("/", http.FileServer(http.Dir("./static/")))
	log.Println("Listening on port... :1234")
	log.Fatal(http.ListenAndServe(":1234", nil))
}
