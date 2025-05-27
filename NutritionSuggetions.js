import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ENV from '../data/Env';
import { useOutletContext } from 'react-router-dom';

const NutritionSuggestions = () => {
  const { username } = useOutletContext();
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mealPlans, setMealPlans] = useState({ breakfast: {}, lunch: {}, dinner: {} });
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [allergyWarnings, setAllergyWarnings] = useState({});
  const [recipeImages, setRecipeImages] = useState({});

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const response = await axios.get(`${ENV.SERVER}/users/${username}/all`);
        setHealthData(response.data);
        
        if (response.data.personal_health?.allergies) {
          const allergyList = response.data.personal_health.allergies
            .split(',')
            .map(allergy => allergy.trim().toLowerCase());
          setAllergies(allergyList);
        }
        
        generateMealPlan(response.data.personal_health);
      } catch (err) {
        console.error('Error fetching health data:', err);
        setError('Failed to load health data');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
  }, [username]);

  const fetchRecipeImage = async (recipeName) => {
    // Check if we already have this image cached
    if (recipeImages[recipeName]) {
      return recipeImages[recipeName];
    }

    const apiKey = '50083402-819231ce6cf1bb0379774b66b';
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(recipeName)}&image_type=photo&category=food&per_page=3`;

    try {
      const response = await axios.get(url);
      
      if (response.data.hits && response.data.hits.length > 0) {
        const imageUrl = response.data.hits[0].webformatURL;
        // Cache the image URL
        setRecipeImages(prev => ({ ...prev, [recipeName]: imageUrl }));
        return imageUrl;
      }
    } catch (err) {
      console.error('Error fetching image from Pixabay:', err);
    }
    return null;
  };

  const generateMealPlan = async (health) => {
    const payload = {
      max_daily_fat: health.age > 50 ? 40.0 : 60.0,
      max_nutritional_values: {
        Calories: health.age > 50 ? 400 : 600,
        Protein: health.diabetes ? 40 : 30,
        Carbohydrates: health.heart_diseases ? 50 : 70,
      },
      ingredient_filter: getRecommendedIngredients(health),
      allergy_filter: allergies
    };

    try {
      const response = await axios.post(`${ENV.SERVER}/recommend_recipe`, payload);
      const mealsWithImages = { ...response.data };
      
      // Fetch images for each meal
      for (const mealType of ['breakfast', 'lunch', 'dinner']) {
        if (mealsWithImages[mealType]?.Name) {
          const imageUrl = await fetchRecipeImage(mealsWithImages[mealType].Name);
          if (imageUrl) {
            mealsWithImages[mealType].imageUrl = imageUrl;
          }
        }
      }
      
      setMealPlans(mealsWithImages);
      checkForAllergens(mealsWithImages);
    } catch (err) {
      console.error('Error fetching meal plan:', err);
      setError('Failed to load meal plan');
    }
  };

  const checkForAllergens = (meals) => {
    const warnings = {};
    
    Object.keys(meals).forEach(mealType => {
      const meal = meals[mealType];
      if (meal?.RecipeIngredientParts) {
        const ingredients = meal.RecipeIngredientParts
          .replace(/c\(|\)/g, '')
          .split(',')
          .map(ing => ing.trim().toLowerCase());
        
        const foundAllergens = allergies.filter(allergy => 
          ingredients.some(ingredient => ingredient.includes(allergy))
        );
        
        if (foundAllergens.length > 0) {
          warnings[mealType] = foundAllergens;
        }
      }
    });
    
    setAllergyWarnings(warnings);
  };

  const getRecommendedIngredients = (health) => {
    let ingredients = ["chicken"];

    if (health.diabetes) {
      ingredients = ["quinoa"];
    }
    if (health.heart_diseases) {
      ingredients = ["oats"];
    }
    if (health.age > 50) {
      ingredients = ["almonds"];
    }

    return ingredients;
  };

  const handleMealClick = (meal) => {
    setSelectedMeal(meal);
  };

  const handleBackClick = () => {
    setSelectedMeal(null);
  };

  const renderAllergyWarning = (mealType) => {
    if (!allergyWarnings[mealType]) return null;
    
    const allergens = allergyWarnings[mealType].join(', ');
    return (
      <div style={{
        backgroundColor: '#fff3cd',
        color: '#856404',
        padding: '10px',
        borderRadius: '5px',
        margin: '10px 0',
        borderLeft: '4px solid #ffc107'
      }}>
        ⚠️ Warning: This meal contains ingredients that may trigger your allergies: {allergens}
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="recentOrders">
      <h2>Personalized Nutrition Plan</h2>
      <br></br>

      {allergies.length > 0 && (
        <div style={{
          backgroundColor: '#e2f0fd',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          borderLeft: '5px solid #2196F3'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0d47a1' }}>Your Allergies</h4>
          <p style={{ margin: 0 }}>
            You have indicated allergies to: <strong>{allergies.join(', ')}</strong>. 
            We'll avoid these ingredients in your recommendations.
          </p>
        </div>
      )}

      {selectedMeal ? (
        <div className="meal-detail-view">
          <div style={{display: 'flex', alignItems: 'center', height: '100%'}}>
            <button onClick={handleBackClick} style={styles.backButton}>Back</button>
            <h3 style={{color: "#00796b"}}>{selectedMeal.Name}</h3>
          </div>
          
          {allergyWarnings[selectedMeal.mealType] && renderAllergyWarning(selectedMeal.mealType)}

          <div style={styles.detailContainer}>
            <div style={styles.imageColumn}>
              <img 
                src={selectedMeal.imageUrl || "https://st2.depositphotos.com/28106912/50461/v/450/depositphotos_504618926-stock-illustration-sample-breakfast-farm-fresh-plate.jpg"} 
                alt={selectedMeal.Name} 
                style={styles.detailImage} 
                onError={(e) => {
                  e.target.src = "https://st2.depositphotos.com/28106912/50461/v/450/depositphotos_504618926-stock-illustration-sample-breakfast-farm-fresh-plate.jpg";
                }}
              />
              <div style={{
                backgroundColor: '#fff', 
                borderRadius: '10px', 
                padding: '20px', 
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', 
                marginTop: '20px'
              }}>
                <h4 style={{ marginBottom: '10px' }}>Ingredients:</h4>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                  {selectedMeal.RecipeIngredientParts.replace(/c\(|\)/g, '')
                    .split(',')
                    .map((ingredient, index) => {
                      const ingredientLower = ingredient.trim().toLowerCase();
                      const isAllergen = allergies.some(allergy => 
                        ingredientLower.includes(allergy.toLowerCase())
                      );
                      
                      return (
                        <li key={index} style={{
                          marginBottom: '10px', 
                          display: 'flex', 
                          alignItems: 'center',
                          color: isAllergen ? '#d32f2f' : 'black',
                          fontWeight: isAllergen ? 'bold' : 'normal'
                        }}>
                          <span style={{
                            width: '10px', 
                            height: '10px', 
                            borderRadius: '50%', 
                            backgroundColor: isAllergen ? '#d32f2f' : 'orange', 
                            marginRight: '10px'
                          }}></span>
                          <span>
                            {ingredient.trim()}
                            {isAllergen && (
                              <span style={{ color: '#d32f2f', marginLeft: '5px' }}>(⚠️ Your allergen)</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
            
            <div style={styles.nutritionColumn}>
              <div style={{
                backgroundColor: '#fff', 
                borderRadius: '10px', 
                padding: '20px', 
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', 
                marginTop: '20px'
              }}>
                <h4 style={{ marginBottom: '10px' }}>Nutrition Facts:</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f3f3f3', borderRadius: '10px', flex: 1, margin: '5px' }}>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedMeal.Calories}</p>
                    <p style={{ fontSize: '12px', color: '#00796b' }}>Calories</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f3f3f3', borderRadius: '10px', flex: 1, margin: '5px' }}>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedMeal.ProteinContent}g</p>
                    <p style={{ fontSize: '12px', color: '#00796b' }}>Protein</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f3f3f3', borderRadius: '10px', flex: 1, margin: '5px' }}>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedMeal.CarbohydrateContent}g</p>
                    <p style={{ fontSize: '12px', color: '#00796b' }}>Carbs</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f3f3f3', borderRadius: '10px', flex: 1, margin: '5px' }}>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedMeal.FatContent}g</p>
                    <p style={{ fontSize: '12px', color: '#00796b' }}>Fat</p>
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#fff', 
                borderRadius: '10px', 
                padding: '20px', 
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', 
                marginTop: '20px'
              }}>
                <h4 style={{ marginBottom: '10px' }}>Instructions:</h4>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                  {selectedMeal.RecipeInstructions
                    .replace(/c\(|\)/g, '')
                    .split(',')
                    .map((step, index) => (
                      <li key={index} style={{
                        marginBottom: '10px', 
                        display: 'flex', 
                        alignItems: 'center'
                      }}>
                        <span style={{
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          backgroundColor: 'orange', 
                          marginRight: '10px'
                        }}></span>
                        <span style={{ color: 'black' }}>{step.trim()}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="meal-container" style={styles.mealContainer}>
          {["breakfast", "lunch", "dinner"].map((mealType) => (
            <div 
              key={mealType}
              className="meal-card" 
              style={styles.mealCard}
            >
              {mealPlans[mealType]?.Name ? (
                <div className="meal-item">
                  <img 
                    className="meal-image" 
                    src={mealPlans[mealType].imageUrl || "https://st2.depositphotos.com/28106912/50461/v/450/depositphotos_504618926-stock-illustration-sample-breakfast-farm-fresh-plate.jpg"} 
                    alt={mealPlans[mealType].Name} 
                    style={styles.mealImage}
                    onError={(e) => {
                      e.target.src = "https://st2.depositphotos.com/28106912/50461/v/450/depositphotos_504618926-stock-illustration-sample-breakfast-farm-fresh-plate.jpg";
                    }}
                  />
                  <h3 style={styles.mealType}>{mealType.toUpperCase()}</h3><br></br>
                  <h3 style={styles.mealTitle}>{mealPlans[mealType].Name}</h3>
                  <p><strong>Calories:</strong> {mealPlans[mealType].Calories}</p>
                  <p><strong>Protein:</strong> {mealPlans[mealType].ProteinContent}g</p>
                  <p><strong>Carbs:</strong> {mealPlans[mealType].CarbohydrateContent}g</p>
                  <p><strong>Fat:</strong> {mealPlans[mealType].FatContent}g</p>
                  
                  {renderAllergyWarning(mealType)}
                  
                  <br></br>
                  <center>
                    <button 
                      onClick={() => {
                        const mealWithType = {...mealPlans[mealType], mealType};
                        handleMealClick(mealWithType);
                      }}
                      style={styles.viewDetailsButton}
                    >
                      View Details
                    </button>
                  </center>
                </div>
              ) : (
                <p style={styles.noMealText}>No meal suggestions available.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  mealContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "15px"
  },
  mealCard: {
    backgroundColor: "#e0f7fa",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    textAlign: "left",
    flex: "1",
    maxWidth: "350px",
    margin: "10px",
  },
  mealImage: {
    width: "100%",
    borderRadius: "10px",
    marginBottom: "10px",
    height: "200px",
    objectFit: "cover"
  },
  mealType: {
    textAlign: "center", 
    fontSize: "16px", 
    color: "#00796b"
  },
  mealTitle: {
    color: "#00796b", 
    fontSize: "18px", 
    marginBottom: "10px"
  },
  viewDetailsButton: {
    backgroundColor: "#00796b",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer"
  },
  noMealText: {
    color: "#d32f2f", 
    fontWeight: "bold"
  },
  backButton: {
    backgroundColor: "#00796b",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "20px"
  },
  detailContainer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "30px"
  },
  imageColumn: {
    flex: "1",
  },
  nutritionColumn: {
    flex: "1",
  },
  detailImage: {
    width: "100%",
    borderRadius: "10px",
    marginBottom: "15px",
    height: "300px",
    objectFit: "cover"
  },
  ingredientsList: {
    paddingLeft: "20px"
  },
  bulletPoint: {
    listStyleType: "circle",
    marginBottom: "5px",
    color: "orange",
  },
  nutritionCard: {
    backgroundColor: "#f1f1f1",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px"
  },
  instructionsCard: {
    backgroundColor: "#f1f1f1",
    padding: "15px",
    borderRadius: "10px"
  },
  instructionStep: {
    marginBottom: "5px"
  }
};

export default NutritionSuggestions;