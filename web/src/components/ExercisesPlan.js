import React, { useEffect, useState } from 'react';
import exercises from '../data/Excercises';
import ENV from '../data/Env';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Notiflix from 'notiflix';

const ExercisePlan = ({ user, caloriesBurned, sessionDuration, selectedExercises, setSelectedExercises, setCaloriesBurned }) => {
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState(null);
  const [exerciseTitle, setExerciseTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');

  // Handle removing an exercise and updating calories burned
  const removeExercise = (index) => {
    const removedExercise = selectedExercises[index];
    setSelectedExercises((prev) => {
      const updatedList = prev.filter((_, i) => i !== index);
      return updatedList;
    });

    // Update calories burned
    setCaloriesBurned((prev) => prev + removedExercise.calories_burned_per_hour);
  };

  // Handle adding an exercise
  const addExercise = (exercise) => {
    setSelectedExercises((prev) => [...prev, exercise]);
  };

  // Handle Drag-and-Drop
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("exerciseIndex", index);
  };

  const handleDrop = (e, newIndex) => {
    e.preventDefault();
    const oldIndex = e.dataTransfer.getData("exerciseIndex");

    if (oldIndex !== newIndex) {
      setSelectedExercises((prev) => {
        const updatedList = [...prev];
        const [movedItem] = updatedList.splice(oldIndex, 1);
        updatedList.splice(newIndex, 0, movedItem);
        return updatedList;
      });
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${ENV.SERVER}/users/${user}/all`);
        console.log(response.data);
        setHealthData(response.data.personal_health);
      } catch (err) {
        console.error('Error fetching user health data:', err);
      }
    };

    fetchUserData();
  }, [user]);

  // Determine the number of slots and display message based on health conditions
  const getExerciseSlotCount = () => {
    if (healthData?.heart_attack) {
      return 1; // Heart patient, 1 slot
    } else if (healthData?.diabetes) {
      return 3; // Diabetes patient, 3 slots
    }
    return 5; // Default, 5 slots
  };

  const getExerciseMessage = () => {
    if (healthData?.heart_attack) {
      return 'For heart patients, we recommend low-intensity exercises like Cardio or Yoga.';
    } else if (healthData?.diabetes) {
      return 'For diabetes patients, regular exercises like Cardio or Strength training are beneficial.';
    }
    return 'Choose from various exercises to create a balanced fitness routine.';
  };

  const exerciseSlotCount = getExerciseSlotCount();
  const exerciseMessage = getExerciseMessage();

  const saveSchedule = async () => {
    if (!selectedDate) {
      setError('Please select a date for the exercise schedule.');
      return;
    }

    const scheduleData = {
      date: selectedDate, // Use selected date
      activities: selectedExercises.map((exercise) => ({
        title: exercise.title,
        summary: exercise.summary,
        image: exercise.image,
        type: exercise.type,
        not_suitable: exercise.not_suitable,
        calories_burned_per_hour: exercise.calories_burned_per_hour,
      })),
      user: user,
      title: exerciseTitle || 'User Exercise Plan', // Use entered title or default
    };

    try {
      const response = await axios.post(`${ENV.SERVER}/exercise_schedules`, scheduleData);
      console.log('Schedule saved:', response.data);
      Notiflix.Notify.success('Exercise schedule saved successfully!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      Notiflix.Notify.failure('Failed to save the exercise schedule. Please try again.');
    }
  };

  return (
    <div className='recentOrders'>
      <div style={{ paddingBottom: '10px', marginBottom: '15px' }}>
        <h2>Exercise Plan</h2>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#007BFF' }}>
          {caloriesBurned || 0}
        </div>
        <div style={{ fontSize: '16px', color: '#555' }}>Calories Suggested to Burn</div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007BFF' }}>
          {sessionDuration || 'N/A'}
        </div>
        <div style={{ fontSize: '14px', color: '#777' }}>Session Duration (1 Slot - 30 min)</div>
      </div>

      {/* Display message based on health conditions */}
      <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '18px', color: '#888' }}>
        {exerciseMessage}
      </div>

      {/* Input field for title */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter Exercise Plan Title"
          value={exerciseTitle}
          onChange={(e) => setExerciseTitle(e.target.value)}
          style={{
            padding: '10px',
            width: '100%',
            fontSize: '16px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            marginBottom: '10px',
          }}
        />
      </div>

      {/* Date picker */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: '10px',
            fontSize: '16px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            width: '100%',
          }}
        />
        {error && <div style={{ color: 'red', fontSize: '14px' }}>{error}</div>}
      </div>

      {/* Slots for exercises arranged in a column layout */}
      <div className='exercise-card' style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        {[...Array(exerciseSlotCount)].map((_, index) => (
          <div
            key={index}
            style={{
              width: '100%',
              height: '120px',
              border: '2px dashed #007BFF',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: '#007BFF',
              backgroundColor: selectedExercises[index] ? '#f0f8ff' : 'transparent',
              position: 'relative',
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
          >
            {selectedExercises[index] ? (
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* Image section */}
                <div className="exercise-image" style={{ marginRight: '10px' }}>
                  <img src={selectedExercises[index].image} alt={selectedExercises[index].title} width="50" />
                </div>

                {/* Details section */}
                <div className="exercise-details" style={{ flex: 1, textAlign: 'left' }}>
                  <h4 style={{ fontSize: '14px', margin: '5px 0' }}>{selectedExercises[index].title}</h4>
                  <button
                    onClick={() => removeExercise(index)}
                    style={{
                      backgroundColor: 'red',
                      color: '#fff',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              '-'
            )}
          </div>
        ))}
      </div>

      <br />
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button className="start-exercise-btn" onClick={() => saveSchedule()}>
          Save Schedule
        </button>
        <button className="start-exercise-btn" onClick={() => navigate('/logged/profile/exercise-schedule')} style={{
          backgroundColor: "green",
          color: "white",
        }}>
          See Schedules
        </button>
      </div>
    </div>
  );
};

export default ExercisePlan;
