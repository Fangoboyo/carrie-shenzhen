import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pb } from '../lib/pocketbase';

export default function Landing() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // On mount, if already logged in, redirect to profile
  useEffect(() => {
    if (pb.authStore.isValid) {
      navigate('/profile');
    }
  }, [navigate]);

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      const authData = await pb.collection('users').authWithOAuth2({
        provider: 'google',
        scopes: [
          'openid',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/youtube.upload'
        ]
      });

      console.log('Login successful', authData);
      if (authData.meta?.accessToken) {
        localStorage.setItem('youtubeAccessToken', authData.meta.accessToken);
      }
      navigate('/profile');
    } catch (err) {
      console.error('Failed to log in', err);
      alert('Login failed. Ensure Google Auth is configured in PocketBase.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="scrapbook-container">
      <div className="notebook-paper">
        <h1 style={{ fontSize: '3rem', textAlign: 'center', marginTop: 0 }}>Memory Boards</h1>
        <p style={{ textAlign: 'center', fontSize: '1.2rem' }}>
          Upload your favorite moments to YouTube and stick them into shared memory boards.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
          <button className="btn-stamp" onClick={loginWithGoogle} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Log in with Google'}
          </button>
        </div>
      </div>

      <div className="video-grid" style={{ marginTop: '50px' }}>
        <div className="polaroid">
          <div className="tape"></div>
          <div style={{ width: '100%', height: '200px', backgroundColor: '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            <span>Example Video</span>
          </div>
          <div className="caption">Our Trip</div>
        </div>
        
        <div className="polaroid" style={{ transform: 'rotate(4deg)' }}>
          <div className="tape"></div>
          <div style={{ width: '100%', height: '200px', backgroundColor: '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            <span>Example Video</span>
          </div>
          <div className="caption">Graduation</div>
        </div>
      </div>
    </div>
  );
}
