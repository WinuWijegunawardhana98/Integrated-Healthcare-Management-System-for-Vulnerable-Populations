// pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Footer from '../components/Footer';
import MedicineCaution from '../components/MedicineCaution';
import ExerciseScheduleForm from '../components/ExerciseScheduleForm';
import ExercisePlan from '../components/ExercisesPlan';

const ExcerciseSchedule = () => {
    const [user, setUser] = useState(() => {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : {};
    });
    const [caloriesBurned, setCaloriesBurned] = useState(null);
    const [sessionDuration, setSessionDuration] = useState('');
    const [selectedExercises, setSelectedExercises] = useState([]);

    const addExercise = (exercise) => {
      setSelectedExercises((prevExercises) => [...prevExercises, exercise]);
      setCaloriesBurned((prev) => prev - exercise.calories_burned_per_hour);
    };
  
    useEffect(() => {
      if (!user.username) {
        console.warn("User data is not available or invalid.");
      }
    }, [user]);

  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="details">
          <ExerciseScheduleForm 
            user={user.username || ''}
            setCaloriesBurned={setCaloriesBurned} 
            setSessionDuration={setSessionDuration}
            caloriesBurned={caloriesBurned}
            addExercise={addExercise} />
          <ExercisePlan user={user.username || ''} setCaloriesBurned={setCaloriesBurned} caloriesBurned={caloriesBurned} sessionDuration={sessionDuration} selectedExercises={selectedExercises} setSelectedExercises={setSelectedExercises}/>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default ExcerciseSchedule;
