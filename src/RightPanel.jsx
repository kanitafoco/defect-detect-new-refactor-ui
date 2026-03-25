import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Square,
  Layers,
  Download,
} from "lucide-react";

export default function RightPanel({
  detections = [],
  selectedId,
  onSelect,
  onAccept,
  onReject,
}) {
  const [activeTab, setActiveTab] = useState("annotations");
  const [patchSettings, setPatchSettings] = useState({
    width: 200,
    height: 200,
    horizontalStride: 50,
    verticalStride: 50,
  });
  const [showPatches, setShowPatches] = useState(false);
  const [patchesCreated, setPatchesCreated] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [expandPreview, setExpandPreview] = useState(true);
  const [expandMasks, setExpandMasks] = useState(true);
  const [expandPatchView, setExpandPatchView] = useState(true);
  const [expandExportOptions, setExpandExportOptions] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [maskIndex, setMaskIndex] = useState(0);
  const [patchIndex, setPatchIndex] = useState(0);
  const [maskZoom, setMaskZoom] = useState(1);
  const [patchZoom, setPatchZoom] = useState(1);
  const [fullscreenMode, setFullscreenMode] = useState(null);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [fullscreenZoom, setFullscreenZoom] = useState(1);
  const [isPanningFullscreen, setIsPanningFullscreen] = useState(false);
  const fullscreenViewportRef = useRef(null);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const [maskExport, setMaskExport] = useState(false);
  const [jsonCollective, setJsonCollective] = useState(true);
  const [jsonIndividual, setJsonIndividual] = useState(false);
  const [yoloExport, setYoloExport] = useState(false);
  const [pascalExport, setPascalExport] = useState(false);
  const [ratingById, setRatingById] = useState({});

  const handleRatingChange = (id, value) => {
    setRatingById((prev) => ({
      ...prev,
      [id]: prev[id] === value ? null : value,
    }));
  };

  useEffect(() => {
    if (!showExportModal) return;
    const initialRatings = detections.reduce((acc, det) => {
      acc[det.id] = acc[det.id] ?? null;
      return acc;
    }, {});
    setRatingById((prev) => ({ ...initialRatings, ...prev }));
  }, [showExportModal, detections]);

  const selected = useMemo(
    () => detections.find((det) => det.id === selectedId),
    [detections, selectedId],
  );

  const pending = detections.filter((det) => det.status !== "confirmed");
  const confirmed = detections.filter((det) => det.class_name !== "Defect");

  const clampZoom = (value) => Math.min(3, Math.max(0.5, value));

  const clampIndex = (current, delta, length) => {
    if (!length) return 0;
    const next = current + delta;
    if (next < 0) return 0;
    if (next >= length) return length - 1;
    return next;
  };

  const maskCount = detections.length;
  const patchCount = detections.length;
  const maskItem = detections[maskIndex];
  const patchItem = detections[patchIndex];

  const fullscreenCount = fullscreenMode === "mask" ? maskCount : patchCount;
  const fullscreenItem = fullscreenMode === "mask" ? maskItem : patchItem;

  // Keep indexes within bounds when detections change
  useEffect(() => {
    if (maskIndex >= maskCount) setMaskIndex(0);
    if (patchIndex >= patchCount) setPatchIndex(0);
    if (fullscreenIndex >= fullscreenCount) setFullscreenIndex(0);
  }, [
    maskCount,
    patchCount,
    fullscreenCount,
    maskIndex,
    patchIndex,
    fullscreenIndex,
  ]);

  const openFullscreen = (mode, index, zoom) => {
    setFullscreenMode(mode);
    setFullscreenIndex(index);
    setFullscreenZoom(zoom);
    setIsPanningFullscreen(false);
  };

  const closeFullscreen = () => {
    if (fullscreenMode === "mask") {
      setMaskIndex(fullscreenIndex);
      setMaskZoom(fullscreenZoom);
    }
    if (fullscreenMode === "patch") {
      setPatchIndex(fullscreenIndex);
      setPatchZoom(fullscreenZoom);
    }

    setIsPanningFullscreen(false);
    setFullscreenMode(null);
  };

  const changeFullscreenIndex = (delta) => {
    setFullscreenIndex((prev) => {
      const next = clampIndex(prev, delta, fullscreenCount);
      if (fullscreenMode === "mask") setMaskIndex(next);
      if (fullscreenMode === "patch") setPatchIndex(next);
      return next;
    });
  };

  const changeFullscreenZoom = (delta) => {
    setFullscreenZoom((prev) => {
      const next = clampZoom(prev + delta);
      if (fullscreenMode === "mask") setMaskZoom(next);
      if (fullscreenMode === "patch") setPatchZoom(next);
      return next;
    });
  };

  const onFullscreenMouseDown = (event) => {
    if (event.button !== 0 || !fullscreenViewportRef.current) return;

    const viewport = fullscreenViewportRef.current;
    setIsPanningFullscreen(true);
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
  };

  const onFullscreenMouseMove = (event) => {
    if (!isPanningFullscreen || !fullscreenViewportRef.current) return;

    const viewport = fullscreenViewportRef.current;
    const dx = event.clientX - panStartRef.current.x;
    const dy = event.clientY - panStartRef.current.y;
    viewport.scrollLeft = panStartRef.current.scrollLeft - dx;
    viewport.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const endFullscreenPan = () => {
    setIsPanningFullscreen(false);
  };

  const onFullscreenWheel = (event) => {
    // Preserve natural scroll by default; use Cmd/Ctrl + wheel to zoom.
    if (!event.metaKey && !event.ctrlKey) return;

    event.preventDefault();
    const step = event.deltaY < 0 ? 0.1 : -0.1;
    changeFullscreenZoom(step);
  };

  useEffect(() => {
    if (!fullscreenMode) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeFullscreen();
        return;
      }
      if (event.key === "ArrowLeft") {
        changeFullscreenIndex(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        changeFullscreenIndex(1);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreenMode]);

  useEffect(() => {
    if (!fullscreenMode) return;
    if (fullscreenMode === "mask") {
      setFullscreenIndex(maskIndex);
    }
    if (fullscreenMode === "patch") {
      setFullscreenIndex(patchIndex);
    }
  }, [fullscreenMode, maskIndex, patchIndex]);

  useEffect(() => {
    if (!fullscreenMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      setIsPanningFullscreen(false);
    };
  }, [fullscreenMode]);

  return (
    <aside className={`right-panel ${isCollapsed ? "collapsed" : ""}`}>
      <div className="tab-bar">
        <button
          type="button"
          className={`tab-item ${activeTab === "annotations" ? "active" : ""}`}
          onClick={() => setActiveTab("annotations")}
        >
          Annotations
        </button>
        <button
          type="button"
          className={`tab-item ${activeTab === "patches" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("patches");
            setShowPatches(true);
          }}
        >
          Export & Patches
        </button>
        <button
          type="button"
          className={`tab-arrow-btn ${isCollapsed ? "collapsed" : ""}`}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {activeTab === "annotations" ? (
        <div className="tab-content">
          <div className="right-panel-section">
            <div className="right-panel-section-header">Annotations</div>
            <div className="right-panel-list">
              {pending.map((det) => {
                const isSelected = det.id === selectedId;
                return (
                  <button
                    key={det.id}
                    type="button"
                    onClick={() => onSelect?.(det.id)}
                    className={`right-panel-item ${isSelected ? "selected" : ""}`}
                  >
                    <div className="right-panel-item-main">
                      <div
                        className="right-panel-item-bullet"
                        style={{
                          backgroundColor:
                            det.class_name === "Bolt"
                              ? "#3b82f6"
                              : det.class_name === "Screw"
                                ? "#10b981"
                                : det.class_name === "Defect"
                                  ? "#ef4444"
                                  : "#9ca3af",
                        }}
                      />
                      <div className="right-panel-item-info">
                        <div
                          className="right-panel-item-label"
                          style={{ color: "#9ca3af" }}
                        >
                          {det.class_name}
                        </div>
                      </div>
                    </div>
                    <div className="right-panel-item-actions">
                      <span
                        className="right-panel-item-confidence"
                        style={{
                          fontSize: "16px",
                          color: "#9ca3af",
                          marginRight: "10px",
                        }}
                      >
                        {Math.round((det.confidence ?? 0) * 100)}%
                      </span>

                      <button
                        type="button"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAccept?.(det.id);
                        }}
                        title="Accept"
                        style={{ color: "#22c55e" }}
                      >
                        <Check size={14} />
                      </button>

                      <button
                        type="button"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReject?.(det.id);
                        }}
                        title="Reject"
                        style={{ color: "#ef4444" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </button>
                );
              })}
              {pending.length === 0 && (
                <div className="right-panel-empty">No AI suggestions</div>
              )}
            </div>
          </div>

          <div className="right-panel-section">
            <div className="right-panel-section-header">Confirmed</div>
            <div className="right-panel-list">
              {confirmed.map((det) => (
                <div
                  key={det.id}
                  className="right-panel-item confirmed"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      className="right-panel-item-bullet"
                      style={{
                        backgroundColor:
                          det.class_name === "Bolt"
                            ? "#3b82f6"
                            : det.class_name === "Circuit Board"
                              ? "#8b5cf6"
                              : "#10b981",
                      }}
                    />

                    <div
                      className="right-panel-item-label"
                      style={{ color: "#9ca3af" }}
                    >
                      {det.class_name}
                    </div>
                  </div>

                  <span
                    className="right-panel-item-confidence"
                    style={{
                      fontSize: "16px",
                      color: "#9ca3af",
                    }}
                  >
                    {Math.round((det.confidence ?? 0) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="right-panel-section">
            <div className="right-panel-section-header">Properties</div>
            <div className="right-panel-properties">
              <div className="property-row">
                <div className="property-label">Label</div>
                <div className="property-value">
                  {selected?.class_name ?? "None"}
                </div>
              </div>
              <div className="property-row">
                <div className="property-label">Position</div>
                <div className="property-value">
                  {selected?.bbox
                    ? `${selected.bbox[0]}, ${selected.bbox[1]}`
                    : "-"}
                </div>
              </div>
              <div className="property-row">
                <div className="property-label">Size</div>
                <div className="property-value">
                  {selected?.bbox
                    ? `${selected.bbox[2]} x ${selected.bbox[3]}`
                    : "-"}
                </div>
              </div>
              <div className="property-row">
                <div className="property-label">Confidence</div>
                <div className="property-value">
                  {selected
                    ? `${Math.round((selected.confidence ?? 0) * 100)}%`
                    : "-"}
                </div>
              </div>
              <div className="property-row">
                <div className="property-label">Source</div>
                <div className="property-value">{selected?.source ?? "-"}</div>
              </div>
              <div className="property-row">
                <div className="property-label">Status</div>
                <div className="property-value">{selected?.status ?? "-"}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="tab-content patches-content">
          <div className="right-panel-section">
            <div className="right-panel-section-header">Create Patches</div>
            <div className="form-group">
              <label>Width</label>
              <input
                type="number"
                value={patchSettings.width}
                onChange={(e) =>
                  setPatchSettings((prev) => ({
                    ...prev,
                    width: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label>Height</label>
              <input
                type="number"
                value={patchSettings.height}
                onChange={(e) =>
                  setPatchSettings((prev) => ({
                    ...prev,
                    height: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label>Horizontal stride</label>
              <input
                type="number"
                value={patchSettings.horizontalStride}
                onChange={(e) =>
                  setPatchSettings((prev) => ({
                    ...prev,
                    horizontalStride: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label>Vertical stride</label>
              <input
                type="number"
                value={patchSettings.verticalStride}
                onChange={(e) =>
                  setPatchSettings((prev) => ({
                    ...prev,
                    verticalStride: Number(e.target.value),
                  }))
                }
              />
            </div>
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                setShowPatches(true);
                setPatchesCreated(true);
              }}
            >
              Create Patches
            </button>
          </div>

          {showPatches && (
            <>
              <div className="right-panel-section">
                <button
                  type="button"
                  className="collapse-toggle"
                  onClick={() => setExpandPreview((prev) => !prev)}
                >
                  <span>Preview</span>
                  {expandPreview ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                {expandPreview && (
                  <div className="preview-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={!maskCount}
                      onClick={() =>
                        openFullscreen("mask", maskIndex, maskZoom)
                      }
                    >
                      Show Masks
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={!patchCount}
                      onClick={() =>
                        openFullscreen("patch", patchIndex, patchZoom)
                      }
                    >
                      Preview Patches
                    </button>
                  </div>
                )}
              </div>

              <div className="right-panel-section">
                <div className="section-header-with-controls">
                  <button
                    type="button"
                    className="collapse-toggle"
                    onClick={() => setExpandMasks((prev) => !prev)}
                  >
                    <span>Masks</span>
                    {expandMasks ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                  <div className="preview-header-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={!maskCount}
                      onClick={() =>
                        setMaskIndex((prev) => clampIndex(prev, -1, maskCount))
                      }
                      title="Previous mask"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={!maskCount}
                      onClick={() =>
                        setMaskIndex((prev) => clampIndex(prev, 1, maskCount))
                      }
                      title="Next mask"
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={!maskCount}
                      onClick={() =>
                        setMaskZoom((prev) => clampZoom(prev - 0.1))
                      }
                      title="Zoom out"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={!maskCount}
                      onClick={() =>
                        setMaskZoom((prev) => clampZoom(prev + 0.1))
                      }
                      title="Zoom in"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={!maskCount}
                      onClick={() =>
                        openFullscreen("mask", maskIndex, maskZoom)
                      }
                      title="Fullscreen"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>
                {expandMasks && (
                  <div className="preview-box">
                    <div
                      className="preview-content"
                      style={{ transform: `scale(${maskZoom})` }}
                    >
                      {maskItem ? (
                        <div className="preview-image">
                          <div className="preview-image-label">
                            {maskItem.class_name} •{" "}
                            {Math.round((maskItem.confidence ?? 0) * 100)}%
                          </div>
                          <div className="preview-image-placeholder">
                            {maskItem.class_name} preview
                          </div>
                        </div>
                      ) : (
                        "No masks available"
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="right-panel-section">
                <div className="section-header-with-controls">
                  <button
                    type="button"
                    className="collapse-toggle"
                    onClick={() => setExpandPatchView((prev) => !prev)}
                  >
                    <span>Patch View</span>
                    {expandPatchView ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                  <div className="preview-header-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={!patchCount}
                      onClick={() =>
                        setPatchIndex((prev) =>
                          clampIndex(prev, -1, patchCount),
                        )
                      }
                      title="Previous patch"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={!patchCount}
                      onClick={() =>
                        setPatchIndex((prev) => clampIndex(prev, 1, patchCount))
                      }
                      title="Next patch"
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={!patchCount}
                      onClick={() =>
                        setPatchZoom((prev) => clampZoom(prev - 0.1))
                      }
                      title="Zoom out"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={!patchCount}
                      onClick={() =>
                        setPatchZoom((prev) => clampZoom(prev + 0.1))
                      }
                      title="Zoom in"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={!patchCount}
                      onClick={() =>
                        openFullscreen("patch", patchIndex, patchZoom)
                      }
                      title="Fullscreen"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>
                {expandPatchView && (
                  <div className="preview-box">
                    <div
                      className="preview-content"
                      style={{ transform: `scale(${patchZoom})` }}
                    >
                      {patchItem ? (
                        <div className="preview-image">
                          <div className="preview-image-label">
                            {patchItem.class_name} •{" "}
                            {Math.round((patchItem.confidence ?? 0) * 100)}%
                          </div>
                          <div className="preview-image-placeholder">
                            {patchItem.class_name} preview
                          </div>
                        </div>
                      ) : (
                        "No patches available"
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="right-panel-section">
                <button
                  type="button"
                  className="collapse-toggle"
                  onClick={() => setExpandExportOptions((prev) => !prev)}
                >
                  <span>Export Options</span>
                  {expandExportOptions ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                {expandExportOptions && (
                  <div
                    className={`export-options ${patchesCreated ? "active" : "disabled"}`}
                  >
                    <label>
                      <span>Mask export</span>
                      <input
                        type="checkbox"
                        checked={maskExport}
                        onChange={(e) => setMaskExport(e.target.checked)}
                      />
                    </label>
                    <label>
                      <span>JSON export (Collective)</span>
                      <input
                        type="checkbox"
                        checked={jsonCollective}
                        onChange={(e) => setJsonCollective(e.target.checked)}
                      />
                    </label>
                    <label>
                      <span>JSON export (Individual)</span>
                      <input
                        type="checkbox"
                        checked={jsonIndividual}
                        onChange={(e) => setJsonIndividual(e.target.checked)}
                      />
                    </label>
                    <label>
                      <span>YOLO export</span>
                      <input
                        type="checkbox"
                        checked={yoloExport}
                        onChange={(e) => setYoloExport(e.target.checked)}
                      />
                    </label>
                    <label>
                      <span>Pascal VOC export</span>
                      <input
                        type="checkbox"
                        checked={pascalExport}
                        onChange={(e) => setPascalExport(e.target.checked)}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="right-panel-section export-action-group">
                <button type="button" className="primary-btn">
                  <Download size={14} style={{ marginRight: 6 }} />
                  Export All Patches
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowExportModal(true)}
                >
                  <Layers size={14} style={{ marginRight: 6 }} />
                  Export Selected Patches
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {showExportModal && (
        <div
          className="export-modal-overlay"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="export-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="export-modal-header">
              <h3>Export Selected Patches</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowExportModal(false)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="export-modal-body">
              <p className="export-modal-subtitle">
                Choose ratings for selected annotations
              </p>
              <div className="export-modal-list">
                {detections.length > 0 ? (
                  detections.map((det) => (
                    <div key={det.id} className="export-modal-item">
                      <div className="export-modal-item-main">
                        <span className="checkbox-text">
                          {det.class_name} (
                          {Math.round((det.confidence ?? 0) * 100)}%)
                        </span>
                        <div className="rating-options">
                          {[0, 1, 2].map((value) => {
                            const isSelected = ratingById[det.id] === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                className={`rating-box ${isSelected ? "selected" : ""}`}
                                onClick={() =>
                                  handleRatingChange(det.id, value)
                                }
                                title={`Select rating ${value}`}
                                aria-label={`Rating ${value}`}
                              >
                                {value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="right-panel-empty">
                    No annotations available
                  </div>
                )}
              </div>
            </div>
            <div className="export-modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowExportModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  setShowExportModal(false);
                }}
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {fullscreenMode && (
        <div className="fullscreen-overlay" onClick={closeFullscreen}>
          <div className="fullscreen-card" onClick={(e) => e.stopPropagation()}>
            <div className="fullscreen-header">
              <span className="fullscreen-title">
                {fullscreenMode === "mask" ? "Mask" : "Patch"} Preview
                {fullscreenCount
                  ? ` (${fullscreenIndex + 1}/${fullscreenCount})`
                  : ""}
              </span>
              <div className="fullscreen-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => changeFullscreenIndex(-1)}
                  disabled={!fullscreenCount}
                  title="Previous"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => changeFullscreenIndex(1)}
                  disabled={!fullscreenCount}
                  title="Next"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => changeFullscreenZoom(-0.1)}
                  disabled={!fullscreenCount}
                  title="Zoom out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => changeFullscreenZoom(0.1)}
                  disabled={!fullscreenCount}
                  title="Zoom in"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={closeFullscreen}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div
              className="fullscreen-body"
              onMouseUp={endFullscreenPan}
              onMouseLeave={endFullscreenPan}
            >
              <div
                ref={fullscreenViewportRef}
                className={`fullscreen-viewport ${isPanningFullscreen ? "is-panning" : ""}`}
                onMouseDown={onFullscreenMouseDown}
                onMouseMove={onFullscreenMouseMove}
                onWheel={onFullscreenWheel}
              >
                <div
                  className="fullscreen-canvas"
                  style={{
                    width: `${fullscreenZoom * 100}%`,
                    height: `${fullscreenZoom * 100}%`,
                  }}
                >
                  {fullscreenItem ? (
                    <div className="preview-image">
                      <div className="preview-image-label">
                        {fullscreenItem.class_name} •{" "}
                        {Math.round((fullscreenItem.confidence ?? 0) * 100)}%
                      </div>
                      <div className="preview-image-placeholder">
                        {fullscreenItem.class_name} preview
                      </div>
                    </div>
                  ) : (
                    "Nothing to show"
                  )}
                </div>
              </div>

              <button
                type="button"
                className="fullscreen-nav-btn fullscreen-nav-btn--left"
                onClick={() => changeFullscreenIndex(-1)}
                disabled={!fullscreenCount || fullscreenIndex === 0}
                title="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="fullscreen-nav-btn fullscreen-nav-btn--right"
                onClick={() => changeFullscreenIndex(1)}
                disabled={
                  !fullscreenCount || fullscreenIndex === fullscreenCount - 1
                }
                title="Next"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
