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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNote, setNewNote] = useState<CreateNoteRequest>({
    title: "",
    content: "",
    tags: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
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
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    fetchNotes();

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
    };
  }, [mousePosition]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/notes`);
      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }
      const data = await response.json();
      setNotes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
      setError(errorMessage);

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
      setError(errorMessage);

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
    if (!searchQuery.trim()) {
      await fetchNotes();
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/notes/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) {
        throw new Error("Failed to search notes");
      }
      const data = await response.json();
      setNotes(data);
      setError(null);

      // Show search toast
      addToast({
        type: "info",
        title: "Search Complete",
        message: `Found ${data.length} note${
          data.length !== 1 ? "s" : ""
        } for "${searchQuery}"`,
        duration: 3000,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to search notes";
      setError(errorMessage);

      // Show error toast
      addToast({
        type: "error",
        title: "Search Failed",
        message: errorMessage,
        duration: 4000,
      });
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
      const response = await fetch(`${API_BASE}/cli/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command, args: [] }),
      });

      if (!response.ok) {
        throw new Error("Failed to execute CLI command");
      }

      const result = await response.json();
      const output = `$ ${command}\n${JSON.stringify(result.result, null, 2)}`;
      setCliOutput((prev) => [...prev, output]);

      // Refresh notes if the command might have changed them
      if (
        ["list", "create", "delete", "search", "stats"].includes(
          command.split(" ")[0]
        )
      ) {
        await fetchNotes();
      }

      // Show CLI success toast
      addToast({
        type: "success",
        title: "Command Executed",
        message: `Successfully executed: ${command}`,
        duration: 3000,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const errorOutput = `$ ${command}\nError: ${errorMessage}`;
      setCliOutput((prev) => [...prev, errorOutput]);

      // Show CLI error toast
      addToast({
        type: "error",
        title: "Command Failed",
        message: errorMessage,
        duration: 4000,
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
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && searchNotes()}
          />
          <button onClick={searchNotes}>Search</button>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                fetchNotes();
              }}
            >
              Clear
            </button>
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
          <p>No notes found. Create your first note!</p>
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
          <input
            type="text"
            value={cliCommand}
            onChange={(e) => setCliCommand(e.target.value)}
            placeholder="Enter CLI command (e.g., list, create 'Title' 'Content', stats)..."
            className="cli-input"
          />
          <button type="submit" className="cli-submit">
            Execute
          </button>
        </form>
        <div className="cli-quick-commands">
          <button onClick={() => executeCLICommand("list")}>List Notes</button>
          <button onClick={() => executeCLICommand("stats")}>Stats</button>
          <button
            onClick={() =>
              executeCLICommand('create "Quick Note" "Created via CLI" "cli"')
            }
          >
            Quick Create
          </button>
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
              <code>gonotes.help()</code>
              <span>Show all available commands and examples</span>
            </div>
            <div className="command-item">
              <code>gonotes.list()</code>
              <span>List all notes</span>
            </div>
            <div className="command-item">
              <code>gonotes.create('Title', 'Content', 'tag1', 'tag2')</code>
              <span>Create a new note</span>
            </div>
            <div className="command-item">
              <code>gonotes.view(1)</code>
              <span>View a specific note by ID</span>
            </div>
            <div className="command-item">
              <code>gonotes.delete(1)</code>
              <span>Delete a note by ID</span>
            </div>
            <div className="command-item">
              <code>gonotes.search('query')</code>
              <span>Search notes by content or title</span>
            </div>
            <div className="command-item">
              <code>gonotes.stats()</code>
              <span>Get note statistics</span>
            </div>
            <div className="command-item">
              <code>gonotes.tag('add', 1, 'important')</code>
              <span>Add a tag to a note</span>
            </div>
            <div className="command-item">
              <code>gonotes.tag('remove', 1, 'old')</code>
              <span>Remove a tag from a note</span>
            </div>
          </div>
        </div>

        <div className="guide-section">
          <h3>🚀 Quick Examples</h3>
          <div className="examples">
            <div className="example-item">
              <h4>Create a Meeting Note:</h4>
              <code>
                gonotes.create('Team Meeting', 'Discuss Q4 goals and project
                timeline', 'work', 'meeting', 'important')
              </code>
            </div>
            <div className="example-item">
              <h4>Search for Work Notes:</h4>
              <code>gonotes.search('work')</code>
            </div>
            <div className="example-item">
              <h4>Get Statistics:</h4>
              <code>gonotes.stats()</code>
            </div>
            <div className="example-item">
              <h4>Add a Tag to Note #1:</h4>
              <code>gonotes.tag('add', 1, 'urgent')</code>
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
