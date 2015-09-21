// ==UserScript==
// @name        HUGELOL Tools
// @namespace   hl-2015-07-24@daud.de.su
// @description HUGELOL extra functionality
// @include     https://*hugelol.com/*
// @include     http://*hugelol.com/*
// @version     1
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// ==/UserScript==


GM_addStyle(".gmhl-collapsed-item { min-height: 0px !important; padding: 0px !important; }");

if ( !('bot-lists' in localStorage) )
    localStorage['bot-lists'] = "https://dl.dropboxusercontent.com/u/4398956/botlist.txt";

var bots  = (localStorage['bots'] || '').split(',');
var lists = (localStorage['bot-lists'] || '').split(',');

console.log(unsafeWindow.jQuery);

function log(x) { console.log(x); return x; }

function get(url, type = "text/html")
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
                            if (type == "text/plain")
                                resolve(res.responseText)
                            else
                            {
                                var doc=parser.parseFromString(res.responseText,"text/html");
                                resolve(doc);
                            }
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
                  alert(msg);
                    reject(Error(msg));
                }
            });
    });
}

function dim(item) { item.style.opacity = '0.2'; }

function getRight(user)
{
    var right = user; do { right = right.parentElement; } while(right && !right.classList.contains('right'));
    return right || null;
}

function downvote(user)
{
    var right = getRight(user);
    if (!right) return;
    var button = right.querySelector('.vote-button.hate');
    //console.log("button:", button);
    if (!button.classList.contains('active'))
    {
        if(document.createEvent)
        {
            var click = document.createEvent("MouseEvents");
            click.initMouseEvent("click", true, true, window,
            0, 0, 0, 0, 0, false, false, false, false, 0, null);
            button.dispatchEvent(click);
            button.focus();
        }else if(document.documentElement.fireEvent)
        {
            button = document.getElementById("test");
            button.fireEvent("onclick");
            button.focus();
        }
    }
}

function collapseDownvoted(user)
{
    var right = getRight(user);
    if (right && right.querySelector('.vote-button.hate.active') != null)
    {
        var usernode = user.parentElement; usernode.innerHTML = '<span style="">' + user.innerHTML + '</span>';
        var title = right.querySelector('.title'); var p = title.parentElement; p.innerHTML = title.innerHTML; title = p;
        title.style.fontSize = '18px'; title.style.color = '#222'; title.style.lineHeight = '1.1';
        var div = right.parentElement; //document.createElement("div");
        div.innerHTML = title.outerHTML + '<span style="float:right">' + usernode.outerHTML + '</span>';
        div.classList.add('gmhl-collapsed-item'); //div.setAttribute('class', 'item jump gmhl-collapsed-item');
        dim(div);
        //right.parentElement.parentElement.replaceChild(div, right.parentElement);
    }
}

function checkBots ()
{
    var do_collapse = !!localStorage['gmhl-collapsedownvoted'];
    var do_hatebots = !!localStorage['gmhl-hatebots'];

    var usernames = document.querySelectorAll('.username');
    for (var i = 0; i < usernames.length; i++)
        {
            var user = usernames[i].textContent.trim().toLowerCase();
            if (bots.indexOf(user) < 0) continue;

            var item = usernames[i];
            do { item = item.parentElement; } while (item && !item.classList.contains('item'));
            dim(item);

            if (do_hatebots)
            try { downvote(usernames[i]); } catch(e) { console.log(e); }
            if (i >= usernames.length - 1) return;
            if (do_collapse)
            try { collapseDownvoted(usernames[i]); } catch(e) { console.log(e); }
        }
}

function appendToList(coll)
{
    for (var i = 0; i < coll.length; i++)
    {
        var x = coll[i].toLowerCase();
        if (bots.indexOf(x) < 0)
            bots.push(x);

    }
    localStorage['bots'] = bots;
}

function steamGet(url)
{
    log('loading: ' + url);
    get(url)
        .then(function(doc)
            {
                // document.body.innerHTML = doc.body.innerHTML;
                var br_to_sep = function(x){ x.parentElement.replaceChild(doc.createTextNode(';'), x) }
                var op_content = doc.querySelector('.forum_op .content');
                Array.prototype.slice.apply(op_content.querySelectorAll('br')).forEach(br_to_sep);
                var bots = op_content.textContent
                                 .trim()
                                 .toLowerCase()
                                 .replace(/[\n\r]+/, ';')
                                 .split(';')
                                 .filter(function(x){ return x; })
                                 ;
                appendToList(bots);
                log(bots);
            })
        .catch(log);
}

function textGet(url)
{
    log('loading: ' + url);
    get(url, 'text/plain')
        .then(function(doc)
            {
                var bots = doc.split('\n');
                appendToList(bots);
                log(bots);
            })
        .catch(log);
}


// Access Bot Lists
function accessBotLists(lists)
{
    // log(lists);
    for (var i = 0; i < lists.length; i++)
    {
        if (lists[i].indexOf('steamcommunity.com') > 0)
            steamGet(lists[i]);
        else
            textGet(lists[i]);
    }
}
accessBotLists(lists);


// Cancel any and all block request
Array.prototype.slice.apply(document.querySelectorAll('.status.orange a[href*="&ignore=0"]'))
    .forEach(function(x)
        {
            var iframe = document.createElement('iframe');
            iframe.src = x.href;
            iframe.style.height = '1px';
            iframe.style.opacity = '0.0';
            document.body.appendChild(iframe);
            get(x.href);
            var p = x.parentNode.parentNode;
            p.parentNode.removeChild(p);
        });


// Settings Box
function createOptions(id, name, description, options)
{
    var ret = 
    '<div class="field" id="' + id + '" style="cursor: auto;">' +
        '<div class="description">' + name + '</div>' +
        '<div class="right-description">' + description +
            '<div>';
    for (var i = 0; i < options.length; i++)
        ret +=
        '<div>' + 
            '<input id="' + id + i + '" type="radio" value="' + i + '" name="' + id + '"></input>' +
            '<label class="label" for="' + id + i + '">' + options[i] + '</label>' +
        '</div>';
    ret +=
            '</div>' +
        '</div>' +
    '</div><br style="clear: both;"></br><br style="clear: both;"></br>'
    ;
    return ret;
}

var settings = document.querySelector('.box.settings');
if (settings)
{
    var do_collapse = !!localStorage['gmhl-collapsedownvoted'];
    var do_hatebots = !!localStorage['gmhl-hatebots'];

    var menuitem = document.createElement('a');
    menuitem.setAttribute('class', 'option');
    menuitem.innerHTML = '<span class="preferences" style="background: transparent url(\'http://hugelol.com/css/sprite_v4.png\') no-repeat scroll -466px -129px;"></span> HL Tools Settings';
    settings.appendChild(menuitem);
    menuitem.addEventListener('click', function()
    {
        document.querySelector('.settings.box > .active').classList.remove('active')
        menuitem.classList.add('active');

        document.querySelector('h2').textContent = "HL Tools Settings";
        document.querySelector('.body').innerHTML = 
            '<label><div class="field">' +
            '<div class="description">Sources</div><textarea id="gmhl-blocklist" name="gmhl-blocklist" class="blue" onfocus="$(\'#gmhl-blocklist-info\').css(\'visibility\', \'visible\');" onblur="$(\'#gmhl-blocklist-info\').css(\'visibility\', \'hidden\');" maxlength="180"></textarea>' +
            '<br style="clear: both;">' +
            '<p class="info hide" id="gmhl-blocklist-info">Please enter your blocklist URLs here! Currently Steam Forums topics and remote text files are supported. I suggest using a public plain text file on your Dropbox account.</p>' + 
            '</div></label>' +

            createOptions('gmhl-collapse-downvoted', 'Collapse downvoted',
                          'Collapse bot posts you already downvoted to just the title and the username, to make things a bit more tidy',
                          ['Keep visible', 'Collapse']) +

            createOptions('gmhl-hate-bots', 'Auto downvote',
                          'Automatically downvote ("<i>hate</i>") all of the bot posts as they appear',
                          ['Let me do it', 'Downvote all!']) +
            '';


        var gmhl_blocklist = document.getElementById('gmhl-blocklist');
        gmhl_blocklist.value = lists.join('\n');

        document.getElementById('gmhl-collapse-downvoted' + (do_collapse ? '1' : '0')).checked = true;
        document.getElementById('gmhl-hate-bots' + (do_hatebots ? '1' : '0')).checked = true;

        document.getElementById('submit-container').innerHTML = 
        '<a href="javascript:void(0);" id="gmhl-pref-reset">Restore default preferences</a>' +
        '<a href="javascript:void(0);" id="gmhl-save" class="btn input flr">Save Preferences</a>' +
        '<br style="clear: both;">';
        
        document.getElementById('gmhl-pref-reset').addEventListener('click', function()
        {
            bots  = [];
            lists = [];
            localStorage['bots']      = '';
            localStorage['bot-lists'] = "https://dl.dropboxusercontent.com/u/4398956/botlist.txt";

            gmhl_blocklist.value = '';
            localStorage['gmhl-collapsedownvoted'] = '';
            localStorage['gmhl-hatebots'] = '';
        });

        document.getElementById('gmhl-save').addEventListener('click', function()
        {
            lists = gmhl_blocklist.value.split('\n');
            localStorage['bot-lists'] = lists;
            localStorage['gmhl-collapsedownvoted'] = document.getElementById('gmhl-collapse-downvoted1').checked ? '1' : '';
            localStorage['gmhl-hatebots']          = document.getElementById('gmhl-hate-bots1'         ).checked ? '1' : '';

        });
    });
}


// check for bots and run auto-scan
checkBots();
var target  = document.getElementById('stream');
var inspect = document.getElementById('stream-append');
var observer = new MutationObserver(function(mutations) {
  for (var i = 0; i < mutations.length; i++)
    if (mutations[i].target == inspect)
      checkBots();
});
observer.observe(target, { childList: true, subtree: true });
