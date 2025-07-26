package cmd

import (
	"fmt"
	"strings"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

var statsCmd = &cobra.Command{
	Use:   "stats",
	Short: "Show note statistics",
	Long: `Display statistics about your notes.
	
Examples:
  gonotes stats`,
	RunE: func(cmd *cobra.Command, args []string) error {
		stats := storage.GetStats()

		color.Cyan("📊 Note Statistics")
		color.Cyan("=" + strings.Repeat("=", 30))

		color.White("Total Notes: %d", stats["total"])
		color.Green("Active Notes: %d", stats["active"])
		color.Yellow("Archived Notes: %d", stats["archived"])
		color.Magenta("Favorite Notes: %d", stats["favorites"])
		color.Blue("Unique Tags: %d", stats["tags"])

		if stats["total"] > 0 {
			activePercent := float64(stats["active"]) / float64(stats["total"]) * 100
			favoritePercent := float64(stats["favorites"]) / float64(stats["total"]) * 100

			fmt.Printf("\n")
			color.New(color.FgHiBlack).Printf("Active Rate: %.1f%%\n", activePercent)
			color.New(color.FgHiBlack).Printf("Favorite Rate: %.1f%%\n", favoritePercent)
		}

		fmt.Println()
		return nil
	},
}

func init() {
	rootCmd.AddCommand(statsCmd)
}
