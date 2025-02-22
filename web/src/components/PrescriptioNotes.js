import React, { useState } from "react";
import axios from "axios";
import ENV from "../data/Env";
import Notiflix from "notiflix";

const PrescriptionNotes = ({user}) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [parsedInfo, setParsedInfo] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [newMedicine, setNewMedicine] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newSchedule, setNewSchedule] = useState("");
  const [newDays, setNewDays] = useState(""); 


  const timeKeywords = ["morning", "afternoon", "evening", "before meal", "after meal"];

  console.log(parsedInfo)

  // Handle file input change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const response = await axios.post(`${ENV.SERVER}/api/parse-prescription-google`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      if (response.data.error) {
        setError(response.data.error);
      } else {
        const text = response.data.recognized_text;
        console.log(response.data);
        setRecognizedText(text);
        const extractedDetails = parseMedicalDetails(text);
        setParsedInfo(extractedDetails);
      }
    } catch (err) {
      setError("Failed to upload and parse prescription.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrescriptionsUpload = async () => {
    // const user = "john_doe";  // Replace with actual logged-in user

    const requestBody = {
        user,
        medicines: parsedInfo
    };

    try {
        const response = await fetch(ENV.SERVER+"/prescriptionSchedule", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        Notiflix.Notify.success('Upload and parsing successful!');

    } catch (error) {
        Notiflix.Notify.failure("Failed to upload and parse prescription.");
    }
  };

    

  const parseMedicalDetails = (text) => {
    console.log(text);
    const popularMedicines = [
      "Paracetamol",
      "Ibuprofen",
      "Aspirin",
      "Amoxicillin",
      "Ciprofloxacin",
      "Hexigel",
      "Augmentin",
      "Digoxin",
      "Enzflam",
      "PanD",
    ];
    const timeKeywords = ["morning", "afternoon", "evening", "before meal", "after meal"];
  
    // Patterns for dosage, intervals, and days
    const dosagePattern = /(\d+mg|\d+ml|\d+\/\d+)/i;
    const daysPattern = /x\s*(\d+)\s*days/i;
    const intervalPattern = /(morning|afternoon|evening|before meal|after meal|1-0-1|1-0-0|0-1-0|0-0-1|1-1-1)/gi;
  
    const details = [];
  
    popularMedicines.forEach((med) => {
      const regex = new RegExp(`\\b${med}\\b`, "i"); // Case-insensitive whole word match
      if (regex.test(text)) {
        // Extract dosage
        const dosageMatch = text.match(new RegExp(`${med}\\s*${dosagePattern.source}`, "i"));
        const dosage = dosageMatch ? dosageMatch[1] || "Unknown" : "Unknown";
  
        // Extract days
        const daysMatch = text.match(new RegExp(`${med}\\s*${daysPattern.source}`, "i"));
        const days = daysMatch ? `${daysMatch[1]} days` : "Unknown";
  
        // Extract associated time keywords and dosage schedules
        let foundIntervals = [];
        let match;
        while ((match = intervalPattern.exec(text)) !== null) {
          foundIntervals.push(match[0]); // Store all occurrences
        }
  
        // Ensure unique intervals
        const interval = foundIntervals.length > 0 ? [...new Set(foundIntervals)] : ["Unknown"];
  
        details.push({
          name: med,
          dosage: dosage,
          interval: interval, // Store as an array of structured tokens
          days: days, // Store extracted days
          isPopular: true,
        });
      }
    });
  
    return details;
  };
  

  const handleRemoveInterval = (medicineIndex, intervalIndex) => {
    setParsedInfo((prev) =>
      prev.map((item, index) =>
        index === medicineIndex
          ? { ...item, interval: item.interval.filter((_, i) => i !== intervalIndex) }
          : item
      )
    );
  };
  

  const removeToken = (medIndex, token) => {
    setParsedInfo((prev) =>
      prev.map((med, index) =>
        index === medIndex
          ? { ...med, interval: med.interval.filter((t) => t !== token) }
          : med
      )
    );
  };

  // Add new token
  const addToken = (medIndex, newToken) => {
    setParsedInfo((prev) =>
      prev.map((med, index) =>
        index === medIndex && !med.interval.includes(newToken)
          ? { ...med, interval: [...med.interval, newToken] }
          : med
      )
    );
  };

  

  const handleEdit = (index, isManual) => {
    const itemToEdit = isManual ? schedule[index] : parsedInfo[index];
  
    const updatedName = prompt("Edit Medicine Name:", itemToEdit.name || itemToEdit[0]);
    const updatedDosage = prompt("Edit Dosage:", itemToEdit.dosage || itemToEdit[1]);
    const updatedDays = prompt("Edit Days:", itemToEdit.days || "Unknown"); // Edit days separately
  
    // Convert interval into a comma-separated list for editing
    const updatedIntervalStr = prompt(
      "Edit Interval (comma-separated):",
      itemToEdit.interval ? itemToEdit.interval.join(", ") : "Unknown"
    );
  
    if (updatedName && updatedDosage && updatedDays && updatedIntervalStr) {
      const updatedInfo = isManual ? [...schedule] : [...parsedInfo];
      updatedInfo[index] = {
        name: updatedName,
        dosage: updatedDosage,
        days: updatedDays, // Store edited days
        interval: updatedIntervalStr.split(",").map((item) => item.trim()), // Convert back to array
      };
      
      isManual ? setSchedule(updatedInfo) : setParsedInfo(updatedInfo);
    }
  };
  
  

  const styles = {
    container: {
      padding: "20px",
      maxWidth: "600px",
      margin: "0 auto",
      fontFamily: "'Arial', sans-serif",
      border: "1px solid #ddd",
      borderRadius: "8px",
      backgroundColor: "#f9f9f9",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    header: {
      textAlign: "center",
      color: "#333",
    },
    input: {
      display: "block",
      margin: "10px auto",
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      width: "100%",
    },
    fileDisplay: {
      display: "flex",
      backgroundColor: '#7ad8be',
      alignItems: "center",
      justifyContent: "center",
      margin: "10px auto",
      borderRadius: "10px",
      padding: "10px"
    },
    fileIcon: {
      width: "60px",
      height: "60px",
      marginRight: "10px",
    },
    texts: {
      textAlign: "left"
    },
    fileName: {
      fontSize: "16px",
      fontWeight: "bold",
    },
    fileType: {
      fontSize: "14px",
      color: "#555",
    },
    
    button: {
      display: "block",
      width: "100%",
      padding: "10px",
      backgroundColor: "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      marginTop: "10px",
    },
    error: {
      color: "red",
      textAlign: "center",
      marginTop: "10px",
    },
    section: {
      marginTop: "20px",
    },
    list: {
      listStyleType: "none",
      padding: 0,
    },
    listItem: {
      backgroundColor: "#fff",
      padding: "10px",
      margin: "5px 0",
      border: "1px solid #ddd",
      borderRadius: "4px",
    },
    bold: {
      fontWeight: "bold",
    },
  };

  return (
    <div className="recentOrders">
      <h2>Upload Medical Documents</h2>
      <br />
      <p className="prepare-info">
        Upload medical documents / prescription notes here.
      </p>
      <div style={{ textAlign: "center" }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={styles.input}
        />
        {file && (
          <div style={styles.fileDisplay}>
            <img
              src="https://images.freeimages.com/fic/images/icons/2813/flat_jewels/512/file.png"
              alt="File Icon"
              style={styles.fileIcon}
            />
            <div style={styles.texts}>
              <div style={styles.fileName}>{file.name}</div>
              <div style={styles.fileType}>
                <strong>{file.type}</strong>
              </div>
            </div>
          </div>
        )}
        <button style={styles.button} onClick={handleUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div style={styles.section}>
        <h3>Add New Medicine:</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newMedicine && newDosage && newDays && newSchedule) {
              const newEntry = {
                name: newMedicine,
                dosage: newDosage,
                days: newDays, // Store days separately
                interval: newSchedule.split(",").map((item) => item.trim()), // Convert schedule to array
              };

              setParsedInfo([...(parsedInfo || []), newEntry]);
              setSchedule([...(schedule || []), newEntry]);

              // Reset input fields
              setNewMedicine("");
              setNewDosage("");
              setNewDays("");
              setNewSchedule("");
            }
          }}
        >
          <input
            type="text"
            placeholder="Medicine Name"
            value={newMedicine}
            onChange={(e) => setNewMedicine(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Dosage"
            value={newDosage}
            onChange={(e) => setNewDosage(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Days (e.g., 5 days)"
            value={newDays}
            onChange={(e) => setNewDays(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Schedule (comma-separated)"
            value={newSchedule}
            onChange={(e) => setNewSchedule(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Add Medicine
          </button>
        </form>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {recognizedText && (
        <div style={styles.section}>
          <h3>Recognized Text:</h3>
          <p>{recognizedText}</p>
        </div>
      )}

{parsedInfo && (
  <div style={styles.section}>
    <h3>Parsed Prescription Details:</h3>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
      {parsedInfo.map((item, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #ddd",
            padding: "10px",
            borderRadius: "8px",
            width: "calc(50% - 10px)",
            backgroundColor: "#fff",
          }}
        >
          <p>
            <strong>Medicine:</strong> {item.name}
          </p>
          <p>
            <strong>Dosage:</strong> {item.dosage}
          </p>
          <p>
            <strong>Days:</strong> {item.days}
          </p>
          <p>
            <strong>Interval:</strong>{" "}
            {item.interval.map((time, i) => (
              <span
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: "#d4edda",
                  color: "#155724",
                  padding: "5px 10px",
                  borderRadius: "15px",
                  marginRight: "5px",
                  fontSize: "14px",
                }}
              >
                {time}
                <button
                  onClick={() => handleRemoveInterval(index, i)}
                  style={{
                    marginLeft: "5px",
                    background: "none",
                    border: "none",
                    color: "#721c24",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ✖
                </button>
              </span>
            ))}
          </p>
          <button style={styles.button} onClick={() => handleEdit(index, false)}>
            Edit
          </button>
        </div>
      ))}
    </div>
  </div>
)}


      {schedule && (
        <div style={styles.section}>
        <h3>Parsed Prescription Details:</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {parsedInfo.map((item, index) => (
            <div key={index} style={styles.card}>
              <p><strong>Medicine:</strong> {item.name}</p>
              <p><strong>Dosage:</strong> {item.dosage}</p>
  
              {/* Interval Tokens */}
              <p><strong>Interval:</strong></p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {item.interval.map((token, i) => (
                  <span key={i} style={styles.token}>
                    {token} <button onClick={() => removeToken(index, token)} style={styles.removeBtn}>❌</button>
                  </span>
                ))}
                <select style={styles.dropdown} onChange={(e) => addToken(index, e.target.value)}>
                  <option value="">+ Add Interval</option>
                  {timeKeywords.map((keyword, i) => (
                    <option key={i} value={keyword}>{keyword}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
      <button style={styles.button} onClick={handlePrescriptionsUpload} disabled={loading}>
          {"Upload Schedule"}
      </button>
    </div>
  );
};

export default PrescriptionNotes;
