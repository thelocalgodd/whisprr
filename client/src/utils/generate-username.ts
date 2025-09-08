function generateAnonymousUsername() {
    const adjectives = [
      "Kind", "Quiet", "Calm", "Gentle", "Hopeful", "Patient",
      "Brave", "Caring", "Thoughtful", "Peaceful", "Warm", "Honest",
      "Steady", "Soft", "Friendly", "Wise"
    ];
  
    const nouns = [
      "Seeker", "Listener", "Supporter", "Friend", "Companion", "Guide",
      "Helper", "Soul", "Voice", "Ally", "Mind", "Heart", "Pathfinder",
      "Light", "Anchor", "Spirit"
    ];
  
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
  
    return `${randomAdjective}${randomNoun}${randomNumber}`;
  }


  export default generateAnonymousUsername;