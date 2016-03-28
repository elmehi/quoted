//var temptext = document.body.innerHTML.replace(new RegExp(" the ", "g"), " apples ");
//var notags = document.body.innerHTML.split(new RegExp("<[^>]+>", "g"));
//


// For curly quotes: replace all instances with "This is a quote" and pop-up the quotes individually
//var curlyq =  document.body.innerHTML.match(new RegExp("“[^“]+”","g"));
//document.body.innerHTML = document.body.innerHTML.replace(new RegExp("“[^“]+”","g"), "THIS IS A QUOTE");
//for (i = 0; i < curlyq.length; i++) {
//window.alert(curlyq[i]);
//}

var html = document.body.innerHTML;
var idx = html.length;
var nest_level = 0
var in_quote = false
var quotes = [];
var current_quote = ""
for (var idx = 0; idx < html.length; idx++) {
    if (html[idx] == '“') {
        in_quote = true;
    } else if (html[idx] == '”') {
        in_quote = false
        if (nest_level == 0) {
            quotes.push(current_quote + "\"");
            current_quote = "";
        }
    }
    
        
    if (nest_level == 0) {
        if (in_quote) {
            if (html[idx] != '“') {
                current_quote += html[idx];
            } else {
                current_quote += '\"';
            }
        } else {
            
        }
    }
    
    if (!in_quote) {
        if (html[idx] === '<') {
            nest_level++;
        } else if (html[idx] === '>') {
            nest_level--;
        }
    }
}

var s = ""
for (q in quotes) {
    s += 'Quote ';
    s += q + ': ';
    s += quotes[q];
    s += '\n';
}

alert(s);

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
