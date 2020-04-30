package main
import (
    "log"
    "net/http"
    contr "chatsocketserver/controller"
    database "chatsocketserver/database"
)

func main(){
    log.SetFlags(log.Lshortfile)
    dbconn:=database.NewDatabase();
    newServerUser:= contr.NewServerUser(dbconn)
    go newServerUser.Controller()
    // http.Handle("/", http.FileServer(http.Dir("./static/")))
    log.Println("Listening on port... :1234")
    log.Fatal(http.ListenAndServe(":1234", nil))
}