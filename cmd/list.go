package cmd

import (
	"fmt"
	"strings"

	"github.com/fatih/color"
	"github.com/midimurphdesigns/go-lang-notes/internal/note"
	"github.com/spf13/cobra"
)

var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List all notes",
	Long: `List all notes with various filtering options.
	
Examples:
  gonotes list                    # List all active notes
  gonotes list --all             # List all notes including archived
  gonotes list --favorites       # List only favorite notes
  gonotes list --tag "go"        # List notes with specific tag`,
	RunE: func(cmd *cobra.Command, args []string) error {
		all, _ := cmd.Flags().GetBool("all")
		favorites, _ := cmd.Flags().GetBool("favorites")
		tag, _ := cmd.Flags().GetString("tag")

		var notes []*note.Note

		switch {
		case favorites:
			notes = storage.GetFavoriteNotes()
		case tag != "":
			notes = storage.GetNotesByTag(tag)
		case all:
			notes = storage.GetAllNotes()
		default:
			notes = storage.GetActiveNotes()
		}

		if len(notes) == 0 {
			fmt.Println("📝 No notes found.")
			return nil
		}

		// Print header
		color.Cyan("📝 Notes (%d found):\n", len(notes))

		for _, note := range notes {
			printNoteSummary(note)
		}

		return nil
	},
}

func printNoteSummary(note *note.Note) {
	// Status indicators
	status := ""
	if note.IsArchived {
		status += "📦 "
	}
	if note.IsFavorite {
		status += "⭐ "
	}

	// Title with color
	titleColor := color.New(color.Bold)
	if note.IsFavorite {
		titleColor = color.New(color.Bold, color.FgYellow)
	}

	// Print note info
	fmt.Printf("%s[%d] ", status, note.ID)
	titleColor.Printf("%s\n", note.Title)

	// Content preview
	content := note.Summary(80)
	if content != note.Content {
		content += "..."
	}
	color.White("   %s\n", content)

	// Tags
	if len(note.Tags) > 0 {
		tagStr := strings.Join(note.Tags, ", ")
		color.Green("   Tags: %s\n", tagStr)
	}

	// Timestamps
	color.New(color.FgHiBlack).Printf("   Created: %s | Updated: %s\n",
		note.CreatedAt.Format("2006-01-02 15:04"),
		note.UpdatedAt.Format("2006-01-02 15:04"))

	fmt.Println()
}

func init() {
	listCmd.Flags().BoolP("all", "a", false, "Show all notes including archived")
	listCmd.Flags().BoolP("favorites", "f", false, "Show only favorite notes")
	listCmd.Flags().StringP("tag", "t", "", "Show notes with specific tag")
	rootCmd.AddCommand(listCmd)
}
