import React, { useEffect, useState } from "react";
import "./SplashScreen.css";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [showLogo, setShowLogo] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const loadingTexts = [
    "Initializing GoNotes...",
    "Loading particle system...",
    "Preparing stunning visuals...",
    "Setting up CLI interface...",
    "Configuring note storage...",
    "Launching application...",
  ];

  useEffect(() => {
    // Show logo after a brief delay
    setTimeout(() => setShowLogo(true), 200);

    // Show particles after logo
    setTimeout(() => setShowParticles(true), 800);

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 1000); // Wait for final animations
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // Update loading text based on progress
    const textInterval = setInterval(() => {
      const textIndex = Math.floor((progress / 100) * loadingTexts.length);
      if (textIndex < loadingTexts.length) {
        setCurrentText(loadingTexts[textIndex]);
      }
    }, 300);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, [progress, onComplete]);

  return (
    <div className="splash-screen">
      {/* Animated Background */}
      <div className="splash-background">
        <div className="splash-particles">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="splash-particle"
              style={{ "--delay": `${i * 0.1}s` } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Floating Orbs */}
        <div className="splash-orbs">
          <div className="splash-orb orb-1"></div>
          <div className="splash-orb orb-2"></div>
          <div className="splash-orb orb-3"></div>
          <div className="splash-orb orb-4"></div>
        </div>

        {/* Animated Grid */}
        <div className="splash-grid">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="grid-line"
              style={{ "--delay": `${i * 0.05}s` } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="splash-content">
        {/* Enhanced Logo */}
        <div className={`splash-logo ${showLogo ? "show" : ""}`}>
          <div className="logo-container">
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
              <h1 className="logo-title">GoNotes</h1>
              <p className="logo-subtitle">Next-Generation Note Taking</p>
            </div>
          </div>
        </div>

        {/* Loading Progress */}
        <div className="splash-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
            <div className="progress-glow"></div>
          </div>
          <div className="progress-text">{currentText}</div>
          <div className="progress-percentage">{Math.round(progress)}%</div>
        </div>

        {/* Animated Elements */}
        <div className={`splash-elements ${showParticles ? "show" : ""}`}>
          <div className="element element-1">✨</div>
          <div className="element element-2">🚀</div>
          <div className="element element-3">💫</div>
          <div className="element element-4">🌟</div>
        </div>
      </div>

      {/* Loading Animation */}
      <div className="splash-loading">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
