import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Redirect to DailyLog - Pomodoro is now integrated there
const Pomodoro = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/daily-log', { replace: true });
  }, [navigate]);

  return null;
};

export default Pomodoro;