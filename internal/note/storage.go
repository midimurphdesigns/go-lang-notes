package note

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// Storage represents the note storage system
type Storage struct {
	notesDir string
	notes    map[int]*Note
	nextID   int
}

// NewStorage creates a new storage instance
func NewStorage(notesDir string) (*Storage, error) {
	if notesDir == "" {
		notesDir = "notes"
	}

	storage := &Storage{
		notesDir: notesDir,
		notes:    make(map[int]*Note),
		nextID:   1,
	}

	// Create notes directory if it doesn't exist
	if err := os.MkdirAll(notesDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create notes directory: %w", err)
	}

	// Load existing notes
	if err := storage.loadNotes(); err != nil {
		return nil, fmt.Errorf("failed to load notes: %w", err)
	}

	return storage, nil
}

// CreateNote creates a new note and saves it
func (s *Storage) CreateNote(title, content string, tags []string) (*Note, error) {
	note := NewNote(title, content, tags)
	note.ID = s.nextID
	s.nextID++

	if err := note.Validate(); err != nil {
		return nil, err
	}

	s.notes[note.ID] = note

	if err := s.saveNote(note); err != nil {
		delete(s.notes, note.ID)
		s.nextID--
		return nil, err
	}

	return note, nil
}

// GetNote retrieves a note by ID
func (s *Storage) GetNote(id int) (*Note, error) {
	note, exists := s.notes[id]
	if !exists {
		return nil, fmt.Errorf("note with ID %d not found", id)
	}
	return note, nil
}

// GetAllNotes returns all notes
func (s *Storage) GetAllNotes() []*Note {
	notes := make([]*Note, 0, len(s.notes))
	for _, note := range s.notes {
		notes = append(notes, note)
	}

	// Sort by creation date (newest first)
	sort.Slice(notes, func(i, j int) bool {
		return notes[i].CreatedAt.After(notes[j].CreatedAt)
	})

	return notes
}

// GetActiveNotes returns only non-archived notes
func (s *Storage) GetActiveNotes() []*Note {
	var activeNotes []*Note
	for _, note := range s.notes {
		if !note.IsArchived {
			activeNotes = append(activeNotes, note)
		}
	}

	// Sort by creation date (newest first)
	sort.Slice(activeNotes, func(i, j int) bool {
		return activeNotes[i].CreatedAt.After(activeNotes[j].CreatedAt)
	})

	return activeNotes
}

// GetFavoriteNotes returns only favorite notes
func (s *Storage) GetFavoriteNotes() []*Note {
	var favoriteNotes []*Note
	for _, note := range s.notes {
		if note.IsFavorite {
			favoriteNotes = append(favoriteNotes, note)
		}
	}

	// Sort by creation date (newest first)
	sort.Slice(favoriteNotes, func(i, j int) bool {
		return favoriteNotes[i].CreatedAt.After(favoriteNotes[j].CreatedAt)
	})

	return favoriteNotes
}

// SearchNotes searches notes by query
func (s *Storage) SearchNotes(query string) []*Note {
	if query == "" {
		return s.GetActiveNotes()
	}

	var results []*Note
	query = strings.ToLower(strings.TrimSpace(query))

	for _, note := range s.notes {
		if note.IsArchived {
			continue
		}

		score := note.SearchScore(query)
		if score > 0 {
			results = append(results, note)
		}
	}

	// Sort by search score (highest first)
	sort.Slice(results, func(i, j int) bool {
		return results[i].SearchScore(query) > results[j].SearchScore(query)
	})

	return results
}

// GetNotesByTag returns notes that have a specific tag
func (s *Storage) GetNotesByTag(tag string) []*Note {
	var taggedNotes []*Note
	tag = strings.ToLower(strings.TrimSpace(tag))

	for _, note := range s.notes {
		if note.IsArchived {
			continue
		}

		if note.HasTag(tag) {
			taggedNotes = append(taggedNotes, note)
		}
	}

	// Sort by creation date (newest first)
	sort.Slice(taggedNotes, func(i, j int) bool {
		return taggedNotes[i].CreatedAt.After(taggedNotes[j].CreatedAt)
	})

	return taggedNotes
}

// GetAllTags returns all unique tags used across notes
func (s *Storage) GetAllTags() []string {
	tagSet := make(map[string]bool)

	for _, note := range s.notes {
		if note.IsArchived {
			continue
		}

		for _, tag := range note.Tags {
			tagSet[tag] = true
		}
	}

	var tags []string
	for tag := range tagSet {
		tags = append(tags, tag)
	}

	sort.Strings(tags)
	return tags
}

// UpdateNote updates an existing note
func (s *Storage) UpdateNote(id int, title, content string, tags []string) (*Note, error) {
	note, exists := s.notes[id]
	if !exists {
		return nil, fmt.Errorf("note with ID %d not found", id)
	}

	note.UpdateTitle(title)
	note.UpdateContent(content)
	note.Tags = tags
	note.UpdatedAt = time.Now()

	if err := note.Validate(); err != nil {
		return nil, err
	}

	if err := s.saveNote(note); err != nil {
		return nil, err
	}

	return note, nil
}

// DeleteNote removes a note
func (s *Storage) DeleteNote(id int) error {
	_, exists := s.notes[id]
	if !exists {
		return fmt.Errorf("note with ID %d not found", id)
	}

	// Remove from disk
	filename := filepath.Join(s.notesDir, fmt.Sprintf("%d.json", id))

	// Remove from memory
	delete(s.notes, id)

	return os.Remove(filename)
}

// ToggleFavorite toggles the favorite status of a note
func (s *Storage) ToggleFavorite(id int) (*Note, error) {
	note, exists := s.notes[id]
	if !exists {
		return nil, fmt.Errorf("note with ID %d not found", id)
	}

	note.ToggleFavorite()

	if err := s.saveNote(note); err != nil {
		return nil, err
	}

	return note, nil
}

// ArchiveNote archives or unarchives a note
func (s *Storage) ArchiveNote(id int) (*Note, error) {
	note, exists := s.notes[id]
	if !exists {
		return nil, fmt.Errorf("note with ID %d not found", id)
	}

	note.Archive()

	if err := s.saveNote(note); err != nil {
		return nil, err
	}

	return note, nil
}

// AddTag adds a tag to a note
func (s *Storage) AddTag(id int, tag string) (*Note, error) {
	note, exists := s.notes[id]
	if !exists {
		return nil, fmt.Errorf("note with ID %d not found", id)
	}

	note.AddTag(tag)
	note.UpdatedAt = time.Now()

	if err := s.saveNote(note); err != nil {
		return nil, err
	}

	return note, nil
}

// RemoveTag removes a tag from a note
func (s *Storage) RemoveTag(id int, tag string) (*Note, error) {
	note, exists := s.notes[id]
	if !exists {
		return nil, fmt.Errorf("note with ID %d not found", id)
	}

	note.RemoveTag(tag)
	note.UpdatedAt = time.Now()

	if err := s.saveNote(note); err != nil {
		return nil, err
	}

	return note, nil
}

// saveNote saves a single note to disk
func (s *Storage) saveNote(note *Note) error {
	data, err := json.MarshalIndent(note, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal note: %w", err)
	}

	filename := filepath.Join(s.notesDir, fmt.Sprintf("%d.json", note.ID))
	if err := os.WriteFile(filename, data, 0644); err != nil {
		return fmt.Errorf("failed to write note file: %w", err)
	}

	return nil
}

// loadNotes loads all notes from disk
func (s *Storage) loadNotes() error {
	entries, err := os.ReadDir(s.notesDir)
	if err != nil {
		return fmt.Errorf("failed to read notes directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}

		if err := s.loadNoteFromFile(entry); err != nil {
			// Log error but continue loading other notes
			fmt.Printf("Warning: failed to load note %s: %v\n", entry.Name(), err)
		}
	}

	return nil
}

// loadNoteFromFile loads a single note from a file
func (s *Storage) loadNoteFromFile(entry fs.DirEntry) error {
	filename := filepath.Join(s.notesDir, entry.Name())
	data, err := os.ReadFile(filename)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	var note Note
	if err := json.Unmarshal(data, &note); err != nil {
		return fmt.Errorf("failed to unmarshal note: %w", err)
	}

	s.notes[note.ID] = &note

	// Update nextID if this note has a higher ID
	if note.ID >= s.nextID {
		s.nextID = note.ID + 1
	}

	return nil
}

// GetStats returns statistics about the notes
func (s *Storage) GetStats() map[string]int {
	stats := map[string]int{
		"total":     len(s.notes),
		"active":    0,
		"archived":  0,
		"favorites": 0,
		"tags":      len(s.GetAllTags()),
	}

	for _, note := range s.notes {
		if note.IsArchived {
			stats["archived"]++
		} else {
			stats["active"]++
		}

		if note.IsFavorite {
			stats["favorites"]++
		}
	}

	return stats
}
