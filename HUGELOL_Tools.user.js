// ==UserScript==
// @name        HUGELOL Tools
// @namespace   hl-2015-07-24@daud.de.su
// @description HUGELOL extra functionality
// @include     https://*hugelol.com/*
// @include     http://*hugelol.com/*
// @version     1
// @grant       GM_xmlhttpRequest
// ==/UserScript==

function log(x) { console.log(x); return x; }

function get(url)
{
    return new Promise(function(resolve, reject)
    {
        GM_xmlhttpRequest(
            {
                method: "GET",
                url: url,
                onload: function(res)
                    {
                        if (res.status >= 200 && res.status < 400)
                        {
                          var parser=new DOMParser();
                          var doc=parser.parseFromString(res.responseText,"text/html");
                          resolve(doc);
                        }
                        else
                          reject(Error(res.status));
                    },
                onerror: function(res) {
                  var msg = "An error occurred."
                      + "\nresponseText: " + res.responseText
                      + "\nreadyState: " + res.readyState
                      + "\nresponseHeaders: " + res.responseHeaders
                      + "\nstatus: " + res.status
                      + "\nstatusText: " + res.statusText
                      + "\nfinalUrl: " + res.finalUrl;
                  log(msg);
                    reject(Error(msg));
                }
            });
    });
}

BOT_LIST_URL = "http://steamcommunity.com/groups/savetheHL1234/discussions/0/541906348044637227/"

var bots = (localStorage['bots'] || '').split(',');

get(BOT_LIST_URL)
    .then(function(doc)
        {

// document.body.innerHTML = doc.body.innerHTML;
var br_to_sep = function(x){ x.parentElement.replaceChild(doc.createTextNode(';'), x) }
var op_content = doc.querySelector('.forum_op .content');
Array.prototype.slice.apply(op_content.querySelectorAll('br')).forEach(br_to_sep);
bots = op_content.textContent
                 .toLowerCase()
                 .replace(/.*lack of comment karma\.s*/, '')
                 .trim()
                 .replace(/^\s*;*\s*(.*[^;])\s*;*\s*/, '$1')
                 .split(';')
                 .filter(function(x){ return x; })
                 ;
localStorage['bots'] = bots;
console.log(bots);

  
        })
    .catch(log);

function checkBots ()
{
    var usernames = document.querySelectorAll('.username');
    for (var i = 0; i < usernames.length; i++)
        {
            var user = usernames[i].textContent.trim().toLowerCase();
            if (bots.indexOf(user) >= 0)
            {
                var item = usernames[i];
                do { item = item.parentElement; } while (item && !item.classList.contains('item'));
                // console.log(item);
                item.style.opacity = '0.2';
            }
            // console.log(user, bots.indexOf(user) < 0);
        }
}

var target  = document.getElementById('stream');
var inspect = document.getElementById('stream-append');
 
// create an observer instance
var observer = new MutationObserver(function(mutations) {
  for (var i = 0; i < mutations.length; i++)
    if (mutations[i].target == inspect)
      checkBots();
});
 
observer.observe(target, { childList: true, subtree: true });
checkBots();
