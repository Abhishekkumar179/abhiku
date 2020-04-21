package database

import (
	"chatsocketserver/models"

	"fmt"

	_ "github.com/jinzhu/gorm/dialects/postgres"
	_ "github.com/lib/pq"

	"github.com/jinzhu/gorm"
)

const (
	host     = "localhost"
	port     = 5432
	user     = "postgres"
	password = "8447849769"
	dbname   = "dbname"
)

func NewDatabase() *gorm.DB {
	dbConn, err := gorm.Open("postgres", "")
	psqlInfo := fmt.Sprintf("host=%s port=%d user=%s "+
		"password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)
	db, err := gorm.Open("postgres", psqlInfo)
	if err != nil {
		panic(err)
	}
	defer db.Close()

	//	err = db.Ping()
	if err != nil {
		return nil
	}
	db.AutoMigrate(models.User{})
	fmt.Println("connected")
	return dbConn
}
