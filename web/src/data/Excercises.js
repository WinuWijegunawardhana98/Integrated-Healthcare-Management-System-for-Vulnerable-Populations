const exercises = [
  {
    id: 1,
    title: 'Push-Up',
    summary: 'A basic upper-body exercise that targets the chest, shoulders, and triceps.',
    image: 'https://i.pinimg.com/originals/fd/bb/09/fdbb092b58863e5c86fdb8bb1411fcea.gif',
    type: 'Strength',
    not_suitable: ['Shoulder injury', 'Tachycardia', 'Heart attack', 'High cholesterol'],
    calories_burned_per_hour: 450, // Approximate value for push-ups
  },
  {
    id: 2,
    title: 'Squat',
    summary: 'A fundamental exercise that strengthens the legs and glutes.',
    image: 'https://images.squarespace-cdn.com/content/v1/54f9e84de4b0d13f30bba4cb/1530743652042-8AW6T0MPM6Q0JYEV6AO9/image-asset.gif',
    type: 'Strength',
    not_suitable: ['Knee pain', 'Bradycardia', 'Heart attack'],
    calories_burned_per_hour: 400, // Approximate value for squats
  },
  {
    id: 3,
    title: 'Plank',
    summary: 'An isometric core exercise that builds endurance in the abs and back.',
    image: 'https://hips.hearstapps.com/hmg-prod/images/08-commando-planks-ps-1550754031.gif?crop=0.846xw:1.00xh;0.0725xw,0&resize=980:*',
    type: 'Strength',
    not_suitable: ['Lower back pain', 'Tachycardia', 'Heart attack'],
    calories_burned_per_hour: 250, // Approximate value for planks
  },
  {
    id: 4,
    title: 'Jumping Jacks',
    summary: 'A full-body cardio exercise that increases heart rate and burns calories.',
    image: 'https://i.pinimg.com/originals/57/cc/e0/57cce0afa73a4b4c9c8c139d08aec588.gif',
    type: 'Cardio',
    not_suitable: ['Tachycardia', 'Joint pain', 'Heart attack'],
    calories_burned_per_hour: 600, // Approximate value for jumping jacks
  },
  {
    id: 5,
    title: 'Burpees',
    summary: 'A high-intensity exercise combining a squat, push-up, and jump to improve strength and cardio fitness.',
    image: 'https://i0.wp.com/joshuaspodek.com/wp-content/uploads/2016/07/burpee.gif?resize=640%2C425&ssl=1',
    type: 'HIIT',
    not_suitable: ['Tachycardia', 'Diabetes', 'Knee injury', 'Heart attack'],
    calories_burned_per_hour: 750, // Approximate value for burpees
  },
  {
    id: 6,
    title: 'Mountain Climbers',
    summary: 'A high-intensity cardio exercise that strengthens the core and legs.',
    image: 'https://i.pinimg.com/originals/32/a7/d0/32a7d00d6123dd416e459ba67cf1691b.gif',
    type: 'HIIT',
    not_suitable: ['Bradycardia', 'Tachycardia', 'Heart attack'],
    calories_burned_per_hour: 700, // Approximate value for mountain climbers
  },
  {
    id: 7,
    title: 'Child’s Pose',
    summary: 'A gentle yoga pose that stretches the back, hips, and thighs while promoting relaxation.',
    image: 'https://www.vissco.com/wp-content/uploads/animation/sub/q-ped-scapular-push-to-child-pose.gif',
    type: 'Yoga',
    not_suitable: ['Knee pain'],
    calories_burned_per_hour: 120, // Approximate value for child’s pose (restorative yoga)
  },
  {
    id: 8,
    title: 'Downward Dog',
    summary: 'A foundational yoga pose that stretches the shoulders, hamstrings, and calves.',
    image: 'https://media3.giphy.com/media/okAQTmSnRnIX5oBXGo/200w.gif?cid=6c09b9522imsyigb5zwtitox4j62mbqx2e781mrwjko3u42t&ep=v1_gifs_search&rid=200w.gif&ct=g',
    type: 'Yoga',
    not_suitable: ['Wrist pain', 'Dizziness'],
    calories_burned_per_hour: 250, // Approximate value for downward dog (vinyasa yoga)
  },
  {
    id: 9,
    title: 'Cycling',
    summary: 'A low-impact cardio exercise that strengthens the legs and improves endurance.',
    image: 'https://media.giphy.com/media/3o6ZtaO9BZHcOjmErm/giphy.gif',
    type: 'Cardio',
    not_suitable: ['Tachycardia', 'Knee pain', 'Heart attack', 'High cholesterol'],
    calories_burned_per_hour: 500, // Approximate value for cycling
  },
  {
    id: 10,
    title: 'Deadlift',
    summary: 'A strength exercise targeting the back, legs, and core.',
    image: 'https://media.giphy.com/media/l0HlIJQ0x8il1CK9y/giphy.gif',
    type: 'Strength',
    not_suitable: ['Lower back pain', 'Tachycardia', 'Heart attack'],
    calories_burned_per_hour: 400, // Approximate value for deadlifts
  },
];

export default exercises;
