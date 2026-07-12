import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Mail, Shield, AlertCircle } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isLogin 
      ? 'http://localhost:8000/api/auth/login/' 
      : 'http://localhost:8000/api/auth/signup/';

    const payload = isLogin 
      ? { username, password }
      : { username, email, password, first_name: firstName, last_name: lastName };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setError(data.detail || Object.values(data).flat().join(' ') || 'An error occurred. Please try again.');
      }
    } catch (err) {
      setError('Cannot connect to authentication server. Please check that the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl border border-neutral-border shadow-xl backdrop-blur-md bg-white/90">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 font-bold text-white text-2xl shadow-md">
            AF
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-neutral-text-primary">
            AssetFlow ERP
          </h2>
          <p className="mt-2 text-sm text-neutral-text-secondary">
            Enterprise Asset & Resource Management
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-border">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors duration-200 ${
              isLogin 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-text-secondary hover:text-neutral-text-primary'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors duration-200 ${
              !isLogin 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-text-secondary hover:text-neutral-text-primary'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-status-danger-bg p-3 text-status-danger-text text-xs font-medium border border-red-200">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          
          {/* Username (Both) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-text-secondary mb-1">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-text-muted">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. raj_patel"
                className="w-full rounded-lg border border-neutral-border bg-white py-2.5 pl-10 pr-3 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-all"
              />
            </div>
          </div>

          {/* Registration specific fields */}
          {!isLogin && (
            <>
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-neutral-text-secondary mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-text-muted">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. raj@company.com"
                    className="w-full rounded-lg border border-neutral-border bg-white py-2.5 pl-10 pr-3 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-all"
                  />
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-text-secondary mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Raj"
                    className="w-full rounded-lg border border-neutral-border bg-white py-2.5 px-3 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-text-secondary mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Patel"
                    className="w-full rounded-lg border border-neutral-border bg-white py-2.5 px-3 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* Password (Both) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-neutral-text-secondary">
                Password
              </label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => alert("Please contact your IT administrator to reset your password.")}
                  className="text-xs font-medium text-primary-600 hover:text-primary-800"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-text-muted">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-neutral-border bg-white py-2.5 pl-10 pr-3 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-all"
              />
            </div>
          </div>

          {/* Info Banner for Registrations */}
          {!isLogin && (
            <div className="flex items-start gap-2 rounded-lg bg-primary-50 p-3 text-primary-900 text-xs border border-primary-100">
              <Shield size={16} className="shrink-0 text-primary-600 mt-0.5" />
              <span>
                All new registrations default to the <strong>Employee</strong> role. Higher roles can only be granted by an administrator via the Organization Directory.
              </span>
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full justify-center rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:bg-primary-100 disabled:text-primary-800 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>

        </form>
      </div>
    </div>
  );
}
