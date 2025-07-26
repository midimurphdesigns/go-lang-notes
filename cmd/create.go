package cmd

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"
)

var createCmd = &cobra.Command{
	Use:   "create [title] [content]",
	Short: "Create a new note",
	Long: `Create a new note with the specified title and content.
	
Examples:
  gonotes create "My First Note" "This is the content of my note"
  gonotes create "Go Slices" "Slices are dynamic arrays in Go" --tags "go,data-structures,slices"`,
	Args: cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		title := args[0]
		content := args[1]

		// Get tags from flag
		tagsFlag, _ := cmd.Flags().GetString("tags")
		var tags []string
		if tagsFlag != "" {
			tags = strings.Split(tagsFlag, ",")
			// Clean up tags
			for i, tag := range tags {
				tags[i] = strings.TrimSpace(tag)
			}
		}

		// Create the note
		newNote, err := storage.CreateNote(title, content, tags)
		if err != nil {
			return fmt.Errorf("failed to create note: %w", err)
		}

		fmt.Printf("✅ Note created successfully!\n")
		fmt.Printf("ID: %d\n", newNote.ID)
		fmt.Printf("Title: %s\n", newNote.Title)
		fmt.Printf("Content: %s\n", newNote.Content)
		if len(newNote.Tags) > 0 {
			fmt.Printf("Tags: %s\n", strings.Join(newNote.Tags, ", "))
		}
		fmt.Printf("Created: %s\n", newNote.CreatedAt.Format("2006-01-02 15:04:05"))

		return nil
	},
}

func init() {
	createCmd.Flags().StringP("tags", "t", "", "Comma-separated list of tags")
	rootCmd.AddCommand(createCmd)
}
