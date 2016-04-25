// This is fired when we get a key combination
chrome.commands.onCommand.addListener(function(command) {
    console.log(command);
    
    // Check to see if we have a logged in user
    chrome.storage.sync.get('USER', function (obj) {
        var user = obj['USER'];
        if ('username' in user && 'authenticated' in user) {
            // Check if authenticated
            if (user['authenticated'] === 'y') {
                var username = user['username'];
                
                // Tell the content script we've got a toggle
                chrome.tabs.query({active: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {'task':'toggle', 'user':username}, function() {});
                });
            } else {
                alert("Quoted can't highlight quotes on this domain because there is no logged in user. Log in or sign up!");
                console.log("No logged in user:");
                console.log(obj);
            }
        } else {
            alert("Quoted can't highlight quotes on this domain because there is no logged in user. Log in or sign up!");
            console.log("No logged in user:");
            console.log(obj);
        }
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request);
    console.log(request.task);
    if (request.task === "getUser") {
        chrome.storage.sync.get("USER", function (obj) {
            var user = obj['USER'];
            
            if ('username' in user && 'authenticated' in user) {
                // Check if authenticated
                if (user['authenticated'] === 'y') {
                    var username = user['username'];
                    
                    // Tell the content script we've got the username
                    chrome.tabs.query({active: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {'task':'usernamerequest', 'user':username}, function() {});
                    });
                } else {
                    chrome.tabs.query({active: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {'task':'nouser'}, function() {});
                    });
                }
            } else {
                chrome.tabs.query({active: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {'task':'nouser'}, function() {});
                });
            }
        });
    } else if (request.task == 'badgeUpdate') {
        var info = {'text': request.text, 'tabId': sender.tab.id};
        chrome.browserAction.setBadgeText(info);
    }
});
