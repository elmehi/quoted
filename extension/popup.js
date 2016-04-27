/*********************************************************/
/* SOME CONSTANT KEYS */
/*********************************************************/
var USER_KEY = 'username';
var PASS_KEY = 'password';
var AUTH_KEY = 'auth';
var SIGN_IN_MESSAGE = 'Log in or sign up!';
var BAD_AUTH_MESSAGE = 'Invalid credentials.'
var UNKNOWN_ERROR = 'Request failed. Try Again.'
/*********************************************************/

/*
 * Helper function to send a message (dict) to the content script.
 */
function sendMessageToContentJS(message, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message, callback);
    });
}

/*
 * Helper function to perform XMLHTTPRequests.
 */
function xhttprequest(URL, username, success) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
                success(xhr);
            } else {
                console.log("Non-200 status", xhr.status);
                if (xhr.status === 503) {
                    document.getElementById('signedinmessage').innerHTML = 'Server uptime quota reached. Server sleeping.';
                    document.getElementById('signedoutmessage').innerHTML = document.getElementById('signedinmessage').innerHTML;
                }
            }
        }
    };
    xhr.onerror = function (e) {
        console.error(xhr.statusText);
    };
    xhr.open("GET", URL, true);
    xhr.setRequestHeader("Authorization", btoa(username));
    xhr.send(null);
}

/*
 * Sign up a new user to Quoted.
 */
function signUp() {
    sendMessageToContentJS({message:'signing up'}, function(){});
    
    var user = document.getElementById('username').value;
    var pass = document.getElementById('password').value;
    var auth_token = 'a_random_string';
    
    // Start signup request
    var URL = "https://quotedserver.herokuapp.com/lookup/signup/";
    xhttprequest(URL, user + ":" + pass + ":" + auth_token, function(xhr) {
        if (xhr.responseText === auth_token) {
            // SUCCESSFUL SIGNUP
            signIn();
        } else {
            // BAD AUTHENTICATION
            console.log("Authentication ERROR");
        }
    });
}

/*
 * Sign an existing user into Quoted.
 */
function signIn() {
    var user = document.getElementById('username').value;
    var pass = document.getElementById('password').value;
    var auth_token = 'a_random_string';
    
    // Record that we've started an authentication request
    var URL = "https://quotedserver.herokuapp.com/lookup/auth/";
    xhttprequest(URL, user + ":" + pass + ":" + auth_token, function(xhr) {
        if (xhr.responseText === auth_token) {
            // SUCCESSFUL AUTHENTICATION
            document.getElementById("password").value = "";
            
            chrome.storage.sync.set({USER: {username:user, token:auth_token, authenticated:'y'}}, function() {
                sendMessageToContentJS({'task':'signin', user:user});
                updateUIForSignedIn(user);
            });
        } else {
            // BAD AUTHENTICATION
            $('#signedoutmessage').text(BAD_AUTH_MESSAGE);
        }
    });
}

/*
 * Sign the current user out of Quoted and clear the user data.
 */
function signOut() {
    chrome.storage.sync.set({USER: {}}, function() {
        sendMessageToContentJS({'task':'signout'});
        updateUIForSignedOut();
    });
}

/* 
 * Update the UI to reflect a signed out user.
 */
function updateUIForSignedOut() {
    $('#signedoutmessage').text(SIGN_IN_MESSAGE);
    
    document.getElementById("signedin").style.display = "none";
    document.getElementById("signedout").style.display = "inline";
}

/*
 * If the domain list has a domain selected, enable the remove domain button.
 */
function enableRemoveButtonIfNecessary() {
    var select = document.getElementById("domains");
    for (var idx = 0; idx < select.length; idx++) {
        if (select.options[idx].selected) {
            document.getElementById("removedomains").disabled = false;
        }
    }
}

/*
 * Grey out the individual domain controls when we aren't in whitelist mode.
 */
function disableDomainControls() {
    document.getElementById("domains").disabled = true;
    document.getElementById("removedomains").disabled = true;
    document.getElementById("togglecurrentdomain").disabled = true;
    document.getElementById("domains").style.opacity = .4;
    document.getElementById("removedomains").style.opacity = .4;
    document.getElementById("togglecurrentdomain").style.opacity = .4;
}

/*
 * Update UI to reflect a particular slider state.
 */
function updateSliderForHighlightingState(state) {
    console.log(state);
    document.getElementById("highlightstate").value = parseInt(state);
    switch (state) {
        case 0:
            $('#highlightstatetext').text('Quote highlighting disabled for all domains.');
            disableDomainControls();
            break;
        case 1:
            $('#highlightstatetext').text('Quote highlighting enabled for domains:');
            document.getElementById("domains").disabled = false;
            document.getElementById("togglecurrentdomain").disabled = false;
            document.getElementById("domains").style.opacity = 1;
            document.getElementById("removedomains").style.opacity = 1;
            document.getElementById("togglecurrentdomain").style.opacity = 1;
            
            enableRemoveButtonIfNecessary();
            break;
        case 2:
            $('#highlightstatetext').text('Quote highlighting enabled for all domains.');
            disableDomainControls();
            break;
    }
}

/*
 * Update the database to reflect a new highlighting state for the user.
 */
function saveNewHighlightingState(state, username) {
    var URL = "https://quotedserver.herokuapp.com/lookup/sethighlightedstate/" + state + '/';
    xhttprequest(URL, username, function(xhr) {
        sendMessageToContentJS({'task':'signin', 'user':username});
    });
}

function requestHighlightingState(username) {
    var URL = "https://quotedserver.herokuapp.com/lookup/gethighlightedstate/";
    xhttprequest(URL, username, function(xhr) {
        updateSliderForHighlightingState(parseInt(xhr.responseText));
    });
}

function updateUIForSignedIn(username) {
    $('#signedinmessage').text('Signed in as ' + username);
    
    document.getElementById("signedin").style.display = "inline";
    document.getElementById("signedout").style.display = "none";
    
    setTimeout(function() { 
        showHistoryGraph(); 
        populateDomainSelectField();
        requestHighlightingState(username);
    }, 50);
}

function checkSignedIn() {
    chrome.storage.sync.get("USER", function (obj) {
        var user = obj['USER'];
        if ('username' in user) {
            updateUIForSignedIn(user['username']);
        } else {
            updateUIForSignedOut();
        }
    });
}

// http://jsfiddle.net/gh/get/jquery/1.9.1/highslide-software/highcharts.com/tree/master/samples/highcharts/demo/pie-monochrome/
function generateHighchart(d) {
    // Build the chart
    $('#container').highcharts({
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            text: ''
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.y}</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: false
                },
                showInLegend: false
            }
        },
        series: [{
            name: 'Quotes',
            colorByPoint: true,
            data:d
        }]
    });
}

function domainFromURL(url) {
    var domain;
    if (url.indexOf('://') == -1) {
        domain = url.split('/')[0];
    } else {
        domain = url.split('/')[2];
    }
    
    return domain;
}

function showHistoryGraph() {
    // request history from heroku
    chrome.storage.sync.get("USER", function (obj) {
        var user = obj['USER'];
        if ('username' in user) {
            var URL = "https://quotedserver.herokuapp.com/lookup/gethistory";
            xhttprequest(URL, user['username'], function(xhr) {
                var responseData = JSON.parse(xhr.responseText);
                
                if (responseData.length > 0) {
                    var data = {};
                    for (var idx = 0; idx < responseData.length; idx++) {
                        var domain = domainFromURL(responseData[idx].url);
                        
                        if (domain in data) {
                            data[domain] = data[domain] + 1;
                        } else {
                            data[domain] = 1;
                        }
                    }
                    
                    var highchartsData = [];
                    for (var key in data) {
                        highchartsData.push({'name':key, 'y':data[key]})
                    }
                    
                    generateHighchart(highchartsData);
                    
                    document.getElementById("container").style.display = 'block';
                    document.getElementById("norequests").style.display = 'none';
                } else {
                    document.getElementById("container").style.display = 'none';
                    document.getElementById("norequests").style.display = 'block';
                }
            });
        }
    });
}

function disableSelectedDomains() {
    var select = document.getElementById("domains");
    var selected = [];
    
    chrome.storage.sync.get("USER", function (obj) {
        var user = obj['USER'];
        if ('username' in user) {
            for (var idx = 0; idx < select.length; idx++) {
                if (select.options[idx].selected) {
                    var URL = "https://quotedserver.herokuapp.com/lookup/toggledomain/";
                    URL += btoa(select.options[idx].text) + '/';
                    xhttprequest(URL, user['username'], function(xhr) {
                        sendMessageToContentJS({'task':'signin', 'user':user.username});
                    });
                    
                    select.remove(idx);
                    idx--;
                }
            }
            
            delayPopulate();
        }
    });
}

function populateDomainSelectField() {
    chrome.storage.sync.get("USER", function (obj) {
        var user = obj['USER'];
        if ('username' in user) {
            var URL = "https://quotedserver.herokuapp.com/lookup/getvaliddomains/";
            xhttprequest(URL, user.username, function(xhr) {
                var valid_domains = JSON.parse(xhr.responseText);
                var list = document.getElementById("domains");
                // clear the list
                while (list.options.length > 0) {
                    list.remove(0);
                }
                
                // populate with valid domains
                for (d in valid_domains) {
                    if (valid_domains[d].length > 1) {
                        var option = document.createElement("option");
                        option.text = valid_domains[d];
                        list.add(option);
                    }
                }
                
                document.getElementById("removedomains").disabled = true;
            });
        }
    });
}

/*
 * Toggle on or off the current domain.
 */
function toggleCurrentDomain() {
    chrome.runtime.sendMessage({task: "toggle"}, function(response) {});
    
    delayPopulate();
}

/*
 * Refresh the domain select field after a delay.
 */
function delayPopulate() {
    setTimeout(function() { 
        populateDomainSelectField();
    }, 150);
}

/* 
 * Perform some basic setup connecting UI elements to javascript functions.
 */
function pageSetup() {
    // Repopulate when the key combination is pressed.
    chrome.commands.onCommand.addListener(delayPopulate);

    document.getElementById("signin").onclick = signIn;
    document.getElementById("signout").onclick = signOut;
    document.getElementById("signup").onclick = signUp;
    document.getElementById("removedomains").onclick = disableSelectedDomains;
    document.getElementById("togglecurrentdomain").onclick = toggleCurrentDomain;
    document.getElementById("domains").onchange = enableRemoveButtonIfNecessary;

    $('#highlightstate').change(function(event) {
        var state = parseInt($(event.target).val());
        updateSliderForHighlightingState(state);
        chrome.storage.sync.get("USER", function (obj) {
            var user = obj['USER'];
            if ('username' in user) {
                saveNewHighlightingState(state, user['username']);
            }
        });
    });

    // http://stackoverflow.com/questions/155188/trigger-a-button-click-with-javascript-on-the-enter-key-in-a-text-box
    $("#password,#username").keyup(function(event) {
        if(event.keyCode == 13) $("#signin").click();
    });
}


/* #############################################################################
 * Kick it all off
 * ###########################################################################*/
pageSetup();
checkSignedIn();
// #############################################################################
