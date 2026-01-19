package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	enableFeatureX := os.Getenv("ENABLE_FEATURE_X") == "true"
	version := os.Getenv("VERSION")
	if version == "" {
		version = "unknown"
	}

	http.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		if enableFeatureX {
			// v2: с фича-флагом
			fmt.Fprintf(w, "pong (Feature X enabled, Version: %s)", version)
		} else {
			// v1: без фича-флага
			fmt.Fprintf(w, "pong (Version: %s)", version)
		}
	})

	// Feature flag route
	if enableFeatureX {
		http.HandleFunc("/feature", func(w http.ResponseWriter, r *http.Request) {
			fmt.Fprintf(w, "Feature X is enabled! (Version: %s)", version)
		})
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Booking Service\nVersion: %s\nFeature X enabled: %v", 
			version, enableFeatureX)
	})

	log.Printf("Server starting on :8080 (Version: %s, Feature X: %v)", version, enableFeatureX)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
