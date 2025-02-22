import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ENV from '../data/Env';
import { Link, useOutletContext } from 'react-router-dom';
import exercises from '../data/Excercises';

const ActivityList = () => {
  const { username } = useOutletContext();
  const [userData, setUserData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to filter exercises based on health data
  const filterExercises = (healthData) => {
    return exercises.filter((exercise) => {
      const unsuitableConditions = exercise.not_suitable;
      // Check if any unsuitable condition matches the user's health data
      for (let condition of unsuitableConditions) {
        if (healthData) {
          if (
            (condition === 'Heart attack' && healthData.heart_attack) ||
            (condition === 'Tachycardia' && healthData.heart_diseases) ||
            (condition === 'Bradycardia' && healthData.heart_diseases) ||
            (condition === 'High cholesterol' && healthData.cholesterol > 200) ||
            (condition === 'Knee pain' && healthData.knee_pain) ||
            (condition === 'Lower back pain' && healthData.back_pain) ||
            (condition === 'Joint pain' && healthData.joint_pain) ||
            (condition === 'Diabetes' && healthData.diabetes) ||
            (condition === 'Wrist pain' && healthData.wrist_pain)
          ) {
            return false; // Exclude exercise if condition matches
          }
        }
      }
      return true; // Include exercise if no condition matches
    });
  };

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${ENV.SERVER}/users/${username}/all`);
        console.log(response.data);
        setUserData(response.data.user);
        setHealthData(response.data.personal_health);
      } catch (err) {
        console.error('Error fetching user health data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  // Filter exercises based on health data
  const filteredExercises = healthData ? filterExercises(healthData) : exercises;

  return (
    <div className="recentOrders">
      <h2>Exercise List</h2>
      
      <div className="prepare-section">
        <p className="prepare-info">Prepare a personalized exercise plan for you.</p>
        <Link className="start-exercise-btn" to={'/logged/excercise-schedule'}>
          Prepare Your Schedule
        </Link>
      </div>

      {/* EXERCISE LIST */}
      <div className="exercise-list">
        {filteredExercises.map((exercise) => (
          <div key={exercise.id} className="exercise-card">
            {/* Left: Exercise Image */}
            <div className="exercise-image">
              <img src={exercise.image} alt={`${exercise.title}`} />
            </div>

            {/* Middle: Exercise Title and Summary */}
            <div className="exercise-details">
              <h3>{exercise.title}</h3>
              <p>{exercise.summary}</p>
            </div>

            {/* Right: Button to Start Exercise */}
            <div className="exercise-action">
              <button onClick={() => handleExerciseRequest(exercise)} className="start-exercise-btn">
                Start Exercise
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityList;
