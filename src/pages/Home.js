// src/pages/Home.js
import React, { useState } from "react";
import styled from "styled-components";
import { stations } from "../data/stations";
import { useAudio } from "../context/AudioContext";
import { useFavorites } from "../context/FavoritesContext";
import { motion } from "framer-motion";

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

const FavoritesFilterButton = styled.button`
  padding: 0.5rem 0.8rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ $active }) => ($active ? "#fff" : "rgba(255, 255, 255, 0.1)")};
  color: ${({ $active }) => ($active ? "#000" : "#fff")};
  border: none;
  font-weight: 600;
  box-shadow: ${({ theme }) =>
    theme.colors.mode === "dark"
      ? "0 0 12px rgba(0,255,255,0.05), 0 0 18px rgba(255,0,255,0.05)"
      : theme.shadows.medium};
  transition: all 0.4s ease-in-out;
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(255, 255, 255, 0.1);
  }
`;

const SearchInput = styled.input`
  padding: 0.5rem 0.8rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: #2d2d2d;
  color: white;
  border: none;
  outline: none;
  width: 250px;

  &:hover {
    background: #f3f3f3;
    color: #000000;
    box-shadow: 0 12px 24px rgba(255, 255, 255, 0.1);
  }

`;

const StationGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
`;

const StationCard = styled.div`
  background: ${({ theme }) =>
    theme.colors.mode === "dark"
      ? "linear-gradient(135deg, rgba(93,12,255,0.15), rgba(155,0,250,0.1))"
      : theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.sm};
  box-shadow: ${({ theme }) =>
    theme.colors.mode === "dark"
      ? "0 0 12px rgba(0,255,255,0.05), 0 0 18px rgba(255,0,255,0.05)"
      : theme.shadows.medium};
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
  transform: translateY(0);
  backdrop-filter: ${({ theme }) =>
    theme.colors.mode === "dark" ? "blur(12px)" : "none"};
  border: ${({ theme }) =>
    theme.colors.mode === "dark" ? "1px solid rgba(255,255,255,0.08)" : "none"};

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
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const FavoriteButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 1rem;
  font-size: 1.6rem;
  transition: transform 0.2s;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text};

  &:hover {
    transform: scale(1.1);
  }
`;

export default function Home() {
  const { setStation, currentStation } = useAudio();
  const { favorites, toggleFavorite } = useFavorites();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filters = ["All", "Favorites"];

  const filteredStations =
  filter === "Favorites"
    ? stations.filter((s) => favorites.find((f) => f.name === s.name))
    : stations;


  const searchedStations = filteredStations.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <PageWrapper>
      <ControlsWrapper>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          {filters.map((f, i) => (
            <FavoritesFilterButton
              key={i}
              $active={filter === f}
              onClick={() => setFilter(f)}
              aria-label={`Filter by ${f}`}
            >
              {f}
            </FavoritesFilterButton>
          ))}
        </div>

        <SearchInput
          type="text"
          placeholder="🔍 Search stations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search stations"
        />
      </ControlsWrapper>

      <StationGrid>
        {searchedStations.map((station, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StationCard
              onClick={() => setStation(station)}
              style={{
                border:
                  station.name === currentStation.name ? "2px solid #ec4899" : "none",
              }}
              aria-label={`Play ${station.name}`}
            >
              <StationLogo src={station.logo} alt={station.name} />
              <StationName>{station.name}</StationName>
              <FavoriteButton
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(station);
                }}
                aria-label={`Toggle favorite for ${station.name}`}
              >
                {favorites.find((f) => f.name === station.name) ? "♥" : "♡"}
              </FavoriteButton>
            </StationCard>
          </motion.div>
        ))}
      </StationGrid>
    </PageWrapper>
  );
}
