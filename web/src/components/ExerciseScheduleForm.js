import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ENV from '../data/Env';
import exercises from '../data/Excercises';
import { ref, onValue } from "firebase/database";
import { db } from '../data/Firebase';

const ExerciseScheduleForm = ({user, caloriesBurned, setCaloriesBurned, setSessionDuration, addExercise}) => {
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    weight: '',
    height: '',
    max_bpm: '',
    avg_bpm: '',
    resting_bpm: '',
    session_duration: '',
    workout_type: '',
    fat_percentage: '',
    water_intake: '',
    workout_frequency: '',
    experience_level: '',
    bmi: '',
  });

  // const [caloriesBurned, setCaloriesBurned] = useState(null);
  const [error, setError] = useState(null);
  const [conditions, setConditions] = useState({
    diabetes: false,
    otherConditions: false,
  });
  
  const [filteredExercises, setFilteredExercises] = useState(exercises);
  const [userDetails, setUserDetails] = useState(null);


  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`${ENV.SERVER}/users/${user}/all`);
        const healthData = response.data.personal_health || {};
        
        // Merge existing Firebase data with API data
        setFormData(prevData => ({
          ...prevData,
          age: healthData.age || prevData.age,
          gender: healthData.gender || prevData.gender,
          weight: healthData.weight || prevData.weight,
          height: healthData.height || prevData.height,
          session_duration: healthData.session_duration || prevData.session_duration,
          workout_type: healthData.workout_type || prevData.workout_type,
          fat_percentage: healthData.fat_percentage || prevData.fat_percentage,
          water_intake: healthData.water_intake || prevData.water_intake,
          workout_frequency: healthData.workout_frequency || prevData.workout_frequency,
          experience_level: healthData.experience_level || prevData.experience_level,
          bmi: healthData.bmi || prevData.bmi,
        }));
      } catch (err) {
        setError('Failed to fetch user details.');
      }
    };

    fetchUserDetails();

    // Firebase database references
    const bpmRef = ref(db, 'bpm');
    const fahrenheitRef = ref(db, 'Farenheit');
    const spo2Ref = ref(db, 'spo2');
    const beatAvgRef = ref(db, 'beatAvg');
    const tanceRef = ref(db, 'tance');
    const degreeCRef = ref(db, 'DegreeC');

    // Function to update form state based on Firebase data
    const updateField = (key, value) => {
      setFormData(prevData => ({
        ...prevData,
        [key]: value || prevData[key]
      }));
    };

    // Real-time listeners for Firebase data
    onValue(bpmRef, snapshot => {
      if (snapshot.exists()) updateField("resting_bpm", snapshot.val());
    });

    onValue(fahrenheitRef, snapshot => {
      if (snapshot.exists()) updateField("max_bpm", snapshot.val());
    });

    onValue(spo2Ref, snapshot => {
      if (snapshot.exists()) updateField("avg_bpm", snapshot.val());
    });

    onValue(beatAvgRef, snapshot => {
      if (snapshot.exists()) updateField("session_duration", snapshot.val());
    });

    onValue(tanceRef, snapshot => {
      if (snapshot.exists()) updateField("water_intake", snapshot.val());
    });

    onValue(degreeCRef, snapshot => {
      if (snapshot.exists()) updateField("bmi", snapshot.val());
    });

  }, [user.username]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
  
    if (type === "checkbox") {
      setConditions((prevConditions) => ({
        ...prevConditions,
        [name]: checked,
      }));
      return;
    }
  
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  
    if (name === "avg_bpm") {
      let condition = "";
      if (value > 100) condition = "Tachycardia";
      if (value < 60) condition = "Bradycardia";
  
      setFilteredExercises(
        exercises.filter(
          (exercise) =>
            !exercise.not_suitable.includes(condition) &&
            (!conditions.diabetes || !exercise.not_suitable.includes("Diabetes")) &&
            (!conditions.otherConditions ||
              !exercise.not_suitable.includes("Other"))
        )
      );
    }
  
    if (name === "workout_type") {
      setFilteredExercises(
        exercises.filter(
          (exercise) =>
            exercise.type === value &&
            (!conditions.diabetes || !exercise.not_suitable.includes("Diabetes")) &&
            (!conditions.otherConditions ||
              !exercise.not_suitable.includes("Other"))
        )
      );
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${ENV.SERVER}/calories/predict`, formData);
      setCaloriesBurned(response.data.predicted_calories_burned);
      setError(null);
      setSessionDuration(formData.session_duration);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong!');
    }
  };

  return (
    <div className="recentOrders">
      <h2>Exercise Schedule</h2>

      {/* Form Card */}
      <div className="form-card">
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              name="age"
              placeholder="Enter Age"
              value={formData.age}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group row">
            <div className="column">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="column">
              <label>Weight (kg)</label>
              <input
                type="number"
                name="weight"
                placeholder="Enter Weight"
                value={formData.weight}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group row">
            <div className="column">
              <label>Height (m)</label>
              <input
                type="number"
                name="height"
                placeholder="Enter Height"
                value={formData.height}
                onChange={handleChange}
                required
              />
            </div>
            <div className="column">
              <label>BMI</label>
              <input
                type="number"
                name="bmi"
                placeholder="Enter BMI"
                value={formData.bmi}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group row">
            <div className="column">
              <label>Max BPM</label>
              <input
                type="number"
                name="max_bpm"
                placeholder="Enter Max BPM"
                value={formData.max_bpm}
                onChange={handleChange}
                required
              />
            </div>
            <div className="column">
              <label>Avg BPM</label>
              <input
                type="number"
                name="avg_bpm"
                placeholder="Enter Avg BPM"
                value={formData.avg_bpm}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Resting BPM</label>
            <input
              type="number"
              name="resting_bpm"
              placeholder="Enter Resting BPM"
              value={formData.resting_bpm}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
                <input
                type="checkbox"
                name="diabetes"
                checked={conditions.diabetes}
                onChange={handleChange}
                />
                Diabetes
            </label>
            <label>
                <input
                type="checkbox"
                name="otherConditions"
                checked={conditions.otherConditions}
                onChange={handleChange}
                />
                Other Conditions
            </label>
        </div>

          <div className="form-group">
            <label>Session Duration (hours)</label>
            <input
              type="number"
              step="0.1"
              name="session_duration"
              placeholder="Enter Session Duration"
              value={formData.session_duration}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group row">
            <div className="column">
              <label>Workout Type</label>
              <select name="workout_type" value={formData.workout_type} onChange={handleChange} required>
                <option value="">Select Workout Type</option>
                <option value="Cardio">Cardio</option>
                <option value="HIIT">HIIT</option>
                <option value="Strength">Strength</option>
                <option value="Yoga">Yoga</option>
              </select>
            </div>
            <div className="column">
              <label>Fat Percentage</label>
              <input
                type="number"
                step="0.1"
                name="fat_percentage"
                placeholder="Enter Fat Percentage"
                value={formData.fat_percentage}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group row">
            <div className="column">
              <label>Water Intake (liters)</label>
              <input
                type="number"
                step="0.1"
                name="water_intake"
                placeholder="Enter Water Intake"
                value={formData.water_intake}
                onChange={handleChange}
                required
              />
            </div>
            <div className="column">
              <label>Workout Frequency (days/week)</label>
              <input
                type="number"
                name="workout_frequency"
                placeholder="Enter Workout Frequency"
                value={formData.workout_frequency}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Experience Level</label>
            <input
              type="number"
              name="experience_level"
              placeholder="Enter Experience Level (0=Beginner, 1=Intermediate, etc.)"
              value={formData.experience_level}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" className="start-exercise-btn">
              Predict Calories Burned
            </button>
            <button
              onClick={() => (window.location.href = "/logged/excercise-monitor")}
              style={{
                backgroundColor: "green",
                color: "white",
                border: "none",
                padding: "10px 15px",
                cursor: "pointer",
                borderRadius: "5px",
              }}
            >
              Direct Approach
            </button>
          </div>

        </form>

        {caloriesBurned && (
          <div className="prediction-result">
            <p>Calories you could burn: {caloriesBurned.toFixed(2)}</p>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>
      <div className="exercise-list">
        {filteredExercises.map((exercise) => (
            <div key={exercise.id} className="exercise-card">
            {/* Left: Exercise Image */}
            <div className="exercise-image">
                <img src={exercise.image} alt={exercise.title} />
            </div>

            {/* Middle: Exercise Title and Summary */}
            <div className="exercise-details">
                <h3>{exercise.title}</h3>
                <p>{exercise.summary}</p>
            </div>

            {/* Right: Button to Start Exercise */}
            <div className="exercise-action">
                <div>
                  <span className='calorie'>{exercise.calories_burned_per_hour}c</span><span>/1 hour</span>
                </div>
                <button onClick={() => addExercise(exercise)} className="start-exercise-btn">
                Add
                </button>
            </div>
            </div>
        ))}
        </div>
    </div>
  );
};

export default ExerciseScheduleForm;
