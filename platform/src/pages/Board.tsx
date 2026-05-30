import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pb } from '../lib/pocketbase';

export default function Board() {
  const { id } = useParams();
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoard();
  }, [id]);

  const loadBoard = async () => {
    try {
      if (!id) return;
      const record = await pb.collection('boards').getOne(id, {
        expand: 'videos',
        requestKey: null
      });
      setBoard(record);
    } catch (err: any) {
      if (err.isAbort) return;
      console.error('Failed to load board', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="scrapbook-container"><div className="notebook-paper">Loading...</div></div>;
  }

  if (!board) {
    return <div className="scrapbook-container"><div className="notebook-paper">Board not found.</div></div>;
  }

  const videos = board.expand?.videos || [];

  return (
    <div className="scrapbook-container">
      <header>
        <Link to="/" className="logo">Scrapbook</Link>
      </header>
      
      <div className="notebook-paper">
        <h2 style={{ marginTop: 0 }}>{board.name}</h2>
        <p>A collection of shared memories.</p>
      </div>

      <div className="video-grid">
        {videos.map((vid: any, idx: number) => (
          <div className="polaroid" key={vid.id} style={{ transform: `rotate(${idx % 2 === 0 ? 3 : -2}deg)` }}>
            <div className="tape"></div>
            <div style={{ width: '100%', height: '200px', backgroundColor: '#000' }}>
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${vid.youtubeId}`} 
                title={vid.title} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <div className="caption">{vid.title}</div>
          </div>
        ))}
        {videos.length === 0 && (
          <div style={{ textAlign: 'center', width: '100%', marginTop: '40px', fontFamily: "'Caveat', cursive", fontSize: '1.5rem' }}>
            No memories pinned yet...
          </div>
        )}
      </div>
    </div>
  );
}
