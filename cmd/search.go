package cmd

import (
	"fmt"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

var searchCmd = &cobra.Command{
	Use:   "search [query]",
	Short: "Search notes",
	Long: `Search notes by title, content, or tags.
	
Examples:
  gonotes search "go slices"
  gonotes search "data structures"
  gonotes search "practice"`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		query := args[0]

		results := storage.SearchNotes(query)

		if len(results) == 0 {
			fmt.Printf("🔍 No notes found matching '%s'\n", query)
			return nil
		}

		color.Cyan("🔍 Search results for '%s' (%d found):\n", query, len(results))

		for _, note := range results {
			printNoteSummary(note)
		}

		return nil
	},
}

func init() {
	rootCmd.AddCommand(searchCmd)
}
