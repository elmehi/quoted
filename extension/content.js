/*******************************************************************************
*
* SETTINGS
*
*******************************************************************************/
var CLOBBER_LINKS = true;
var INCLUDE_TITLES = true;
/******************************************************************************/


// #############################################################################
// TAG TO USE AS A PLACEHOLDER UNTIL A QUOTE'S INFORMATION HAS BEEN LOADED
// #############################################################################
var LOAD_TAG = '<a id="ID" class="quote">' +
'<span class="tooltip tooltip_bottom" data_tooltip_bottom="Loading article...">';
var LOAD_TAG_END = '</span></a>'
// #############################################################################

// #############################################################################
// TAG TO USE ONCE A QUOTE'S INFORMATION HAS BEEN LOADED
// #############################################################################
var INFO_TAG = '<span class="tooltip tooltip_top" data_tooltip_top="__SOURCE__">' + 
'<span class="tooltip tooltip_middle" data_tooltip_middle="__DATE__">' +
'<span class="tooltip tooltip_bottom" data_tooltip_bottom="&quot;__ARTICLE_TITLE__&quot;">';
var INFO_TAG_END = '</span></span></span>';
// #############################################################################

// #############################################################################
// QUOTE VALIDITY CHECKING CONSTANTS
// #############################################################################
var MIN_CHARS = 8;
var MIN_WORDS = 4;
var MIN_LONGEST_WORD_LENGTH = MIN_CHARS;
// #############################################################################

var quotes_highlighted = false;
var quote_ids;
// #############################################################################

// A valid quote:
// **MUST** be at least MIN_CHARS characters long
// **MUST** have either:
//  a word at least MIN_LONGEST_WORD_LENGTH characters long
//  at least MIN_WORDS words
function quoteValid(quote) {
    var valid_quote = false;
    
    if (quote.length >= 8) {
        var words = quote.split(" ");
        if (words.length >= MIN_WORDS) {
            valid_quote = true;
        } else {
            for (var idx = 0; idx < words.length; idx++) {
                if (words[idx].length >= MIN_LONGEST_WORD_LENGTH) {
                    valid_quote = true;
                }
            }
        }
    }
    
    return valid_quote;
}

function extractText() {
    var article_pieces = [];
    $("body").find("div").contents().each(function(i, el) {
        var text = $(el).text();
        if (text !== undefined) {
            var reduced = text.replace(/\s{2,}/g, ' ');
            if (reduced.length > 50) {
                if (text.length / reduced.length < 2 && text.length / reduced.length > 1.1) {
                    article_pieces.push(reduced);
                }
            }
        }
    })
    
    var article = article_pieces.join(" ");
    
    return article;
}

function extractQuotes() {
    quote_ids = {};
    var id = 0;
    var selector = "p, div";
    if (INCLUDE_TITLES) {
        selector += ", :header";
    }
    if (CLOBBER_LINKS) {
        selector += ", a";
    }
    $(selector).contents().filter(function (i, el) {
        return el.nodeType === 3; // THIS MEANS THE CONTENTS ARE TEXT
    }).each(function (i, el) {
        var replaced = $(el).text().replace(/(["\u201C])([^"\u201D]+)(["\u201D])/g, function($0, $1, $2, $3) {
            if (quoteValid($2)) {
                // BUILD A UNIQUE IDENFITIER FOR THIS QUOTE
                var id_to_use;
                if ($2 in quote_ids) {
                    id_to_use = quote_ids[$2];
                } else {
                    id++;
                    quote_ids[$2] = id;
                    id_to_use = id;
                }
                
                return LOAD_TAG.replace('ID', "" + id_to_use) + $1 + $2 + $3 + LOAD_TAG_END;
            } else {
                return $1 + $2 + $3;
            }
        });
        
        if ($(el).text() !== replaced) {
            $(el).replaceWith(replaced);
        }
    })
}

function reload(response) {
    console.log(response);
    var quote = response['quote'];
    var id_string = "[id=" + quote_ids[quote] + "]";
    var block = $(id_string);
    $(id_string).attr('href', response['url']);
    $(id_string).contents().each(function (i, el) {
        if ($(el).text().length) {
            var INFO_TAG_populated = INFO_TAG;
            if ('date' in response && response['date'].length > 1) {
                INFO_TAG_populated = INFO_TAG_populated.replace('__DATE__', response['date']);
            } else {
                INFO_TAG_populated = INFO_TAG_populated.replace('__DATE__', "No Source Date...");
            }
            
            if ('name' in response && response['name'].length > 1) {
                INFO_TAG_populated = INFO_TAG_populated.replace('__SOURCE__', response['name']);
            } else {
                INFO_TAG_populated = INFO_TAG_populated.replace('__SOURCE__', "No Source Name...");
            }
            
            if ('title' in response && response['title'].length > 1) {
                INFO_TAG_populated = INFO_TAG_populated.replace('__ARTICLE_TITLE__', response['title']);
            } else {
                INFO_TAG_populated = INFO_TAG_populated.replace('__ARTICLE_TITLE__', "No Article Title...");
            }
            
            $(el).replaceWith(INFO_TAG_populated + '"' + quote + '"' + INFO_TAG_END);
        }
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

function unhighlightQuotes() {
    $(".tooltip").contents().unwrap();
    $(".quote").contents().unwrap();
}

function highlightQuotes() {
    $(".quote").hover(
        function(e) {
            if (e.type === "mouseenter" && !this.working) {
                this.working = true;
                var quote = e.currentTarget.outerText;
                quote = quote.substring(1, quote.length - 1);
                var test_response = '{' +
                '"domain": "http://www.example-website.com", ' +
                '"url": "http://www.google.com/", ' +
                '"title": "Test Article", ' + 
                '"name": "Test Source", ' +
                '"date": "January 16, 2016 1:30 EST", ' + 
                '"quote": "' + quote + '"' +
                '}';
                
                var xhr = new XMLHttpRequest();
                var URL = "https://quotedserver.herokuapp.com/lookup/__/results/";
                URL = URL.replace('__', encodeURIComponent(quote));
                console.log(encodeURIComponent(quote));
                console.log(URL);
                xhr.onreadystatechange = function (e) {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            console.log(xhr.responseText);
                            var JSON_object = JSON.parse(xhr.responseText);
                            if (!('date' in JSON_object)) {
                                JSON_object['date'] = xhr.getResponseHeader('Date');
                            }
                            reload(JSON_object);
                        } else {
                            console.log("Non-200 status", xhr.status);
                            reload(JSON.parse(test_response));
                        }
                    }
                    this.working = false;
                };
                xhr.onerror = function (e) {
                    console.log("THIS IS AN ERROR:");
                    console.error(xhr.statusText);
                    console.log(xhr.statusText);
                    reload(JSON.parse(test_response));
                    this.working = false;
                };
                xhr.open("GET", URL, true);
                xhr.send(null);
            }
        }
    )
}

function highlightIfNeeded(domains, domain) {
    if (domains.indexOf(domain) === -1 && domain.length) {
        unhighlightQuotes();
    } else {
        extractQuotes();
        highlightQuotes();
    }
}

function currentDomain() {
    var domain = window.location.hostname;
    if (domain.length == 0) {
        return '_';
    } else {
        return domain;
    }
}

function domainRequestWithURL(URL, username) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log('VALID DOMAINS:');
                console.log(xhr.responseText);
                var valid_domains = JSON.parse(xhr.responseText);
                highlightIfNeeded(valid_domains, currentDomain());
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
    xhr.open("GET", URL, true);
    xhr.setRequestHeader("Authorization", btoa(username));
    xhr.send(null);
}

function highlightFromValidDomains(username) {
    var URL = "https://quotedserver.herokuapp.com/lookup/getvaliddomains/";
    domainRequestWithURL(URL, username);
}

function toggleDomain(username) {
    var URL = "https://quotedserver.herokuapp.com/lookup/toggledomain/__/";
    URL = URL.replace('__', btoa(currentDomain()));
    domainRequestWithURL(URL, username);
}

function requestUsername() {
    chrome.runtime.sendMessage({task: "getUser"}, function(response) {});
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        var task = request.task;
        console.log("MESSAGE FROM BACKGROUND SCRIPT:");
        console.log(request);
        
        if (task === 'toggle') {
            toggleDomain(request.user);
        } else if (task === 'signout') {
            unhighlightQuotes();
        } else if (task === 'usernamerequest' || task === 'signin') {
            highlightFromValidDomains(request.user);
        } else if (task === 'nouser') {
            
        }
    }
);

// #############################################################################
// THIS IS THE ONLY THING THAT HAPPENS EVERY TIME
// #############################################################################
requestUsername();
// #############################################################################
