import { useEffect, useState } from "react";

type TabTime = {
    url: string;
    time: number; // in milliseconds
};

const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / 1000 / 60) % 60;
    const hours = Math.floor(ms / 1000 / 60 / 60);
    return `${hours}h ${minutes}m ${seconds}s`;
};

const Popup = () => {
    const [tabTimes, setTabTimes] = useState<TabTime[]>([]);

    useEffect(() => {
        const fetchData = () => {
            chrome.storage.local.get(null, (data) => {
                const result: TabTime[] = Object.keys(data).map((url) => ({
                    url,
                    time: data[url],
                }));
                // Sort by time descending
                result.sort((a, b) => b.time - a.time);
                setTabTimes(result);
            });
        };

        fetchData();

        // Update every 5 seconds
        const interval = setInterval(fetchData, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleClearData = () => {
        chrome.storage.local.clear(() => {
            console.log("Local storage cleared.");
            setTabTimes([]);
        });
    };

    return (
        <div className="w-80 max-h-[480px] p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans rounded-lg shadow-lg overflow-auto">
            <div className="relative">
                <h2 className="text-xl font-bold mb-4 text-center">
                    Tab Time Tracker
                </h2>
                <button
                    onClick={handleClearData}
                    className="absolute top-0 right-0 p-1 rounded text-sm bg-red-600 hover:bg-red-700 text-white"
                    title="Clear All Data"
                >
                    Clear
                </button>
            </div>
            {tabTimes.length === 0 ? (
                <p className="text-center text-gray-500">
                    No tabs tracked yet.
                </p>
            ) : (
                <ul className="space-y-3">
                    {tabTimes.map((tab) => (
                        <li
                            key={tab.url}
                            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md shadow-sm"
                        >
                            <strong className="block truncate">
                                {tab.url}
                            </strong>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {formatTime(tab.time)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Popup;
