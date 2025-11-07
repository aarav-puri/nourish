// Configuration
const CONFIG = {
  // API key is now stored securely on the server
  // No need to expose it in the frontend
  OPENROUTER_API_URL: "/api/ai", // Proxy endpoint (Vercel serverless function)
  MODEL: "google/gemini-2.5-flash",
  OPEN_FOOD_FACTS_API: "https://world.openfoodfacts.org/api/v0/product",
  // Supabase credentials
  SUPABASE_URL: "https://aqbsazjkcqohjwqexsqv.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYnNhemprY3FvaGp3cWV4c3F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzI5NDksImV4cCI6MjA3ODA0ODk0OX0.IUFoSyr86CJHKKz4aOlFTUPAlgYlY_D0oAbjQtw11So",
};

// User preferences (stored in localStorage)
const getUserPreferences = () => {
  const prefs = localStorage.getItem("userPreferences");
  return prefs
    ? JSON.parse(prefs)
    : {
        dietaryRestrictions: [],
        allergies: [],
        sustainabilityPreference: true,
        priceRange: "medium",
      };
};

const saveUserPreferences = (prefs) => {
  localStorage.setItem("userPreferences", JSON.stringify(prefs));
};
