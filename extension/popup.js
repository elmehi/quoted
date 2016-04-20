var USER_KEY = 'username';
var PASS_KEY = 'password';
var AUTH_KEY = 'auth';

function sendMessageToContentJS(message, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message, function() {
            console.log("Sent message to content script:");
            console.log(message);
        });
    });
}

function signUp() {
    console.log('sign up');
    sendMessageToContentJS({message:'signing up'}, function(){});
    
    var user = document.getElementById('username').value;
    var pass = document.getElementById('password').value;
    var auth_token = 'a_random_string';
    
    // Start signup request
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    var URL = "https://quotedserver.herokuapp.com/lookup/signup/";
    console.log(xhr.requestHeader);
    xhr.onreadystatechange = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
                if (responseText === auth_token) {
                    // SUCCESSFUL SIGNUP
                    signIn();
                } else {
                    // BAD AUTHENTICATION
                    console.log("Authentication ERROR");
                }
            } else {
                console.log("Non-200 status on signup", xhr.status);
            }
        }
        this.working = false;
    };
    xhr.onerror = function (e) {
        console.log("THIS IS AN ERROR (SIGNUP):");
        console.error(xhr.statusText);
        console.log(xhr.statusText);
        this.working = false;
    };
    xhr.open("GET", URL, true);
    xhr.setRequestHeader("Authorization", btoa(user + ":" + pass + ":" + auth_token));
    xhr.send(null);
}

function signIn() {
    console.log('sign in');
    sendMessageToContentJS({message:'signing in'}, function(){});
    
    var user = document.getElementById('username').value;
    var pass = document.getElementById('password').value;
    var auth_token = 'a_random_string';
    
    // Record that we've started an authentication request
    chrome.storage.sync.set({USER: {username:user, token:auth_token}}, function() {
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        var URL = "https://quotedserver.herokuapp.com/lookup/auth/";
        xhr.onreadystatechange = function (e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log(xhr.responseText);
                    if (xhr.responseText === auth_token) {
                        // SUCCESSFUL AUTHENTICATION
                        chrome.storage.sync.set({USER: {username:user, token:auth_token, authenticated:'y'}}, function() {
                            sendMessageToContentJS({username:user});
                        });
                    } else {
                        // BAD AUTHENTICATION
                        console.log("Authentication ERROR");
                    }
                } else {
                    console.log("Non-200 status on auth", xhr.status);
                }
            }
            this.working = false;
        };
        xhr.onerror = function (e) {
            console.log("THIS IS AN ERROR (SIGN IN):");
            console.error(xhr.statusText);
            console.log(xhr.statusText);
            reload(JSON.parse(test_response));
            this.working = false;
        };
        xhr.open("GET", URL, true);
        xhr.setRequestHeader("Authorization", btoa(user + ":" + pass + ":" + auth_token));
        xhr.send(null);
    });
    
    console.log('Sending Message');
}

document.getElementById("signin").onclick = signIn;
document.getElementById("signup").onclick = signUp;

chrome.storage.sync.get("USER", function (obj) {
    var user = obj['USER'];
    if ('username' in user) {
        var username = user['username'];
        $('#title').text('Signed in as:');
        $('#signin').text('Sign Out');
        document.getElementById("signup").style.display = "none";
        document.getElementById("username").value = username;
    }
});