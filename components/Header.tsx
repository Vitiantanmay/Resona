
import * as React from 'react';

const Clock: React.FC = () => {
    const [time, setTime] = React.useState(new Date());

    React.useEffect(() => {
        const timerId = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="text-sm font-medium tabular-nums">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
    );
};

const Header: React.FC = () => {
    return (
        <header className="fixed top-0 left-0 right-0 h-12 px-4 md:px-6 z-30 bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
            <div className="h-full flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200">Resona</h1>
                <Clock />
            </div>
        </header>
    );
};

export default Header;
