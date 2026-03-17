import "./App.css";

function HomeScreen({ onLoadImage, onLoadMultiple, onLoadSession, error }) {
  const Card = ({ title, description, onClick, icon }) => (
    <button type="button" className="home-card" onClick={onClick}>
      <div className="home-card-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="home-card-body">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </button>
  );

  return (
    <div className="home-screen">
      <div className="home-hero">
        <div className="home-logo" aria-hidden="true">
          <svg
            width="52"
            height="52"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="home-logo-svg"
          >
            <path
              d="M12 2C7.582 2 4 5.582 4 10c0 2.243.914 4.28 2.4 5.735A6.996 6.996 0 0 0 6 18c0 3.866 3.134 7 7 7s7-3.134 7-7a6.996 6.996 0 0 0-0.4-2.265A7.955 7.955 0 0 0 20 10c0-4.418-3.582-8-8-8Z"
              fill="#FF7A00"
            />
            <path
              d="M12 6.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"
              fill="#FFF"
              opacity="0.8"
            />
          </svg>
        </div>
        <h1 className="home-title">AnnotIQ</h1>
        <p className="home-subtitle">AI-Assisted Annotation Platform</p>
      </div>

      <div className="home-cards">
        <Card
          title="Load Image"
          description="Open a single image for annotation"
          onClick={onLoadImage}
          icon={<span className="home-icon">🖼️</span>}
        />
        <Card
          title="Load Multiple Images"
          description="Open a folder with multiple images"
          onClick={onLoadMultiple}
          icon={<span className="home-icon">📁</span>}
        />
        <Card
          title="Load Session"
          description="Resume a previously saved session"
          onClick={onLoadSession}
          icon={<span className="home-icon">⏳</span>}
        />
      </div>

      {error ? <div className="home-error">{error}</div> : null}

      <div className="home-hint">
        Supports PNG, JPG, TIFF, BMP · Drag and drop anywhere to begin
      </div>
    </div>
  );
}

export default HomeScreen;
