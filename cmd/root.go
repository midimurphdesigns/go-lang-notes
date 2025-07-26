package cmd

import (
	"fmt"
	"os"

	"github.com/midimurphdesigns/go-lang-notes/internal/note"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	cfgFile  string
	notesDir string
	storage  *note.Storage
)

var rootCmd = &cobra.Command{
	Use:   "gonotes",
	Short: "A simple and efficient note-taking application",
	Long: `GoNotes is a command-line note-taking application built with Go.
	
It allows you to create, read, update, delete, and search notes with a simple and intuitive interface.
Notes are stored as JSON files for easy backup and version control.`,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		// Initialize storage
		var err error
		storage, err = note.NewStorage(notesDir)
		if err != nil {
			return fmt.Errorf("failed to initialize storage: %w", err)
		}
		return nil
	},
}

// Execute adds all child commands to the root command and sets flags appropriately.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	cobra.OnInitialize(initConfig)

	// Global flags
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.gonotes.yaml)")
	rootCmd.PersistentFlags().StringVar(&notesDir, "notes-dir", "notes", "directory to store notes")

	// Local flags
	rootCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" {
		// Use config file from the flag.
		viper.SetConfigFile(cfgFile)
	} else {
		// Find home directory.
		home, err := os.UserHomeDir()
		cobra.CheckErr(err)

		// Search config in home directory with name ".gonotes" (without extension).
		viper.AddConfigPath(home)
		viper.SetConfigType("yaml")
		viper.SetConfigName(".gonotes")
	}

	viper.AutomaticEnv() // read in environment variables that match

	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err == nil {
		fmt.Fprintln(os.Stderr, "Using config file:", viper.ConfigFileUsed())
	}
}
