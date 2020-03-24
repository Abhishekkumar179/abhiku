package repository

import (
	"context"
	"crud/crud"
	models "crud/model"

	"github.com/jinzhu/gorm"

	//"crud/logger"
	"fmt"
)

type crudRepository struct {
	DBConn *gorm.DB
}

func NewcrudRepository(conn *gorm.DB) crud.Repository {
	return &crudRepository{
		DBConn: conn,
	}
}

/**************************************************Create User***************************************************/

func (r *crudRepository) CreateUSER(ctx context.Context, empid int64, name string, phoneno string, age int64, salary int64) (*models.Response, error) {
	//creating flow model.
	newFlow := models.Employee{
		Id:      empid,
		Name:    name,
		Salary:  salary,
		Age:     age,
		Phoneno: phoneno,
	}
	if db := r.DBConn.Create(&newFlow); db.Error != nil {
		fmt.Println("flow created but flow menu already exits, try renaming flow menu", db.Error)
		// logger.Logger.WithError(db.Error).WithField("DBConn.Create(newFlowMenu) ", db.Value).
		// Errorf("Error while creating flow menu into database")
		return &models.Response{Status: "2", Msg: "EmpId already exists", ResponseCode: 201}, nil
	} else {
		fmt.Println("flow menu created", db.Value, db.RowsAffected, db.Error)
		return &models.Response{Status: "1", Msg: "EmpID has been created successfully", ResponseCode: 200}, nil
	}
}

/**************************************************Update User***************************************************/

func (r *crudRepository) Update(ctx context.Context, id int64, empid int64, name string, phoneno string, age int64, salary int64) (*models.Employee, error) {
	//creating flow model.

	update := models.Employee{
		Id: id,
	}
	db := r.DBConn.Model(&update).Updates(map[string]interface{}{"name": name, "phoneno": phoneno, "age": age, "salary": salary})
	fmt.Println(db)
	return &update, nil

}

/**************************************************Get User***************************************************/

func (r *crudRepository) GetUser(ctx context.Context) (*models.Response, error) {
	//creating flow model.
	// 	users:=[]models.Employee{}
	// 	//list:=make([]models.Employee, 0)
	// if	err:=r.DBConn.Find(&users); err.Error!=nil{
	// 		 logger.Logger.WithError(err.Error).WithField("DBConn.Select ", err.Value).
	// 		 	Errorf("Error while getting flow_uuid and flow_name from database")
	// 		fmt.Println(err)
	// 	}
	// 	return  &models.Response{Status:"OK",Msg:"Record Found",ResponseCode:200,Employee:users},nil

	// }
	list := make([]models.Employee, 0)

	//	Select("flow_name, flow_uuid").Where("account_id= ?",accid).Find(&flowIdName).Rows()
	if rows, err := r.DBConn.Raw("select id, name from Employees").Rows(); err != nil {
		// logger.Logger.WithError(err).WithField("DBConn.Select ", rows).
		// 	Errorf("Error while getting flow_uuid and flow_name from database")
		return &models.Response{Status: "Not Found", Msg: "Record Not Found", ResponseCode: 400}, nil
	} else {
		defer rows.Close()
		// var id int64
		// var flowUUID, flowName string
		for rows.Next() {
			f := models.Employee{}
			if err := rows.Scan(&f.Id, &f.Name); err != nil {
				// logger.Logger.WithError(err).WithField("DBConn.Select ", rows).
				// Errorf("Error while getting flow_uuid and flow_name from database")
				return nil, err
			}
			list = append(list, f)
		}
		return &models.Response{Status: "OK", Msg: "Record Found", ResponseCode: 200, Employee: list}, nil
	}
}

/**************************************************Delete User***************************************************/

func (r *crudRepository) Delete(ctx context.Context, id int64) (*models.Response, error) {

	f := models.Employee{
		Id: id,
	}
	query := r.DBConn.Delete(&f)
	if query.RowsAffected == 0 {
		return &models.Response{Status: "Not Found", Msg: "Record Doesn't Exist", ResponseCode: 401}, nil
	}
	// if query!=nil{
	// 	//fmt.Println("error")
	// }
	fmt.Println(query.Value, query.Error, query.RowsAffected, "kuj")
	return &models.Response{Status: "OK", Msg: "Record Deleted", ResponseCode: 200}, nil

}

/**************************************************Get By Id****************************************************/

func (r *crudRepository) GetById(ctx context.Context, id int64) (*models.Employee, error) {
	s := models.Employee{
		Id: id,
	}
	row := r.DBConn.First(&s)
	if row.RowsAffected == 0 {
		return &models.Employee{Name: "Not Exist in DB"}, nil

	}

	// f :=models.Employee{}
	// if err:=row.Scan(&f.Id, &f.Name,&f.Age,&f.Phoneno,&f.Salary); err!=nil{
	// 	fmt.Println("fdfchjdssfcsd",err)
	// 	// logger.Logger.WithError(err).WithField("DBConn.Select ", rows).
	// 	// Errorf("Error while getting flow_uuid and flow_name from database")
	// 	return nil,err
	// }
	fmt.Println("asdbncbv", row.Value, row.RowsAffected, row.Error)
	return &s, nil
}

/************************************************Get Location************************************************/
func (r *crudRepository) GetLocation(ctx context.Context) (*models.Response, error) {
	//creating flow model.
	users := []models.Location{}
	//list:=make([]models.Employee, 0)
	if err := r.DBConn.Where("lat  ? AND long  ?", "28.5961", "77.3683").Find(&users); err.Error != nil {
		//  logger.Logger.WithError(err.Error).WithField("DBConn.Select ", err.Value).
		// 	 Errorf("Error while getting flow_uuid and flow_name from database")
		fmt.Println(err)
	}
	return &models.Response{Status: "OK", Msg: "Record Found", ResponseCode: 200, Location: users}, nil

}

/*********************************************Add Location***************************************************/
func (r *crudRepository) AddLocation(ctx context.Context, name string, types string, lat string, long string, dist int64) (*models.Response, error) {
	//creating flow model.
	newFlow := models.Location{
		Name: name,
		Type: types,
		Lat:  lat,
		Long: long,
		Dist: dist,
	}
	if db := r.DBConn.Create(&newFlow); db.Error != nil {
		fmt.Println("flow created but flow menu already exits, try renaming flow menu", db.Error)
		// logger.Logger.WithError(db.Error).WithField("DBConn.Create(newFlowMenu) ", db.Value).
		// Errorf("Error while creating flow menu into database")
		return &models.Response{Status: "2", Msg: "EmpId already exists", ResponseCode: 201}, nil
	} else {
		fmt.Println("flow menu created", db.Value, db.RowsAffected, db.Error)
		return &models.Response{Status: "1", Msg: "EmpID has been created successfully", ResponseCode: 200}, nil
	}
}

/*********************************************Upload File*************************************************/
func (r *crudRepository) UploadFile(ctx context.Context, allRecords [][]string) (*models.Response, error) {
	//creating flow model.
	//fmt.Println(allRecords,"rows value.......")
	// newFlow:= models.Student{

	// }
	list := make([]models.Student, 0)

	if rows, err := r.DBConn.Raw("COPY students(Id,Name,Age,Profile) FROM '/home/stl/Documents/record.csv' DELIMITER ',' CSV HEADER").Rows(); err != nil {
		// logger.Logger.WithError(err).WithField("DBConn.Select ", rows).
		// 	Errorf("Error while getting flow_uuid and flow_name from database")
		return &models.Response{Status: "Not Inserted", Msg: "Table Already Exist ", ResponseCode: 400}, nil
	} else {
		defer rows.Close()

		for rows.Next() {
			f := models.Student{}
			if err := rows.Scan(&f.Id, &f.Name); err != nil {
				// logger.Logger.WithError(err).WithField("DBConn.Select ", rows).
				// Errorf("Error while getting flow_uuid and flow_name from database")
				return nil, err
			}
			list = append(list, f)
		}

		return &models.Response{Status: "OK", Msg: "Record Found", ResponseCode: 200}, nil
	}

	// if db:=r.DBConn.Raw("COPY students(Id,Name,Age,Profile) FROM '/home/stl/Documents/record.csv' DELIMITER ',' CSV HEADER"); db.Error!=nil{
	// 	fmt.Println("flow created but flow menu already exits, try renaming flow menu",db.Error)
	// 	logger.Logger.WithError(db.Error).WithField("DBConn.Create(newFlowMenu) ", db.Value).
	// 	Errorf("Error while creating flow menu into database")
	// 	return &models.Response{Status:"2",Msg:"EmpId already exists",ResponseCode:201},nil
	// }else{
	// 	fmt.Println("flow menu created",db.Value,db.RowsAffected,db.Error)
	// 	return &models.Response{Status:"1",Msg:"EmpID has been created successfully",ResponseCode:200},nil
	// }
}

/***/
func (r *crudRepository) Student(ctx context.Context, id int64, name string, address string) (*models.Teacher, error) {
	//creating flow model.
	newFlow := models.Teacher{
		Id:      id,
		Name:    name,
		Address: address,
	}

	if db := r.DBConn.Create(&newFlow); db.Error != nil {
		fmt.Println("flow created but flow menu already exits, try renaming flow menu", db.Error)
		// logger.Logger.WithError(db.Error).WithField("DBConn.Create(newFlowMenu) ", db.Value).
		// Errorf("Error while creating flow menu into database")
		return &models.Teacher{}, nil
	} else {
		fmt.Println("flow menu created", db.Value, db.RowsAffected, db.Error)
		return &newFlow, nil
	}
}

/************************************************Mail send***************************************/

func (r *crudRepository) Mail(ctx context.Context, Name string, to string) (*models.Response, error) {
	//creating flow model.
	newFlow := models.Email{

		Name: Name,
		To:   to,
	}

	if db := r.DBConn.Create(&newFlow); db.Error != nil {
		fmt.Println("flow created but flow menu already exits, try renaming flow menu", db.Error)
		// logger.Logger.WithError(db.Error).WithField("DBConn.Create(newFlowMenu) ", db.Value).
		// Errorf("Error while creating flow menu into database")
		return &models.Response{Status: "NOT OK", Msg: "Mail NOT Sent", ResponseCode: 400}, nil
	} else {
		fmt.Println("flow menu created", db.Value, db.RowsAffected, db.Error)
		return &models.Response{Status: "OK", Msg: "Mail Sent", ResponseCode: 200}, nil
	}
}
