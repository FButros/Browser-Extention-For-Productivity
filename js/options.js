document.addEventListener('DOMContentLoaded', function() {
    loadAndDisplayData();
    loadTrackingState();
    setupEventListeners();
});

function loadAndDisplayData() {
    chrome.runtime.sendMessage({ type: "getBlockedSites" }, function(blockedSites) {
        displayBlockedSites(blockedSites);
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

function loadTrackingState() {
    chrome.storage.local.get('isTrackingEnabled', function(data) {
        document.getElementById('toggleTracking').checked = !!data.isTrackingEnabled;
    });
}

function setupEventListeners() {
    document.getElementById('blockSiteButton').addEventListener('click', () => {
        const site = document.getElementById('siteInput').value;
        if (site) blockSite(site);
    });

    document.getElementById('toggleTracking').addEventListener('change', function() {
        chrome.runtime.sendMessage({ type: "toggleTracking", isEnabled: this.checked });
    });
}
