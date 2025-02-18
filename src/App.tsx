import { useRef, useEffect, useState } from 'react';
import './App.css';
import * as faceapi from 'face-api.js';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    startVideo();
    loadModels();
    return () => {
      // Clear the detection interval when component unmounts
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
      .catch((err) => {
        console.error(err);
      });
  };

  // Load models from face-api.js
  const loadModels = () => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models")
    ]).then(() => {
      if (isDetecting) {
        startDetection();
      }
    });
  };

  // Start face detection and drawing results on the canvas
  const startDetection = () => {
    detectionIntervalRef.current = window.setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
          .withFaceLandmarks()
          .withFaceExpressions();

        // Use the actual video dimensions for display size
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
        };
        faceapi.matchDimensions(canvasRef.current, displaySize);

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const context = canvasRef.current.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }

        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
      }
    }, 1000);
  };

  // Stop the face detection
  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
      // Clear the canvas when detection is paused
      if (canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
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

  return (
    <div className="myapp">
      <h1>RealTime Facial Emotion Detection System</h1>
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
      <button className="toggle-btn" onClick={toggleDetection}>
        {isDetecting ? "Pause Detection" : "Start Detection"}
      </button>
    </div>
  );
}

export default App;
