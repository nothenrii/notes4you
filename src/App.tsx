import { useState, useEffect } from "react";
import "./App.css";
import Piano from "./components/Piano";
import { BackgroundLines } from "./components/ui/background-lines";
import { TextHoverEffect } from "./components/ui/text-hover-effect";
import { audioManager } from "./utils/audioUtils";

function App() {
  const [refreshTrigger] = useState(0);

  // Initialize audio context on app load
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await audioManager.startAudioContext();
        // Audio context initialized on app load
      } catch (error) {
        // Failed to initialize audio context on load
      }
    };

    // Start audio context immediately instead of waiting
    initializeAudio();
  }, []);

  const handleAppClick = async () => {
    // Start audio context on any user interaction
    try {
      await audioManager.startAudioContext();
    } catch (error) {
      // Failed to start audio context
    }
  };

  return (
    <BackgroundLines className="min-h-screen flex full-width flex-col">
      <div className="App relative z-10" onClick={handleAppClick}>
        <div className="piano-section">
          <header className="App-header">
            <div className="title-container">
              <TextHoverEffect text="notes 4 zan" />
            </div>
          </header>

          <main className="piano-container">
            <Piano key={refreshTrigger} />
          </main>
        </div>
      </div>
    </BackgroundLines>
  );
}

export default App;
