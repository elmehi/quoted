var USER_KEY = 'username';
var PASS_KEY = 'password';
var AUTH_KEY = 'auth';
var SIGN_IN_MESSAGE = 'Log in or sign up!';
var BAD_AUTH_MESSAGE = 'Invalid credentials.'
var UNKNOWN_ERROR = 'Request failed. Try Again.'

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
                if (xhr.responseText === auth_token) {
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
    var user = document.getElementById('username').value;
    var pass = document.getElementById('password').value;
    var auth_token = 'a_random_string';
    
    document.getElementById("password").value = "";
    
    // Record that we've started an authentication request
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
                        sendMessageToContentJS({'task':'signin', user:user});
                        updateUIForSignedIn(user);
                    });
                } else {
                    // BAD AUTHENTICATION
                    console.log("Authentication ERROR");
                    $('#signedoutmessage').text(BAD_AUTH_MESSAGE);
                }
            } else {
                console.log("Non-200 status on auth", xhr.status);
                $('#signedoutmessage').text(UNKNOWN_ERROR);
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
    
    console.log('Sending Message');
}

function signOut() {
    chrome.storage.sync.set({USER: {}}, function() {
        sendMessageToContentJS({'task':'signout'});
        updateUIForSignedOut();
    });
}

function updateUIForSignedOut() {
    $('#signedoutmessage').text(SIGN_IN_MESSAGE);
    
    document.getElementById("signedin").style.display = "none";
    document.getElementById("signedout").style.display = "inline";
}

function updateSliderForHighlightingState(state) {
    console.log(state);
    document.getElementById("highlightstate").value = parseInt(state);
    switch (state) {
        case 0:
            $('#highlightstatetext').text('Quote highlighting disabled for all domains.');
            document.getElementById("domains").disabled = true;
            document.getElementById("removedomains").disabled = true;
            document.getElementById("domains").style.opacity = .4;
            document.getElementById("removedomains").style.opacity = .4;
            break;
        case 1:
            $('#highlightstatetext').text('Quote highlighting enabled only on the following domains:');
            document.getElementById("domains").disabled = '';
            document.getElementById("removedomains").disabled = '';
            document.getElementById("domains").style.opacity = 1;
            document.getElementById("removedomains").style.opacity = 1;
            break;
        case 2:
            $('#highlightstatetext').text('Quote highlighting enabled on all domains.');
            document.getElementById("domains").disabled = true;
            document.getElementById("removedomains").disabled = true;
            document.getElementById("domains").style.opacity = .4;
            document.getElementById("removedomains").style.opacity = .4;
            break;
    }
}

function saveNewHighlightingState(state, username) {
    var xhr = new XMLHttpRequest();
    var URL = "https://quotedserver.herokuapp.com/lookup/sethighlightedstate/" + state + '/';
    xhr.onreadystatechange = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log('saved new state:');
                console.log(state);
                sendMessageToContentJS({'task':'signin', 'user':username});
            }
        }
        this.working = false;
    };
    xhr.onerror = function (e) {
        console.log("THIS IS AN ERROR:");
        console.error(xhr.statusText);
        console.log(xhr.statusText);
    };
    xhr.open("GET", URL, true);
    xhr.setRequestHeader("Authorization", btoa(username));
    xhr.send(null);
}

function requestHighlightingState(username) {
    console.log('requesting highlighting state');
    var xhr = new XMLHttpRequest();
    var URL = "https://quotedserver.herokuapp.com/lookup/gethighlightedstate/";
    xhr.onreadystatechange = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log("HIGHLIGHTINGSTATE");
                console.log(xhr.responseText);
                updateSliderForHighlightingState(parseInt(xhr.responseText));
            } else {
                console.log("Non-200 status", xhr.status);
            }
        }
    };
    xhr.onerror = function (e) {
        console.log("THIS IS AN ERROR:");
        console.error(xhr.statusText);
        console.log(xhr.statusText);
    };
    xhr.open("GET", URL, true);
    xhr.setRequestHeader("Authorization", btoa(username));
    xhr.send(null);
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
    var xhr = new XMLHttpRequest();
    var URL = "https://quotedserver.herokuapp.com/lookup/gethistory";
    xhr.onreadystatechange = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
                var responseData = JSON.parse(xhr.responseText);
                console.log(responseData);
                console.log(responseData.length);
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
                    
                    console.log(data);
                    
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
            } else {
                console.log("Non-200 status", xhr.status);
            }
        }
    };
    
    xhr.onerror = function (e) {
        console.log("HISTORY ERROR:");
        console.log(xhr.statusText);
    };
    
    chrome.storage.sync.get("USER", function (obj) {
        var user = obj['USER'];
        if ('username' in user) {
            xhr.open("GET", URL, true);
            xhr.setRequestHeader("Authorization", btoa(user['username']));
            xhr.send(null);
        }
    });
}

function disableSelectedDomains() {
    var select = document.getElementById("domains");
    var selected = [];
    var username;
    for (var idx = 0; idx < select.length; idx++) {
        if (select.options[idx].selected) {
            var URL = "https://quotedserver.herokuapp.com/lookup/toggledomain/";
            URL += btoa(select.options[idx].text) + '/';
            var xhr = new XMLHttpRequest();
            
            xhr.onreadystatechange = function (e) {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        sendMessageToContentJS({'task':'signin', 'user':username});
                    }
                }
            };
            
            xhr.onerror = function (e) {
                console.log("THIS IS AN ERROR:");
                console.error(xhr.statusText);
                console.log(xhr.statusText);
            };
            
            select.remove(idx);
            idx--;
            
            chrome.storage.sync.get("USER", function (obj) {
                var user = obj['USER'];
                if ('username' in user) {
                    username = user['username'];
                    xhr.open("GET", URL, true);
                    xhr.setRequestHeader("Authorization", btoa(user['username']));
                    xhr.send(null);
                }
            });
        }
    }
}

function populateDomainSelectField() {
    var URL = "https://quotedserver.herokuapp.com/lookup/getvaliddomains/";
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log('VALID DOMAINS:');
                console.log(xhr.responseText);
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
            } else {
                console.log("Non-200 status", xhr.status);
            }
        }
        this.working = false;
    };
    xhr.onerror = function (e) {
        console.log("THIS IS AN ERROR:");
        console.error(xhr.statusText);
        console.log(xhr.statusText);
        this.working = false;
    };
    
    chrome.storage.sync.get("USER", function (obj) {
        var user = obj['USER'];
        if ('username' in user) {
            xhr.open("GET", URL, true);
            xhr.setRequestHeader("Authorization", btoa(user['username']));
            xhr.send(null);
        }
    });
}

document.getElementById("signin").onclick = signIn;
document.getElementById("signout").onclick = signOut;
document.getElementById("signup").onclick = signUp;
document.getElementById("removedomains").onclick = disableSelectedDomains;

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

checkSignedIn();
