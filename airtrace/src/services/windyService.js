// src/services/windyService.js

// 1. Sign up for free at https://openweathermap.org/
// 2. Go to "My API Keys" and paste it below:
const OWM_API_KEY = "a4636529f089cf54f303c99e6bc73455"; 

export const windyLayers = {
  // Nitrogen Dioxide (Pollution from cars)
  no2: `https://tile.openweathermap.org/map/no2/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`,
  
  // PM 2.5 (Fine particles / Haze)
  pm25: `https://tile.openweathermap.org/map/pm2_5/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`,
  
  // Clouds (Good for fallback)
  clouds: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`,
};