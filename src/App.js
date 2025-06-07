// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { ThemeProvider, useTheme } from "./context/ThemeContext.js";
import { SoundBarProvider } from "./context/SoundBarContext.js";
import { fetchPosts } from "./features/posts/postsSlice.js";
import AuthObserver from "./features/auth/Authobserver.js";
import AppRoutes from "./routes/AppRoutes.js";
import SoundBar from "./components/Layout/SoundBar.js";
import Layout from "./components/Layout/Layout.js"; // ✅ use this

import "./styles/App.css";

const AppContent = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();

  useEffect(() => {
    dispatch(fetchPosts());
  }, [dispatch]);

  return (
    <StyledThemeProvider theme={theme}>
      <Router>
        <AuthObserver />
        <SoundBar />
          <AppRoutes />
      </Router>
    </StyledThemeProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <SoundBarProvider>
        <AppContent />
      </SoundBarProvider>
    </ThemeProvider>
  );
}
