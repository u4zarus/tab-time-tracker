let activeTabId: number | null = null;
let lastActiveTime: number = Date.now();

// Called when the user switches tabs
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    await recordTime(); // Record time for the previous tab
    activeTabId = tabId;
    lastActiveTime = Date.now();
});

// Called when the user switches windows
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // No window is focused
        await recordTime();
        activeTabId = null;
    } else {
        lastActiveTime = Date.now();
    }
});

/**
 * Records the time spent on the current tab. This function is called whenever
 * the user switches tabs or windows.
 *
 * @returns {Promise<void>}
 */
async function recordTime() {
    if (activeTabId === null) return;

    const now = Date.now();
    const duration = now - lastActiveTime;

    chrome.tabs.get(activeTabId, (tab) => {
        if (!tab || !tab.url) return;

        const key = tab.url;
        chrome.storage.local.get([key], (result) => {
            const prevTime = result[key] || 0;
            const newTime = prevTime + duration;

            chrome.storage.local.set({ [key]: newTime });
        });
    });
}
