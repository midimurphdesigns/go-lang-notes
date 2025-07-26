package note

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// Note represents a single note in the application
type Note struct {
	ID         int       `json:"id"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	Tags       []string  `json:"tags"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	IsArchived bool      `json:"is_archived"`
	IsFavorite bool      `json:"is_favorite"`
}

// NewNote creates a new note with default values
func NewNote(title, content string, tags []string) *Note {
	now := time.Now()
	return &Note{
		Title:     strings.TrimSpace(title),
		Content:   strings.TrimSpace(content),
		Tags:      tags,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// Validate checks if the note has valid data
func (n *Note) Validate() error {
	if strings.TrimSpace(n.Title) == "" {
		return fmt.Errorf("note title cannot be empty")
	}
	if strings.TrimSpace(n.Content) == "" {
		return fmt.Errorf("note content cannot be empty")
	}
	return nil
}

// AddTag adds a tag to the note if it doesn't already exist
func (n *Note) AddTag(tag string) {
	tag = strings.TrimSpace(strings.ToLower(tag))
	if tag == "" {
		return
	}

	for _, existingTag := range n.Tags {
		if existingTag == tag {
			return
		}
	}
	n.Tags = append(n.Tags, tag)
}

// RemoveTag removes a tag from the note
func (n *Note) RemoveTag(tag string) {
	tag = strings.TrimSpace(strings.ToLower(tag))
	for i, existingTag := range n.Tags {
		if existingTag == tag {
			n.Tags = append(n.Tags[:i], n.Tags[i+1:]...)
			return
		}
	}
}

// HasTag checks if the note has a specific tag
func (n *Note) HasTag(tag string) bool {
	tag = strings.TrimSpace(strings.ToLower(tag))
	for _, existingTag := range n.Tags {
		if existingTag == tag {
			return true
		}
	}
	return false
}

// UpdateContent updates the note content and sets the updated timestamp
func (n *Note) UpdateContent(content string) {
	n.Content = strings.TrimSpace(content)
	n.UpdatedAt = time.Now()
}

// UpdateTitle updates the note title and sets the updated timestamp
func (n *Note) UpdateTitle(title string) {
	n.Title = strings.TrimSpace(title)
	n.UpdatedAt = time.Now()
}

// ToggleFavorite toggles the favorite status of the note
func (n *Note) ToggleFavorite() {
	n.IsFavorite = !n.IsFavorite
	n.UpdatedAt = time.Now()
}

// Archive archives or unarchives the note
func (n *Note) Archive() {
	n.IsArchived = !n.IsArchived
	n.UpdatedAt = time.Now()
}

// ToJSON converts the note to JSON string
func (n *Note) ToJSON() (string, error) {
	data, err := json.MarshalIndent(n, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// Summary returns a short summary of the note content
func (n *Note) Summary(maxLength int) string {
	if len(n.Content) <= maxLength {
		return n.Content
	}
	return n.Content[:maxLength] + "..."
}

// SearchScore calculates a relevance score for search queries
func (n *Note) SearchScore(query string) int {
	query = strings.ToLower(query)
	score := 0

	// Title matches get highest score
	if strings.Contains(strings.ToLower(n.Title), query) {
		score += 10
	}

	// Content matches
	if strings.Contains(strings.ToLower(n.Content), query) {
		score += 5
	}

	// Tag matches
	for _, tag := range n.Tags {
		if strings.Contains(strings.ToLower(tag), query) {
			score += 3
		}
	}

	return score
}
