import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import ENV from '../data/Env';

const MedicationSchedule = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [medications, setMedications] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [ticks, setTicks] = useState({});
  const [selectedMeds, setSelectedMeds] = useState([]); 
  const [updatedMedicationsForDate, setUpdatedMedicationsForDate] = useState([]);

  // console.log(user)

  useEffect(() => {
    fetchPrescriptions(user);
  }, [user]);

  const fetchPrescriptions = async (user) => {
    try {
      const response = await axios.get(`${ENV.SERVER}/prescriptionSchedule/${user}`);
      // console.log(response.data);

      if (response.data.prescriptions && response.data.prescriptions.length > 0) {
        const latestPrescription = response.data.prescriptions[0];
        const originalDate = new Date(latestPrescription.date_created);
        let tempMedications = [];
        let tempMarkedDates = {};

        latestPrescription.medicines.forEach((medicine, index) => {
          const medicineColor = getColor(index); // Get unique color for each medicine
          for (let i = 0; i < medicine.days; i++) {
            const medDate = new Date(originalDate);
            medDate.setDate(medDate.getDate() + i);
            const formattedDate = medDate.toDateString();
            if (!tempMarkedDates[formattedDate]) {
              tempMarkedDates[formattedDate] = [];
            }
            tempMarkedDates[formattedDate].push({ name: medicine.name, color: medicineColor });
          }
          medicine.schedule.forEach((time) => {
            tempMedications.push({ 
              id: `${medicine.name}-${time}`, 
              name: medicine.name, 
              time, 
              taken: false, 
              color: medicineColor // Save color for each medicine
            });
          });
        });

        setMedications(tempMedications);
        setMarkedDates(tempMarkedDates);
        filterMedicationsByDate(new Date()); // Filter for the initial date (today)
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const getColor = (index) => {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A6', '#FFC300', '#6A1B9A'];
    return colors[index % colors.length];
  };

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    filterMedicationsByDate(date);

    const formattedDate = date.toISOString().split("T")[0];

    if (date <= new Date()) {
        console.log(date);
        try {
            const response = await axios.get(`${ENV.SERVER}/medication-daily/${user}/${formattedDate}`);
            console.log("Fetched past medication record:", response.data);

            if (response.data && response.data.medications) {
                setUpdatedMedicationsForDate(response.data.medications);

                const tickMap = response.data.medications.reduce((acc, med) => {
                    acc[med.id] = med.taken;
                    return acc;
                }, {});
                setTicks(tickMap);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log("No past medication record found. Resetting ticks.");
                setUpdatedMedicationsForDate((prev) =>
                    prev.map((med) => ({ ...med, taken: false }))
                );
                setTicks({});
            } else {
                console.error("Error fetching past medication record:", error);
            }
        }
    }
};


  const filterMedicationsByDate = (date) => {
    const formattedDate = date.toDateString();
    const medicationsForDate = medications.filter((med) =>
      markedDates[formattedDate] && markedDates[formattedDate].some((markedMed) => markedMed.name === med.name)
    );
    setFilteredMedications(medicationsForDate);
    const clonedMedications = medicationsForDate.map((med) => ({ ...med, taken: false }));
    setUpdatedMedicationsForDate(clonedMedications)
    
  };

  const handleMedicationToggle = (id) => {
    setMedications((prev) =>
      prev.map((med) =>
        med.id === id ? { ...med, taken: !med.taken } : med
      )
    );
  };

  const handleTickToggle = (id, name, time) => {
    setTicks((prevTicks) => ({
      ...prevTicks,
      [id]: !prevTicks[id],
    }));

    setUpdatedMedicationsForDate((prevMeds) =>
      prevMeds.map((med) =>
        med.id === id ? { ...med, taken: !med.taken } : med
      )
    );

    setSelectedMeds((prevSelectedMeds) => {
      if (prevSelectedMeds.some((med) => med.id === id)) {
        return prevSelectedMeds.filter((med) => med.id !== id); 
      } else {
        return [...prevSelectedMeds, { id, name, time }];
      }
    });
  };

  const handleSaveSchedule = async () => {
    const formattedDate = selectedDate.toISOString().split('T')[0]; // Convert date to YYYY-MM-DD format
  
    const payload = {
      date: formattedDate,
      schedule_id: "null", // Modify if needed
      medications: updatedMedicationsForDate, // Pass updated medications list
    };
  
    try {
      const response = await axios.post(`${ENV.SERVER}/medication-daily/${user}/${formattedDate}`, payload);
      alert("Medication schedule saved successfully!");
    } catch (error) {
      console.error("Error saving medication schedule:", error);
      alert("Failed to save schedule. Please try again.");
    }
  };

  const isPastOrToday = selectedDate <= new Date();

  return (
    <div className="recentOrders">
      <h2>Medication Schedule</h2>

      <div style={styles.calendarContainer}>
        <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileContent={({ date }) => {
                const formattedDate = date.toDateString();
                return markedDates[formattedDate] ? (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                    {markedDates[formattedDate].map((med, idx) => (
                    <span key={idx} style={{ background: med.color, width: '10px', height: '10px', borderRadius: '50%' }}></span>
                    ))}
                </div>
                ) : null;
            }}
            style={styles.calendar}
        />
      </div>

      <div style={styles.scheduleContainer}>
        <h3 style={styles.title}>Medicine Timetable</h3>
        {filteredMedications.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Time</th>
                <th>Status</th>
                {isPastOrToday && <th>Tick</th>}
              </tr>
            </thead>
            <tbody>
              {filteredMedications.map((med) => (
                <tr key={med.id} style={styles.row}>
                  <td>{med.name}</td>
                  <td>{med.time}</td>
                  <td>
                    <button
                      style={{ ...styles.btn, backgroundColor: med.color }}
                      onClick={() => handleMedicationToggle(med.id)}
                    >
                      {med.taken ? 'Taken' : 'Pending'}
                    </button>
                  </td>
                  {isPastOrToday && (
                    <td>
                      <input
                        type="checkbox"
                        checked={ticks[med.id] || false}
                        onChange={() => handleTickToggle(med.id)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No medications found for the selected date.</p>
        )}
      </div>

      {isPastOrToday && (
        <button onClick={handleSaveSchedule} style={styles.saveButton}>
          Save Schedule
        </button>
      )}
    </div>
  );
};

const styles = {
  calendarContainer: {
    textAlign: 'center',
    marginBottom: '20px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  calendar: {
    width: '100%',
    maxWidth: '600px',
  },
  scheduleContainer: {
    padding: '20px',
    background: '#f9f9f9',
    borderRadius: '10px',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
  },
  title: {
    textAlign: 'center',
    marginBottom: '10px',
    color: '#333',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  row: {
    textAlign: 'center',
    borderBottom: '1px solid #ddd',
  },
  btn: {
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  saveButton: {
    display: 'block',
    width: '100%',
    padding: '10px',
    background: '#007BFF',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '15px',
  },
};

export default MedicationSchedule;
