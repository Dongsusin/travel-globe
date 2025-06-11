import React, { useRef, useEffect } from "react";
import Globe from "react-globe.gl";
import destinations from "../data/destinations.json";

export default function Globe3D({ onSelectDestination }) {
  const globeRef = useRef();

  const markers = destinations.map((dest) => ({
    lat: dest.latitude,
    lng: dest.longitude,
    label: dest.name,
    id: dest.id,
  }));

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2 }, 1000);
    }
  }, []);

  return (
    <div>
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        pointsData={markers}
        pointLat="lat"
        pointLng="lng"
        pointLabel="label"
        pointAltitude={0.01}
        pointColor={() => "red"}
        pointRadius={0.5}
        onPointClick={(point) => onSelectDestination(point.id)}
      />
    </div>
  );
}
