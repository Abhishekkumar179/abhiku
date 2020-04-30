package models
type Message struct {
	MessageType string `json:"message_type,omitempty"`
	To string `json:"to,omitempty"`
	From string `json:"from,omitempty"`
	Body string `json:"body,omitempty"`
	File *File `json:"file,omitempty"`
	MessageId string `json:"message_id,omitempty"`
	MessageStageId string `json:"message_stage_id,omitempty"`
	UserStatus string `json:"user_status,omitempty"`
}

type File struct{
	Filemessagetype string `json:"Filemessagetype,omitempty"`
	Filename string `json:"filename,omitempty"`
	Fileextension string `json:"fileextension,omitempty"`
	Filesize int `json:"filesize,omitempty"`
	FileRequest bool `json:"filerequest,omitempty"`
	Filedata []string `json:"filedata,omitempty"`
	Filesliceddata string `json:"filesliceddata,omitempty"`
	Filejourneystate string `json:"filejourneystate,omitempty"`
	Sliceresponse bool `json:"sliceresponse,omitempty"`
}

type MyResponse struct{
	StatusCode string `json:"statuscode, omitempty"`
	StatusMessage string `json:"statusmsg, omitempty"`
	Msg Message `json:"msg, omitempty"`
}
