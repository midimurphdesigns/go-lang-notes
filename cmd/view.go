package cmd

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/fatih/color"
	"github.com/midimurphdesigns/go-lang-notes/internal/note"
	"github.com/spf13/cobra"
)

var viewCmd = &cobra.Command{
	Use:   "view [id]",
	Short: "View a specific note",
	Long: `View a specific note by its ID.
	
Examples:
  gonotes view 1
  gonotes view 5`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		id, err := strconv.Atoi(args[0])
		if err != nil {
			return fmt.Errorf("invalid note ID: %s", args[0])
		}

		note, err := storage.GetNote(id)
		if err != nil {
			return fmt.Errorf("failed to get note: %w", err)
		}

		printNoteDetail(note)
		return nil
	},
}

func printNoteDetail(note *note.Note) {
	// Header
	color.Cyan("📝 Note Details")
	color.Cyan("=" + strings.Repeat("=", 50))

	// Status indicators
	status := ""
	if note.IsArchived {
		status += "📦 Archived "
	}
	if note.IsFavorite {
		status += "⭐ Favorite "
	}
	if status != "" {
		color.Yellow("Status: %s\n", status)
	}

	// Title
	color.New(color.Bold).Printf("Title: %s\n", note.Title)

	// Content
	color.White("\nContent:\n")
	color.White(strings.Repeat("-", 50) + "\n")
	color.White("%s\n", note.Content)
	color.White(strings.Repeat("-", 50) + "\n")

	// Tags
	if len(note.Tags) > 0 {
		tagStr := strings.Join(note.Tags, ", ")
		color.Green("Tags: %s\n", tagStr)
	}

	// Timestamps
	color.New(color.FgHiBlack).Printf("Created: %s\n", note.CreatedAt.Format("2006-01-02 15:04:05"))
	color.New(color.FgHiBlack).Printf("Updated: %s\n", note.UpdatedAt.Format("2006-01-02 15:04:05"))

	fmt.Println()
}

func init() {
	rootCmd.AddCommand(viewCmd)
}
