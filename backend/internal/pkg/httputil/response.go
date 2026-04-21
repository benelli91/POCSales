package httputil

import (
	"encoding/json"
	"net/http"
)

// RespondJSON serializa v como JSON con status 200.
func RespondJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

// RespondJSONStatus serializa v con status custom.
func RespondJSONStatus(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// RespondErr responde un error textual con un código HTTP.
func RespondErr(w http.ResponseWriter, err error, code int) {
	http.Error(w, err.Error(), code)
}

// RespondMsg responde un objeto {"error": msg} con el código indicado.
func RespondMsg(w http.ResponseWriter, code int, msg string) {
	RespondJSONStatus(w, code, map[string]string{"error": msg})
}
