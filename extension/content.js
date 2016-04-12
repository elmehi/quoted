var load_tag = '<a id="ID" class="quote">' +
                '<span class="tooltip tooltip_bottom" data_tooltip_bottom="Loading article...">';
var load_tag_end = '</span></a>'
var start_tag = '<span class="tooltip tooltip_top" data_tooltip_top="__SOURCE__">' + 
                '<span class="tooltip tooltip_middle" data_tooltip_middle="__DATE__">' +
                '<span class="tooltip tooltip_bottom" data_tooltip_bottom="&quot;__ARTICLE_TITLE__&quot;">';
var end_tag = '</span></span></span></a>';

var id = 0;
var quote_ids = {}
$("p").contents().filter(function (i, el) {
    return el.nodeType === 3; // THIS MEANS THE CONTENTS ARE TEXT
}).each(function (i, el) {
    var replaced = $(el).text().replace(/(["\u201C])([^"\u201D]+)(["\u201D])/g, function($0, $1, $2, $3) {
        var id_to_use;
        if ($2 in quote_ids) {
            id_to_use = quote_ids[$2];
        } else {
            id++;
            quote_ids[$2] = id;
            id_to_use = id;
        }
        return $1 + load_tag.replace('ID', "" + id_to_use) + $2 + load_tag_end + $3;
    });
    if ($(el).text() !== replaced) {
        $(el).replaceWith(replaced);
    }
})

function reload(response) {
    console.log(response);
    var quote = response['quote'];
    var id_string = "[id=" + quote_ids[quote] + "]";
    var block = $(id_string);
    $(id_string).attr('href', response['url']);
    $(id_string).contents().each(function (i, el) {
        if ($(el).text().length) {
            var start_tag_populated = start_tag;
            start_tag_populated = start_tag_populated.replace('__DATE__', response['date']);
            start_tag_populated = start_tag_populated.replace('__SOURCE__', response['source']);
            start_tag_populated = start_tag_populated.replace('__ARTICLE_TITLE__', response['title']);
            
            $(el).replaceWith(start_tag_populated + quote + end_tag);
        }
    })
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

$(".quote").hover(
    function(e) {
        if (e.type === "mouseenter" && !this.working) {
            this.working = true;
            var quote = e.currentTarget.outerText;
            var test_response = '{' +
                                '"domain": "http://www.example-website.com", ' +
                                '"url": "http://www.google.com/", ' +
                                '"title": "Test Article [API Limit Reached]", ' + 
                                '"source": "Test Source", ' +
                                '"date": "January 16, 2016 1:30 EST", ' + 
                                '"quote": "' + quote + '"' +
                                '}';
            
            var xhr = new XMLHttpRequest();
            var URL = "https://quotedserver.herokuapp.com/lookup/__/results/";
            URL = URL.replace('__', quote.replace(/ /g, '+'));
            xhr.onreadystatechange = function (e) {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        var JSON_object = JSON.parse(xhr.responseText);
                        if (!('date' in JSON_object)) {
                            JSON_object['date'] = xhr.getResponseHeader('Date');
                        }
                        reload(JSON_object);
                    } else {
                        console.log(test_response);
                        reload(JSON.parse(test_response));
                    }
                }
                this.working = false;
            };
            xhr.onerror = function (e) {
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
