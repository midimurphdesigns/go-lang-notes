package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/midimurphdesigns/go-lang-notes/internal/note"
)

type Server struct {
	storage *note.Storage
	router  *mux.Router
}

type NoteResponse struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Tags      []string  `json:"tags"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateNoteRequest struct {
	Title   string   `json:"title"`
	Content string   `json:"content"`
	Tags    []string `json:"tags"`
}

type UpdateNoteRequest struct {
	Title   string   `json:"title"`
	Content string   `json:"content"`
	Tags    []string `json:"tags"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func NewServer(notesDir string) (*Server, error) {
	storage, err := note.NewStorage(notesDir)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize storage: %w", err)
	}

	router := mux.NewRouter()
	server := &Server{
		storage: storage,
		router:  router,
	}

	server.setupRoutes()
	return server, nil
}

func (s *Server) setupRoutes() {
	// Add CORS middleware
	s.router.Use(s.corsMiddleware)

	// API routes
	api := s.router.PathPrefix("/api").Subrouter()

	// Notes CRUD operations
	api.HandleFunc("/notes", s.getNotes).Methods("GET")
	api.HandleFunc("/notes", s.createNote).Methods("POST")
	api.HandleFunc("/notes/{id}", s.getNote).Methods("GET")
	api.HandleFunc("/notes/{id}", s.updateNote).Methods("PUT")
	api.HandleFunc("/notes/{id}", s.deleteNote).Methods("DELETE")

	// Search and stats
	api.HandleFunc("/notes/search", s.searchNotes).Methods("GET")
	api.HandleFunc("/stats", s.getStats).Methods("GET")

	// CLI console API
	api.HandleFunc("/cli/execute", s.executeCLICommand).Methods("POST")
	api.HandleFunc("/cli/help", s.getCLIHelp).Methods("GET")

	// Serve static files (React app) with CLI console injection
	s.router.PathPrefix("/").Handler(s.cliConsoleHandler(http.FileServer(http.Dir("../frontend/build"))))
}

func (s *Server) getNotes(w http.ResponseWriter, r *http.Request) {
	notes := s.storage.GetActiveNotes()

	response := make([]NoteResponse, len(notes))
	for i, note := range notes {
		response[i] = NoteResponse{
			ID:        note.ID,
			Title:     note.Title,
			Content:   note.Content,
			Tags:      note.Tags,
			CreatedAt: note.CreatedAt,
			UpdatedAt: note.UpdatedAt,
		}
	}

	s.sendJSON(w, response)
}

func (s *Server) createNote(w http.ResponseWriter, r *http.Request) {
	var req CreateNoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Title == "" {
		s.sendError(w, "Title is required", http.StatusBadRequest)
		return
	}

	createdNote, err := s.storage.CreateNote(req.Title, req.Content, req.Tags)
	if err != nil {
		s.sendError(w, "Failed to create note", http.StatusInternalServerError)
		return
	}

	response := NoteResponse{
		ID:        createdNote.ID,
		Title:     createdNote.Title,
		Content:   createdNote.Content,
		Tags:      createdNote.Tags,
		CreatedAt: createdNote.CreatedAt,
		UpdatedAt: createdNote.UpdatedAt,
	}

	s.sendJSON(w, response)
}

func (s *Server) getNote(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		s.sendError(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	note, err := s.storage.GetNote(id)
	if err != nil {
		s.sendError(w, "Note not found", http.StatusNotFound)
		return
	}

	response := NoteResponse{
		ID:        note.ID,
		Title:     note.Title,
		Content:   note.Content,
		Tags:      note.Tags,
		CreatedAt: note.CreatedAt,
		UpdatedAt: note.UpdatedAt,
	}

	s.sendJSON(w, response)
}

func (s *Server) updateNote(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		s.sendError(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	var req UpdateNoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updatedNote, err := s.storage.UpdateNote(id, req.Title, req.Content, req.Tags)
	if err != nil {
		s.sendError(w, "Failed to update note", http.StatusInternalServerError)
		return
	}

	response := NoteResponse{
		ID:        updatedNote.ID,
		Title:     updatedNote.Title,
		Content:   updatedNote.Content,
		Tags:      updatedNote.Tags,
		CreatedAt: updatedNote.CreatedAt,
		UpdatedAt: updatedNote.UpdatedAt,
	}

	s.sendJSON(w, response)
}

func (s *Server) deleteNote(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		s.sendError(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	if err := s.storage.DeleteNote(id); err != nil {
		s.sendError(w, "Failed to delete note", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) searchNotes(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		s.sendError(w, "Search query is required", http.StatusBadRequest)
		return
	}

	notes := s.storage.SearchNotes(query)

	response := make([]NoteResponse, len(notes))
	for i, note := range notes {
		response[i] = NoteResponse{
			ID:        note.ID,
			Title:     note.Title,
			Content:   note.Content,
			Tags:      note.Tags,
			CreatedAt: note.CreatedAt,
			UpdatedAt: note.UpdatedAt,
		}
	}

	s.sendJSON(w, response)
}

func (s *Server) getStats(w http.ResponseWriter, r *http.Request) {
	stats := s.storage.GetStats()

	s.sendJSON(w, stats)
}

func (s *Server) executeCLICommand(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Command string   `json:"command"`
		Args    []string `json:"args"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Execute CLI command based on the command string
	result, err := s.executeCommand(req.Command, req.Args)
	if err != nil {
		s.sendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	s.sendJSON(w, map[string]interface{}{
		"result":  result,
		"command": req.Command,
		"args":    req.Args,
	})
}

func (s *Server) getCLIHelp(w http.ResponseWriter, r *http.Request) {
	help := map[string]interface{}{
		"commands": map[string]string{
			"list":   "List all notes",
			"create": "Create a new note (args: title, content, tags...)",
			"view":   "View a specific note (args: id)",
			"delete": "Delete a note (args: id)",
			"search": "Search notes (args: query)",
			"stats":  "Get statistics",
			"tag":    "Tag operations (args: add/remove, note_id, tag)",
		},
		"examples": []string{
			"gonotes.list()",
			"gonotes.create('My Note', 'Note content', 'tag1', 'tag2')",
			"gonotes.view(1)",
			"gonotes.delete(1)",
			"gonotes.search('important')",
			"gonotes.stats()",
			"gonotes.tag('add', 1, 'important')",
		},
	}

	s.sendJSON(w, help)
}

func (s *Server) executeCommand(command string, args []string) (interface{}, error) {
	switch command {
	case "list":
		notes := s.storage.GetActiveNotes()
		return notes, nil
	case "create":
		if len(args) < 2 {
			return nil, fmt.Errorf("create requires at least title and content")
		}
		title := args[0]
		content := args[1]
		tags := args[2:]
		note, err := s.storage.CreateNote(title, content, tags)
		if err != nil {
			return nil, err
		}
		return note, nil
	case "view":
		if len(args) < 1 {
			return nil, fmt.Errorf("view requires note ID")
		}
		id, err := strconv.Atoi(args[0])
		if err != nil {
			return nil, fmt.Errorf("invalid note ID")
		}
		note, err := s.storage.GetNote(id)
		if err != nil {
			return nil, err
		}
		return note, nil
	case "delete":
		if len(args) < 1 {
			return nil, fmt.Errorf("delete requires note ID")
		}
		id, err := strconv.Atoi(args[0])
		if err != nil {
			return nil, fmt.Errorf("invalid note ID")
		}
		err = s.storage.DeleteNote(id)
		if err != nil {
			return nil, err
		}
		return map[string]string{"message": "Note deleted successfully"}, nil
	case "search":
		if len(args) < 1 {
			return nil, fmt.Errorf("search requires query")
		}
		query := args[0]
		notes := s.storage.SearchNotes(query)
		return notes, nil
	case "stats":
		stats := s.storage.GetStats()
		return stats, nil
	case "tag":
		if len(args) < 3 {
			return nil, fmt.Errorf("tag requires operation, note ID, and tag")
		}
		operation := args[0]
		id, err := strconv.Atoi(args[1])
		if err != nil {
			return nil, fmt.Errorf("invalid note ID")
		}
		tag := args[2]

		var note *note.Note
		switch operation {
		case "add":
			note, err = s.storage.AddTag(id, tag)
		case "remove":
			note, err = s.storage.RemoveTag(id, tag)
		default:
			return nil, fmt.Errorf("invalid operation: %s", operation)
		}
		if err != nil {
			return nil, err
		}
		return note, nil
	default:
		return nil, fmt.Errorf("unknown command: %s", command)
	}
}

func (s *Server) cliConsoleHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only inject for HTML files
		if r.URL.Path == "/" || r.URL.Path == "/index.html" {
			// Read the original file
			file, err := os.Open("../frontend/build/index.html")
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}
			defer file.Close()

			content, err := os.ReadFile("../frontend/build/index.html")
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}

			// Inject CLI console JavaScript
			cliScript := `
<script>
// GoNotes CLI Console
window.gonotes = {
    async execute(command, ...args) {
        try {
            const response = await fetch('/api/cli/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command, args })
            });
            const result = await response.json();
            if (result.error) {
                console.error('Error:', result.error);
                return result.error;
            }
            console.log('Result:', result.result);
            return result.result;
        } catch (error) {
            console.error('CLI Error:', error);
            return error.message;
        }
    },
    
    async list() {
        return await this.execute('list');
    },
    
    async create(title, content, ...tags) {
        return await this.execute('create', title, content, ...tags);
    },
    
    async view(id) {
        return await this.execute('view', id.toString());
    },
    
    async delete(id) {
        return await this.execute('delete', id.toString());
    },
    
    async search(query) {
        return await this.execute('search', query);
    },
    
    async stats() {
        return await this.execute('stats');
    },
    
    async tag(operation, id, tag) {
        return await this.execute('tag', operation, id.toString(), tag);
    },
    
    async help() {
        try {
            const response = await fetch('/api/cli/help');
            const help = await response.json();
            console.log('GoNotes CLI Help:');
            console.log('Commands:', help.commands);
            console.log('Examples:', help.examples);
            return help;
        } catch (error) {
            console.error('Help Error:', error);
            return error.message;
        }
    }
};

console.log('GoNotes CLI Console loaded! Use gonotes.help() for available commands.');
console.log('Examples:');
console.log('  gonotes.list()');
console.log('  gonotes.create("My Note", "Note content", "tag1", "tag2")');
console.log('  gonotes.view(1)');
console.log('  gonotes.search("important")');
</script>
`

			// Insert the script before the closing body tag
			htmlContent := string(content)
			insertPos := strings.Index(htmlContent, "</body>")
			if insertPos != -1 {
				htmlContent = htmlContent[:insertPos] + cliScript + htmlContent[insertPos:]
			}

			w.Header().Set("Content-Type", "text/html")
			w.Write([]byte(htmlContent))
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *Server) sendJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func (s *Server) sendError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{Error: message})
}

func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *Server) Start(port string) error {
	log.Printf("Server starting on port %s", port)
	return http.ListenAndServe(":"+port, s.router)
}
