import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <nav style={{
        background: 'var(--bg-nav)',
        padding: '0 2rem',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ color: 'var(--text-inverse)', fontWeight: 600, fontSize: '1.1rem' }}>
          MakerBase
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {user?.name}
          </span>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: '1px solid #3d6b54',
              color: 'var(--text-muted)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem'
            }}
          >
            Sign out
          </button>
        </div>
      </nav>
      <div style={{ padding: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Welcome back, {user?.name}
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Select a module to get started.
        </p>
      </div>
    </div>
  );
}