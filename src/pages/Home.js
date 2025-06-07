import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import PostList from "../features/posts/PostList.js";

const Wrapper = styled.div`
  padding: 2rem;
  color: ${({ theme }) => theme.text};

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const HomePage = () => {
  const { isAuthenticated, provider, user } = useSelector((state) => state.auth);

  return (
    <Wrapper>
      {!isAuthenticated && (
        <>
          <h1>Welcome to Reddit Clone! 🎉</h1>
          <p>Explore trending posts. Sign in to vote, comment, or post your own.</p>
        </>
      )}

      {isAuthenticated && provider === "reddit" && (
        <>
          <h1>Welcome back, {user?.name || "Reddit user"}! 👋</h1>
          <p>You’re logged in via Reddit. You can browse, comment, and upvote directly on Reddit!</p>
        </>
      )}

      {isAuthenticated && provider === "firebase" && (
        <>
          <h1>Welcome back, {user?.name || user?.email || "user"}! 🔥</h1>
          <p>You’re logged in with email. You can vote, comment, and enjoy all features locally.</p>
        </>
      )}

      <PostList />
    </Wrapper>
  );
};

export default HomePage;
