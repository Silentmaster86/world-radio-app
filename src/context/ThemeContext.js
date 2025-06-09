import React, { createContext, useState, useContext } from "react";
import { darkTheme } from "../darkTheme";
import { lightTheme } from "../lightTheme";

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export const ThemeProviderToggle = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // ✅ Define this first

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme: currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
