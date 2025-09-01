package upload

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	r.ParseMultipartForm(50 << 20) // 50MB
	f, header, err := r.FormFile("file")
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	defer f.Close()
	home, _ := os.UserHomeDir()
	dir := filepath.Join(home, "uploads")
	os.MkdirAll(dir, 0700)
	dst, err := os.Create(filepath.Join(dir, filepath.Base(header.Filename)))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer dst.Close()
	io.Copy(dst, f)
	json.NewEncoder(w).Encode(map[string]any{"ok": true, "savedPath": "~/uploads/" + filepath.Base(header.Filename)})
}
