// src/pages/Home.js
import React, { useState } from "react";
import styled from "styled-components";
import { stations } from "../data/stations";
import { useAudio } from "../context/AudioContext";
import { useFavorites } from "../context/FavoritesContext";

const PageWrapper = styled.div`
  padding: 1rem;
  min-height: 100vh;
  background: linear-gradient(to bottom, #1a1a1a, #000);
  color: white;
`;

const ControlsWrapper = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
`;

const CategoryButton = styled.button`
  padding: 0.4rem 1rem;
  border-radius: 9999px;
  border: 1px solid transparent;
  font-weight: ${({ $active }) => ($active ? "bold" : "normal")};
  background: ${({ $active }) => ($active ? "white" : "#2d2d2d")};
  color: ${({ $active }) => ($active ? "black" : "white")};
  box-shadow: ${({ active }) => (active ? "0 2px 4px rgba(0,0,0,0.3)" : "none")};
  transition: all 0.2s ease-in-out;

  &:hover {
    background: #444;
  }
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: #2d2d2d;
  color: white;
  border: none;
  outline: none;
  width: 250px;
`;

const StationGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
`;

const StationCard = styled.div`
  background: #1a1a1a;
  padding: 1.25rem;
  border-radius: 1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  text-align: center;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.7);
  }
`;

const StationLogo = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 0.5rem;
  margin: 0 auto 1rem;
`;

const FavoriteButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 1rem;
  font-size: 1.5rem;
  transition: transform 0.2s;
  background: none;
  border: none;
  color: white;

  &:hover {
    transform: scale(1.1);
  }
`;

export default function Home() {
  const { setStation } = useAudio();
  const { favorites, toggleFavorite } = useFavorites();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const categories = ["All", ...new Set(stations.map((s) => s.category))];

  const filteredStations =
    filter === "All" ? stations : stations.filter((s) => s.category === filter);

  const searchedStations = filteredStations.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <PageWrapper>
      <ControlsWrapper>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {categories.map((cat, i) => (
            <CategoryButton
              key={i}
              $active={filter === cat}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </CategoryButton>
          ))}
        </div>

        <SearchInput
          type="text"
          placeholder="🔍 Search stations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </ControlsWrapper>

      <StationGrid>
        {searchedStations.map((station, i) => (
          <StationCard key={i} onClick={() => setStation(station)}>
            <StationLogo src={station.logo} alt={station.name} />
            <div className="text-xl font-semibold mb-2">{station.name}</div>
            <FavoriteButton
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(station);
              }}
            >
              {favorites.find((f) => f.name === station.name) ? "♥" : "♡"}
            </FavoriteButton>
          </StationCard>
        ))}
      </StationGrid>
    </PageWrapper>
  );
}
