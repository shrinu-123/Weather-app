import React, { useRef, useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import './Weather.css'
import search_icon from '../assets/search.png'
import clear_icon from '../assets/clear.png'
import cloud_icon from '../assets/cloud.png'
import drizzle_icon from '../assets/drizzle.png'
import rain_icon from '../assets/rain.png'
import snow_icon from '../assets/snow.png'
import wind_icon from '../assets/wind.png'
import humidity_icon from '../assets/humidity.png'

const RecenterMap = ({ lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom());
  }, [lat, lon]);
  return null;
};

const reverseGeocode = async (lat, lon) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
  const data = await res.json();
  return data.address.city || data.address.town || data.address.village || data.address.state;
};


const LocationPicker = ({ setCustomCoord, inputRef, search }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;

      // Update coordinates
      setCustomCoord({ lat, lon: lng });

      // Reverse geocode to get city name
      const city = await reverseGeocode(lat, lng);
      if (city) {
        inputRef.current.value = city;
        search(city);
      }
    }
  });
  return null;
};

const Weather = () => {
  const inputRef = useRef();
  const [weatherData, setWeatherData] = useState(false);
  const [customCoord, setCustomCoord] = useState(null); // for pin drop

  const allIcons = {
    "01d": clear_icon,
    "01n": clear_icon,
    "02d": cloud_icon,
    "03d": cloud_icon,
    "03n": cloud_icon,
    "04d": drizzle_icon,
    "04n": drizzle_icon,
    "09d": rain_icon,
    "09n": rain_icon,
    "10d": rain_icon,
    "10n": rain_icon,
    "13d": snow_icon,
    "13n": snow_icon
  }

  const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const search = async (city) => {
    if (city === "") {
      alert("Please enter a city name");
      return;
    }
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      const icon = allIcons[data.weather[0].icon] || clear_icon;

      setWeatherData({
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        temperature: Math.floor(data.main.temp),
        location: data.name,
        icon: icon,
        coord: data.coord
      });
      console.log("Setting map to: ", data.coord);


      setCustomCoord({
        lat: data.coord.lat,
        lon: data.coord.lon
      });
      // move map to searched location

    } catch (error) {
      setWeatherData(false);
      console.error("Error in fetching data");
    }
  }

  useEffect(() => {
    search("London");
  }, []);

  return (
    <div className='weather'>
      <div className='search-bar'>
        <input ref={inputRef} type="text" placeholder='Search' />
        <img src={search_icon} alt="" onClick={() => search(inputRef.current.value)} />
      </div>

      {weatherData && <>
        <img src={weatherData.icon} alt="" className='weather-icon' />
        <p className='temperature'>{weatherData.temperature}°C</p>
        <p className='location'>{weatherData.location}</p>

        <div className='weather-data'>
          <div className="column">
            <img src={humidity_icon} alt="" />
            <div>
              <p>{weatherData.humidity}%</p>
              <span>Humidity</span>
            </div>
          </div>

          <div className='column'>
            <img src={wind_icon} alt="" />
            <div>
              <p>{weatherData.windSpeed} Km/h</p>
              <span>Wind Speed</span>
            </div>
          </div>
        </div>

        {customCoord && (
          <div className="map-container">
            <MapContainer
              center={[customCoord.lat, customCoord.lon]}
              zoom={10}
              style={{ height: "300px", width: "100%", marginTop: "20px", borderRadius: "12px" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[customCoord.lat, customCoord.lon]} icon={customIcon}>
                <Popup>
                  Selected Location<br />Lat: {customCoord.lat.toFixed(2)}, Lon: {customCoord.lon.toFixed(2)}
                </Popup>
              </Marker>
              <RecenterMap lat={customCoord.lat} lon={customCoord.lon} />
              <LocationPicker setCustomCoord={setCustomCoord} inputRef={inputRef} search={search} />

            </MapContainer>
          </div>
        )}
      </>}
    </div>
  )
}

export default Weather;

