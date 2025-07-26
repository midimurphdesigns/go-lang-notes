package main

import (
	"flag"
	"log"
	"os"

	"github.com/midimurphdesigns/go-lang-notes/cmd"
)

func main() {
	// Define command line flags
	var (
		webMode  = flag.Bool("web", false, "Run in web server mode")
		port     = flag.String("port", "8080", "Port for web server (default: 8080)")
		notesDir = flag.String("notes-dir", "notes", "Directory to store notes")
	)
	flag.Parse()

	if *webMode {
		// Web server mode
		runWebServer(*port, *notesDir)
	} else {
		// CLI mode (default)
		runCLI(*notesDir)
	}
}

func runWebServer(port, notesDir string) {
	// Create and start the server
	server, err := NewServer(notesDir)
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	log.Printf("Starting GoNotes web server on port %s", port)
	log.Printf("Notes directory: %s", notesDir)
	log.Printf("Web interface: http://localhost:%s", port)
	log.Printf("API endpoints: http://localhost:%s/api", port)
	log.Printf("CLI console: Open browser dev tools and use 'gonotes' object")

	if err := server.Start(port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

func runCLI(notesDir string) {
	// Set the notes directory for CLI
	os.Setenv("NOTES_DIR", notesDir)

	// Run the CLI application
	cmd.Execute()
}
