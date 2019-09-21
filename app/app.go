package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/health", health)
	http.HandleFunc("/", hello)
	http.ListenAndServe(":8080", nil)
}

func health(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", "text/plain")
	fmt.Fprintf(w, "OK")
}

func hello(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", "text/html")
	fmt.Fprintf(w, message)
}

const message = `
	<html>
		</head></head>
		<body>Hello world!</body>
	</html>
`
