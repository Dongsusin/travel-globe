import React from "react";
import Globe3D from "../components/Globe3D";
import { useNavigate } from "react-router-dom";

export default function MainPage() {
  const navigate = useNavigate();

  const handleSelect = (id) => {
    navigate(`/destination/${id}`);
  };

  return (
    <div className="main-page">
      <Globe3D className="Glob" onSelectDestination={handleSelect} />
    </div>
  );
}
