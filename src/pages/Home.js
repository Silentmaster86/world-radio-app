// src/pages/Home.js
import React, { useState } from "react";
import styled from "styled-components";
import { stations } from "../data/stations";
import { useAudio } from "../context/AudioContext";
import { useFavorites } from "../context/FavoritesContext";

const PageWrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.sm};
  min-height: 100vh;
  background: linear-gradient(to bottom, #1a1a1a, #000);
  color: ${({ theme }) => theme.colors.text};
`;

const ControlsWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  justify-content: space-between;
`;

const CategoryButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ $active }) => ($active ? "#fff" : "rgba(255, 255, 255, 0.1)")};
  color: ${({ $active }) => ($active ? "#000" : "#fff")};
  border: none;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease-in-out;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: #2d2d2d;
  color: white;
  border: none;
  outline: none;
  width: 250px;
`;

const StationGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
`;

const StationCard = styled.div`
  background: linear-gradient(145deg, #1a1a1a, #121212);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.sm};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
  transform: translateY(0);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(255, 255, 255, 0.1);
  }
`;

const StationLogo = styled.img`
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin: 0 auto ${({ theme }) => theme.spacing.sm};
`;

const StationName = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
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
            <StationName>{station.name}</StationName>
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
