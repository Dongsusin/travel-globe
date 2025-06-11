import { useState, useEffect } from "react";
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
      onPointerOver={() => onHover(location.krName)}
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(true);

  const [showIntro, setShowIntro] = useState(true);
  const [introVisible, setIntroVisible] = useState(true);
  const [introImages, setIntroImages] = useState([]);
  const [introImageIndex, setIntroImageIndex] = useState(0);

  const WEATHER_API_KEY = "e6d02aec03da2632c5505afa1f2670ec";
  const UNSPLASH_ACCESS_KEY = "AQPoHBzv-aqVMwY6iB7oHXSvRWcGRTA16WGinMFg84s";

  useEffect(() => {
    const fetchIntroImages = async () => {
      try {
        const keywords = ["travel", "nature", "city", "adventure", "world"];
        const randomKeyword =
          keywords[Math.floor(Math.random() * keywords.length)];

        const res = await axios.get(
          `https://api.unsplash.com/search/photos?query=${randomKeyword}&per_page=10&client_id=${UNSPLASH_ACCESS_KEY}`
        );

        const urls = res.data.results.map((img) => img.urls.regular);
        setIntroImages(urls);
      } catch (err) {
        console.error("인트로 이미지 로딩 실패:", err);
      }
    };

    if (showIntro) {
      fetchIntroImages();
    }
  }, [showIntro]);

  useEffect(() => {
    if (!showIntro || introImages.length <= 1) return;

    const interval = setInterval(() => {
      setIntroImageIndex((prev) => (prev + 1) % introImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [showIntro, introImages]);

  useEffect(() => {
    if (!selectedLocation) {
      setInfoVisible(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [weatherRes, imageRes, wikiRes] = await Promise.all([
          axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${selectedLocation.name}&units=metric&appid=${WEATHER_API_KEY}&lang=kr`
          ),
          axios.get(
            `https://api.unsplash.com/search/photos?query=${selectedLocation.name}&per_page=5&client_id=${UNSPLASH_ACCESS_KEY}`
          ),
          axios.get(
            `https://ko.wikipedia.org/api/rest_v1/page/summary/${selectedLocation.krName}`
          ),
        ]);

        const imageUrls =
          imageRes.data.results.length > 0
            ? imageRes.data.results.map((img) => img.urls.regular)
            : [`https://source.unsplash.com/400x300/?${selectedLocation.name}`];

        setInfo({
          weather: weatherRes.data.weather[0].description,
          temp: weatherRes.data.main.temp,
          images: imageUrls,
          summary: wikiRes.data.extract,
        });

        setInfoVisible(true);
        setCurrentImageIndex(0);
        setTransitioning(true);
      } catch (error) {
        console.error("API Error:", error);
        setInfo(null);
        setInfoVisible(false);
      }
    };

    fetchData();
  }, [selectedLocation]);

  useEffect(() => {
    if (!info || !info.images || info.images.length <= 1) return;

    const interval = setInterval(() => {
      setTransitioning(true);
      setCurrentImageIndex((prev) => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, [info]);

  const handleTransitionEnd = () => {
    if (!info) return;

    if (currentImageIndex === info.images.length) {
      setTransitioning(false);
      setCurrentImageIndex(0);
    }
  };

  const onBackgroundClick = () => {
    if (infoVisible) {
      setInfoVisible(false);
      setSelectedLocation(null);
      setInfo(null);
    }
  };

  const handleIntroEnd = () => {
    const intro = document.querySelector(".intro-overlay");
    intro.classList.add("fade-out");
    setTimeout(() => {
      setShowIntro(false);
      setIntroVisible(false);
    }, 1000);
  };

  return (
    <>
      {introVisible && (
        <div className="intro-overlay">
          <img
            src={introImages[introImageIndex]}
            alt="Intro"
            className="intro-background"
          />
          <img src="/로고.png" alt="Intro-title" className="intro-title" />
          <button className="intro-button" onClick={handleIntroEnd}>
            여행지 보기
          </button>
        </div>
      )}

      {!showIntro && (
        <div className="container" onPointerDown={onBackgroundClick}>
          <Canvas camera={{ position: [0, 0, 5] }}>
            <ambientLight intensity={0.8} />
            <Stars radius={100} depth={50} count={5000} factor={4} />
            <OrbitControls enableZoom={true} enableRotate={true} />
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

          <div
            className={`info-panel ${infoVisible ? "visible" : "hidden"}`}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn-mobile"
              onClick={() => {
                setInfoVisible(false);
                setSelectedLocation(null);
                setInfo(null);
              }}
            >
              ×
            </button>
            {selectedLocation && info ? (
              <>
                <h2>{selectedLocation.krName}</h2>

                {info.images && (
                  <div className="slider-container">
                    <div
                      className="slider"
                      style={{
                        transform: `translateX(-${
                          (currentImageIndex + 1) * 100
                        }%)`,
                        transition: transitioning
                          ? "transform 0.8s ease-in-out"
                          : "none",
                      }}
                      onTransitionEnd={handleTransitionEnd}
                    >
                      <img
                        src={info.images[info.images.length - 1]}
                        alt="clone-last"
                      />
                      {info.images.map((img, idx) => (
                        <img key={idx} src={img} alt={`slide-${idx}`} />
                      ))}
                      <img src={info.images[0]} alt="clone-first" />
                    </div>
                  </div>
                )}

                <p>
                  날씨: {info.weather} ({info.temp}°C)
                </p>
                <p>{info.summary}</p>
              </>
            ) : (
              <p>여행지를 클릭해주세요.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
