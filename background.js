chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({ color: '#3aa757' }, function() {
    console.log('The color is green.');
  });
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {
              hostEquals: 'www.collegealma.qc.ca',
              pathContains: 'colnet/cahier.asp'
            },
            css: ["input[name='chkPublierTravail']"]
          })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ]);
  });
});
