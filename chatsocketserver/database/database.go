package database
import(
	"database/sql"
	_"github.com/lib/pq"
	"log"
)
func NewDatabase() *sql.DB{
	dbConn, err:= sql.Open("postgres","host=localhost port=5432 user=postgres password=psql dbname=chatsocketserver sslmode=disable");
	if err!=nil{
		log.Fatal(err);
		return nil
	}
	return dbConn
}