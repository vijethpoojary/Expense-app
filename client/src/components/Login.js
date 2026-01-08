import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(email, password);
    
    if (result.success) {
      setError('');
      setShowRegister(false);
      alert('Registration successful! Please login.');
      setEmail('');
      setPassword('');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">💰 Expense Tracker</h1>
        
        {showRegister ? (
          <div>
            <h2 className="login-subtitle">Register</h2>
            <form onSubmit={handleRegister} className="login-form">
              <div className="form-group">
                <label htmlFor="register-email">Email</label>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="register-password">Password</label>
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Enter a strong password"
                  disabled={loading}
                />
                <small className="password-requirements">
                  Password must contain:
                  <ul>
                    <li>At least 8 characters</li>
                    <li>One uppercase letter (A-Z)</li>
                    <li>One lowercase letter (a-z)</li>
                    <li>One number (0-9)</li>
                    <li>One special character (!@#$%^&*()_+-=[]{}|;:,.&lt;&gt;?)</li>
                  </ul>
                </small>
              </div>
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setShowRegister(false);
                  setError('');
                }}
                disabled={loading}
              >
                Back to Login
              </button>
            </form>
          </div>
        ) : (
          <div>
            <h2 className="login-subtitle">Login</h2>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setShowRegister(true);
                  setError('');
                }}
                disabled={loading}
              >
                Don't have an account? Register
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

