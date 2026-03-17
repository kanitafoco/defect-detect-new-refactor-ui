import { useMemo, useState } from "react";
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
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
  const [expandPreview, setExpandPreview] = useState(true);
  const [expandMasks, setExpandMasks] = useState(true);
  const [expandPatchView, setExpandPatchView] = useState(true);
  const [expandExportOptions, setExpandExportOptions] = useState(true);

  const [maskExport, setMaskExport] = useState(false);
  const [jsonCollective, setJsonCollective] = useState(true);
  const [jsonIndividual, setJsonIndividual] = useState(false);
  const [yoloExport, setYoloExport] = useState(false);
  const [pascalExport, setPascalExport] = useState(false);

  const selected = useMemo(
    () => detections.find((det) => det.id === selectedId),
    [detections, selectedId],
  );

  const pending = detections.filter((det) => det.status !== "confirmed");
  const confirmed = detections.filter((det) => det.class_name !== "Defect");

  return (
    <aside className="right-panel">
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
                    <button type="button" className="secondary-btn">
                      Show Masks
                    </button>
                    <button type="button" className="secondary-btn">
                      Preview Patches
                    </button>
                  </div>
                )}
              </div>

              <div className="right-panel-section">
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
                {expandMasks && <div className="preview-box">Mask preview</div>}
              </div>

              <div className="right-panel-section">
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
                {expandPatchView && (
                  <div className="preview-box">Patch view</div>
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
                <button type="button" className="secondary-btn">
                  <Layers size={14} style={{ marginRight: 6 }} />
                  Export Selected Patches
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
