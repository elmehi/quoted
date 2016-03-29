//var temptext = document.body.innerHTML.replace(new RegExp(" the ", "g"), " apples ");
//var notags = document.body.innerHTML.split(new RegExp("<[^>]+>", "g"));
//


// For curly quotes: replace all instances with "This is a quote" and pop-up the quotes individually
//var curlyq =  document.body.innerHTML.match(new RegExp("“[^“]+”","g"));
//document.body.innerHTML = document.body.innerHTML.replace(new RegExp("“[^“]+”","g"), "THIS IS A QUOTE");
//for (i = 0; i < curlyq.length; i++) {
//window.alert(curlyq[i]);
//}

var start_tag = '<a style="text-decoration: none;" href="http://www.nytimes.com/">' +
                '<span class="tooltip tooltip-top" data-tooltip-top="June 15, 2015">' + 
                '<span class="tooltip tooltip-middle" data-tooltip-middle="The New York Times">' +
                '<span class="tooltip tooltip-bottom" data-tooltip-bottom="&quot;Trump Wins the Presidency&quot;">';
var end_tag = '</span></span></span></a>';

// http://stackoverflow.com/questions/25742862/find-and-replace-text-inside-quotes-ignoring-html-tags
$("p").contents().filter(function (i, el) {
   return el.nodeType === 3;
}).each(function (i, el) {
    var replaced = $(el).text().replace(/"([^"]* [^"]* [^"]* [^"]*?)"/g, start_tag + '"$1"' + end_tag);
    if ($(el).text() !== replaced) {
        $(el).replaceWith(replaced);
    }
})

$("p").contents().filter(function (i, el) {
   return el.nodeType === 3;
}).each(function (i, el) {
    var replaced = $(el).text().replace(/\u201C([^\u201D]* [^\u201D]* [^\u201D]* [^\u201D]*?)\u201D/g, start_tag + '\u201C$1\u201D' + end_tag);
    if ($(el).text() !== replaced) {
        $(el).replaceWith(replaced);
    }
})

$("p").contents().filter(function (i, el) {
   return el.nodeType === 3;
}).each(function (i, el) {
    var replaced = $(el).text().replace(/"([^\u201D]* [^\u201D]* [^\u201D]* [^\u201D]*?)\u201D/g, start_tag + '"$1\u201D' + end_tag);
    if ($(el).text() !== replaced) {
        $(el).replaceWith(replaced);
    }
})

$("div").contents().filter(function (i, el) {
   return el.nodeType === 3;
}).each(function (i, el) {
   var replaced = $(el).text().replace(/\u201C([^\u201D]* [^\u201D]* [^\u201D]* [^\u201D]*?)\u201D/g, start_tag + '\u201C$1\u201D' + end_tag);
   if ($(el).text() !== replaced) {
       $(el).replaceWith(replaced);
   }
})

$("div").contents().filter(function (i, el) {
   return el.nodeType === 3;
}).each(function (i, el) {
    var replaced = $(el).text().replace(/"([^"]* [^"]* [^"]* [^"]*?)"/g, start_tag + '"$1"' + end_tag);
    if ($(el).text() !== replaced) {
        $(el).replaceWith(replaced);
    }
})

$("div").contents().filter(function (i, el) {
   return el.nodeType === 3;
}).each(function (i, el) {
    var replaced = $(el).text().replace(/"([^\u201D]* [^\u201D]* [^\u201D]* [^\u201D]*?)\u201D/g, start_tag + '"$1\u201D' + end_tag);
    if ($(el).text() !== replaced) {
        $(el).replaceWith(replaced);
    }
})

// console.log($("p"));


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
