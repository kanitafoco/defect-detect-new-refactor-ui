import { useEffect, useMemo, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import "./App.css";
import defaultImage from "./assets/sample-inspection.jpg";
import PanZoomBoard from "./PanZoomBoard";

const CLASS_STYLE_MAP = {
  bolt: {
    color: "#2dd4bf",
    boxBg: "rgba(45, 212, 191, 0.14)",
    badgeBg: "rgba(13, 148, 136, 0.9)",
    text: "#ecfeff",
    muted: "#ccfbf1",
  },
  defect: {
    color: "#ef4444",
    boxBg: "rgba(239, 68, 68, 0.14)",
    badgeBg: "rgba(220, 38, 38, 0.92)",
    text: "#fef2f2",
    muted: "#fee2e2",
  },
  screw: {
    color: "#3b82f6",
    boxBg: "rgba(59, 130, 246, 0.14)",
    badgeBg: "rgba(37, 99, 235, 0.9)",
    text: "#eff6ff",
    muted: "#dbeafe",
  },
  "circuit board": {
    color: "#8b5cf6",
    boxBg: "rgba(139, 92, 246, 0.14)",
    badgeBg: "rgba(124, 58, 237, 0.9)",
    text: "#f5f3ff",
    muted: "#ede9fe",
  },
};

function getClassStyle(label) {
  const key = String(label || "")
    .trim()
    .toLowerCase();

  return (
    CLASS_STYLE_MAP[key] || {
      color: "#22d3ee",
      boxBg: "rgba(34, 211, 238, 0.14)",
      badgeBg: "rgba(14, 116, 144, 0.9)",
      text: "#ecfeff",
      muted: "#cffafe",
    }
  );
}

function getNormalizedRect(bbox, naturalSize) {
  if (!bbox) return null;

  const naturalWidth = Number(naturalSize?.width) || 0;
  const naturalHeight = Number(naturalSize?.height) || 0;

  let x;
  let y;
  let w;
  let h;

  if (Array.isArray(bbox) && bbox.length >= 4) {
    const [a, b, c, d] = bbox.map((v) => Number(v));
    if ([a, b, c, d].some((v) => !Number.isFinite(v))) return null;

    // Support both [x, y, w, h] and [x1, y1, x2, y2].
    if (c > a && d > b) {
      x = a;
      y = b;
      w = c - a;
      h = d - b;
    } else {
      x = a;
      y = b;
      w = c;
      h = d;
    }
  } else if (typeof bbox === "object") {
    const bx = Number(bbox.x ?? bbox.left ?? bbox.x1);
    const by = Number(bbox.y ?? bbox.top ?? bbox.y1);
    const bw = Number(bbox.w ?? bbox.width);
    const bh = Number(bbox.h ?? bbox.height);
    const bx2 = Number(bbox.x2);
    const by2 = Number(bbox.y2);

    if (Number.isFinite(bx) && Number.isFinite(by)) {
      x = bx;
      y = by;
      if (Number.isFinite(bw) && Number.isFinite(bh)) {
        w = bw;
        h = bh;
      } else if (Number.isFinite(bx2) && Number.isFinite(by2)) {
        w = bx2 - bx;
        h = by2 - by;
      }
    }
  }

  if (![x, y, w, h].every((v) => Number.isFinite(v))) return null;

  // Convert normalized [0..1] boxes to pixel coordinates using the source image size.
  if (
    naturalWidth > 0 &&
    naturalHeight > 0 &&
    x >= 0 &&
    y >= 0 &&
    x <= 1 &&
    y <= 1 &&
    w <= 1 &&
    h <= 1
  ) {
    x *= naturalWidth;
    y *= naturalHeight;
    w *= naturalWidth;
    h *= naturalHeight;
  }

  if (w <= 0 || h <= 0) return null;

  return { x, y, w, h };
}

function clampRectToBounds(rect, bounds) {
  const maxWidth = Number(bounds?.width) || 0;
  const maxHeight = Number(bounds?.height) || 0;

  if (maxWidth <= 0 || maxHeight <= 0) return null;

  const left = Math.max(0, Math.min(rect.x, maxWidth));
  const top = Math.max(0, Math.min(rect.y, maxHeight));
  const width = Math.max(0, Math.min(rect.w, maxWidth - left));
  const height = Math.max(0, Math.min(rect.h, maxHeight - top));

  if (width <= 0 || height <= 0) return null;
  return { left, top, width, height };
}

function ImageCanvas({
  zoom = 100,
  onZoomChange,
  imageSrc,
  file,
  detections = [],
  selectedId,
  onSelect,
  onAccept,
  onReject,
  onImageLoad,
}) {
  const imgRef = useRef(null);
  const [objectUrl, setObjectUrl] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [boardScale, setBoardScale] = useState(zoom / 100);
  const [selectedBox, setSelectedBox] = useState(null);

  useEffect(() => {
    const next = Math.max(0.5, Math.min(3, zoom / 100));
    setBoardScale(next);
  }, [zoom]);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const source = file ? objectUrl : defaultImage;

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!imgRef.current) return;

    const updateDimensions = () => {
      const img = imgRef.current;
      if (!img) return;
      setDimensions({
        width: img.clientWidth || 0,
        height: img.clientHeight || 0,
      });
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(imgRef.current);
    window.addEventListener("resize", updateDimensions);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [source]);

  const scale = useMemo(() => {
    if (!naturalSize.width || !naturalSize.height) return { x: 1, y: 1 };
    return {
      x: dimensions.width / naturalSize.width,
      y: dimensions.height / naturalSize.height,
    };
  }, [dimensions, naturalSize]);

  const boxes = useMemo(() => {
    return detections
      .map((det, index) => {
        const rect = getNormalizedRect(det.bbox, naturalSize);
        if (!rect) return null;

        const scaled = {
          x: rect.x * scale.x,
          y: rect.y * scale.y,
          w: rect.w * scale.x,
          h: rect.h * scale.y,
        };
        const bounded = clampRectToBounds(scaled, dimensions);
        if (!bounded) return null;

        const classStyle = getClassStyle(det.class_name);
        const isDashed =
          String(det.source || "")
            .toLowerCase()
            .includes("ai") && index % 2 === 1;
        const confidenceRank =
          typeof det.confidence === "number"
            ? Math.round(det.confidence * 100)
            : 0;

        return {
          key: det.id || index,
          id: det.id || index,
          index,
          left: bounded.left,
          top: bounded.top,
          width: bounded.width,
          height: bounded.height,
          label: det.class_name || "",
          confidence: det.confidence,
          source: det.source,
          status: det.status,
          classStyle,
          isDashed,
          zIndex: 200 + confidenceRank + index,
        };
      })
      .filter(Boolean);
  }, [detections, naturalSize, scale, dimensions]);

  useEffect(() => {
    console.log("[ImageCanvas] detections:", detections);
  }, [detections]);

  useEffect(() => {
    console.log("[ImageCanvas] boxes:", boxes, {
      dimensions,
      naturalSize,
      scale,
    });
  }, [boxes, dimensions, naturalSize, scale]);

  useEffect(() => {
    if (selectedId === undefined || selectedId === null) return;
    const matched = boxes.find((box) => box.id === selectedId);
    if (matched) {
      setSelectedBox(matched.index);
    }
  }, [selectedId, boxes]);

  useEffect(() => {
    if (selectedBox === null) return;
    const selected = boxes.find((box) => box.index === selectedBox);
    if (!selected) {
      setSelectedBox(null);
      return;
    }

    console.log("[ImageCanvas] selected detection:", {
      selectedBox,
      id: selected.id,
      label: selected.label,
      confidence: selected.confidence,
    });
  }, [selectedBox, boxes]);

  return (
    <div className="image-canvas">
      {!source ? (
        <div className="workspace-empty">No image loaded</div>
      ) : (
        <>
          <div className="image-info">
            {naturalSize.width} x {naturalSize.height} px ·
            {Math.round(boardScale * 100)}%
          </div>
          <PanZoomBoard
            minZoom={0.5}
            maxZoom={3}
            scale={boardScale}
            onScaleChange={(nextScale) => {
              setBoardScale(nextScale);
              if (onZoomChange) {
                onZoomChange(Math.round(nextScale * 100));
              }
            }}
            style={{ backgroundImage: "none" }}
          >
            <div
              className="image-canvas-inner"
              style={{ position: "relative" }}
            >
              <img
                ref={imgRef}
                src={source}
                alt="Annotation"
                className="canvas-image"
                onLoad={(event) => {
                  const width = event.target.naturalWidth;
                  const height = event.target.naturalHeight;
                  setNaturalSize({ width, height });
                  setDimensions({
                    width: event.target.clientWidth || 0,
                    height: event.target.clientHeight || 0,
                  });
                  if (onImageLoad) {
                    onImageLoad(width, height);
                  }
                }}
              />
              <div
                className="image-overlay-layer"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 10,
                }}
              >
                {boxes.map((box) => {
                  const isSelected = selectedBox === box.index;
                  return (
                    <div
                      key={box.key}
                      className={`bbox ${box.isDashed ? "dashed" : ""} ${isSelected ? "selected" : ""}`}
                      style={{
                        position: "absolute",
                        top: box.top,
                        left: box.left,
                        width: box.width,
                        height: box.height,
                        zIndex: isSelected ? 2500 : box.zIndex,
                        borderColor: box.classStyle.color,
                        background: box.classStyle.boxBg,
                        borderWidth: isSelected ? 3 : 2,
                        borderRadius: 10,
                        boxSizing: "border-box",
                        outline: `1px solid ${box.classStyle.color}66`,
                        boxShadow: isSelected
                          ? `0 0 0 2px ${box.classStyle.color}66, 0 10px 24px rgba(0, 0, 0, 0.35)`
                          : "0 6px 14px rgba(0, 0, 0, 0.22)",
                        pointerEvents: "auto",
                        cursor: "pointer",
                        borderStyle: box.isDashed ? "dashed" : "solid",
                        "--bbox-color": box.classStyle.color,
                        "--bbox-label-bg": box.classStyle.badgeBg,
                        "--bbox-label-text": box.classStyle.text,
                        "--bbox-label-muted": box.classStyle.muted,
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBox(box.index);
                        onSelect?.(box.id);
                      }}
                    >
                      <div
                        className="bbox-label"
                        style={{ position: "absolute", top: -28, left: 0 }}
                      >
                        <span className="bbox-name">{box.label}</span>
                        {typeof box.confidence === "number" ? (
                          <span className="bbox-confidence">
                            {(box.confidence * 100).toFixed(0)}%
                          </span>
                        ) : null}
                      </div>
                      {isSelected ? (
                        <div className="bbox-actions">
                          <button
                            type="button"
                            className="bbox-action-btn bbox-action-btn-accept"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAccept?.(box.id);
                            }}
                            title="Accept"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            className="bbox-action-btn bbox-action-btn-reject"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReject?.(box.id);
                            }}
                            title="Reject"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </PanZoomBoard>
        </>
      )}
    </div>
  );
}

export default ImageCanvas;
