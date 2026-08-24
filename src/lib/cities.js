// Supported high-precision geographic coordinate anchors for Panchang & Kundali
export const CITIES = [
  { id: 'dhanbad', name: 'Dhanbad', state: 'Jharkhand', country: 'India', lat: 23.7957, lng: 86.4304, tz: 5.5 },
  { id: 'patna', name: 'Patna', state: 'Bihar', country: 'India', lat: 25.5941, lng: 85.1376, tz: 5.5 },
  { id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', country: 'India', lat: 25.3176, lng: 82.9739, tz: 5.5 },
  { id: 'delhi', name: 'New Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lng: 77.2090, tz: 5.5 },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0760, lng: 72.8777, tz: 5.5 },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lng: 77.5946, tz: 5.5 },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5726, lng: 88.3639, tz: 5.5 },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lng: 80.2707, tz: 5.5 },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.3850, lng: 78.4867, tz: 5.5 },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lng: 73.8567, tz: 5.5 },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', country: 'India', lat: 26.9124, lng: 75.7873, tz: 5.5 },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0225, lng: 72.5714, tz: 5.5 },
  { id: 'ujjain', name: 'Ujjain', state: 'Madhya Pradesh', country: 'India', lat: 23.1765, lng: 75.7885, tz: 5.5 },
  { id: 'haridwar', name: 'Haridwar', state: 'Uttarakhand', country: 'India', lat: 29.9457, lng: 78.1642, tz: 5.5 },
  { id: 'guwahati', name: 'Guwahati', state: 'Assam', country: 'India', lat: 26.1445, lng: 91.7362, tz: 5.5 },
  { id: 'dubai', name: 'Dubai', state: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, tz: 4.0 },
  { id: 'london', name: 'London', state: 'England', country: 'UK', lat: 51.5074, lng: -0.1278, tz: 1.0 },
  { id: 'newyork', name: 'New York', state: 'NY', country: 'USA', lat: 40.7128, lng: -74.0060, tz: -4.0 },
  { id: 'sanfrancisco', name: 'San Francisco', state: 'CA', country: 'USA', lat: 37.7749, lng: -122.4194, tz: -7.0 },
  { id: 'singapore', name: 'Singapore', state: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, tz: 8.0 }
];

export const DEFAULT_CITY = CITIES[0]; // Dhanbad, Jharkhand as specified in prompt
