import React, { useEffect, useState } from "react";
import "./Toast.css";

export interface ToastProps {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show toast with animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto-hide after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📝";
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case "success":
        return "toast-success";
      case "error":
        return "toast-error";
      case "warning":
        return "toast-warning";
      case "info":
        return "toast-info";
      default:
        return "toast-info";
    }
  };

  return (
    <div
      className={`toast ${getTypeClass()} ${isVisible ? "show" : ""} ${
        isExiting ? "exit" : ""
      }`}
      onClick={handleClose}
    >
      <div className="toast-content">
        <div className="toast-icon">
          <span className="icon">{getIcon()}</span>
          <div className="icon-glow"></div>
        </div>

        <div className="toast-text">
          <h4 className="toast-title">{title}</h4>
          <p className="toast-message">{message}</p>
        </div>

        <button
          className="toast-close"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
        >
          <span>×</span>
        </button>
      </div>

      <div className="toast-progress">
        <div className="progress-bar"></div>
      </div>

      <div className="toast-glow"></div>
    </div>
  );
};

export default Toast;
