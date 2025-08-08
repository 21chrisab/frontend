import React, { useState, useEffect } from 'react';
import './App.css'; // Make sure to create and import the CSS file

// Simple icon component for the buttons
const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.031 0H.938v9.094h9.093V0zm0 10.906H.938V20h9.093v-9.094zM20 0h-9.094v9.094H20V0zm0 10.906h-9.094V20H20v-9.094z"/>
  </svg>
);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Effect to handle the OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && !isLoggedIn) {
      window.history.pushState({}, document.title, "/"); // Clean the URL
      setIsLoading(true);
      // Use the proxy for this request (relative URL)
      fetch(`/auth/callback?code=${code}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to exchange code for token.');
          return res.json();
        })
        .then(data => {
          if (data.accessToken) {
            setIsLoggedIn(true);
            setError('');
          } else {
            throw new Error('Authentication failed.');
          }
        })
        .catch(err => {
          console.error("Auth callback error:", err);
          setError(err.message || 'An error occurred during authentication.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isLoggedIn]);

  const handleLogin = () => {
    // The backend handles the redirect to Microsoft
    window.location.href = '/auth/login';
  };

  const handleFetchAndAnalyze = async () => {
    setIsLoading(true);
    setError('');
    setAnalysis('');
    try {
      // Use the proxy for this request (relative URL)
      const res = await fetch('/fetch-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Server responded with status: ${res.status}`);
      }
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      console.error("Fetch/Analyze error:", err);
      setError(err.message || 'Failed to fetch and analyze emails.');
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Render Logic ----

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Analyzing your emails, please wait...</p>
        </div>
      );
    }

    if (error) {
      return <div className="error-message"><strong>Error:</strong> {error}</div>;
    }

    if (isLoggedIn) {
      if (analysis) {
        return (
          <>
            <div className="analysis-header">
                <h2>Analysis Complete</h2>
                <button className="btn" onClick={handleFetchAndAnalyze} disabled={isLoading}>
                    Re-Analyze Emails
                </button>
            </div>
            <pre className="analysis-results">
              <code>{analysis}</code>
            </pre>
          </>
        );
      }
      return (
        <div>
          <h2>Welcome!</h2>
          <p>You are successfully logged in. Ready to analyze your recent emails?</p>
          <button className="btn" onClick={handleFetchAndAnalyze} disabled={isLoading}>
            Fetch and Analyze Emails
          </button>
        </div>
      );
    }

    // Default state: Logged out
    return (
      <div>
        <button className="btn" onClick={handleLogin}>
          <MicrosoftIcon />
          Login with Microsoft
        </button>
      </div>
    );
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Email Insight Engine</h1>
        <p>Connect your Microsoft account to get AI-powered analysis of your recent emails.</p>
      </header>
      <main>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;