// src/services/windyService.js

// Keep your existing key
const OWM_API_KEY = "a4636529f089cf54f303c99e6bc73455"; 

export const windyLayers = {
  // Nitrogen Dioxide (Pollution)
  no2: `https://tile.openweathermap.org/map/no2/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`,
  
  // PM 2.5 (Haze)
  pm25: `https://tile.openweathermap.org/map/pm2_5/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`,
  
  // NEW: Wind Speed & Direction Layer
  wind: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`,
  
  // NEW: Precipitation (Rain) - useful for "washing away" pollution context
  rain: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`,
};