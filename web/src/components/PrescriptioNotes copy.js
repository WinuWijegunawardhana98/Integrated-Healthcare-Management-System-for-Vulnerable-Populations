import React, { useState } from "react";
import axios from "axios";
import ENV from "../data/Env";

const PrescriptionNotes = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [parsedInfo, setParsedInfo] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [newMedicine, setNewMedicine] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newSchedule, setNewSchedule] = useState("");

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
    const user = "john_doe";  // Replace with actual logged-in user

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
        console.log("Prescription uploaded:", data);
    } catch (error) {
        console.error("Error uploading prescription:", error);
    }
};

  

  const parseMedicalDetails = (text) => {
    console.log(text);
    const popularMedicines = ["Paracetamol", "Ibuprofen", "Aspirin", "Amoxicillin", "Ciprofloxacin", "Hexigel", "Augmentin", "Digoxin"];
    const details = [];

    popularMedicines.forEach((med) => {
        const regex = new RegExp(`\\b${med}\\b`, "i"); // Case-insensitive whole word match
        if (regex.test(text)) {
            // Extract dosage and interval if the medicine is found
            const match = text.match(new RegExp(`${med}\\s*(\\d+mg|\\d+ml|\\d+\\/\\d+).*?(\\d+ (days|times|h))?`, "i"));
            
            if (match) {
                details.push({
                    name: med,
                    dosage: match[1] || "Unknown",
                    interval: match[2] || "Unknown",
                    isPopular: true,
                });
            } else {
                details.push({
                    name: med,
                    dosage: "Unknown",
                    interval: "Unknown",
                    isPopular: true,
                });
            }
        }
    });

    return details;
};

  

  const handleEdit = (index, isManual) => {
    const itemToEdit = isManual ? schedule[index] : parsedInfo[index];
    const updatedName = prompt("Edit Medicine Name:", itemToEdit.name || itemToEdit[0]);
    const updatedDosage = prompt("Edit Dosage:", itemToEdit.dosage || itemToEdit[1]);
    const updatedInterval = prompt("Edit Interval:", itemToEdit.interval || itemToEdit[2]);
  
    if (updatedName && updatedDosage && updatedInterval) {
      const updatedInfo = isManual ? [...schedule] : [...parsedInfo];
      updatedInfo[index] = {
        name: updatedName,
        dosage: updatedDosage,
        interval: updatedInterval,
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
            if (newMedicine && newDosage && newSchedule) {
              setParsedInfo([
                ...(parsedInfo || []),
                { name: newMedicine, dosage: newDosage, interval: newSchedule },
              ]);
              setSchedule([
                ...(schedule || []),
                { name: newMedicine, dosage: newDosage, interval: newSchedule },
              ]);
              setNewMedicine("");
              setNewDosage("");
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
            type="number"
            placeholder="Dosage"
            value={newDosage}
            onChange={(e) => setNewDosage(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Schedule"
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
                  <strong>Interval:</strong> {item.interval}
                </p>
                <button
                  style={styles.button}
                  onClick={() => handleEdit(index, false)}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {schedule && (
        <div style={styles.section}>
          <h3>Drug Schedule:</h3>
          <ul style={styles.list}>
            {schedule.map((item, index) => (
              <li key={index} style={styles.listItem}>
                {item.name} - {item.dosage} - {item.interval}
                <button
                  style={styles.button}
                  onClick={() => handleEdit(index, true)}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button style={styles.button} onClick={handlePrescriptionsUpload} disabled={loading}>
          {"Upload Schedule"}
      </button>
    </div>
  );
};

export default PrescriptionNotes;
