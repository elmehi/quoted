// This is fired when we get a key combination
chrome.commands.onCommand.addListener(function(command) {
    console.log(command);
    
    // Check to see if we have a logged in user
    chrome.storage.sync.get("USER", function (obj) {
        var user = obj['USER'];
        if ('username' in user) {
            if ('authenticated' in user) {
                // Check if authenticated
                if (user['authenticated'] === 'y') {
                    var username = user['username'];
                    
                    // Tell the content script we've got a toggle
                    chrome.tabs.query({active: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {toggle:'y', 'user':username}, function() {
                            
                        });
                    });
                }
            }
        }
    });
});
