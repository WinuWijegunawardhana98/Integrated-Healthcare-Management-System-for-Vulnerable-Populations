import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ENV from '../data/Env';
import { useOutletContext } from 'react-router-dom';

const LifePathSuggestions = () => {
  const { username } = useOutletContext();
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tip, setTip] = useState('');
  const [dietSuggestions, setDietSuggestions] = useState([]);

  const healthTips = {
    general: [
      "Stay hydrated and drink at least 8 glasses of water daily.",
      "Aim for at least 30 minutes of moderate exercise per day.",
      "Practice deep breathing and mindfulness to reduce stress."
    ],
    diabetes: [
      "Maintain a balanced diet with low sugar intake.",
      "Monitor blood sugar levels regularly and stay active.",
      "Choose whole grains over processed foods for better glucose control."
    ],
    heart_patient: [
      "Engage in low-impact exercises like walking or yoga.",
      "Reduce salt intake to keep blood pressure in check.",
      "Avoid trans fats and eat more heart-friendly foods like fish and nuts."
    ],
    seniors: [
      "Prioritize bone health with calcium-rich foods.",
      "Stay socially active to maintain mental well-being.",
      "Ensure regular medical checkups for early detection of health issues."
    ]
  };

  const dietItems = [
    {
      name: "Diabetic Salad",
      imagePath: "https://www.eatingwell.com/thmb/bv6F3b9mi_a017XG_73h8TSVCoU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/7436258-68b68f1ecb954104affe85a0c8c1d85f.jpg",
      nutritions: ["Protein", "Fiber", "Vitamins", "Minerals"],
      suitableFor: ["Diabetes", "Heart Diseases"],
    },
    {
      name: "Heart Healthy Oatmeal",
      imagePath: "https://www.eatingwell.com/thmb/e2iV6HvZQa8lZyKiEX8lp7z_qR0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/EWL-251317-oatmeal-with-fruit-nuts-04-A-ad4552834cec480d8c6ea92b5f29aa40.jpg",
      nutritions: ["Fiber", "Omega-3", "Protein"],
      suitableFor: ["Heart Diseases", "Seniors"],
    },
    {
      name: "Calcium-Rich Smoothie",
      imagePath: "https://images.squarespace-cdn.com/content/v1/60f0a98861ccc05f5a850211/a0db671c-094e-4bf3-956d-c800cba6bb82/Smoothie.png",
      nutritions: ["Calcium", "Vitamin D", "Fiber"],
      suitableFor: ["Seniors"],
    },
    {
      name: "Low-Sugar Green Juice",
      imagePath: "https://images.squarespace-cdn.com/content/v1/61d58011a75874135ce99702/97f432f5-f348-49e9-819e-21343611e684/DA8184~1.JPG",
      nutritions: ["Vitamins", "Fiber", "Antioxidants"],
      suitableFor: ["Diabetes"],
    },
    {
      name: "Grilled Salmon",
      imagePath: "https://www.tasteofhome.com/wp-content/uploads/2024/02/Grilled-Salmon-Fillets_EXPS_THVS23_273661_MR_09_13_23_GrilledSalmonFillets_1.jpg",
      nutritions: ["Omega-3", "Protein", "Vitamin D"],
      suitableFor: ["Heart Diseases"],
    },
    {
      name: "Avocado Toast",
      imagePath: "https://www.mediterraneanliving.com/wp-content/uploads/2018/04/image4.jpg",
      nutritions: ["Healthy Fats", "Fiber", "Potassium"],
      suitableFor: ["Diabetes", "Heart Diseases"],
    },
    {
      name: "Greek Yogurt with Berries",
      imagePath: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNZ3mgR0RBJDAEIsA6uw71M8PcaUW-l0hedg&s",
      nutritions: ["Probiotics", "Calcium", "Protein"],
      suitableFor: ["Young", "Diabetes"],
    },
    {
      name: "Quinoa and Chickpea Bowl",
      imagePath: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7NF9wVL-h__UuYwp5k_1OAJbuB-V4SlV3XA&s",
      nutritions: ["Protein", "Fiber", "Iron"],
      suitableFor: ["Heart Diseases", "Diabetes"],
    },
    {
      name: "Steamed Vegetables",
      imagePath: "https://www.kitchensanctuary.com/wp-content/uploads/2023/10/Steamed-Veg-Medley-square-FS.jpg",
      nutritions: ["Vitamins", "Fiber", "Antioxidants"],
      suitableFor: ["Diabetes", "Seniors"],
    },
    {
      name: "Lentil Soup",
      imagePath: "https://theclevermeal.com/wp-content/uploads/2022/02/mediterranean-lentil-soup_2.jpg",
      nutritions: ["Protein", "Fiber", "Iron"],
      suitableFor: ["Heart Diseases", "Diabetes"],
    },
    {
      name: "Almond & Walnut Mix",
      imagePath: "https://m.media-amazon.com/images/I/71oR9w5AjbL._AC_UF894,1000_QL80_.jpg",
      nutritions: ["Healthy Fats", "Protein", "Magnesium"],
      suitableFor: ["Heart Diseases", "Seniors"],
    },
    {
      name: "Boiled Eggs & Spinach",
      imagePath: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTxdfzLAXFM5X7AqNY9SZdxtUmJnG8HoSixg&s",
      nutritions: ["Protein", "Iron", "Vitamins"],
      suitableFor: ["Seniors", "Heart Diseases"],
    },
    {
      name: "Brown Rice & Grilled Chicken",
      imagePath: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0m3LO2gCoHfLwCoUMbIctDoH-Ifhv6E368Q&s",
      nutritions: ["Protein", "Fiber", "Iron"],
      suitableFor: ["Diabetes", "Heart Diseases"],
    },
    {
      name: "Fresh Fruit Platter",
      imagePath: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqA-C7XDndsEWfugAMY8xj74SqwWnjVDervQ&s",
      nutritions: ["Vitamins", "Antioxidants", "Fiber"],
      suitableFor: ["Diabetes", "Seniors"],
    },
    {
      name: "Baked Sweet Potatoes",
      imagePath: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlCrVjl6bTZZ6ONPFNx4Qpswe-ggG-_r1yIg&s",
      nutritions: ["Fiber", "Vitamin A", "Potassium"],
      suitableFor: ["Heart Diseases", "Diabetes"],
    },
    {
      name: "Turmeric Ginger Tea",
      imagePath: "https://tastythriftytimely.com/wp-content/uploads/2023/01/Ginger-Turmeric-Tea-Featured.jpg",
      nutritions: ["Antioxidants", "Anti-Inflammatory", "Immune Boosting"],
      suitableFor: ["Seniors", "Heart Diseases"],
    },
    {
      name: "Grilled Chicken with Quinoa & Vegetables",
      imagePath: "https://healthyfitnessmeals.com/wp-content/uploads/2018/01/Barbecue-chicken-quinoa-bowls-3-SQUARE.jpg",
      nutritions: ["High Protein", "Fiber", "Healthy Carbs"],
      suitableFor: ["Young", "Muscle Gain"],
    },
    {
      name: "Salmon with Brown Rice & Avocado",
      imagePath: "https://californiaavocado.com/wp-content/uploads/2020/07/Salmon-and-Brown-Rice-Bowl-with-California-Avocado.jpeg",
      nutritions: ["Omega-3", "Protein", "Healthy Fats"],
      suitableFor: ["Young", "Muscle Recovery"],
    },
  ];

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const response = await axios.get(`${ENV.SERVER}/users/${username}/all`);
        setHealthData(response.data);
        generateTip(response.data.personal_health);
        suggestDiet(response.data.personal_health);
        // console.log(response.data.personal_health)
      } catch (err) {
        console.error('Error fetching health data:', err);
        setError('Failed to load health data');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
  }, [username]);

  const generateTip = (data) => {
    let tips = [...healthTips.general];
    
    if (data.diabetes) tips = tips.concat(healthTips.diabetes);
    if (data.heart_attack || data.heart_diseases) tips = tips.concat(healthTips.heart_patient);
    if (data.age > 50) tips = tips.concat(healthTips.seniors);
    
    setTip(tips[Math.floor(Math.random() * tips.length)]);
  };

  const suggestDiet = (data) => {
    console.log(data.diabetes);
    
    // Filter based on health conditions
    let suggestedDiets = dietItems.filter(diet => {
      if (data.diabetes && diet.suitableFor.includes("Diabetes")) return true;
      if ((data.heart_attack || data.heart_diseases) && diet.suitableFor.includes("Heart Diseases")) return true;
      if (data.age > 50 && diet.suitableFor.includes("Seniors")) return true;
      if (data.age <= 50 && diet.suitableFor.includes("Young")) return true;
      return false;
    });
  
    // Shuffle function (Fisher-Yates Algorithm)
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
      }
    };
  
    shuffleArray(suggestedDiets); // Shuffle the array
    setDietSuggestions(suggestedDiets.slice(0, 6)); // Select up to 6 items
  
    console.log(suggestedDiets.slice(0, 6));
  };
  

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="recentOrders">
      <h2>LifePath Suggestions</h2>
      <div className="tip-box" style={{
        padding: '15px',
        border: '2px solid #28a745',
        borderRadius: '10px',
        backgroundColor: '#f9f9f9',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <p>{tip}</p>
      </div>

      <h3 style={{ marginTop: '30px' }}>Recommended Diets</h3>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        justifyContent: 'space-between',
      }}>
        {dietSuggestions.map((diet, index) => (
          <div key={index} style={{
            display: 'flex',
            flexDirection: 'row',
            border: '1px solid #ddd',
            borderRadius: '10px',
            padding: '10px',
            width: '350px',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ flex: '0 0 30%', marginRight: '10px' }}>
              <img src={diet.imagePath} alt={diet.name} style={{
                width: '100%',
                height: 'auto',
                borderRadius: '10px',
              }} />
            </div>
            <div style={{ flex: '1' }}>
              <h4>{diet.name}</h4>
              {/* <div style={{ marginBottom: '10px' }}>
                <span style={{
                  padding: '5px 10px',
                  backgroundColor: '#f39c12',
                  color: '#fff',
                  borderRadius: '20px',
                  marginRight: '5px',
                }}>
                  {diet.suitableFor.join(', ')}
                </span>
              </div> */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {diet.nutritions.map((nutrition, idx) => (
                  <div key={idx} style={{
                    padding: '5px 10px',
                    backgroundColor: '#2ecc71',
                    color: '#fff',
                    borderRadius: '20px',
                  }}>
                    {nutrition}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LifePathSuggestions;
