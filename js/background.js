// Global variables
let blockedSites = {};
let currentTabId = null;
let startTime = null;
let tabTimes = {};
let isTrackingEnabled = false;

// Utility Functions
function isValidHttpUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;  
    }
}

function updateTabTime(tabId) {
    if (!tabId || !startTime) return;

    const timeSpent = Date.now() - startTime;
    tabTimes[tabId] = (tabTimes[tabId] || 0) + timeSpent;
    chrome.storage.local.set({ 'tabTimes': tabTimes });
    startTime = Date.now();
}

// Load data from storage
chrome.storage.local.get(['blockedSites', 'tabTimes', 'isTrackingEnabled'], function(result) {
    blockedSites = result.blockedSites || {};
    tabTimes = result.tabTimes || {};
    isTrackingEnabled = !!result.isTrackingEnabled;
});

// Event Listeners
document.addEventListener('copy', function (event) {
    const clipboardData = event.clipboardData || window.clipboardData;
    const copiedText = clipboardData.getData('text');
    if (isValidHttpUrl(copiedText) && confirm(`Do you want to block this site?\n${copiedText}`)) {
        blockedSites[copiedText] = true;
    }
});

chrome.tabs.onActivated.addListener(activeInfo => {
    if (isTrackingEnabled) {
        updateTabTime(currentTabId);
        currentTabId = activeInfo.tabId;
        startTime = Date.now();
    }
});

chrome.windows.onFocusChanged.addListener(windowId => {
    if (isTrackingEnabled) {
        if (windowId === chrome.windows.WINDOW_ID_NONE) {
            updateTabTime(currentTabId);
            currentTabId = null;
            startTime = null;
        } else {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0) {
                    currentTabId = tabs[0].id;
                    startTime = Date.now();
                }
            });
        }
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.type) {
        case "blockSite":
            blockedSites[request.url] = true;
            break;
        case "unblockSite":
            delete blockedSites[request.url];
            sendResponse({ status: "Site unblocked" });
            chrome.storage.local.set({ blockedSites: blockedSites });
            break;
        case "getBlockedSites":
            sendResponse(blockedSites);
            break;
        case "toggleTracking":
            isTrackingEnabled = request.isEnabled;
            chrome.storage.local.set({ 'isTrackingEnabled': isTrackingEnabled });
            if (!isTrackingEnabled) {
                updateTabTime(currentTabId);
                currentTabId = null;
                startTime = null;
            }
            break;
        case "getTimeSpent":
            sendResponse(tabTimes);
            break;
    }
});

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        const url = new URL(details.url);
        console.log("Blocking URL:", url.href); 
        return { cancel: !!blockedSites[url.href] };
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);
