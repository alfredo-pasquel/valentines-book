import React, { useState } from 'react';
import axios from 'axios';

export function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5001/api/auth/login', { username, password });
      // Save the JWT token in localStorage or via a context provider
      localStorage.setItem('token', res.data.token);
      onLogin(); // Callback to signal successful login
    } catch (err) {
      setError('Invalid credentials');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-pink-100 flex flex-col items-center justify-center p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded mb-4"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded mb-4"
          required
        />
        <button
          type="submit"
          className="w-full bg-pink-500 text-white p-2 rounded"
        >
          Login
        </button>
        <p className="mt-4 text-center">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => window.location.hash = '#register'}
            className="text-pink-500 underline"
          >
            Create Account
          </button>
        </p>
      </form>
    </div>
  );
}

export function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    // Only allow registration if the PIN is correct (e.g. 4266 or 1608)
    if (pin !== '4266' && pin !== '1608') {
      setError('Incorrect PIN. Cannot create account.');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5001/api/auth/register', { username, password, pin });
      // Registration successful – you might automatically log in the user:
      localStorage.setItem('token', res.data.token);
      onRegister(); // Callback for successful registration
    } catch (err) {
      setError('Registration failed');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-pink-100 flex flex-col items-center justify-center p-4">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4">Create Account</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded mb-4"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded mb-4"
          required
        />
        <input
          type="text"
          placeholder="Secret PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded mb-4"
          required
        />
        <button
          type="submit"
          className="w-full bg-pink-500 text-white p-2 rounded"
        >
          Register
        </button>
        <p className="mt-4 text-center">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => window.location.hash = '#login'}
            className="text-pink-500 underline"
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
}
