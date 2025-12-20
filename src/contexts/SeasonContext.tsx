import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Season = 'spring' | 'summer' | 'autumn' | 'winter';

interface SeasonContextType {
  season: Season;
  seasonName: string;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export const useSeason = () => {
  const context = useContext(SeasonContext);
  if (!context) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
};

const getSeason = (): Season => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Northern hemisphere seasons (approximate)
  // Spring: March 20 - June 20
  // Summer: June 21 - September 22
  // Autumn: September 23 - December 20
  // Winter: December 21 - March 19

  if ((month === 3 && day >= 20) || month === 4 || month === 5 || (month === 6 && day <= 20)) {
    return 'spring';
  } else if ((month === 6 && day >= 21) || month === 7 || month === 8 || (month === 9 && day <= 22)) {
    return 'summer';
  } else if ((month === 9 && day >= 23) || month === 10 || month === 11 || (month === 12 && day <= 20)) {
    return 'autumn';
  } else {
    return 'winter';
  }
};

const getSeasonName = (season: Season): string => {
  const names: Record<Season, string> = {
    spring: 'بهار',
    summer: 'تابستان',
    autumn: 'پاییز',
    winter: 'زمستان',
  };
  return names[season];
};

export const SeasonProvider = ({ children }: { children: ReactNode }) => {
  const [season, setSeason] = useState<Season>(getSeason());

  useEffect(() => {
    // Update season daily
    const checkSeason = () => {
      const newSeason = getSeason();
      if (newSeason !== season) {
        setSeason(newSeason);
      }
    };

    // Check every hour
    const interval = setInterval(checkSeason, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [season]);

  useEffect(() => {
    // Apply season class to document
    document.documentElement.setAttribute('data-season', season);
  }, [season]);

  return (
    <SeasonContext.Provider value={{ season, seasonName: getSeasonName(season) }}>
      {children}
    </SeasonContext.Provider>
  );
};
