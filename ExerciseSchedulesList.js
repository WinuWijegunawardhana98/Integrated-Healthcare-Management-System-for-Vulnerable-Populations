import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import ENV from "../data/Env";
import { useOutletContext } from "react-router-dom";
import exercises from '../data/Excercises';

const localizer = momentLocalizer(moment);

const ExerciseSchedulesList = () => {
  const { username } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exerciseSchedules, setExerciseSchedules] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetchExerciseSchedules();
  }, [username]);

  const fetchExerciseSchedules = async () => {
    try {
      const response = await axios.get(`${ENV.SERVER}/exercise_schedules/${username}`);
      setExerciseSchedules(response.data);
      
      const events = response.data.map(schedule => ({
        id: schedule.id,
        title: schedule.title,
        start: new Date(schedule.date),
        end: new Date(schedule.end_date),
        allDay: true,
      }));

      setCalendarEvents(events);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching exercise schedules:", err);
      setError("Failed to load exercise schedules");
      setLoading(false);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    try {
      await axios.delete(`${ENV.SERVER}/exercise_schedules/id/${scheduleId}`);
      setExerciseSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
      setCalendarEvents(prev => prev.filter(event => event.id !== scheduleId));
      alert("Schedule deleted successfully");
    } catch (err) {
      console.error("Error deleting schedule:", err);
      alert("Failed to delete schedule");
    }
  };

  const handleDragStart = (event, schedule) => {
    event.dataTransfer.setData("text/plain", JSON.stringify(schedule));
  };

  const handleDrop = ({ start }, dropEvent) => {
    const scheduleData = dropEvent.dataTransfer.getData("text/plain");
    if (!scheduleData) return;

    const schedule = JSON.parse(scheduleData);
    setCalendarEvents(prev => [
      ...prev,
      { id: schedule.id, title: schedule.title, start, end: start, allDay: true },
    ]);
  };

  const handleEventChange = (event, start) => {
    setCalendarEvents(prev =>
      prev.map(e => (e.id === event.id ? { ...e, start, end: start } : e))
    );
  };

  const handleEventRemove = (eventToRemove) => {
    setCalendarEvents(prev => prev.filter(event => event.id !== eventToRemove.id));
  };

  const openScheduleDetails = (schedule) => {
    setSelectedSchedule(schedule);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedSchedule(null);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const handleExerciseRequest = async (exercise) => {
      try {
        const response = await axios.post(ENV.SERVER + '/start-exercise', {
          exerciseId: exercise.id,
          exerciseName: exercise.title,
        });
        console.log('Exercise response:', response.data);
      } catch (error) {
        console.error('Error starting exercise:', error);
      }
  };

  return (
    <div className="recentOrders" style={{ display: "flex", gap: "20px" }}>
      {/* Left Section: Exercise Schedules */}
      <div style={{ flex: 1, padding: "10px", borderRight: "2px solid #ddd" }}>
        <h2>Exercise Schedules</h2>
        {exerciseSchedules.length > 0 ? (
          <div>
            {exerciseSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="schedule-card"
                draggable
                onDragStart={(e) => handleDragStart(e, schedule)}
                onClick={() => openScheduleDetails(schedule)}
                style={{
                  border: "2px solid #007BFF",
                  borderRadius: "10px",
                  padding: "15px",
                  marginBottom: "20px",
                  backgroundColor: "#f9f9f9",
                  cursor: "pointer",
                  position: "relative",
                  transition: "transform 0.2s",
                  ":hover": {
                    transform: "scale(1.02)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                  }
                }}
              >
                <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>{schedule.title}</h3>
                <p style={{ margin: "5px 0", color: "#555" }}>
                  <strong>Start:</strong> {schedule.date || "No Date Specified"}
                </p>
                <p style={{ margin: "5px 0", color: "#555" }}>
                  <strong>End:</strong> {schedule.end_date}
                </p>
                

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSchedule(schedule.id);
                  }}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    backgroundColor: "#FF0000",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: "18px",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>X</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div>No exercise schedules available</div>
        )}
      </div>

      {/* Right Section: Calendar */}
      <div style={{ flex: 2, padding: "10px" }}>
        <h2>Schedule Calendar</h2>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          selectable
          onSelectSlot={(slotInfo) => handleDrop({ start: slotInfo.start }, slotInfo)}
          onEventDrop={({ event, start }) => handleEventChange(event, start)}
          onDragOver={(e) => e.preventDefault()}
          onSelectEvent={(event) => handleEventRemove(event)}
          draggableAccessor={() => true}
          resizable
        />
      </div>

      {/* Schedule Details Popup */}
      {showPopup && selectedSchedule && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "25px",
            width: "80%",
            maxWidth: "800px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 5px 15px rgba(0,0,0,0.3)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              borderBottom: "1px solid #eee",
              paddingBottom: "10px"
            }}>
              <h2 style={{ margin: 0, color: "#333" }}>{selectedSchedule.title}</h2>
              <button
                onClick={closePopup}
                style={{
                  backgroundColor: "#ff4444",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  cursor: "pointer",
                  fontSize: "16px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ margin: "5px 0" }}>
                <strong>Start Date:</strong> {selectedSchedule.date}
              </p>
              <p style={{ margin: "5px 0" }}>
                <strong>End Date:</strong> {selectedSchedule.end_date}
              </p>
            </div>

            <h3 style={{ margin: "20px 0 10px 0", color: "#444" }}>Activities</h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
              marginTop: "15px"
            }}>
              {selectedSchedule.activities && selectedSchedule.activities.map((activity, index) => {
                // Find the full exercise details from the imported exercises data
                const fullExercise = exercises.find(ex => ex.title === activity.title) || activity;
                
                return (
                  <div key={index} style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    padding: "15px",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                  }}>
                    <div style={{
                      display: "flex",
                      gap: "15px",
                      marginBottom: "10px"
                    }}>
                      {fullExercise.image && (
                        <img 
                          src={fullExercise.image} 
                          alt={fullExercise.title} 
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "5px"
                          }}
                        />
                      )}
                      <div>
                        <h4 style={{ margin: "0 0 5px 0", color: "#333" }}>{fullExercise.title}</h4>
                        <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                          {fullExercise.summary || "No description available"}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginTop: "10px" }}>
                      <p style={{ margin: "5px 0", fontSize: "14px" }}>
                        <strong>Type:</strong> {fullExercise.type || "N/A"}
                      </p>
                      <p style={{ margin: "5px 0", fontSize: "14px" }}>
                        <strong>Calories/hour:</strong> {fullExercise.calories_burned_per_hour || "N/A"}
                      </p>
                      {fullExercise.not_suitable && fullExercise.not_suitable.length > 0 && (
                        <p style={{ margin: "5px 0", fontSize: "14px" }}>
                          <strong>Not suitable for:</strong> {fullExercise.not_suitable.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="exercise-action">
                      <button onClick={() => handleExerciseRequest(activity)} className="start-exercise-btn">
                        Start Exercise
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseSchedulesList;