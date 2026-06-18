import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pb } from '../lib/pocketbase';

export default function Landing() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (pb.authStore.isValid) navigate('/profile');
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
          'https://www.googleapis.com/auth/youtube.upload',
        ],
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
    <div className="min-h-screen bg-db-bg-dark bg-grid-dots flex flex-col items-center py-10 px-5 font-sans">

      {/* Notebook paper card */}
      <div className="w-full max-w-[600px] bg-[#fffdf8] border-l-2 border-[#e7a098] bg-notebook-lines rounded-[2px_8px_8px_2px] shadow-[2px_2px_5px_rgba(0,0,0,0.05)] px-10 py-10 mt-8">
        <h1 className="font-hand text-[3rem] text-center mt-0 mb-4 text-db-text">
          Memory Boards
        </h1>
        <p className="text-center text-[1.2rem] text-db-muted leading-relaxed">
          Upload your favorite moments to YouTube and stick them into shared memory boards.
        </p>

        <div className="flex justify-center mt-10">
          <button
            className="font-hand text-[1.5rem] bg-transparent text-db-accent border-[3px] border-db-accent px-5 py-2.5 rounded-[5px] uppercase cursor-pointer -rotate-[3deg] transition-all duration-200 hover:bg-db-accent hover:text-white hover:scale-[1.05] hover:rotate-0 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={loginWithGoogle}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Log in with Google'}
          </button>
        </div>
      </div>

      {/* Sample polaroid grid */}
      <div className="flex flex-wrap justify-center gap-5 mt-12">
        {/* Polaroid 1 */}
        <div className="relative bg-[#fcfcfc] px-4 pt-4 pb-10 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08)] -rotate-2 transition-transform duration-300 hover:scale-[1.02] hover:rotate-0 hover:z-10">
          <div className="absolute -top-[15px] left-1/2 -translate-x-1/2 -rotate-[3deg] w-[100px] h-[30px] bg-white/40 shadow-[0_1px_3px_rgba(0,0,0,0.1)] opacity-80 border-x-2 border-dashed border-black/10" />
          <div className="w-full h-[200px] bg-[#e5e5e5] flex items-center justify-center text-[#888]">
            <span>Example Video</span>
          </div>
          <p className="font-script text-[1.5rem] text-center mt-4 text-[#111]">Our Trip</p>
        </div>

        {/* Polaroid 2 */}
        <div className="relative bg-[#fcfcfc] px-4 pt-4 pb-10 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08)] rotate-[4deg] transition-transform duration-300 hover:scale-[1.02] hover:rotate-0 hover:z-10">
          <div className="absolute -top-[15px] left-1/2 -translate-x-1/2 -rotate-[3deg] w-[100px] h-[30px] bg-white/40 shadow-[0_1px_3px_rgba(0,0,0,0.1)] opacity-80 border-x-2 border-dashed border-black/10" />
          <div className="w-full h-[200px] bg-[#e5e5e5] flex items-center justify-center text-[#888]">
            <span>Example Video</span>
          </div>
          <p className="font-script text-[1.5rem] text-center mt-4 text-[#111]">Graduation</p>
        </div>
      </div>
    </div>
  );
}
