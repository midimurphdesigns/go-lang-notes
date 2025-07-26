import React, { useState, useEffect } from "react";
import "./App.css";
import SplashScreen from "./SplashScreen";
import ToastManager, { ToastMessage } from "./ToastManager";

interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface CreateNoteRequest {
  title: string;
  content: string;
  tags: string[];
}

type Page = "notes" | "cli" | "dev-console";

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNote, setNewNote] = useState<CreateNoteRequest>({
    title: "",
    content: "",
    tags: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [cliCommand, setCliCommand] = useState("");
  const [cliOutput, setCliOutput] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>("notes");

  // Interactive effects state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Splash screen and toast state
  const [showSplash, setShowSplash] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const API_BASE = "http://localhost:8080/api";

  // Toast functions
  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString();
    const toastWithDefaults = {
      duration: 5000, // Default 5 seconds
      ...toast,
      id,
    };
    setToasts((prev) => [...prev, toastWithDefaults]);
  };

  const setErrorWithTimeout = (
    errorMessage: string,
    duration: number = 5000
  ) => {
    // Clear any existing timeout
    if (errorTimeout) {
      clearTimeout(errorTimeout);
    }

    // Set the error
    setError(errorMessage);

    // Set up new timeout
    const timeout = setTimeout(() => {
      setError(null);
      setErrorTimeout(null);
    }, duration);

    setErrorTimeout(timeout);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    // Add mouse tracking for interactive effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    // Add particle interaction
    const handleParticleInteraction = () => {
      const particles = document.querySelectorAll(".particle");
      particles.forEach((particle, index) => {
        const rect = particle.getBoundingClientRect();
        const distance = Math.sqrt(
          Math.pow(mousePosition.x - (rect.left + rect.width / 2), 2) +
            Math.pow(mousePosition.y - (rect.top + rect.height / 2), 2)
        );

        if (distance < 100) {
          (particle as HTMLElement).style.transform = `scale(1.5) rotate(${
            index * 45
          }deg)`;
          (particle as HTMLElement).style.filter = "brightness(1.5)";
        } else {
          (particle as HTMLElement).style.transform = "";
          (particle as HTMLElement).style.filter = "";
        }
      });
    };

    // Add glow orb tracking
    const handleGlowOrbTracking = () => {
      const orbs = document.querySelectorAll(".glow-orb");
      orbs.forEach((orb, index) => {
        const rect = orb.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (mousePosition.x - centerX) * 0.1;
        const deltaY = (mousePosition.y - centerY) * 0.1;

        (
          orb as HTMLElement
        ).style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      });
    };

    // Add note card parallax effect
    const handleNoteCardParallax = () => {
      const cards = document.querySelectorAll(".note-card");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (mousePosition.x - centerX) * 0.02;
        const deltaY = (mousePosition.y - centerY) * 0.02;

        (
          card as HTMLElement
        ).style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Set up animation loops
    const particleInterval = setInterval(handleParticleInteraction, 50);
    const orbInterval = setInterval(handleGlowOrbTracking, 16);
    const cardInterval = setInterval(handleNoteCardParallax, 16);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(particleInterval);
      clearInterval(orbInterval);
      clearInterval(cardInterval);

      // Clear error timeout on cleanup
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [mousePosition]);

  const fetchNotes = async (clearErrors = true) => {
    console.log(
      "fetchNotes called - clearErrors:",
      clearErrors,
      "isSearching:",
      isSearching
    );

    // Don't fetch all notes if we're currently searching
    if (isSearching && !clearErrors) {
      console.log("Skipping fetchNotes - currently in search mode");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/notes`);
      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }
      const data = await response.json();
      setNotes(data);
      if (clearErrors) {
        setError(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setErrorWithTimeout(errorMessage, 5000);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    try {
      const response = await fetch(`${API_BASE}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newNote),
      });

      if (!response.ok) {
        throw new Error("Failed to create note");
      }

      // Add success animation
      const form = document.querySelector(".create-form") as HTMLElement;
      if (form) {
        form.classList.add("success-animation");
        setTimeout(() => {
          form.classList.remove("success-animation");
        }, 600);
      }

      await fetchNotes();
      setNewNote({ title: "", content: "", tags: [] });
      setShowCreateForm(false);

      // Show success toast
      addToast({
        type: "success",
        title: "Note Created!",
        message: `"${newNote.title}" has been successfully created.`,
        duration: 4000,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create note";
      setErrorWithTimeout(errorMessage, 5000);

      // Show error toast
      addToast({
        type: "error",
        title: "Creation Failed",
        message: errorMessage,
        duration: 5000,
      });
    }
  };

  const deleteNote = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/notes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      await fetchNotes();

      // Show success toast
      addToast({
        type: "success",
        title: "Note Deleted!",
        message: "The note has been successfully removed.",
        duration: 3000,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete note";
      setErrorWithTimeout(errorMessage, 5000);

      // Show error toast
      addToast({
        type: "error",
        title: "Deletion Failed",
        message: errorMessage,
        duration: 5000,
      });
    }
  };

  const searchNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build search URL with parameters
      const searchParams = new URLSearchParams();

      if (searchQuery.trim()) {
        searchParams.append("q", searchQuery.trim());
        setIsSearching(true);
      } else {
        // If no search query, clear search state and fetch all notes
        setIsSearching(false);
        await fetchNotes();
        return;
      }

      // You can add search type parameter here if needed
      // searchParams.append('type', 'all'); // all, title, content, tags

      const searchUrl = `${API_BASE}/search?${searchParams.toString()}`;
      console.log("=== FRONTEND SEARCH DEBUG ===");
      console.log("API_BASE:", API_BASE);
      console.log("searchQuery:", searchQuery);
      console.log("searchParams:", searchParams.toString());
      console.log("Final Search URL:", searchUrl);
      console.log("=== END FRONTEND DEBUG ===");

      const response = await fetch(searchUrl);
      console.log("Search response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Search error response:", errorText);
        throw new Error(
          `Search failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Search results:", data);

      // Handle new response format with metadata
      if (data.results) {
        setNotes(data.results);
        console.log(
          `Found ${data.count} results out of ${data.total} total notes`
        );
        console.log("Search state: isSearching =", true);
      } else {
        // Fallback for old format
        setNotes(data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to search notes";
      console.log("Search error:", errorMessage);
      setErrorWithTimeout(errorMessage, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleTagInput = (value: string) => {
    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setNewNote((prev) => ({ ...prev, tags }));
  };

  const executeCLICommand = async (command: string) => {
    try {
      // Parse the command to extract the actual command and arguments
      const parts = command.trim().split(" ");
      let actualCommand = "";
      let args: string[] = [];

      if (parts[0] === "gonotes" && parts.length > 1) {
        actualCommand = parts[1];
        args = parts.slice(2);

        // Parse arguments for commands with flags
        if (actualCommand === "create") {
          const titleIndex = args.indexOf("--title");
          const contentIndex = args.indexOf("--content");
          const tagsIndex = args.indexOf("--tags");

          if (titleIndex !== -1 && contentIndex !== -1) {
            // Find the full quoted title by looking for the next flag or end of args
            let titleEndIndex = args.length;
            for (let i = titleIndex + 1; i < args.length; i++) {
              if (args[i].startsWith("--")) {
                titleEndIndex = i;
                break;
              }
            }
            const titleParts = args.slice(titleIndex + 1, titleEndIndex);
            const title = titleParts.join(" ").replace(/['"]/g, "");

            // Find the full quoted content by looking for the next flag or end of args
            let contentEndIndex = args.length;
            for (let i = contentIndex + 1; i < args.length; i++) {
              if (args[i].startsWith("--")) {
                contentEndIndex = i;
                break;
              }
            }
            const contentParts = args.slice(contentIndex + 1, contentEndIndex);
            const content = contentParts.join(" ").replace(/['"]/g, "");

            // Handle tags
            let tags: string[] = [];
            if (tagsIndex !== -1) {
              let tagsEndIndex = args.length;
              for (let i = tagsIndex + 1; i < args.length; i++) {
                if (args[i].startsWith("--")) {
                  tagsEndIndex = i;
                  break;
                }
              }
              const tagsParts = args.slice(tagsIndex + 1, tagsEndIndex);
              const tagsString = tagsParts.join(" ").replace(/['"]/g, "");
              tags = tagsString
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0);
            }

            // Ensure we have valid title and content
            if (title.trim() === "") {
              throw new Error("Create command requires a non-empty title");
            }
            if (content.trim() === "") {
              throw new Error("Create command requires non-empty content");
            }

            args = [title, content, ...tags];
          } else {
            throw new Error(
              "Create command requires --title and --content flags"
            );
          }
        } else if (actualCommand === "view" || actualCommand === "delete") {
          const idIndex = args.indexOf("--id");
          if (idIndex !== -1) {
            // Find the full quoted ID by looking for the next flag or end of args
            let idEndIndex = args.length;
            for (let i = idIndex + 1; i < args.length; i++) {
              if (args[i].startsWith("--")) {
                idEndIndex = i;
                break;
              }
            }
            const idParts = args.slice(idIndex + 1, idEndIndex);
            const id = idParts.join(" ").replace(/['"]/g, "");

            // Ensure we have a valid ID
            if (id.trim() === "" || isNaN(Number(id))) {
              throw new Error(
                `${actualCommand} command requires a valid numeric ID`
              );
            }

            args = [id];
          } else {
            throw new Error(`${actualCommand} command requires --id flag`);
          }
        } else if (actualCommand === "search") {
          const queryIndex = args.indexOf("--query");
          if (queryIndex !== -1) {
            // Find the full quoted query by looking for the next flag or end of args
            let queryEndIndex = args.length;
            for (let i = queryIndex + 1; i < args.length; i++) {
              if (args[i].startsWith("--")) {
                queryEndIndex = i;
                break;
              }
            }
            const queryParts = args.slice(queryIndex + 1, queryEndIndex);
            const query = queryParts.join(" ").replace(/['"]/g, "");

            // Ensure we have a valid query
            if (query.trim() === "") {
              throw new Error("Search query cannot be empty");
            }

            args = [query];
          } else {
            throw new Error("Search command requires --query flag");
          }
        } else if (actualCommand === "tag") {
          const idIndex = args.indexOf("--id");
          const tagIndex = args.indexOf("--tag");
          if (idIndex !== -1 && tagIndex !== -1) {
            const operation = args[0]; // add or remove

            // Find the full quoted ID
            let idEndIndex = args.length;
            for (let i = idIndex + 1; i < args.length; i++) {
              if (args[i].startsWith("--")) {
                idEndIndex = i;
                break;
              }
            }
            const idParts = args.slice(idIndex + 1, idEndIndex);
            const id = idParts.join(" ").replace(/['"]/g, "");

            // Find the full quoted tag
            let tagEndIndex = args.length;
            for (let i = tagIndex + 1; i < args.length; i++) {
              if (args[i].startsWith("--")) {
                tagEndIndex = i;
                break;
              }
            }
            const tagParts = args.slice(tagIndex + 1, tagEndIndex);
            const tag = tagParts.join(" ").replace(/['"]/g, "");

            args = [operation, id, tag];
          }
        }
      } else {
        // Fallback for old format
        actualCommand = parts[0];
        args = parts.slice(1);
      }

      // Debug logging
      console.log("CLI Command Debug:", {
        command: actualCommand,
        args,
        originalCommand: command,
      });

      const response = await fetch(`${API_BASE}/cli/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command: actualCommand, args }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const output = `PS C:\\GoNotes> ${command}\n${JSON.stringify(
        result.result,
        null,
        2
      )}`;
      setCliOutput((prev) => [...prev, output]);

      // Refresh notes if the command might have changed them
      if (
        ["list", "create", "delete", "search", "stats"].includes(actualCommand)
      ) {
        await fetchNotes();
      }

      // Only show toast for CRUD operations (create, update, delete)
      if (["create", "delete", "update"].includes(actualCommand)) {
        addToast({
          type: "success",
          title: "Note Modified",
          message: `Successfully ${actualCommand}d note via CLI`,
          duration: 3000,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const errorOutput = `PS C:\\GoNotes> ${command}\nError: ${errorMessage}`;
      setCliOutput((prev) => [...prev, errorOutput]);

      // Show error toast for all command errors
      addToast({
        type: "error",
        title: "CLI Command Failed",
        message: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleCLISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cliCommand.trim()) {
      const command = cliCommand.trim();
      setCliCommand("");

      // Add typing effect to CLI output
      const newOutput = `$ ${command}`;
      setCliOutput((prev) => [...prev, newOutput]);

      // Add typing animation delay
      setTimeout(() => {
        executeCLICommand(command);
      }, 500);
    }
  };

  const getCLIHelp = async () => {
    try {
      const response = await fetch(`${API_BASE}/cli/help`);
      const help = await response.json();
      const helpText = `Available Commands:\n${Object.entries(help.commands)
        .map(([cmd, desc]) => `  ${cmd}: ${desc}`)
        .join("\n")}\n\nExamples:\n${help.examples.join("\n")}`;
      setCliOutput((prev) => [...prev, helpText]);
    } catch (err) {
      setCliOutput((prev) => [
        ...prev,
        `Error getting help: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      ]);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({
        type: "success",
        title: "Copied!",
        message: "Command copied to clipboard",
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      addToast({
        type: "error",
        title: "Copy Failed",
        message: "Failed to copy to clipboard",
        duration: 3000,
      });
    }
  };

  const renderNotesPage = () => (
    <div className="page-content">
      {error && (
        <div className="error-message">
          Error: {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="controls">
        <div className="search-section">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search notes by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchNotes()}
              className="search-input"
            />
            <div className="search-buttons">
              <button
                onClick={searchNotes}
                className="search-button"
                disabled={!searchQuery.trim()}
              >
                🔍 {isSearching ? "Search Again" : "Search"}
              </button>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearching(false);
                    fetchNotes();
                  }}
                  className="clear-button"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
          {isSearching && searchQuery && (
            <div className="search-info">
              <small>Searching for: "{searchQuery}"</small>
            </div>
          )}
        </div>

        <button
          className="create-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Cancel" : "+ New Note"}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form">
          <h3>Create New Note</h3>
          <input
            type="text"
            placeholder="Title"
            value={newNote.title}
            onChange={(e) =>
              setNewNote((prev) => ({ ...prev, title: e.target.value }))
            }
          />
          <textarea
            placeholder="Content"
            value={newNote.content}
            onChange={(e) =>
              setNewNote((prev) => ({ ...prev, content: e.target.value }))
            }
          />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            onChange={(e) => handleTagInput(e.target.value)}
          />
          <button onClick={createNote} disabled={!newNote.title.trim()}>
            Create Note
          </button>
        </div>
      )}

      <div className="notes-grid">
        {notes.map((note) => (
          <div key={note.id} className="note-card" data-note-id={note.id}>
            <div className="note-header">
              <h3>{note.title}</h3>
              <button
                className="delete-button"
                onClick={() => deleteNote(note.id)}
                title="Delete note"
              >
                ✕
              </button>
            </div>
            <p className="note-content">{note.content}</p>
            {note.tags.length > 0 && (
              <div className="note-tags">
                {note.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="note-meta">
              <small>
                Created: {new Date(note.created_at).toLocaleDateString()}
              </small>
              {note.updated_at !== note.created_at && (
                <small>
                  Updated: {new Date(note.updated_at).toLocaleDateString()}
                </small>
              )}
            </div>
          </div>
        ))}
      </div>

      {notes.length === 0 && !loading && (
        <div className="empty-state">
          <p>
            {isSearching
              ? `No notes found matching "${searchQuery}". Try a different search term.`
              : "No notes found. Create your first note!"}
          </p>
        </div>
      )}
    </div>
  );

  const renderCLIPage = () => (
    <div className="page-content">
      <div className="cli-interface">
        <div className="cli-header">
          <h3>💻 GoNotes CLI Console</h3>
          <button onClick={getCLIHelp} className="help-button">
            Help
          </button>
          <button onClick={() => setCliOutput([])} className="clear-button">
            Clear
          </button>
        </div>
        <div className="cli-output">
          {cliOutput.map((output, index) => (
            <pre key={index} className="cli-line">
              {output}
            </pre>
          ))}
        </div>
        <form onSubmit={handleCLISubmit} className="cli-input-form">
          <div className="cli-prompt">
            <span className="prompt-symbol">PS</span>
            <span className="prompt-path">C:\GoNotes{">"}</span>
          </div>
          <input
            type="text"
            value={cliCommand}
            onChange={(e) => setCliCommand(e.target.value)}
            placeholder="gonotes list | gonotes create --title 'Title' --content 'Content' | gonotes search --query 'term'"
            className="cli-input"
          />
          <button type="submit" className="cli-submit">
            Execute
          </button>
        </form>
        <div className="cli-commands-section">
          <h4>📋 Available CLI Commands</h4>
          <div className="commands-grid">
            <div className="command-category">
              <h5>📝 Note Operations</h5>
              <div className="command-buttons">
                <button
                  className="command-btn"
                  onClick={() => setCliCommand("gonotes list")}
                  title="List all notes"
                >
                  <span className="command-icon">📋</span>
                  <span className="command-name">gonotes list</span>
                  <span className="command-desc">List all notes</span>
                </button>

                <button
                  className="command-btn"
                  onClick={() =>
                    setCliCommand(
                      "gonotes create --title 'New Note' --content 'Note content' --tags 'tag1,tag2'"
                    )
                  }
                  title="Create a new note with title, content, and optional tags"
                >
                  <span className="command-icon">➕</span>
                  <span className="command-name">gonotes create</span>
                  <span className="command-desc">Create new note</span>
                </button>

                <button
                  className="command-btn"
                  onClick={() => setCliCommand("gonotes view --id 1")}
                  title="View a specific note by ID"
                >
                  <span className="command-icon">👁️</span>
                  <span className="command-name">gonotes view</span>
                  <span className="command-desc">View note by ID</span>
                </button>

                <button
                  className="command-btn danger"
                  onClick={() => setCliCommand("gonotes delete --id 1")}
                  title="Delete a note by ID"
                >
                  <span className="command-icon">🗑️</span>
                  <span className="command-name">gonotes delete</span>
                  <span className="command-desc">Delete note by ID</span>
                </button>
              </div>
            </div>

            <div className="command-category">
              <h5>🔍 Search & Stats</h5>
              <div className="command-buttons">
                <button
                  className="command-btn"
                  onClick={() =>
                    setCliCommand("gonotes search --query 'important'")
                  }
                  title="Search notes by query"
                >
                  <span className="command-icon">🔍</span>
                  <span className="command-name">gonotes search</span>
                  <span className="command-desc">Search notes</span>
                </button>

                <button
                  className="command-btn"
                  onClick={() => setCliCommand("gonotes stats")}
                  title="Get note statistics"
                >
                  <span className="command-icon">📊</span>
                  <span className="command-name">gonotes stats</span>
                  <span className="command-desc">Get statistics</span>
                </button>
              </div>
            </div>

            <div className="command-category">
              <h5>🏷️ Tag Operations</h5>
              <div className="command-buttons">
                <button
                  className="command-btn"
                  onClick={() =>
                    setCliCommand("gonotes tag add --id 1 --tag 'important'")
                  }
                  title="Add a tag to a note"
                >
                  <span className="command-icon">➕</span>
                  <span className="command-name">gonotes tag add</span>
                  <span className="command-desc">Add tag to note</span>
                </button>

                <button
                  className="command-btn"
                  onClick={() =>
                    setCliCommand("gonotes tag remove --id 1 --tag 'important'")
                  }
                  title="Remove a tag from a note"
                >
                  <span className="command-icon">➖</span>
                  <span className="command-name">gonotes tag remove</span>
                  <span className="command-desc">Remove tag from note</span>
                </button>
              </div>
            </div>

            <div className="command-category">
              <h5>⚡ Quick Actions</h5>
              <div className="command-buttons">
                <button
                  className="command-btn primary"
                  onClick={() => {
                    setCliCommand("gonotes list");
                    setTimeout(() => {
                      const form = document.querySelector(
                        ".cli-input-form"
                      ) as HTMLFormElement;
                      if (form) form.requestSubmit();
                    }, 100);
                  }}
                  title="List all notes and execute immediately"
                >
                  <span className="command-icon">⚡</span>
                  <span className="command-name">List & Execute</span>
                  <span className="command-desc">Quick list notes</span>
                </button>

                <button
                  className="command-btn primary"
                  onClick={() => {
                    setCliCommand("gonotes stats");
                    setTimeout(() => {
                      const form = document.querySelector(
                        ".cli-input-form"
                      ) as HTMLFormElement;
                      if (form) form.requestSubmit();
                    }, 100);
                  }}
                  title="Get stats and execute immediately"
                >
                  <span className="command-icon">⚡</span>
                  <span className="command-name">Stats & Execute</span>
                  <span className="command-desc">Quick get stats</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDevConsolePage = () => (
    <div className="page-content">
      <div className="dev-console-guide">
        <h2>🔧 Developer Console Guide</h2>
        <p>
          Use the browser's developer console to access powerful CLI commands
          directly in your browser!
        </p>

        <div className="guide-section">
          <h3>📱 How to Open Developer Console</h3>
          <div className="instructions">
            <div className="instruction-step">
              <span className="step-number">1</span>
              <div>
                <strong>Chrome/Edge:</strong> Press <kbd>F12</kbd> or{" "}
                <kbd>Ctrl+Shift+I</kbd> (Windows) / <kbd>Cmd+Option+I</kbd>{" "}
                (Mac)
              </div>
            </div>
            <div className="instruction-step">
              <span className="step-number">2</span>
              <div>
                <strong>Firefox:</strong> Press <kbd>F12</kbd> or{" "}
                <kbd>Ctrl+Shift+K</kbd> (Windows) / <kbd>Cmd+Option+K</kbd>{" "}
                (Mac)
              </div>
            </div>
            <div className="instruction-step">
              <span className="step-number">3</span>
              <div>
                <strong>Safari:</strong> Press <kbd>Cmd+Option+I</kbd> (Mac)
              </div>
            </div>
            <div className="instruction-step">
              <span className="step-number">4</span>
              <div>
                Click on the <strong>"Console"</strong> tab
              </div>
            </div>
          </div>
        </div>

        <div className="guide-section">
          <h3>💻 Available Commands</h3>
          <div className="command-list">
            <div className="command-item">
              <div className="command-content">
                <code>gonotes.help()</code>
                <span>Show all available commands and examples</span>
              </div>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard("gonotes.help()")}
                title="Copy command"
              >
                📋
              </button>
            </div>
            <div className="command-item">
              <div className="command-content">
                <code>gonotes.list()</code>
                <span>List all notes</span>
              </div>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard("gonotes.list()")}
                title="Copy command"
              >
                📋
              </button>
            </div>
            <div className="command-item">
              <div className="command-content">
                <code>gonotes.create('Title', 'Content', 'tag1', 'tag2')</code>
                <span>Create a new note</span>
              </div>
              <button
                className="copy-btn"
                onClick={() =>
                  copyToClipboard(
                    "gonotes.create('Title', 'Content', 'tag1', 'tag2')"
                  )
                }
                title="Copy command"
              >
                📋
              </button>
            </div>
            <div className="command-item">
              <div className="command-content">
                <code>gonotes.view(1)</code>
                <span>View a specific note by ID</span>
              </div>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard("gonotes.view(1)")}
                title="Copy command"
              >
                📋
              </button>
            </div>
            <div className="command-item">
              <div className="command-content">
                <code>gonotes.delete(1)</code>
                <span>Delete a note by ID</span>
              </div>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard("gonotes.delete(1)")}
                title="Copy command"
              >
                📋
              </button>
            </div>
            <div className="command-item">
              <div className="command-content">
                <code>gonotes.search('query')</code>
                <span>Search notes by content or title</span>
              </div>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard("gonotes.search('query')")}
                title="Copy command"
              >
                📋
              </button>
            </div>
            <div className="command-item">
              <div className="command-content">
                <code>gonotes.stats()</code>
                <span>Get note statistics</span>
              </div>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard("gonotes.stats()")}
                title="Copy command"
              >
                📋
              </button>
            </div>
            <div className="command-item">
              <div className="command-content">
                <code>gonotes.tag('add', 1, 'important')</code>
                <span>Add a tag to a note</span>
              </div>
              <button
                className="copy-btn"
                onClick={() =>
                  copyToClipboard("gonotes.tag('add', 1, 'important')")
                }
                title="Copy command"
              >
                📋
              </button>
            </div>
            <div className="command-item">
              <div className="command-content">
                <code>gonotes.tag('remove', 1, 'old')</code>
                <span>Remove a tag from a note</span>
              </div>
              <button
                className="copy-btn"
                onClick={() =>
                  copyToClipboard("gonotes.tag('remove', 1, 'old')")
                }
                title="Copy command"
              >
                📋
              </button>
            </div>
          </div>
        </div>

        <div className="guide-section">
          <h3>🚀 Quick Examples</h3>
          <div className="examples">
            <div className="example-item">
              <h4>Create a Meeting Note:</h4>
              <div className="example-content">
                <code>
                  gonotes.create('Team Meeting', 'Discuss Q4 goals and project
                  timeline', 'work', 'meeting', 'important')
                </code>
                <button
                  className="copy-btn"
                  onClick={() =>
                    copyToClipboard(
                      "gonotes.create('Team Meeting', 'Discuss Q4 goals and project timeline', 'work', 'meeting', 'important')"
                    )
                  }
                  title="Copy example"
                >
                  📋
                </button>
              </div>
            </div>
            <div className="example-item">
              <h4>Search for Work Notes:</h4>
              <div className="example-content">
                <code>gonotes.search('work')</code>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard("gonotes.search('work')")}
                  title="Copy example"
                >
                  📋
                </button>
              </div>
            </div>
            <div className="example-item">
              <h4>Get Statistics:</h4>
              <div className="example-content">
                <code>gonotes.stats()</code>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard("gonotes.stats()")}
                  title="Copy example"
                >
                  📋
                </button>
              </div>
            </div>
            <div className="example-item">
              <h4>Add a Tag to Note #1:</h4>
              <div className="example-content">
                <code>gonotes.tag('add', 1, 'urgent')</code>
                <button
                  className="copy-btn"
                  onClick={() =>
                    copyToClipboard("gonotes.tag('add', 1, 'urgent')")
                  }
                  title="Copy example"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="guide-section">
          <h3>💡 Tips</h3>
          <ul className="tips-list">
            <li>
              All notes created via console will appear in the main interface
            </li>
            <li>
              Use quotes around text with spaces: <code>'My Note Title'</code>
            </li>
            <li>Commands are case-sensitive</li>
            <li>
              Use <code>gonotes.help()</code> anytime to see available commands
            </li>
            <li>
              Console commands work alongside the web interface seamlessly
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  if (loading && notes.length === 0) {
    return (
      <div className="App">
        <div className="loading">Loading notes...</div>
      </div>
    );
  }

  // Show splash screen if needed
  if (showSplash) {
    return (
      <div style={{ overflow: "hidden", width: "100vw", height: "100vh" }}>
        <SplashScreen onComplete={() => setShowSplash(false)} />
      </div>
    );
  }

  return (
    <div className="App">
      {/* Particle Background */}
      <div className="particle-background">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      {/* Glow Orbs */}
      <div className="glow-orb"></div>
      <div className="glow-orb"></div>
      <div className="glow-orb"></div>

      <header className="App-header">
        <div className="enhanced-logo">
          <div className="logo-icon">
            <div className="logo-circle">
              <div className="logo-inner">
                <span className="logo-text">GN</span>
              </div>
              <div className="logo-ring ring-1"></div>
              <div className="logo-ring ring-2"></div>
              <div className="logo-ring ring-3"></div>
            </div>
          </div>
          <div className="logo-text-container">
            <h1>GoNotes</h1>
            <p>Next-Generation Note Taking</p>
          </div>
        </div>
      </header>

      <nav className="navbar">
        <div className="nav-container">
          <button
            className={`nav-item ${currentPage === "notes" ? "active" : ""}`}
            onClick={() => setCurrentPage("notes")}
          >
            📝 Notes
          </button>
          <button
            className={`nav-item ${currentPage === "cli" ? "active" : ""}`}
            onClick={() => setCurrentPage("cli")}
          >
            💻 CLI Console
          </button>
          <button
            className={`nav-item ${
              currentPage === "dev-console" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("dev-console")}
          >
            🔧 Dev Console
          </button>
        </div>
      </nav>

      <main className="App-main">
        {currentPage === "notes" && renderNotesPage()}
        {currentPage === "cli" && renderCLIPage()}
        {currentPage === "dev-console" && renderDevConsolePage()}
      </main>

      {/* Toast Notifications */}
      <ToastManager toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}

export default App;
