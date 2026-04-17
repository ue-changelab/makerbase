import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)'
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '2rem' }}>
        <div style={{
          background: 'var(--bg-nav)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <h1 style={{
            color: 'var(--text-inverse)',
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '0.25rem'
          }}>MakerBase</h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            marginBottom: '1.75rem'
          }}>ChangeLab · University of Evansville</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                marginBottom: 6,
                fontSize: '0.875rem',
                color: 'var(--text-muted)'
              }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #3d6b54',
                  background: '#243d32',
                  color: 'var(--text-inverse)',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: 6,
                fontSize: '0.875rem',
                color: 'var(--text-muted)'
              }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #3d6b54',
                  background: '#243d32',
                  color: 'var(--text-inverse)',
                  fontSize: '1rem',
                }}
              />
            </div>

            {error && (
              <p style={{
                color: '#ff6b6b',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}