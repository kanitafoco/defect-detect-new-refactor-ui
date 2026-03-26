import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  Save,
  Settings,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Trash2,
  Sun,
  Moon,
} from "lucide-react";

export default function TopToolbar({
  zoom,
  onZoomChange,
  onOpenSettings,
  onLogoClick,
  darkMode,
  onToggleTheme,
  annotationsVisible,
  onToggleAnnotationsVisibility,
  selectedAnnotation,
  onDeleteSelected,
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowDeleteModal(false);
      }
    };

    if (showDeleteModal) {
      window.addEventListener("keydown", onKeyDown);
    }

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showDeleteModal]);

  const openDeleteModal = () => setShowDeleteModal(true);
  const closeDeleteModal = () => setShowDeleteModal(false);
  const confirmDelete = () => {
    if (onDeleteSelected) onDeleteSelected();
    setShowDeleteModal(false);
  };

  return (
    <>
      <header className="top-toolbar">
        <div className="top-toolbar-left">
          <button
            className="top-toolbar-logo"
            type="button"
            onClick={onLogoClick}
          >
            <span className="logo-icon" aria-hidden />
            <span className="logo-text">
              Annot<span className="logo-accent">IQ</span>
            </span>
          </button>

          <div className="top-toolbar-file-actions" aria-label="File actions">
            <button
              type="button"
              className="top-toolbar-icon"
              title="Open File"
            >
              <FolderOpen />
            </button>
            <button type="button" className="top-toolbar-icon" title="Save">
              <Save />
            </button>
            <div className="top-toolbar-file-divider" />
          </div>

          <div className="top-toolbar-separator" />

          <div className="top-toolbar-actions">
            <button type="button" className="top-toolbar-icon" title="Undo">
              <Undo2 />
            </button>
            <button type="button" className="top-toolbar-icon" title="Redo">
              <Redo2 />
            </button>
            <div className="top-toolbar-zoom">
              <button
                type="button"
                className="top-toolbar-icon"
                onClick={() => onZoomChange(Math.max(25, zoom - 10))}
                title="Zoom out"
              >
                <ZoomOut />
              </button>
              <span className="top-toolbar-zoom-label">{zoom}%</span>
              <button
                type="button"
                className="top-toolbar-icon"
                onClick={() => onZoomChange(Math.min(300, zoom + 10))}
                title="Zoom in"
              >
                <ZoomIn />
              </button>
              <button
                type="button"
                className="top-toolbar-icon"
                onClick={() => onZoomChange(100)}
                title="Reset zoom"
              >
                <RotateCcw />
              </button>
            </div>

            <div className="top-toolbar-separator" />

            <div className="top-toolbar-extra-actions">
              <button
                type="button"
                className="top-toolbar-icon"
                onClick={onToggleAnnotationsVisibility}
                title={
                  annotationsVisible ? "Hide annotations" : "Show annotations"
                }
              >
                {annotationsVisible ? <Eye /> : <EyeOff />}
              </button>
              <button
                type="button"
                className="top-toolbar-icon"
                onClick={openDeleteModal}
                title="Delete selected"
              >
                <span className="top-toolbar-icon-inner">
                  <Trash2 />
                </span>
              </button>
            </div>

            <div className="top-toolbar-separator" />
          </div>
        </div>

        <div className="top-toolbar-right">
          <button
            type="button"
            className="top-toolbar-icon"
            onClick={onToggleTheme}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun /> : <Moon />}
          </button>

          <button
            type="button"
            className="top-toolbar-icon"
            onClick={onOpenSettings}
            title="Settings"
          >
            <Settings />
          </button>
        </div>
      </header>
      {showDeleteModal ? (
        <div className="confirm-modal-overlay" onClick={closeDeleteModal}>
          <div
            className="confirm-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Are you sure you want to delete all annotations?</h2>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="confirm-modal-button confirm-modal-button--secondary"
                onClick={closeDeleteModal}
              >
                No
              </button>
              <button
                type="button"
                className="confirm-modal-button confirm-modal-button--primary"
                onClick={confirmDelete}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
