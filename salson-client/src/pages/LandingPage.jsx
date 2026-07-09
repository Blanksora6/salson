import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

 const handleHost = () => {
  window.location.href = 'http://localhost:5187/api/auth/login';
};

  const handleJoin = () => {
    navigate('/join');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      
      {/* Logo / Brand */}
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-black text-gray-900 tracking-tight">
          Sal<span className="text-primary">son</span>
        </h1>
        <p className="text-gray-500 mt-3 text-lg">
          Real-time quiz battles. No mercy.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={handleHost}
          className="w-full py-4 bg-primary hover:bg-primary-dark text-white text-xl font-bold rounded-2xl transition-colors duration-200 shadow-md"
        >
          Host a Game
        </button>

        <button
          onClick={handleJoin}
          className="w-full py-4 bg-white border-2 border-primary text-primary text-xl font-bold rounded-2xl hover:bg-primary hover:text-white transition-colors duration-200 shadow-md"
        >
          Join a Game
        </button>
      </div>

      {/* Footer */}
      <p className="mt-16 text-gray-400 text-sm">
        Built with React + .NET + SignalR
      </p>
    </div>
  );
}

export default LandingPage;