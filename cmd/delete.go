package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

var deleteCmd = &cobra.Command{
	Use:   "delete [id]",
	Short: "Delete a note",
	Long: `Delete a note by its ID.
	
Examples:
  gonotes delete 1
  gonotes delete 5 --force`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		id, err := strconv.Atoi(args[0])
		if err != nil {
			return fmt.Errorf("invalid note ID: %s", args[0])
		}

		// Get the note first to show what will be deleted
		note, err := storage.GetNote(id)
		if err != nil {
			return fmt.Errorf("failed to get note: %w", err)
		}

		force, _ := cmd.Flags().GetBool("force")

		if !force {
			color.Yellow("🗑️  About to delete note:")
			printNoteSummary(note)

			fmt.Print("Are you sure? (y/N): ")
			reader := bufio.NewReader(os.Stdin)
			response, err := reader.ReadString('\n')
			if err != nil {
				return fmt.Errorf("failed to read input: %w", err)
			}

			response = strings.ToLower(strings.TrimSpace(response))
			if response != "y" && response != "yes" {
				color.Green("✅ Deletion cancelled.")
				return nil
			}
		}

		// Delete the note
		if err := storage.DeleteNote(id); err != nil {
			return fmt.Errorf("failed to delete note: %w", err)
		}

		color.Green("✅ Note '%s' (ID: %d) deleted successfully.", note.Title, id)
		return nil
	},
}

func init() {
	deleteCmd.Flags().BoolP("force", "f", false, "Force deletion without confirmation")
	rootCmd.AddCommand(deleteCmd)
}
