import { useState } from "react";
import HomeScreen from "./HomeScreen";
import AnnotationScreen from "./AnnotationScreen";
import "./App.css";

function App() {
  const [view, setView] = useState("home");
  const [selectedFile, setSelectedFile] = useState(null);
  const [detectionResults, setDetectionResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStartAnnotation = () => {
    setView("annotation");
    setError(null);
  };

  const handleBackHome = () => {
    setView("home");
    setSelectedFile(null);
    setDetectionResults(null);
    setError(null);
    setLoading(false);
  };

  const handleImageSelect = (file) => {
    setSelectedFile(file);
    setDetectionResults(null);
    setError(null);
  };

  const handleUpload = async (file) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results = await response.json();
      setDetectionResults(results);
    } catch (err) {
      setError(`Failed to upload image: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {view === "home" ? (
        <HomeScreen
          onLoadImage={handleStartAnnotation}
          onLoadMultiple={handleStartAnnotation}
          onLoadSession={handleStartAnnotation}
          error={error}
        />
      ) : (
        <AnnotationScreen
          file={selectedFile}
          results={detectionResults}
          loading={loading}
          error={error}
          onBack={handleBackHome}
          onLogoClick={handleBackHome}
          onFileSelect={handleImageSelect}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}

export default App;
