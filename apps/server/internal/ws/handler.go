package ws

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"nhooyr.io/websocket"
	sshc "web-terminal-ttyd/apps/server/internal/ssh"
)

type initMsg struct {
	Host string `json:"host"`
	Port int    `json:"port"`
	User string `json:"user"`
	Cols int    `json:"cols"`
	Rows int    `json:"rows"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	c, err := websocket.Accept(w, r, &websocket.AcceptOptions{InsecureSkipVerify: true})
	if err != nil {
		log.Println("ws accept:", err)
		return
	}
	defer c.Close(websocket.StatusInternalError, "")

	_, data, err := c.Read(r.Context())
	if err != nil {
		log.Println("read init:", err)
		return
	}
	var im initMsg
	if err := json.Unmarshal(data, &im); err != nil {
		log.Println("init json:", err)
		return
	}
	keyPath := os.Getenv("SSH_KEY_PATH")
	client, err := sshc.Dial(im.User, im.Host, im.Port, keyPath)
	if err != nil {
		log.Println("ssh dial:", err)
		return
	}
	sess, rwc, err := client.Shell(im.Cols, im.Rows)
	if err != nil {
		log.Println("shell:", err)
		return
	}
	ctx, cancel := context.WithCancel(r.Context())
	go func() {
		for {
			_, msg, err := c.Read(ctx)
			if err != nil {
				cancel()
				return
			}
			if len(msg) > 0 && msg[0] == '{' {
				var rm struct {
					Type       string `json:"type"`
					Cols, Rows int
				}
				if json.Unmarshal(msg, &rm) == nil && rm.Type == "resize" {
					sess.WindowChange(rm.Rows, rm.Cols)
				}
				continue
			}
			rwc.Write(msg)
		}
	}()
	buf := make([]byte, 4096)
	for {
		n, err := rwc.Read(buf)
		if err != nil {
			break
		}
		c.Write(ctx, websocket.MessageText, buf[:n])
	}
	c.Close(websocket.StatusNormalClosure, "")
}
