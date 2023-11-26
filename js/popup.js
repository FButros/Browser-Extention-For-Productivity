document.addEventListener('DOMContentLoaded', function() {
    // Load and display data
    loadAndDisplayData();
    loadTrackingState();
    displayCurrentTabTime();

    // Setup event listeners
    setupEventListeners();
});

function loadAndDisplayData() {
    chrome.runtime.sendMessage({ type: "getBlockedSites" }, function(blockedSites) {
        displayBlockedSites(blockedSites);
        displayCurrentTabTime();
    });
}

function displayBlockedSites(blockedSites) {
    const list = document.getElementById('blockedSitesList');
    list.innerHTML = '';
    Object.keys(blockedSites).forEach(site => {
        const li = document.createElement('li');
        li.textContent = site;
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => unblockSite(site));
        list.appendChild(li);
    });
}

function unblockSite(site) {
    chrome.runtime.sendMessage({ type: "unblockSite", url: site }, loadAndDisplayData);
}

function blockSite(site) {
    if (!site.startsWith('http://') && !site.startsWith('https://')) {
        site = 'https://' + site;
    }
    chrome.runtime.sendMessage({ type: "blockSite", url: site }, loadAndDisplayData);
}

function displayCurrentTabTime() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs.length) return;
        const { id: currentTabId, url: currentTabUrl } = tabs[0];
        chrome.runtime.sendMessage({type: "getTimeSpent"}, function(tabTimes) {
            const timeSpent = formatTime(tabTimes[currentTabId] || 0);
            document.getElementById('currentTabTime').innerHTML = `URL: ${currentTabUrl}<br>Time Spent: ${timeSpent}`;
        });
    });
}

function formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
}

function loadTrackingState() {
    chrome.storage.local.get('isTrackingEnabled', function(data) {
        const isTrackingEnabled = !!data.isTrackingEnabled;
        document.getElementById('toggleTrackingOn').checked = isTrackingEnabled;
        document.getElementById('toggleTrackingOff').checked = !isTrackingEnabled;
    });
}

function setupEventListeners() {
    document.getElementById('blockSiteButton').addEventListener('click', () => {
        const site = document.getElementById('siteInput').value;
        if (site) blockSite(site);
    });

    document.getElementById('toggleTrackingOn').addEventListener('change', function() {
        if (this.checked) {
            chrome.runtime.sendMessage({ type: "toggleTracking", isEnabled: true });
        }
    });

    document.getElementById('toggleTrackingOff').addEventListener('change', function() {
        if (this.checked) {
            chrome.runtime.sendMessage({ type: "toggleTracking", isEnabled: false });
        }
    });
}
