let activeTabId: number | null = null;
let activeTabStart: number | null = null;

// Helper function to get the current active tab's URL
async function getActiveTabUrl(): Promise<string | null> {
    if (activeTabId === null) return null;
    try {
        const tab = await chrome.tabs.get(activeTabId);
        return tab?.url ?? null;
    } catch {
        // Tab no longer exists, handle the error gracefully
        return null;
    }
}

// Finalize and save time for the previous tab
async function finalizeAndSaveTime() {
    if (activeTabId === null || activeTabStart === null) return;

    const now = Date.now();
    const duration = now - activeTabStart;
    const url = await getActiveTabUrl();

    if (url) {
        const result = await chrome.storage.local.get([url]);
        const prevTime = result[url] || 0;
        await chrome.storage.local.set({ [url]: prevTime + duration });
    }
}

// Initialize the extension
async function initialize() {
    const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
    });
    if (tab?.id) {
        activeTabId = tab.id;
        activeTabStart = Date.now();
    }
}
initialize();

// Event listener for tab changes
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    await finalizeAndSaveTime();
    activeTabId = tabId;
    activeTabStart = Date.now();
});

// Event listener for window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    await finalizeAndSaveTime();
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        activeTabId = null;
        activeTabStart = null;
    } else {
        const [tab] = await chrome.tabs.query({
            active: true,
            windowId: windowId,
        });
        if (tab?.id) {
            activeTabId = tab.id;
            activeTabStart = Date.now();
        }
    }
});

// Event listener for tab removal
chrome.tabs.onRemoved.addListener(async (tabId) => {
    if (tabId === activeTabId) {
        await finalizeAndSaveTime();
        activeTabId = null;
        activeTabStart = null;
    }
});

// A periodic timer to continuously update the time for the active tab
setInterval(async () => {
    if (activeTabId === null || activeTabStart === null) return;

    const now = Date.now();
    const duration = now - activeTabStart;
    activeTabStart = now; // Reset the start time for the next interval

    const url = await getActiveTabUrl();
    if (url) {
        const result = await chrome.storage.local.get([url]);
        const prevTime = result[url] || 0;
        await chrome.storage.local.set({ [url]: prevTime + duration });
    }
}, 5000); // Updates every 5 seconds
