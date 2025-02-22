import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaFileUpload, FaCamera } from 'react-icons/fa';
import './forms.css';

const ProfilePictureUpload = () => {
  const location = useLocation();
  const navigate = useNavigate()
  const { id, username } = location.state || {};
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(`${process.env.PUBLIC_URL}/anim/id.gif`);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const webcamRef = useRef(null);
  const [webcamImage, setWebcamImage] = useState(null);

  useEffect(() => {
    if (isWebcamActive) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          webcamRef.current.srcObject = stream;
        })
        .catch((error) => {
          console.error('Error accessing webcam:', error);
          alert('Unable to access webcam.');
        });
    }

    return () => {
      if (webcamRef.current && webcamRef.current.srcObject) {
        const stream = webcamRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isWebcamActive]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop(); // Extract the file extension
      const newFileName = `${username}.${fileExtension}`; // Construct the new file name
      const renamedFile = new File([file], newFileName, { type: file.type }); // Create a new File object

      setSelectedFile(renamedFile);
      setPreview(URL.createObjectURL(renamedFile));
    }
  };

  const handleSnapshot = () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = webcamRef.current.videoWidth;
    canvas.height = webcamRef.current.videoHeight;
    context.drawImage(webcamRef.current, 0, 0, canvas.width, canvas.height);
    const imageUrl = canvas.toDataURL('image/png');
    setWebcamImage(imageUrl);
    setPreview(imageUrl); // Update preview with webcam snapshot
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile && !webcamImage) {
      alert('Please select or take a photo to upload.');
      return;
    }

    // Stop the webcam stream if it's active
    if (webcamRef.current && webcamRef.current.srcObject) {
      const tracks = webcamRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop()); // Stop all tracks
    }

    const formData = new FormData();
    const fileToUpload = selectedFile || new File([dataURLtoBlob(webcamImage)], `${username}.png`, { type: 'image/png' });
    formData.append('file', fileToUpload);

    try {
      const response = await axios.post('http://localhost:8000/face-detection/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('File uploaded successfully');
      navigate('/sign-in');
    } catch (error) {
      console.error('Error uploading file', error);
      alert('Error uploading file');
    }
  };

  const dataURLtoBlob = (dataURL) => {
    const byteString = atob(dataURL.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uintArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uintArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([uintArray], { type: 'image/png' });
  };

  return (
    <div className="signup-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Upload Profile Picture</h2>
        <img src={`${process.env.PUBLIC_URL}/anim/id.gif`} alt="Upload Profile" />
        <p>Upload your profile picture to personalize your account.</p>
      </div>

      {/* Form Section */}
      <div className="form-container">
        <h2>Profile Picture Upload</h2>
        <form onSubmit={handleSubmit}>
        <div className="row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          {/* Card for File Upload */}
          <div
            className="form-group"
            style={{
              flex: 1,
              border: '1px solid #ddd',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              backgroundColor: '#fff',
            }}
          >
            <FaFileUpload size={40} color="#007bff" style={{ marginBottom: '10px' }} />
            <h4>Upload Profile Image</h4>
            <input type="file" onChange={handleFileChange} style={{ marginTop: '10px' }} />
          </div>

          {/* Card for Webcam */}
          <div
            className="form-group"
            style={{
              flex: 1,
              border: '1px solid #ddd',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              backgroundColor: '#fff',
            }}
          >
            <FaCamera size={40} color="#28a745" style={{ marginBottom: '10px' }} />
            <h4>Or Take a Profile Picture Using Webcam</h4>
            {isWebcamActive ? (
              <div>
                <video
                  ref={webcamRef}
                  autoPlay
                  width="100%"
                  height="auto"
                  style={{
                    borderRadius: '10px',
                    objectFit: 'cover',
                    marginBottom: '10px',
                    maxHeight: '200px',
                    width: '100%',
                  }}
                ></video>
                <button
                  type="button"
                  onClick={handleSnapshot}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    border: 'none',
                    color: 'white',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Take Snapshot
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsWebcamActive(true)}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  border: 'none',
                  color: 'white',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Start Webcam
              </button>
            )}
          </div>
        </div>

          <div className="image-preview">
            <img
              src={preview}
              alt="Image Preview"
              style={{ width: '100%', height: '400px', objectFit: 'contain' }}
            />
          </div>

          <button type="submit" className="upload-button">
            Upload
          </button>
          <p className="back-link">
            <Link to="/">Back to Home</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
