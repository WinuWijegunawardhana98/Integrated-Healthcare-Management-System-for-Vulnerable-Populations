import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import ENV from "../data/Env";
import { useOutletContext } from "react-router-dom";

const localizer = momentLocalizer(moment);

const ExerciseSchedulesList = () => {
  const { username } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exerciseSchedules, setExerciseSchedules] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    fetchExerciseSchedules();
  }, [username]);

  const fetchExerciseSchedules = async () => {
    try {
      const response = await axios.get(`${ENV.SERVER}/exercise_schedules/${username}`);
      setExerciseSchedules(response.data);
      console.log(response.data);
      
      // Map the schedules to calendar events
      const events = response.data.map(schedule => ({
        id: schedule.id,
        title: schedule.title,
        start: new Date(schedule.date),  // assuming schedule.date is in a valid date format
        end: new Date(schedule.date),
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
      setExerciseSchedules((prevSchedules) =>
        prevSchedules.filter((schedule) => schedule.id !== scheduleId)
      );
      setCalendarEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== scheduleId)
      );
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
    // dropEvent.preventDefault();
    const scheduleData = dropEvent.dataTransfer.getData("text/plain");

    if (!scheduleData) {
      console.error("No schedule data found on drop event.");
      return;
    }

    const schedule = JSON.parse(scheduleData);

    setCalendarEvents((prevEvents) => [
      ...prevEvents,
      { id: schedule.id, title: schedule.title, start, end: start, allDay: true },
    ]);
  };

  const handleEventChange = (event, start) => {
    setCalendarEvents((prevEvents) =>
      prevEvents.map((e) => (e.id === event.id ? { ...e, start, end: start } : e))
    );
  };

  const handleEventRemove = (eventToRemove) => {
    setCalendarEvents((prevEvents) =>
      prevEvents.filter((event) => event.id !== eventToRemove.id)
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

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
                style={{
                  border: "2px solid #007BFF",
                  borderRadius: "10px",
                  padding: "15px",
                  marginBottom: "20px",
                  backgroundColor: "#f9f9f9",
                  cursor: "grab",
                  position: "relative",
                }}
              >
                <h3>{schedule.title}</h3>
                <p>{schedule.date || "No Date Specified"}</p>

                {/* Delete Button */}
                <button
                  onClick={() => deleteSchedule(schedule.id)}
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
          onSelectSlot={(slotInfo) => handleDrop({ start: slotInfo.start }, slotInfo)} // ✅ Fixed event issue
          onEventDrop={({ event, start }) => handleEventChange(event, start)}
          onDragOver={(e) => e.preventDefault()}
          onSelectEvent={(event) => handleEventRemove(event)}
          draggableAccessor={() => true}
          resizable
        />
      </div>
    </div>
  );
};

export default ExerciseSchedulesList;
