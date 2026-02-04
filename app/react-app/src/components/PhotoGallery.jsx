import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import './PhotoGallery.css';

function PhotoGallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  

  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 12;


  const totalPages = Math.ceil(photos.length / photosPerPage);
  const startIndex = (currentPage - 1) * photosPerPage;
  const endIndex = startIndex + photosPerPage;
  const currentPhotos = photos.slice(startIndex, endIndex);
  const [deleteConfirm, setDeleteConfirm] = useState(null); 
  const [deleting, setDeleting] = useState(false);


 const handleDeletePhoto = async (photoId) => {
    setDeleting(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const response = await fetch(`${import.meta.env.VITE_SERVER}/api/photos/${photoId}`,{
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Close modal and refresh gallery
        setSelectedPhoto(null);
        setDeleteConfirm(null);
        fetchPhotos();
      } else {
        const error = await response.json();
        alert(`Failed to delete: ${error.detail}`);
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('Failed to delete photo');
    } finally {
      setDeleting(false);
    }
  };

  // Delete all photos
  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const response = await fetch(`${import.meta.env.VITE_SERVER}/api/photos`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setDeleteConfirm(null);
        fetchPhotos();
      } else {
        const error = await response.json();
        alert(`Failed to delete: ${error.detail}`);
      }
    } catch (err) {
      console.error('Error deleting all photos:', err);
      alert('Failed to delete photos');
    } finally {
      setDeleting(false);
    }
  };

 
  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevious = () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  };

  const goToNext = () => {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const response = await fetch(`${import.meta.env.VITE_SERVER}/api/photos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPhotos(data);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openPhoto = (photo) => {
    setSelectedPhoto(photo);
  };

  const closePhoto = () => {
    setSelectedPhoto(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closePhoto();
      }
    };

    if (selectedPhoto) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPhoto]);

  if (loading) {
    return (
      <div className="gallery-loading">
        <div className="spinner"></div>
        <p>Loading your photos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gallery-error">
        <p>Error loading photos: {error}</p>
        <button onClick={fetchPhotos}>Try Again</button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="photo-gallery">
        <div className="gallery-header">
        <h2>Your Photos ({photos.length})</h2>
        <div className="header-actions">
          <button onClick={fetchPhotos} className="refresh-btn">
            Refresh
          </button>
          {photos.length > 0 && (
            <button 
              onClick={() => setDeleteConfirm('all')} 
              className="delete-all-btn"
            >
              Delete All
            </button>
          )}
        </div>
      </div>
        <div className="gallery-empty">
          <p>No photos yet. Upload some photos to get started!</p>
        </div>

          {deleteConfirm && (
          <div className="confirm-modal" onClick={() => !deleting && setDeleteConfirm(null)}>
            <div className="confirm-content" onClick={(e) => e.stopPropagation()}>
              {deleteConfirm === 'all' ? (
                <>
                  <h3>Delete All Photos?</h3>
                  <p>This will permanently delete all {photos.length} photos. This action cannot be undone.</p>
                  <div className="confirm-actions">
                    <button 
                      onClick={() => setDeleteConfirm(null)} 
                      className="cancel-btn"
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDeleteAll} 
                      className="confirm-delete-btn"
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Delete All'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>Delete Photo?</h3>
                  <p>This will permanently delete this photo. This action cannot be undone.</p>
                  <div className="confirm-actions">
                    <button 
                      onClick={() => setDeleteConfirm(null)} 
                      className="cancel-btn"
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleDeletePhoto(deleteConfirm)} 
                      className="confirm-delete-btn"
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (

    
    <div className="photo-gallery">
      <div className="gallery-header">
        <h2>Your Photos ({photos.length})</h2>
        <div className="header-actions">
          <button onClick={fetchPhotos} className="refresh-btn">
            Refresh
          </button>
          {photos.length > 0 && (
            <button 
              onClick={() => setDeleteConfirm('all')} 
              className="delete-all-btn"
            >
              Delete All
            </button>
          )}
        </div>
      </div>
          {deleteConfirm && (
          <div className="confirm-modal" onClick={() => !deleting && setDeleteConfirm(null)}>
            <div className="confirm-content" onClick={(e) => e.stopPropagation()}>
              {deleteConfirm === 'all' ? (
                <>
                  <h3>Delete All Photos?</h3>
                  <p>This will permanently delete all {photos.length} photos. This action cannot be undone.</p>
                  <div className="confirm-actions">
                    <button 
                      onClick={() => setDeleteConfirm(null)} 
                      className="cancel-btn"
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDeleteAll} 
                      className="confirm-delete-btn"
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Delete All'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>Delete Photo?</h3>
                  <p>This will permanently delete this photo. This action cannot be undone.</p>
                  <div className="confirm-actions">
                    <button 
                      onClick={() => setDeleteConfirm(null)} 
                      className="cancel-btn"
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleDeletePhoto(deleteConfirm)} 
                      className="confirm-delete-btn"
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      

      {/* Thumbnail Grid */}
      <div className="gallery-grid">
        {currentPhotos.map((photo) => (
          <div
            key={photo.photo_id}
            className="gallery-item"
            onClick={() => openPhoto(photo)}
          >
            <img
              src={photo.thumbnail_url}
              alt={photo.labels?.join(', ') || 'Photo'}
              loading="lazy"
            />
            <div className={`status-badge status-${photo.status?.toLowerCase()}`}>
              {photo.status}
            </div>
            {photo.labels && photo.labels.length > 0 && (
              <div className="labels-preview">
                {photo.labels.slice(0, 3).join(', ')}
                {photo.labels.length > 3 && '...'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={goToPrevious} 
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`pagination-num ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button 
            onClick={goToNext} 
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Photo count info */}
      <div className="photo-count">
        Showing {startIndex + 1}-{Math.min(endIndex, photos.length)} of {photos.length} photos
      </div>

      {/* Full-size Photo Modal */}
      {selectedPhoto && (
        <div className="photo-modal" onClick={closePhoto}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closePhoto}>
              &times;
            </button>
            
            <div className="modal-image-container">
              <img
                src={selectedPhoto.photo_url}
                alt={selectedPhoto.labels?.join(', ') || 'Photo'}
              />
            </div>
            
            <div className="modal-info">

              <div className="modal-actions">
                <button 
                  onClick={() => setDeleteConfirm(selectedPhoto.photo_id)}
                  className="delete-photo-btn"
                >
                  Delete Photo
                </button>
              </div>
              <h3>Photo Details</h3>
              <p><strong>ID:</strong> {selectedPhoto.photo_id}</p>
              <p><strong>Uploaded:</strong> {new Date(selectedPhoto.created_at).toLocaleString()}</p>
              <p><strong>Status:</strong> {selectedPhoto.status}</p>
              
              {selectedPhoto.labels && selectedPhoto.labels.length > 0 && (
                <div className="modal-labels">
                  <strong>Detected in this photo:</strong>
                  <div className="label-tags">
                    {selectedPhoto.labels.map((label, index) => (
                      <span key={index} className="label-tag">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;