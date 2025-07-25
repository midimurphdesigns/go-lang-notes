# Go Notes - Note Taking Practice App

A simple and efficient note-taking application built with Go, designed to help you practice and learn Go programming concepts while organizing your thoughts and ideas.

## 🚀 Features

- **Simple Note Management**: Create, read, update, and delete notes
- **File-based Storage**: Notes are stored as plain text files for easy backup and version control
- **Search Functionality**: Find notes by title or content
- **Tagging System**: Organize notes with tags for better categorization
- **Command Line Interface**: Clean and intuitive CLI for all operations
- **Cross-platform**: Works on Windows, macOS, and Linux

## 📋 Prerequisites

- Go 1.21 or higher
- Git (for cloning the repository)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/midimurphdesigns/go-lang-notes.git
   cd go-lang-notes
   ```

2. **Build the application**

   ```bash
   go build -o gonotes main.go
   ```

3. **Run the application**
   ```bash
   ./gonotes
   ```

## 📖 Usage

### Basic Commands

```bash
# Create a new note
gonotes create "My First Note" "This is the content of my note"

# List all notes
gonotes list

# View a specific note
gonotes view "My First Note"

# Edit a note
gonotes edit "My First Note"

# Delete a note
gonotes delete "My First Note"

# Search notes
gonotes search "keyword"

# Add tags to a note
gonotes tag "My First Note" "go,practice,learning"
```

### Examples

```bash
# Create a note about Go slices
gonotes create "Go Slices" "Slices are dynamic arrays in Go. They are more flexible than arrays and can grow or shrink as needed."

# Add tags
gonotes tag "Go Slices" "go,data-structures,slices"

# Search for slice-related notes
gonotes search "slice"
```

## 📁 Project Structure

```
go-lang-notes/
├── main.go              # Main application entry point
├── cmd/                 # Command implementations
│   ├── create.go
│   ├── list.go
│   ├── view.go
│   ├── edit.go
│   ├── delete.go
│   ├── search.go
│   └── tag.go
├── internal/            # Internal packages
│   ├── note/           # Note management
│   │   ├── note.go
│   │   └── storage.go
│   └── utils/          # Utility functions
│       └── file.go
├── notes/              # Default notes storage directory
├── go.mod              # Go module file
├── go.sum              # Go module checksums
└── README.md           # This file
```

## 🧪 Development

### Setting up the development environment

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/yourusername/go-lang-notes.git
   cd go-lang-notes
   ```

2. **Initialize Go module**

   ```bash
   go mod init github.com/yourusername/go-lang-notes
   ```

3. **Install dependencies**
   ```bash
   go mod tidy
   ```

### Running tests

```bash
go test ./...
```

### Building for different platforms

```bash
# Windows
GOOS=windows GOARCH=amd64 go build -o gonotes.exe main.go

# macOS
GOOS=darwin GOARCH=amd64 go build -o gonotes main.go

# Linux
GOOS=linux GOARCH=amd64 go build -o gonotes main.go
```

## 🎯 Learning Objectives

This project is designed to help you practice and learn:

- **Go Fundamentals**: Variables, functions, structs, interfaces
- **File I/O**: Reading and writing files
- **Command Line Applications**: Building CLI tools with flags and arguments
- **Error Handling**: Proper Go error handling patterns
- **Package Management**: Organizing code into packages
- **Testing**: Writing unit tests for Go code
- **Data Structures**: Working with slices, maps, and structs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for a simple note-taking tool while learning Go
- Built with Go's standard library for maximum learning value
- Designed to be simple yet functional

## 📞 Support

If you have any questions or need help with the application, please:

1. Check the [Issues](https://github.com/yourusername/go-lang-notes/issues) page
2. Create a new issue if your problem isn't already addressed
3. Feel free to contribute improvements!

---

**Happy coding and note-taking! 📝✨**
