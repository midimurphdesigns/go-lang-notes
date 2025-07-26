package cmd

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

var tagCmd = &cobra.Command{
	Use:   "tag [id] [tags]",
	Short: "Manage tags on a note",
	Long: `Add or remove tags from a note.
	
Examples:
  gonotes tag 1 "go,practice,learning"    # Add tags to note
  gonotes tag 1 --remove "practice"       # Remove specific tag
  gonotes tag --list                      # List all tags`,
	Args: cobra.MinimumNArgs(0),
	RunE: func(cmd *cobra.Command, args []string) error {
		list, _ := cmd.Flags().GetBool("list")
		remove, _ := cmd.Flags().GetString("remove")

		if list {
			return listAllTags()
		}

		if len(args) < 2 {
			return fmt.Errorf("tag command requires note ID and tags")
		}

		id, err := strconv.Atoi(args[0])
		if err != nil {
			return fmt.Errorf("invalid note ID: %s", args[0])
		}

		if remove != "" {
			return removeTag(id, remove)
		}

		return addTags(id, args[1])
	},
}

func addTags(id int, tagsStr string) error {
	tags := strings.Split(tagsStr, ",")

	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			continue
		}

		note, err := storage.AddTag(id, tag)
		if err != nil {
			return fmt.Errorf("failed to add tag '%s': %w", tag, err)
		}

		color.Green("✅ Added tag '%s' to note '%s'", tag, note.Title)
	}

	return nil
}

func removeTag(id int, tag string) error {
	note, err := storage.RemoveTag(id, tag)
	if err != nil {
		return fmt.Errorf("failed to remove tag '%s': %w", tag, err)
	}

	color.Green("✅ Removed tag '%s' from note '%s'", tag, note.Title)
	return nil
}

func listAllTags() error {
	tags := storage.GetAllTags()

	if len(tags) == 0 {
		fmt.Println("📝 No tags found.")
		return nil
	}

	color.Cyan("📝 All tags (%d found):\n", len(tags))
	for _, tag := range tags {
		notes := storage.GetNotesByTag(tag)
		color.Green("  %s (%d notes)", tag, len(notes))
	}

	return nil
}

func init() {
	tagCmd.Flags().BoolP("list", "l", false, "List all tags")
	tagCmd.Flags().StringP("remove", "r", "", "Remove specific tag")
	rootCmd.AddCommand(tagCmd)
}
