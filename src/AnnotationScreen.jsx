import { useEffect, useMemo, useState } from "react";
import ImageUpload from "./ImageUpload";
import ImageCanvas from "./ImageCanvas";
import SidebarTools from "./SidebarTools";
import TopToolbar from "./TopToolbar";
import RightPanel from "./RightPanel";
import heroImage from "./assets/hero.png";
import "./App.css";

function AnnotationScreen({
  file,
  results,
  loading,
  error,
  onFileSelect,
  onUpload,
  onBack,
  onLogoClick,
}) {
  const [zoom, setZoom] = useState(100);
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const clampZoom = (value) => Math.min(300, Math.max(25, value));
  const onZoomChange = (value) => setZoom(clampZoom(value));

  const [selectedId, setSelectedId] = useState(null);
  const [annotationsVisible, setAnnotationsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [settingsValues, setSettingsValues] = useState({
    marker1: "Defect 1",
    marker2: "Defect 2",
    marker3: "Defect 3",
    marker4: "Defect 4",
    marker5: "Defect 5",
    eraser: "Eraser",
    edge: "Edge",
    surface: "Surface",
    classCorrect: "Class Correct",
    classLeather: "Leather",
  });
  const defaultSettingsValues = {
    marker1: "Defect 1",
    marker2: "Defect 2",
    marker3: "Defect 3",
    marker4: "Defect 4",
    marker5: "Defect 5",
    eraser: "Eraser",
    edge: "Edge",
    surface: "Surface",
    classCorrect: "Class Correct",
    classLeather: "Leather",
  };

  useEffect(() => {
    if (!settingsOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen]);

  const handleOverlayClick = () => {
    setSettingsOpen(false);
  };

  const handleModalClick = (event) => {
    event.stopPropagation();
  };

  const saveSettings = () => {
    // No backend hook yet. Just close modal.
    setSettingsOpen(false);
  };

  const resetSettings = () => {
    setSettingsValues(defaultSettingsValues);
  };

  const updateSetting = (key, value) => {
    setSettingsValues((prev) => ({ ...prev, [key]: value }));
  };

  const [annotations, setAnnotations] = useState([
    {
      id: "bolt-1",
      class_name: "Bolt",
      confidence: 0.89,
      bbox: [180, 90, 140, 80],
      source: "AI Detected",
      status: "pending",
    },
    {
      id: "screw-1",
      class_name: "Screw",
      confidence: 0.84,
      bbox: [540, 70, 120, 70],
      source: "AI Detected",
      status: "pending",
    },
    {
      id: "defect-1",
      class_name: "Defect",
      confidence: 0.72,
      bbox: [430, 280, 105, 60],
      source: "AI Detected",
      status: "pending",
    },
  ]);

  const detections = useMemo(() => {
    if (results?.detections?.length) {
      return results.detections.map((det, idx) => ({
        ...det,
        id: det.id ?? `${det.class_name}-${idx}`,
        source: det.source ?? "AI Detected",
        status: det.status ?? "pending",
      }));
    }
    return annotations;
  }, [results, annotations]);

  const annotationsCount = detections.length;
  const confirmedCount = detections.filter(
    (det) => det.status === "confirmed",
  ).length;
  const imageWidth = imageSize.width || 0;
  const imageHeight = imageSize.height || 0;

  return (
    <div
      className={`annotation-screen ${darkMode ? "theme-dark" : "theme-light"} ${
        sidebarExpanded ? "sidebar-expanded" : "sidebar-collapsed"
      }`}
    >
      <TopToolbar
        zoom={zoom}
        onZoomChange={onZoomChange}
        aiProcessing={false}
        pendingCount={detections.length}
        onRunAI={() => {}}
        onAcceptAll={() => {}}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogoClick={onLogoClick}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((prev) => !prev)}
        annotationsVisible={annotationsVisible}
        onToggleAnnotationsVisibility={() =>
          setAnnotationsVisible((prev) => !prev)
        }
        selectedAnnotation={selectedId}
        onDeleteSelected={() => setSelectedId(null)}
      />
      <div className="workspace">
        <aside
          className={`sidebar left ${sidebarExpanded ? "sidebar-expanded" : "sidebar-collapsed"}`}
        >
          <SidebarTools
            expanded={sidebarExpanded}
            onToggleExpand={() => setSidebarExpanded((prev) => !prev)}
          />
        </aside>

        <main className="workspace-main">
          <ImageCanvas
            zoom={zoom}
            imageSrc={heroImage}
            file={file}
            detections={detections}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onImageLoad={(width, height) => setImageSize({ width, height })}
            onAccept={(id) => {
              setAnnotations((prev) =>
                prev.map((item) =>
                  item.id === id ? { ...item, status: "confirmed" } : item,
                ),
              );
            }}
            onReject={(id) => {
              setAnnotations((prev) =>
                prev.map((item) =>
                  item.id === id ? { ...item, status: "rejected" } : item,
                ),
              );
            }}
          />
        </main>

        <RightPanel
          detections={detections}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAccept={(id) => {
            setAnnotations((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, status: "confirmed" } : item,
              ),
            );
          }}
          onReject={(id) => {
            setAnnotations((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, status: "rejected" } : item,
              ),
            );
          }}
        />
      </div>

      <div className="bottom-status-bar">
        <div className="status-left">
          <span>{annotationsCount} annotations</span>
          <span>{confirmedCount} confirmed</span>
        </div>
        <div className="status-right">
          <span>
            {imageWidth} x {imageHeight} px
          </span>
          <span>{zoom}%</span>
        </div>
      </div>

      {settingsOpen && (
        <div className="settings-modal-overlay" onClick={handleOverlayClick}>
          <div className="settings-modal-card" onClick={handleModalClick}>
            <div className="settings-modal-header">
              <h2>Settings</h2>
              <button
                className="settings-close-button"
                onClick={() => setSettingsOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="settings-modal-content">
              {Object.entries(settingsValues).map(([key, value]) => (
                <div key={key} className="settings-field">
                  <label>{key}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateSetting(key, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="settings-modal-actions">
              <button className="settings-save-button" onClick={saveSettings}>
                Save
              </button>
              <button className="settings-reset-button" onClick={resetSettings}>
                Reset
              </button>
              <button
                className="settings-cancel-button"
                onClick={() => setSettingsOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnnotationScreen;
