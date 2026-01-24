import React, { createContext, useContext, useState, useEffect } from 'react';

const TimerContext = createContext();

export const useTimer = () => useContext(TimerContext);

const ALARM_SOUND_URL = 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=service-bell-ring-14610.mp3'; // Gentle bell

export const TimerProvider = ({ children }) => {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [direction, setDirection] = useState('up'); // 'up' | 'down'
    const [totalDuration, setTotalDuration] = useState(0); // For progress calculation if needed

    useEffect(() => {
        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds(prev => {
                    if (direction === 'down') {
                        if (prev <= 0) {
                            setIsActive(false);
                            // Play Alarm
                            try {
                                const audio = new Audio(ALARM_SOUND_URL);
                                audio.volume = 0.5;
                                audio.play();
                            } catch (e) {
                                console.error("Alarm failed to play", e);
                            }
                            return 0;
                        }
                        return prev - 1;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, direction]);

    const startTimer = (initialSeconds = 0, dir = 'up') => {
        if (dir === 'down') {
            setSeconds(initialSeconds);
            setTotalDuration(initialSeconds);
            setDirection('down');
        } else {
            // Stopwatch mode usually starts from where it left off or 0
            if (!isActive && seconds === 0) {
                setSeconds(0);
            }
            setDirection('up');
        }
        setIsActive(true);
    };

    const stopTimer = () => {
        setIsActive(false);
    };

    const resetTimer = () => {
        setIsActive(false);
        setSeconds(0);
        setTotalDuration(0);
        setDirection('up');
    };

    const setCustomTime = (mins) => {
        const secs = mins * 60;
        setSeconds(secs);
        setTotalDuration(secs);
        setDirection('down'); // Implicitly preparing for countdown
    };

    return (
        <TimerContext.Provider value={{
            seconds,
            isActive,
            direction,
            totalDuration,
            startTimer,
            stopTimer,
            resetTimer,
            setCustomTime,
            setSeconds // Expose for manual adjustments if needed (e.g. presets without starting)
        }}>
            {children}
        </TimerContext.Provider>
    );
};
