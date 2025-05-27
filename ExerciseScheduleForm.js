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
  const [lockedFields, setLockedFields] = useState({});

  const [errors, setErrors] = useState({});
  const [conditions, setConditions] = useState({
    diabetes: false,
    heartDiseases: false,
    cholesterol: false,
    heartAttack: false,
    allergies: false
  });
  
  const [filteredExercises, setFilteredExercises] = useState(exercises);
  const [userDetails, setUserDetails] = useState(null);
  const [firebaseFields] = useState({
    max_bpm: false,
    avg_bpm: false,
    resting_bpm: false,
    session_duration: false,
    water_intake: false,
    bmi: false
  });

  const filterExercises = () => {
    setFilteredExercises(
      exercises.filter(exercise => {
        // Filter by workout type if selected
        const typeMatch = !formData.workout_type || exercise.type === formData.workout_type;
        
        // Filter by health conditions
        const conditionsMatch = 
          (!conditions.diabetes || !exercise.not_suitable.includes("Diabetes")) &&
          (!conditions.heartDiseases || !exercise.not_suitable.includes("Heart Disease")) &&
          (!conditions.heartAttack || !exercise.not_suitable.includes("Heart Attack")) &&
          (!conditions.cholesterol || !exercise.not_suitable.includes("High Cholesterol")) &&
          (!conditions.allergies || !exercise.not_suitable.includes("Allergies"));
        
        // Filter by BPM conditions if avg_bpm is set
        let bpmCondition = "";
        if (formData.avg_bpm > 100) bpmCondition = "Tachycardia";
        if (formData.avg_bpm < 60) bpmCondition = "Bradycardia";
        const bpmMatch = !bpmCondition || !exercise.not_suitable.includes(bpmCondition);
        
        return typeMatch && conditionsMatch && bpmMatch;
      })
    );
  };

  // Validation rules
  const validations = {
    age: (value) => value >= 1 && value <= 120,
    weight: (value) => value >= 20 && value <= 300, // kg
    height: (value) => value >= 0.5 && value <= 2.5, // meters
    max_bpm: (value) => value >= 40 && value <= 220,
    avg_bpm: (value) => value >= 40 && value <= 220,
    resting_bpm: (value) => value >= 30 && value <= 120,
    session_duration: (value) => value >= 0.1 && value <= 8, // hours
    fat_percentage: (value) => value >= 2 && value <= 60, // %
    water_intake: (value) => value >= 0.5 && value <= 15, // liters
    workout_frequency: (value) => value >= 0 && value <= 20, // days/week
    experience_level: (value) => value >= 0 && value <= 5, // 0-5 scale
    bmi: (value) => value >= 10 && value <= 50,
  };

  const validateField = (name, value) => {
    if (!validations[name]) return true; // no validation rule for this field
    
    const isValid = validations[name](value);
    setErrors(prev => ({
      ...prev,
      [name]: isValid ? null : `Invalid ${name} value`
    }));
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await axios.post(`${ENV.SERVER}/calories/predict`, formData);
      setCaloriesBurned(response.data.predicted_calories_burned);
      setErrors({});
      setSessionDuration(formData.session_duration);
    } catch (err) {
      setErrors({...errors, form: err.response?.data?.detail || 'Something went wrong!'});
    }
  };

  
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = {};
    
    // Validate all fields
    Object.keys(formData).forEach(key => {
      if (validations[key] && !validations[key](formData[key])) {
        newErrors[key] = `Invalid ${key} value`;
        isValid = false;
      }
    });
    
    // Check required fields
    const requiredFields = ['age', 'gender', 'weight', 'height', 'workout_type'];
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`${ENV.SERVER}/users/${user}/all`);
        const healthData = response.data.personal_health || {};
        
        // Determine which fields should be locked (non-empty values from healthData)
        const newLockedFields = {};
        Object.keys(healthData).forEach(key => {
          if (healthData[key] !== null && healthData[key] !== "" && healthData[key] !== 0) {
            newLockedFields[key] = true;
          }
        });
        setLockedFields(newLockedFields);
        
        // Set conditions from health data
        setConditions({
          diabetes: healthData.diabetes || false,
          heartDiseases: healthData.heart_diseases || false,
          cholesterol: healthData.cholesterol ? healthData.cholesterol > 200 : false,
          heartAttack: healthData.heart_attack || false,
          allergies: healthData.allergies ? healthData.allergies !== "none" : false
        });

        // Set form data
        setFormData(prevData => ({
          ...prevData,
          age: healthData.age || prevData.age,
          gender: healthData.gender || prevData.gender,
          weight: healthData.weight || prevData.weight,
          height: healthData.height ? (healthData.height / 100).toFixed(2) : prevData.height, // Convert cm to m
          bmi: healthData.bmi || prevData.bmi,
          workout_type: healthData.workout_type || prevData.workout_type,
          fat_percentage: healthData.fat_percentage || prevData.fat_percentage,
          water_intake: healthData.water_intake || prevData.water_intake,
          workout_frequency: healthData.workout_frequency || prevData.workout_frequency,
          experience_level: healthData.experience_level || prevData.experience_level,
        }));

      } catch (err) {
        setErrors({...errors, form: 'Failed to fetch user details.'});
      }
    };

    fetchUserDetails();

    // Firebase listeners (keep the same)
    const bpmRef = ref(db, 'bpm');
    const fahrenheitRef = ref(db, 'Farenheit');
    const spo2Ref = ref(db, 'spo2');
    const beatAvgRef = ref(db, 'beatAvg');
    const tanceRef = ref(db, 'tance');
    const degreeCRef = ref(db, 'DegreeC');

    const updateField = (key, value) => {
      if (value !== null && value !== undefined) {
        validateField(key, value);
        setFormData(prevData => ({
          ...prevData,
          [key]: value || prevData[key]
        }));
        firebaseFields[key] = true;
      }
    };

    onValue(bpmRef, snapshot => updateField("resting_bpm", snapshot.val()));
    onValue(fahrenheitRef, snapshot => updateField("max_bpm", snapshot.val()));
    onValue(spo2Ref, snapshot => updateField("avg_bpm", snapshot.val()));
    onValue(beatAvgRef, snapshot => updateField("session_duration", snapshot.val()));
    onValue(tanceRef, snapshot => updateField("water_intake", snapshot.val()));
    onValue(degreeCRef, snapshot => updateField("bmi", snapshot.val()));

  }, [user]);

  useEffect(() => {
    filterExercises();
  }, [formData.workout_type, formData.avg_bpm, conditions]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
  
    if (type === "checkbox") {
      setConditions((prevConditions) => ({
        ...prevConditions,
        [name]: checked,
      }));
      return;
    }

    if (lockedFields[name] || firebaseFields[name]) return;
  
    // Validate the field before updating state
    validateField(name, value);
    
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

  return (
    <div className="recentOrders">
      <h2 style={{ 
        marginBottom: '20px', 
        color: '#333',
        fontSize: '24px',
        fontWeight: '600'
      }}>Exercise Schedule</h2>

      {/* Form Card */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '25px', 
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px'
          }}>
            {/* Left Column */}
            <div>
              {/* Age */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>Age (1-120 years)</label>
                <input
                  type="number"
                  name="age"
                  placeholder="Enter Age"
                  value={formData.age}
                  onChange={handleChange}
                  min="1"
                  max="120"
                  required
                  readOnly={lockedFields.age}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${errors.age ? '#ff4444' : '#ddd'}`,
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }}
                />
                {errors.age && <span style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  display: 'block'
                }}>{errors.age}</span>}
              </div>

              {/* Gender */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>Gender</label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange} 
                  required
                  disabled={lockedFields.gender}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${errors.gender ? '#ff4444' : '#ddd'}`,
                    boxSizing: 'border-box',
                    fontSize: '14px',
                    backgroundColor: lockedFields.gender ? '#f0f0f0' : '#fff',
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <span style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  display: 'block'
                }}>{errors.gender}</span>}
              </div>

              {/* Weight */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>Weight (20-300 kg)</label>
                <input
                  type="number"
                  name="weight"
                  placeholder="Enter Weight"
                  value={formData.weight}
                  onChange={handleChange}
                  min="20"
                  max="300"
                  step="0.1"
                  required
                  readOnly={lockedFields.weight}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${errors.weight ? '#ff4444' : '#ddd'}`,
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }}
                />
                {errors.weight && <span style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  display: 'block'
                }}>{errors.weight}</span>}
              </div>

              {/* Height */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>Height (0.5-2.5 m)</label>
                <input
                  type="number"
                  name="height"
                  placeholder="Enter Height"
                  value={formData.height}
                  onChange={handleChange}
                  min="0.5"
                  max="2.5"
                  step="0.01"
                  required
                  readOnly={lockedFields.height}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${errors.height ? '#ff4444' : '#ddd'}`,
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }}
                />
                {errors.height && <span style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  display: 'block'
                }}>{errors.height}</span>}
              </div>

              {/* BMI */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>BMI (10-50)</label>
                <input
                  type="number"
                  name="bmi"
                  placeholder="Enter BMI"
                  value={formData.bmi}
                  onChange={handleChange}
                  min="10"
                  max="50"
                  step="0.1"
                  required
                  readOnly={firebaseFields.bmi}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${errors.bmi ? '#ff4444' : '#ddd'}`,
                    boxSizing: 'border-box',
                    fontSize: '14px',
                    backgroundColor: firebaseFields.bmi ? '#f0f0f0' : '#fff'
                  }}
                />
                {errors.bmi && <span style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  display: 'block'
                }}>{errors.bmi}</span>}
              </div>
            </div>

            {/* Middle Column */}
            <div>
              {/* Max BPM */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>Max BPM (40-220)</label>
                <input
                  type="number"
                  name="max_bpm"
                  placeholder="Enter Max BPM"
                  value={formData.max_bpm}
                  onChange={handleChange}
                  min="40"
                  max="220"
                  required
                  readOnly={firebaseFields.max_bpm}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${errors.max_bpm ? '#ff4444' : '#ddd'}`,
                    boxSizing: 'border-box',
                    fontSize: '14px',
                    backgroundColor: firebaseFields.max_bpm ? '#f0f0f0' : '#fff'
                  }}
                />
                {errors.max_bpm && <span style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  display: 'block'
                }}>{errors.max_bpm}</span>}
              </div>

              {/* Avg BPM */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>Avg BPM (40-220)</label>
                <input
                  type="number"
                  name="avg_bpm"
                  placeholder="Enter Avg BPM"
                  value={formData.avg_bpm}
                  onChange={handleChange}
                  min="40"
                  max="220"
                  required
                  readOnly={firebaseFields.avg_bpm}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${errors.avg_bpm ? '#ff4444' : '#ddd'}`,
                    boxSizing: 'border-box',
                    fontSize: '14px',
                    backgroundColor: firebaseFields.avg_bpm ? '#f0f0f0' : '#fff'
                  }}
                />
                {errors.avg_bpm && <span style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  display: 'block'
                }}>{errors.avg_bpm}</span>}
              </div>

              {/* Resting BPM */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>Resting BPM (30-120)</label>
                <input
                  type="number"
                  name="resting_bpm"
                  placeholder="Enter Resting BPM"
                  value={formData.resting_bpm}
                  onChange={handleChange}
                  min="30"
                  max="120"
                  required
                  readOnly={firebaseFields.resting_bpm}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${errors.resting_bpm ? '#ff4444' : '#ddd'}`,
                    boxSizing: 'border-box',
                    fontSize: '14px',
                    backgroundColor: firebaseFields.resting_bpm ? '#f0f0f0' : '#fff'
                  }}
                />
                {errors.resting_bpm && <span style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  display: 'block'
                }}>{errors.resting_bpm}</span>}
              </div>

              {/* Health Conditions */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>Health Conditions</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="diabetes"
                      checked={conditions.diabetes}
                      onChange={handleChange}
                    />
                    Diabetes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="heartDiseases"
                      checked={conditions.heartDiseases}
                      onChange={handleChange}
                    />
                    Heart Diseases
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="heartAttack"
                      checked={conditions.heartAttack}
                      onChange={handleChange}
                    />
                    Previous Heart Attack
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="cholesterol"
                      checked={conditions.cholesterol}
                      onChange={handleChange}
                    />
                    High Cholesterol
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="allergies"
                      checked={conditions.allergies}
                      onChange={handleChange}
                    />
                    Allergies
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Session Duration */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>Session Duration (0.1-8 hours)</label>
                <input
                  type="number"
                  step="0.1"
                  name="session_duration"
                  placeholder="Enter Session Duration"
                  value={formData.session_duration}
                  onChange={handleChange}
                  min="0.1"
                  max="8"
                  required
                  readOnly={firebaseFields.session_duration}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${errors.session_duration ? '#ff4444' : '#ddd'}`,
                    boxSizing: 'border-box',
                    fontSize: '14px',
                    backgroundColor: firebaseFields.session_duration ? '#f0f0f0' : '#fff'
                  }}
                />
                {errors.session_duration && <span style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  display: 'block'
                }}>{errors.session_duration}</span>}
              </div>

              {/* Workout Type */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>Workout Type</label>
                <select 
                  name="workout_type" 
                  value={formData.workout_type} 
                  onChange={handleChange} 
                  required
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${errors.workout_type ? '#ff4444' : '#ddd'}`,
                    boxSizing: 'border-box',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="">Select Workout Type</option>
                  <option value="Cardio">Cardio</option>
                  <option value="HIIT">HIIT</option>
                  <option value="Strength">Strength</option>
                  <option value="Yoga">Yoga</option>
                </select>
                {errors.workout_type && <span style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  display: 'block'
                }}>{errors.workout_type}</span>}
              </div>

              {/* Fat Percentage */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>Fat Percentage (2-60%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="fat_percentage"
                  placeholder="Enter Fat Percentage"
                  value={formData.fat_percentage}
                  onChange={handleChange}
                  min="2"
                  max="60"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${errors.fat_percentage ? '#ff4444' : '#ddd'}`,
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }}
                />
                {errors.fat_percentage && <span style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  display: 'block'
                }}>{errors.fat_percentage}</span>}
              </div>

              {/* Water Intake */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>Water Intake (0.5-15 liters)</label>
                <input
                  type="number"
                  step="0.1"
                  name="water_intake"
                  placeholder="Enter Water Intake"
                  value={formData.water_intake}
                  onChange={handleChange}
                  min="0.5"
                  max="15"
                  required
                  readOnly={firebaseFields.water_intake}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${errors.water_intake ? '#ff4444' : '#ddd'}`,
                    boxSizing: 'border-box',
                    fontSize: '14px',
                    backgroundColor: firebaseFields.water_intake ? '#f0f0f0' : '#fff'
                  }}
                />
                {errors.water_intake && <span style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  display: 'block'
                }}>{errors.water_intake}</span>}
              </div>

              {/* Workout Frequency */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>Workout Frequency (0-20 days/week)</label>
                <input
                  type="number"
                  name="workout_frequency"
                  placeholder="Enter Workout Frequency"
                  value={formData.workout_frequency}
                  onChange={handleChange}
                  min="0"
                  max="20"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${errors.workout_frequency ? '#ff4444' : '#ddd'}`,
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }}
                />
                {errors.workout_frequency && <span style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  display: 'block'
                }}>{errors.workout_frequency}</span>}
              </div>

              {/* Experience Level */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#444'
                }}>Experience Level (0-5 scale)</label>
                <input
                  type="number"
                  name="experience_level"
                  placeholder="0=Beginner, 1=Intermediate, etc."
                  value={formData.experience_level}
                  onChange={handleChange}
                  min="0"
                  max="5"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: `1px solid ${errors.experience_level ? '#ff4444' : '#ddd'}`,
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }}
                />
                {errors.experience_level && <span style={{ 
                  color: '#ff4444', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  display: 'block'
                }}>{errors.experience_level}</span>}
              </div>
            </div>
          </div>

          <div style={{ 
            display: "flex", 
            gap: "15px",
            marginTop: '20px'
          }}>
            <button 
              type="submit" 
              style={{
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                padding: "12px 20px",
                cursor: "pointer",
                borderRadius: "6px",
                fontSize: '16px',
                fontWeight: '500',
                flex: 1,
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#0056b3"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#007bff"}
            >
              Predict Calories Burned
            </button>
            <button
              onClick={() => (window.location.href = "/logged/excercise-monitor")}
              style={{
                backgroundColor: "green",
                color: "white",
                border: "none",
                padding: "12px 20px",
                cursor: "pointer",
                borderRadius: "6px",
                fontSize: '16px',
                fontWeight: '500',
                flex: 1,
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#006400"}
              onMouseOut={(e) => e.target.style.backgroundColor = "green"}
            >
              Direct Approach
            </button>
          </div>
        </form>

        {errors.form && <p style={{ 
          color: '#ff4444', 
          marginTop: '15px',
          textAlign: 'center'
        }}>{errors.form}</p>}
        {caloriesBurned && (
          <div style={{ 
            backgroundColor: '#e9f5ff',
            padding: '15px',
            borderRadius: '8px',
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '18px',
              fontWeight: '500',
              color: '#007bff',
              margin: 0
            }}>Calories you could burn: {caloriesBurned.toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* Exercise List */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '30px'
      }}>
        {filteredExercises.map((exercise) => (
          <div key={exercise.id} style={{ 
            backgroundColor: '#fff',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Exercise Image */}
            <div style={{ height: '180px', overflow: 'hidden' }}>
              <img 
                src={exercise.image} 
                alt={exercise.title} 
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }} 
              />
            </div>

            {/* Exercise Details */}
            <div style={{ padding: '15px', flex: 1 }}>
              <h3 style={{ 
                margin: '0 0 10px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#333'
              }}>{exercise.title}</h3>
              <p style={{ 
                margin: '0 0 15px 0',
                fontSize: '14px',
                color: '#666',
                lineHeight: '1.5'
              }}>{exercise.summary}</p>
            </div>

            {/* Exercise Action */}
            <div style={{ 
              padding: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #eee'
            }}>
              <div style={{ fontSize: '14px' }}>
                <span style={{ 
                  fontWeight: '600',
                  color: '#007bff',
                  marginRight: '5px'
                }}>{exercise.calories_burned_per_hour}c</span>
                <span style={{ color: '#888' }}>/1 hour</span>
              </div>
              <button 
                onClick={() => addExercise(exercise)}
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  padding: "8px 15px",
                  cursor: "pointer",
                  borderRadius: "4px",
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#0056b3"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#007bff"}
              >
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