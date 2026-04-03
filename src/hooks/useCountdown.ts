import {useState, useEffect, useRef} from 'react';
import {CountdownInfo} from '../types';
import {getNextDoseInfo} from '../utils/timeUtils';

export function useCountdown(times: string[]): CountdownInfo {
  const [info, setInfo] = useState<CountdownInfo>(() => getNextDoseInfo(times));
  const timesRef = useRef(times);

  useEffect(() => {
    timesRef.current = times;
  }, [times]);

  useEffect(() => {
    const interval = setInterval(() => {
      setInfo(getNextDoseInfo(timesRef.current));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return info;
}
