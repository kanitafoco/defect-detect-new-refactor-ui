import { useEffect, useMemo, useRef, useState } from "react";
import {
  Move,
  Square,
  Circle,
  PenTool,
  Hexagon,
  Eraser,
  Sparkles,
  FileText,
  Search,
} from "lucide-react";
import "./App.css";

function SidebarTools({ expanded = true, onToggleExpand }) {
  const [activeTool, setActiveTool] = useState("Pointer");
  const [selectedColor, setSelectedColor] = useState("#2dd4bf");
  const [thickness, setThickness] = useState("20px");
  const [thicknessOpen, setThicknessOpen] = useState(false);
  const pickerRef = useRef(null);

  const toolSections = useMemo(
    () => [
      {
        title: "ANNOTATE",
        items: [
          { key: "Pointer", label: "Pointer", icon: <Move size={18} /> },
          { key: "Rectangle", label: "Rectangle", icon: <Square size={18} /> },
          { key: "Ellipse", label: "Ellipse", icon: <Circle size={18} /> },
          { key: "Freehand", label: "Freehand", icon: <PenTool size={18} /> },
        ],
      },
      {
        title: "MARKERS",
        items: [{ key: "Eraser", label: "Eraser", icon: <Eraser size={18} /> }],
      },
      {
        title: "COLOR",
        palette: true,
        paletteColors: ["#2dd4bf", "#818cf8", "#3b82f6", "#ef4444", "#f59e0b"],
      },
      {
        title: "THICKNESS",
        picker: true,
        value: "5px",
      },
      {
        title: "AI",
        items: [
          {
            key: "SmartPropagate",
            label: "Auto Annotate",
            icon: <Sparkles size={18} />,
          },
          {
            key: "DefectScan",
            label: "Defect Scan",
            icon: <Search size={18} />,
          },
          {
            key: "PatchExtract",
            label: "Report",
            icon: <FileText size={18} />,
          },
        ],
      },
    ],
    [],
  );

  const topSections = useMemo(() => toolSections.slice(0, 4), [toolSections]);
  const bottomSections = useMemo(() => toolSections.slice(4), [toolSections]);

  const renderSection = (section) => (
    <div key={section.title} className="tool-section">
      <div className="tool-section-title">{section.title}</div>
      <div className="tools-group">
        {section.items?.map((tool) => {
          const isActive = tool.key === activeTool;
          return (
            <button
              key={tool.key}
              type="button"
              className={`tool-button ${isActive ? "active" : ""}`}
              onClick={() => setActiveTool(tool.key)}
            >
              <span className="tool-icon" aria-hidden="true">
                {tool.icon}
              </span>
              {expanded ? (
                <span className="tool-label">{tool.label}</span>
              ) : null}
            </button>
          );
        })}

        {section.palette ? renderPalette(section.paletteColors) : null}
        {section.picker ? renderPicker(section.value) : null}
      </div>
    </div>
  );

  const thicknessOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65];

  const renderPalette = (colors) => {
    return (
      <div className="palette">
        {colors.map((color) => {
          const isSelected = color === selectedColor;
          return (
            <button
              key={color}
              type="button"
              className={`palette-swatch${isSelected ? " selected" : ""}`}
              style={{ background: color }}
              aria-label={`Color ${color}`}
              onClick={() => setSelectedColor(color)}
            />
          );
        })}
      </div>
    );
  };

  const renderPicker = () => (
    <div
      ref={pickerRef}
      className="picker-control"
      onClick={() => setThicknessOpen((prev) => !prev)}
      role="button"
      aria-haspopup="listbox"
      aria-expanded={thicknessOpen}
      tabIndex={0}
    >
      <span className="picker-value">{thickness}</span>
      <span className="picker-arrows" aria-hidden>
        {thicknessOpen ? "▲" : "▼"}
      </span>
      {thicknessOpen ? (
        <div className="picker-dropdown" role="listbox">
          {thicknessOptions.map((size) => {
            const value = `${size}px`;
            const isSelected = value === thickness;
            return (
              <button
                key={value}
                type="button"
                className={`picker-item${isSelected ? " selected" : ""}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setThickness(value);
                  setThicknessOpen(false);
                }}
              >
                <span className="picker-item-label">{value}</span>
                {isSelected ? (
                  <span className="picker-item-check">✓</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  useEffect(() => {
    if (!thicknessOpen) return;

    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setThicknessOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [thicknessOpen]);

  return (
    <div
      className={`tools-panel ${expanded ? "expanded" : "collapsed"}`}
      role="toolbar"
      aria-label="Annotation tools"
    >
      <div className="tools-header">
        <button
          type="button"
          className="tools-toggle"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          onClick={onToggleExpand}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="sidebar-top">
        {topSections.map((section) => renderSection(section))}
      </div>

      <div className="sidebar-bottom">
        {bottomSections.map((section) => renderSection(section))}
      </div>
    </div>
  );
}

export default SidebarTools;
