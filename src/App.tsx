import { useRef, useEffect, useState } from 'react';
import './App.css';
import * as faceapi from 'face-api.js';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  useEffect(() => {
    startVideo();
    loadModels();
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  // Start webcam video
  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((currentStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      })
      .catch((err) => console.error(err));
  };

  // Load face-api.js models
  const loadModels = () => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models")
    ]).then(() => {
      if (isDetecting) startDetection();
    });
  };

  // Start face detection on a set interval
  const startDetection = () => {
    detectionIntervalRef.current = window.setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
          .withFaceLandmarks()
          .withFaceExpressions();

        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
        };
        faceapi.matchDimensions(canvasRef.current, displaySize);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const context = canvasRef.current.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
        }
      }
    }, 1000);
  };

  // Stop face detection
  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
      if (canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  // Toggle detection on/off
  const toggleDetection = () => {
    if (isDetecting) {
      stopDetection();
      setIsDetecting(false);
    } else {
      setIsDetecting(true);
      startDetection();
    }
  };

  // Capture a snapshot from the video feed
  const takeSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = tempCanvas.toDataURL('image/png');
        setSnapshot(dataUrl);
      }
    }
  };

  return (
    <>
      <header className="app-header">
        <h1>Realtime Facial Emotion Recognition System</h1>
      </header>
      <div className="myapp">
        <p className="project-description">
          Welcome to our Realtime Facial Emotion Recognition project! Using CNN, this app detects faces, landmarks, and expressions in real-time from your webcam. Toggle detection on/off and capture snapshots of the live feed to explore this cool experiment with modern web technologies.
        </p>
        <div className="video-container">
          <video
            crossOrigin="anonymous"
            ref={videoRef}
            autoPlay
            muted
            playsInline
          ></video>
          <canvas ref={canvasRef} className="appcanvas" />
        </div>
        <div className="buttons">
          <button className="toggle-btn" onClick={toggleDetection}>
            {isDetecting ? "Pause Detection" : "Start Detection"}
          </button>
          <button className="snapshot-btn" onClick={takeSnapshot}>
            Take Snapshot
          </button>
        </div>
        {snapshot && (
          <div className="snapshot-container">
            <h2>Snapshot</h2>
            <img src={snapshot} alt="Snapshot" className="snapshot-img" />
          </div>
        )}
      </div>
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Executive Tech. All rights reserved.</p>
      </footer>
    </>
  );
}

export default App;
