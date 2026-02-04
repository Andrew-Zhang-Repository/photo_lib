import React from 'react';
import { useAuth } from '../context/AuthContext';
import FileForm from '../components/FileForm';
import PhotoGallery from '../components/PhotoGallery';

function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="dashboard">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid #e0e0e0',
        background: '#fff'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>
          Photo Gallery
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#666' }}>
            {user?.username || user?.signInDetails?.loginId}
          </span>
          <button 
            onClick={signOut}
            style={{
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ padding: '24px' }}>
        {/* Upload Section */}
        <section style={{ marginBottom: '32px' }}>
          <h2>Upload Photos</h2>
          <FileForm />
        </section>

        {/* Gallery Section */}
        <section>
          <PhotoGallery />
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;