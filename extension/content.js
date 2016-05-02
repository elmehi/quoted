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
'<span class="tooltip tooltip_bottom" data="Loading article...">';
var LOAD_TAG_END = '</span></a>'
// #############################################################################

// #############################################################################
// TAG TO USE ONCE A QUOTE'S INFORMATION HAS BEEN LOADED
// #############################################################################
var TOP_INFO_TAG = '<span class="tooltip tooltip-normal tooltip_bottom" data="&quot;__ARTICLE_TITLE__&quot;">' + 
'<span class="tooltip tooltip-normal tooltip_middle" data="__DATE__">' +
'<span class="tooltip tooltip-normal tooltip_top" data="__SOURCE__">';
var TOP_INFO_TAG_END = '</span></span></span>';

var DROPDOWN_ITEM = '<a class="dropdown dropdown-normal" href="__LINK__" target="_blank">__CONTENT__</a>';

var INFO_TAG = '<div class="dropdown-content">';
var INFO_TAG_END = '</div>';
// #############################################################################

// #############################################################################
// QUOTE VALIDITY CHECKING CONSTANTS
// #############################################################################
var MIN_CHARS = 8;
var MIN_WORDS = 4;
var MIN_LONGEST_WORD_LENGTH = MIN_CHARS;
// #############################################################################
var quote_ids;
var num_quote_ids;
var trusted_sources;
var untrusted_sources;
// #############################################################################

/*******************************************************************************
 * HELPER FUNCTIONS
 ******************************************************************************/

/*
 * Let the background script know we want to set the badge text
 */
function updateBadgeWithCount(count) {
    var text;
    if (count == -1) {
        text = '';
    } else {
        text = String(count);
    }
    chrome.runtime.sendMessage({task: "badgeUpdate", 'text': text}, function(response) {});
}

/* 
 * Escape a string to use HTML codes.
 * http://stackoverflow.com/questions/24816/escaping-html-strings-with-jquery
 */
function escapeHtml(string) {
    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };
    
    return String(string).replace(/[&<>"'\/]/g, function (s) {
        return entityMap[s];
    });
}

/*
 * Extract the domain from a URL.
 */
function domainFromURL(url) {
    var domain;
    if (url.indexOf('://') == -1) {
        domain = url.split('/')[0];
    } else {
        domain = url.split('/')[2];
    }
    
    return domain;
}

function displayNameFromURL(url) {
    var domain = domainFromURL(url);
    domain = domain.replace('www.', '');
    // var split_domain = domain.split('.');
    // var displayName = "";
    // var i = split_domain.length > 2 ? 1 : 0;
    // for (; i < split_domain.length - 1; i++) {
    //     displayName += '.' + split_domain[i];
    // }
    // var displayName = split_domain[split_domain.length - 2];
    // return  displayName.charAt(0).toUpperCase() + displayName.slice(1);
    return domain;
}

/* 
 * Builds a test JSON response.
 */
function testResponse(quote) {
    var test_response = '{' +
    '"domain": "http://www.example-website.com", ' +
    '"url": "http://www.google.com/", ' +
    '"title": "Test Article", ' + 
    '"name": "Test Source", ' +
    '"date": "January 16, 2016 1:30 EST", ' + 
    '"quote": "' + quote + '"' +
    '}';
    
    return test_response;
}

/*
 * Helper function to retrieve the current domain and correct for local files (_)
 */
function currentDomain() {
    var domain = window.location.hostname;
    if (domain.length == 0) {
        return '_';
    } else {
        return domain;
    }
}

/*
 * Sanitize a string for a URL.
 */
function replaceWordChars(text) {
    var s = text;
    // smart single quotes and apostrophe
    s = s.replace(/[\u2018\u2019\u201A]/g, "\'");
    // smart double quotes
    s = s.replace(/[\u201C\u201D\u201E]/g, "\"");
    // ellipsis
    s = s.replace(/\u2026/g, "...");
    // dashes
    s = s.replace(/[\u2013\u2014]/g, "-");
    // circumflex
    s = s.replace(/\u02C6/g, "^");
    // open angle bracket
    s = s.replace(/\u2039/g, "<");
    // close angle bracket
    s = s.replace(/\u203A/g, ">");
    // spaces
    s = s.replace(/[\u02DC\u00A0]/g, " ");
    
    return s;
}

/*
 * A valid quote:
 * **MUST** be at least MIN_CHARS characters long
 * **MUST** have either:
 *  a word at least MIN_LONGEST_WORD_LENGTH characters long
 *  at least MIN_WORDS words
 */
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

/*
 * Helper function to perform XMLHTTPRequests.
 */
function xhttprequest(URL, username, success) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                // console.log(xhr.responseText);
                success(xhr);
            } else {
                console.log("Non-200 status", xhr.status);
                if (xhr.status === 503) {
                    alert('Server uptime quota reached. Server sleeping.');
                }
            }
        }
    };
    xhr.onerror = function (e) {
        console.error(xhr.statusText);
    };
    xhr.open("GET", URL, true);
    xhr.setRequestHeader("Authorization", btoa(username));
    xhr.setRequestHeader("RequestOriginURL", btoa(document.URL));
    xhr.send(null);
}

/*******************************************************************************
 * THE MEAT OF THE SCRIPT
 ******************************************************************************/

/*
 * <EXPERIMENTAL FUNCTION CURRENTLY UNDER DEVELOPMENT>
 * Extract only the interesting text from the current page.
 */
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

/*
 * Extract the quotes from the webpage and build a reference dictionary so that
 * we can update the data for each one when the user mouses over.
 */
function extractQuotes() {
    quote_ids = {};
    num_quote_ids = 0;
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
            var quote = replaceWordChars($2);
            if (quoteValid(quote)) {
                // BUILD A UNIQUE IDENFITIER FOR THIS QUOTE
                var id_to_use;
                if (quote in quote_ids) {
                    id_to_use = quote_ids[quote];
                } else {
                    num_quote_ids++;
                    quote_ids[quote] = num_quote_ids;
                    id_to_use = num_quote_ids;
                }
                
                return LOAD_TAG.replace('ID', "" + id_to_use) + $1 + $2 + $3 + LOAD_TAG_END;
            } else {
                return $1 + $2 + $3;
            }
        });
        
        if ($(el).text() !== replaced) {
            $(el).replaceWith(replaced);
        }
    });
    
    updateBadgeWithCount(Object.keys(quote_ids).length);
}

/*
 * When we received a JSON response for a quote lookup, stick the data in the
 * tags.
 */
function reloadQuoteWithJSONResponse(response) {
    var quote = response['quote'];
    var id_string = "[id=" + quote_ids[quote] + "]";
    var block = $(id_string);
    $(id_string).attr('href', response['url']);
    $(id_string).attr('target', "_blank");
    
    $(id_string).contents().each(function (i, el) {
        if ($(el).text().length) {
            var TOP_INFO_TAG_populated = TOP_INFO_TAG;
            var INFO_TAG_populated = INFO_TAG;
            if ('date' in response && response['date'].length > 1) {
                TOP_INFO_TAG_populated = TOP_INFO_TAG_populated.replace('__DATE__', escapeHtml(response['date']));
            } else {
                TOP_INFO_TAG_populated = TOP_INFO_TAG_populated.replace('__DATE__', "No Source Date...");
            }
            
            if ('name' in response && response['name'].length > 1) {
                TOP_INFO_TAG_populated = TOP_INFO_TAG_populated.replace('__SOURCE__', escapeHtml(response['name']));
            } else {
                TOP_INFO_TAG_populated = TOP_INFO_TAG_populated.replace('__SOURCE__', displayNameFromURL(response['url']));
            }
            
            if ('title' in response && response['title'].length > 1) {
                TOP_INFO_TAG_populated = TOP_INFO_TAG_populated.replace('__ARTICLE_TITLE__', escapeHtml(response['title']));
            } else {
                TOP_INFO_TAG_populated = TOP_INFO_TAG_populated.replace('__ARTICLE_TITLE__', "No Article Title...");
            }
            
            // var primary_match = DROPDOWN_ITEM.replace('__LINK__', response['url']);
            // primary_match = primary_match.replace('__STYLE__', '');
            // if (response['name'].length > 1) {
            //     primary_match = primary_match.replace('__CONTENT__', escapeHtml(response['name']));
            // } else {
            //     primary_match = primary_match.replace('__CONTENT__', displayNameFromURL(response['url']));
            // }
            // 
            // INFO_TAG_populated += primary_match;
            
            var other_articles = response['other_article_titles'];
            for (var i = 0; i < other_articles.length; i++) {
                var url = response['other_article_urls'][i];
                
                var new_item = DROPDOWN_ITEM.replace('__LINK__', url).replace('__CONTENT__', displayNameFromURL(url));
                
                INFO_TAG_populated += new_item;
            }
            
            var complete_contents = INFO_TAG_populated + INFO_TAG_END + TOP_INFO_TAG_populated + '"' + quote + '"' + TOP_INFO_TAG_END;
            
            $(el).replaceWith(complete_contents);
            
            /* Set all the background colors if needed. */
            updateUIForTrustedUntrusted();
        }
    });
}

/*
 * Unhighlight all quotes on the page.
 */
function unhighlightQuotes() {
    $(".tooltip").contents().unwrap();
    $(".quote").contents().unwrap();
    
    updateBadgeWithCount(-1);
}

/*
 * Prepare quotes to be moused over and load their data.
 */
function prepareQuotes(username) {
    $(".quote").mouseover(
        function(e) {
            if (e.type === "mouseover" && !this.working) {
                this.working = true;
                var quote = e.currentTarget.outerText;
                quote = quote.substring(1, quote.length - 1);
                
                var URL = "https://quotedserver.herokuapp.com/lookup/__/results/";
                URL = URL.replace('__', btoa(replaceWordChars(quote)));
                xhttprequest(URL, username, function(xhr) {
                    var JSON_object = JSON.parse(xhr.responseText);
                    if (!('date' in JSON_object)) {
                        JSON_object['date'] = xhr.getResponseHeader('Date');
                    }
                    reloadQuoteWithJSONResponse(JSON_object);
                });
            }
        }
    )
}

/*
 * Get the user's valid domains and highlight quotes only if the current domain
 * is on the list.
 */
function highlightFromValidDomains(username) {
    var URL = "https://quotedserver.herokuapp.com/lookup/getvaliddomains/";
    xhttprequest(URL, username, function(xhr) {
        var domains = JSON.parse(xhr.responseText);
        var domain = currentDomain();
        if (domains.indexOf(domain) === -1 && domain.length) {
            unhighlightQuotes();
        } else {
            extractQuotes();
            prepareQuotes(username);
        }
    });
}

/*
 * Flip a domain on or off for the current user.
 */
function toggleDomain(username) {
    var URL = "https://quotedserver.herokuapp.com/lookup/toggledomain/__/";
    URL = URL.replace('__', btoa(currentDomain()));
    xhttprequest(URL, username, function(xhr) {
        requestHighlightingState(username);
    });
}

/*
 * Kick everything off by figuring out who the current user is.
 */
function requestUsername() {
    // expects a response from the background script with task='usernamerequest'
    chrome.runtime.sendMessage({task: "getUser"}, function(response) {});
}

/*
 * Request heroku to give us the user's current highlighting state
 * State will be one of:
 * - none (0)
 * - whitelist (1)
 * - all (2)
 */
function requestHighlightingState(username) {
    var xhr = new XMLHttpRequest();
    var URL = "https://quotedserver.herokuapp.com/lookup/gethighlightedstate/";
    xhttprequest(URL, username, function(xhr) {
        unhighlightQuotes();
        
        if (xhr.responseText === '0') {
            // all quote highlighting disabled
        } else if (xhr.responseText === '1') {
            // quote highlighting enabled only for whitelist
            highlightFromValidDomains(username);
        } else if (xhr.responseText === '2') {
            // quote highlighting enabled for all domains
            extractQuotes();
            prepareQuotes(username);
        }
    });
}

function updateUIForTrustedUntrusted() {
    for (var i = 0; i <= num_quote_ids; i++) {
        var id_string = "[id=" + i + "]";
        var block = $(id_string);
        var url = $(id_string).attr('href');
        if (url) {
            var urls = [domainFromURL(url)];
            
            // Collect all related URLs
            $(id_string).find('*').each(function(id, element) {
                var this_url = $(element).attr('href');
                if (this_url) {
                    urls.push(domainFromURL(this_url));
                }
            });
            
            var trusted = false;
            var untrusted = false;
            for (var jdx = 0; jdx < urls.length; jdx++) {
                for (var idx = 0; idx < trusted_sources.length; idx++) {
                    if (urls[jdx] == trusted_sources[idx]) {
                        trusted = true;
                    }
                }
                
                for (var idx = 0; idx < untrusted_sources.length; idx++) {
                    if (urls[jdx] == untrusted_sources[idx]) {
                        untrusted = true;
                    }
                }
            }
            
            var suffix = 'normal';
            if (trusted) {
                suffix = 'trusted';
            } else if (untrusted) {
                suffix = 'untrusted';
            }
            
            // console.log(urls);
            console.log(suffix);
            
            /* Set all the background colors if needed. */
            var quote = $(id_string);
            quote.find('.tooltip').each(function(idx, element) {
                $(element).removeClass('tooltip-normal tooltip-trusted tooltip-untrusted').addClass('tooltip-' + suffix);
            });
            
            quote.find('.dropdown').each(function(idx, element) {
                $(this).removeClass('dropdown-normal dropdown-trusted dropdown-untrusted').addClass('dropdown-' + suffix);
            });
        }
    }
}

function requestTrustedSources(username) {
    var URL = "https://quotedserver.herokuapp.com/lookup/gettrustedsources/";
    xhttprequest(URL, username, function(xhr) {
        trusted_sources = JSON.parse(xhr.responseText);
        
        requestUntrustedSources(username);
    });
}

function requestUntrustedSources(username) {
    var URL = "https://quotedserver.herokuapp.com/lookup/getuntrustedsources/";
    xhttprequest(URL, username, function(xhr) {
        untrusted_sources = JSON.parse(xhr.responseText);
        
        updateUIForTrustedUntrusted();
        
        requestHighlightingState(username);
    });
}

/*
 * We want to listen for messages back from the background script about the user.
 */
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        var task = request.task;
        console.log(request);
        
        if (task === 'toggle') {
            toggleDomain(request.user);
        } else if (task === 'signout') {
            unhighlightQuotes();
        } else if (task === 'usernamerequest' || task === 'signin') {
            requestTrustedSources(request.user);
        } else if (task === 'nouser') {
            console.log("NO LOGGED IN USER!!");
        }
    }
);

/* #############################################################################
 * The control flow is something like this:
 * - request username -> get response from background script with user info
 * - request highlighting status (are we doing any highlighting at all, or are
 *   we highlighting just domains on a whitelist?) from heroku
 * - depending on the user's highlighting state, refresh the status of the page
 * ###########################################################################*/
requestUsername();
// #############################################################################
