//var temptext = document.body.innerHTML.replace(new RegExp(" the ", "g"), " apples ");
//var notags = document.body.innerHTML.split(new RegExp("<[^>]+>", "g"));
//


// For curly quotes: replace all instances with "This is a quote" and pop-up the quotes individually
//var curlyq =  document.body.innerHTML.match(new RegExp("“[^“]+”","g"));
//document.body.innerHTML = document.body.innerHTML.replace(new RegExp("“[^“]+”","g"), "THIS IS A QUOTE");
//for (i = 0; i < curlyq.length; i++) {
//window.alert(curlyq[i]);
//}

var start_tag = '<a style="text-decoration: none;" href="__URL__">' +
'<span class="tooltip tooltip-top" data-tooltip-top="__SOURCE__">' + 
'<span class="tooltip tooltip-middle" data-tooltip-middle="__DATE__">' +
'<span class="tooltip tooltip-bottom" data-tooltip-bottom="&quot;__ARTICLE_TITLE__&quot;">';
var end_tag = '</span></span></span></a>';

// http://stackoverflow.com/questions/247483/http-get-request-in-javascript

function retrieveQuote(quote) {
    // TODO
    url = 'http://www.google.com/'; // TODO
    // TODO
    
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
        responseReceived(xmlHttp.responseText, quote);
    }
    xmlHttp.open("GET", url, true); // true for asynchronous 
    xmlHttp.send(null);
}

function responseReceived(text, quote) {
    console.log("Response for quote (" + quote + "): " + text);
}

// http://stackoverflow.com/questions/25742862/find-and-replace-text-inside-quotes-ignoring-html-tags
// var p = $("p").contents().filter(function (i, el) {
//    return el.nodeType === 3;
// })

// var news = $("html").html()
//             .replace(/(["\u201C])([^"\u201D]+)(["\u201D])(.*)/g, start_tag + '$1$2$3' + end_tag + '$4');
// $(news).replaceWith(news);

var quote_dict;
var quotes = [];
$("p").contents().filter(function (i, el) {
    return el.nodeType === 3; // THIS MEANS THE CONTENTS ARE TEXT
}).each(function (i, el) {
    var matches = $(el).text().match(/(["\u201C])([^"\u201D]+)(["\u201D])/g);
    if (matches != null) {
        for (var idx in matches) {
            if (matches[idx].length > 0) {
                quotes.push(matches[idx]); 
            }
        }
    }
})

$("div").contents().filter(function (i, el) {
    return el.nodeType === 3; // THIS MEANS THE CONTENTS ARE TEXT
}).each(function (i, el) {
    var matches = $(el).text().match(/(["\u201C])([^"\u201D]+)(["\u201D])/g);
    if (matches != null) {
        for (var idx in matches) {
            if (matches[idx].length > 0) {
                quotes.push(matches[idx]); 
            }
        }
    }
})

function reload(response) {
    // console.log(quote);
    // console.log(response);
    var quote = response['quote'];
    
    $("p").contents().filter(function (i, el) {
       return el.nodeType === 3; // THIS MEANS THE CONTENTS ARE TEXT
    }).each(function (i, el) {
        if ($(el).text().length) {
            var start_tag_populated = start_tag;
            start_tag_populated = start_tag_populated.replace('__URL__', response['url']);
            start_tag_populated = start_tag_populated.replace('__DATE__', response['date']);
            start_tag_populated = start_tag_populated.replace('__SOURCE__', response['source']);
            start_tag_populated = start_tag_populated.replace('__ARTICLE_TITLE__', response['article_title']);
            
            var replaced = $(el).text().replace(quote, start_tag_populated + quote + end_tag);
            if ($(el).text() !== replaced) {
                $(el).replaceWith(replaced);
            } 
        }
    })

    $("div").contents().filter(function (i, el) {
       return el.nodeType === 3; // THIS MEANS THE CONTENTS ARE TEXT
    }).each(function (i, el) {
        if ($(el).text().length) {
            var replaced = $(el).text().replace(quote, start_tag + quote + end_tag);
                
            if ($(el).text() !== replaced) {
                $(el).replaceWith(replaced);
            } 
        }
    })
}

// console.log(quotes);
// for (var idx in quotes) {
//     var quote = quotes[idx];
//     var xhr = new XMLHttpRequest();
//     var URL = "https://quotedserver.herokuapp.com/lookup/change+the+meaning+of+a+picture+by+framing+it+differently,/results/";
//     // var escaped = quote.replace(/ /g, '+');
//     // escaped = escaped.substring(1, escaped.length - 1);
//     xhr.open("GET", "https://google.com/", true);
//     console.log(URL);
//     xhr.onreadystatechange = function () {
//         console.log(xhr.readyState);
//         console.log(xhr.responseText);
//         var response = '{' +
//                         '"url": "http://www.theatlantic.com/entertainment/archive/2016/03/directors-without-borders/475122/", ' +
//                         '"article_title": "Directors Without Borders", ' + 
//                         '"source": "The Atlantic", ' +
//                         '"date": "January 16, 2016 1:30 EST"' + 
//                         '}';
//         reload(quote, JSON.parse(response));
//         
//         // if (xhr.readyState === 4) {
//         //     if (xhr.status === 200) {
//         //         console.log(xhr.responseText);
//         //     } else {
//         //         console.error(xhr.statusText);
//         //     }
//         // }
//     };
//     xhr.onerror = function (e) {
//         console.error(xhr.statusText);
//     };
//     xhr.send(null);
// }

// function domainFromURL(url) {
//     var domain;
//     if (url.indexOf('://') == -1) {
//         domain = url.split('/')[0];
//     } else {
//         domain = url.split('/')[2];
//     }
//     
//     return domain;
// }
// 
// // console.log(quotes);
for (var idx in quotes) {
    var quote = quotes[idx];
    var xhr = new XMLHttpRequest();
    var URL = "https://quotedserver.herokuapp.com/lookup/__/results/";
    var escaped = quote.replace(/ /g, '+');
    escaped = escaped.substring(1, escaped.length - 1);
    URL = URL.replace('__', escaped);
    console.log(URL);
    xhr.onreadystatechange = function (e) {
        // var response = '{' +
        //                 '"url": "http://www.theatlantic.com/entertainment/archive/2016/03/directors-without-borders/475122/", ' +
        //                 '"article_title": "Directors Without Borders", ' + 
        //                 '"source": "The Atlantic", ' +
        //                 '"date": "January 16, 2016 1:30 EST"' + 
        //                 '}';
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
                var JSON_object = JSON.parse(xhr.responseText);
                JSON_object['date'] = xhr.getResponseHeader('Last-Modified');
                JSON_object['source'] = domainFromURL(JSON_object['url']);
                reload(JSON_object);
            } else {
                console.error(xhr.statusText);
            }
        }
    };
    xhr.onerror = function (e) {
        console.error(xhr.statusText);
    };
    xhr.open("GET", URL, true);
    xhr.send(null);
    break;
}

// console.log(quotes);

// $("p").contents().filter(function (i, el) {
//    return el.nodeType === 3; // THIS MEANS THE CONTENTS ARE TEXT
// }).each(function (i, el) {
//     if ($(el).text().length) {
//         var replaced = $(el).text()
//             .replace(/(["\u201C])([^"\u201D]+)(["\u201D])(.*)/g, start_tag + '$1$2$3' + end_tag + '$4');
//             
//         if ($(el).text() !== replaced) {
//             $(el).replaceWith(replaced);
//         } 
//     }
// })
// 
// $("div").contents().filter(function (i, el) {
//    return el.nodeType === 3; // THIS MEANS THE CONTENTS ARE TEXT
// }).each(function (i, el) {
//     if ($(el).text().length) {
//         var replaced = $(el).text()
//             .replace(/(["\u201C])([^"\u201D]+)(["\u201D])(.*)/g, start_tag + '$1$2$3' + end_tag + '$4');
//             
//         if ($(el).text() !== replaced) {
//             $(el).replaceWith(replaced);
//         } 
//     }
// })

// var minimum_length = 4;
// var str = document.body.innerHTML;
// 
// var nest_level = 0
// var in_quote = false, in_script = false, start_p = false, close_p = false, end_p = false;
// var quotes = [];
// var current_quote = ""
// var injected_start = false, injected_end = false;
// var start_tag = "<a style=\"text-decoration: none;\" href=\"http://www.nytimes.com/\"><span class=\"tooltip tooltip-top\" data-tooltip-top=\"New York Times\"><span class=\"tooltip tooltip-bottom\" data-tooltip-bottom=\"June 15, 2015\">";
// var end_tag = "</span></span></a>";
// for (var idx = 0; idx < str.length; idx++) {
//     if (injected_start) {
//         injected_start = false;
//         idx += start_tag.length;
//     }
//     
//     if (injected_end) {
//         injected_end = false;
//         idx += end_tag.length;
//     }
//     
//     // if (str.substring(idx, idx + 26) == 'The hijacker has just been') {
//     //     console.log('NEST LEVEL: ' + nest_level + ' ' + str.substring(idx - 5, idx + 30));
//     // }
//     
//     if ((str[idx] == '”') && in_quote) {
//         // console.log('----- (' + in_script + ')' + nest_level + ' ' + str.substring(idx - 5, idx + 30));
//         in_quote = false
//          if (nest_level == 0) {
//             str = str.substr(0, idx) + end_tag + str.substr(idx);
//             injected_end = true;
//             if (current_quote.split(' ').length >= minimum_length) {
//                 quotes.push(current_quote + "\"");
//             }
//             current_quote = "";
//          }
//          
//         //  console.log(current_quote);
//     }
//     
//     if (in_quote) {
//         current_quote += str[idx];
//     }
//     // if (str.substring(idx, idx + 7) === '<script') {
//     //     // console.log(str.substring(idx - 5, idx + 5));
//     //     // console.log(current_quote);
//     //     in_script = true;
//     // }
//     if (!in_quote) {
//         // if (str.substring(idx, idx + 1) === '<') {
//         //     // console.log(str.substring(idx - 5, idx + 5));
//         //     in_script = true;
//         // } else if (str.substring(idx, idx + 9 === '</script>')) {
//         //     // console.log('&&&&&&&&&&&&&&');
//         //     in_script = false;
//         // } 
//         
//         if (!in_script) {
//             if (str[idx] === '<') {
//                 // If we've just injected the end tag, we'll see the opening bracket
//                 //  of the tag before the closing quote, so we need to ignore it
//                 if (!injected_end) {
//                     nest_level++;
//                 }
//             } else if (str[idx] === '>') {
//                 nest_level--;
//             }
//         }
//     }
//     
//     // Are we entering a new quote?
//     if ((str[idx] == '“') && !in_quote) {
//         // console.log('+++++ (' + in_script + ')' + nest_level + ' ' + str.substring(idx - 5, idx + 30));
//         in_quote = true;
//         if (nest_level == 0) {
//             str = str.substr(0, idx + 1) + start_tag + str.substr(idx + 1);
//             injected_start = true;
//         }
//     } 
// }
// 
// document.body.innerHTML = str;
// 
// var s = ""
// for (q in quotes) {
//     s += 'Quote ';
//     s += q + ': ';
//     s += quotes[q];
//     s += '\n';
// }

// alert(s);

// var match, location, beg, end;
// var lastClosedTag = 0;
// var inTag = false;
// var validQuote = true;
// quotereg = new RegExp("\"[^\"]+\"","g");
// 
// 
// while (match = quotereg.exec(document.body.innerHTML)) {
//     beg = match.index;
//     end = match.index + match[0].length
//     validQuote = true;
//     for (i = lastClosedTag; i < beg; i++) {
//         if (document.body.innerHTML.charAt(i)=='<') inTag = true;
//         else if (document.body.innerHTML.charAt(i)=='>') {
//             inTag = false;
//             lastClosedTag = i + 1;
//             }
//         }
//     if (inTag) validQuote = false;
//         for (i = beg; i <= end; i++) {
//             if (document.body.innerHTML.charAt(i)=='<') inTag = true;
//             else if (document.body.innerHTML.charAt(i)=='>') {
//                 inTag = false;
//                 lastClosedTag = i + 1;
//                 }
//             }
//     if (inTag) validQuote = false;
//     if(validQuote) window.alert(match[0]);
//     }
