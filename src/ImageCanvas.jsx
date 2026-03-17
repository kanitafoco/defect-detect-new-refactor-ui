import { useEffect, useMemo, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import "./App.css";
import defaultImage from "./assets/hero.png";

function ImageCanvas({
  zoom = 100,
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

  const source = file ? objectUrl : imageSrc || defaultImage;

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!imgRef.current) return;

    const updateDimensions = () => {
      const img = imgRef.current;
      setDimensions({ width: img.clientWidth, height: img.clientHeight });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [objectUrl]);

  const scale = useMemo(() => {
    if (!naturalSize.width || !naturalSize.height) return { x: 1, y: 1 };
    return {
      x: dimensions.width / naturalSize.width,
      y: dimensions.height / naturalSize.height,
    };
  }, [dimensions, naturalSize]);

  const boxes = useMemo(() => {
    return detections.map((det, index) => {
      const [x, y, w, h] = det.bbox || [0, 0, 0, 0];
      const left = x * scale.x;
      const top = y * scale.y;
      const width = w * scale.x;
      const height = h * scale.y;
      return {
        key: det.id || index,
        id: det.id || index,
        left,
        top,
        width,
        height,
        label: det.class_name || "",
        confidence: det.confidence,
        source: det.source,
        status: det.status,
      };
    });
  }, [detections, scale]);

  return (
    <div className="image-canvas">
      {!source ? (
        <div className="workspace-empty">No image loaded</div>
      ) : (
        <>
          <div className="image-info">
            {naturalSize.width} x {naturalSize.height} px · {zoom}%
          </div>
          <div
            className="image-canvas-inner"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease",
            }}
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
                if (onImageLoad) {
                  onImageLoad(width, height);
                }
              }}
            />
            {boxes.map((box) => {
              const isSelected = selectedId === box.id;
              return (
                <div
                  key={box.key}
                  className={`bbox ${isSelected ? "selected" : ""}`}
                  style={{
                    top: box.top,
                    left: box.left,
                    width: box.width,
                    height: box.height,
                  }}
                  onClick={() => onSelect?.(box.id)}
                >
                  <div className="bbox-label">
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
        </>
      )}
    </div>
  );
}

export default ImageCanvas;
