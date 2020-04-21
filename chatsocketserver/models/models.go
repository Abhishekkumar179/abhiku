package models

type Message struct {
	MessageType    string `json:"message_type,omitempty"`
	To             string `json:"to,omitempty"`
	From           string `json:"from,omitempty"`
	Body           string `json:"body,omitempty"`
	File           string `json:"file,omitempty"`
	MessageId      string `json:"message_id,omitempty"`
	MessageStageId string `json:"message_stage_id,omitempty"`
}
type User struct {
	Id   int    `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
}
type MyResponse struct {
	StatusCode    string  `json:"statuscode,omitempty"`
	StatusMessage string  `json:"statusmsg,omitempty"`
	Msg           Message `json:"msg,omitempty"`
}
