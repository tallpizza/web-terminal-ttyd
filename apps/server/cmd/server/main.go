package main

import (
	"log"
	"net/http"
	"os"

	upload "web-terminal-ttyd/apps/server/internal/upload"
	ws "web-terminal-ttyd/apps/server/internal/ws"
)

func main() {
	http.HandleFunc("/api/ws/term", ws.Handler)
	http.HandleFunc("/api/upload", upload.Handler)
	addr := ":3001"
	if v := os.Getenv("PORT"); v != "" {
		addr = ":" + v
	}
	log.Printf("server listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
