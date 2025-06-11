import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import axios from "axios";
import { locations } from "./locations";
import "./App.css";

function convertLatLonToXYZ(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

function Marker({ location, onClick, onHover }) {
  const pos = convertLatLonToXYZ(location.lat, location.lon, 2);
  return (
    <mesh
      position={[pos.x, pos.y, pos.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick(location);
      }}
      onPointerOver={() => onHover(location.name)}
      onPointerOut={() => onHover(null)}
      scale={1.2}
    >
      <sphereGeometry args={[0.03, 16, 16]} />
      <meshBasicMaterial color="orange" />
    </mesh>
  );
}

export default function App() {
  const [hoveredName, setHoveredName] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [info, setInfo] = useState(null);
  const [infoVisible, setInfoVisible] = useState(false);

  const WEATHER_API_KEY = "e6d02aec03da2632c5505afa1f2670ec";
  const EXCHANGE_API_KEY = "c84e654df5ff565ce29a6adf";
  const UNSPLASH_ACCESS_KEY = "AQPoHBzv-aqVMwY6iB7oHXSvRWcGRTA16WGinMFg84s";

  useEffect(() => {
    if (!selectedLocation) {
      setInfoVisible(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [weatherRes, rateRes, imageRes] = await Promise.all([
          axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${selectedLocation.name}&units=metric&appid=${WEATHER_API_KEY}&lang=kr`
          ),
          axios.get(
            `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/KRW`
          ),
          axios.get(
            `https://api.unsplash.com/search/photos?query=${selectedLocation.name}&client_id=${UNSPLASH_ACCESS_KEY}`
          ),
        ]);

        const currency = selectedLocation.currency;
        const currencyRate = rateRes.data.conversion_rates[currency] || "N/A";

        const imageUrl =
          imageRes.data.results.length > 0
            ? imageRes.data.results[0].urls.regular
            : `https://source.unsplash.com/400x300/?${selectedLocation.name}`;

        setInfo({
          weather: weatherRes.data.weather[0].description,
          temp: weatherRes.data.main.temp,
          currencyRate,
          image: imageUrl,
        });

        setInfoVisible(true);
      } catch (error) {
        console.error("API Error:", error);
        setInfo(null);
        setInfoVisible(false);
      }
    };

    fetchData();
  }, [selectedLocation]);

  const onBackgroundClick = () => {
    if (infoVisible) {
      setInfoVisible(false);
      setSelectedLocation(null);
      setInfo(null);
    }
  };

  return (
    <div className="container" onPointerDown={onBackgroundClick}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.8} />
        <Stars radius={100} depth={50} count={5000} factor={4} />
        <OrbitControls enableZoom={false} enableRotate={true} />
        <mesh>
          <sphereGeometry args={[2, 64, 64]} />
          <meshStandardMaterial
            map={new THREE.TextureLoader().load("/earth_texture.jpg")}
          />
        </mesh>
        {locations.map((loc, idx) => (
          <Marker
            key={idx}
            location={loc}
            onClick={setSelectedLocation}
            onHover={setHoveredName}
          />
        ))}
      </Canvas>

      {hoveredName && <div className="hover-label">{hoveredName}</div>}
      <div className={`info-panel ${infoVisible ? "visible" : "hidden"}`}>
        {selectedLocation && info ? (
          <>
            <h2>{selectedLocation.name}</h2>
            <img src={info.image} alt={selectedLocation.name} />
            <p>
              날씨: {info.weather} ({info.temp}°C)
            </p>
            <p>
              환율: 1 {selectedLocation.currency} ≈ {info.currencyRate} KRW
            </p>
          </>
        ) : (
          <p>여행지를 클릭해주세요.</p>
        )}
      </div>
    </div>
  );
}
