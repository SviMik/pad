function chatEnhancementsInit() {
    this.hooks = ['chatLineText', 'padCollabClientInitialized'];
    this.chatLineText = chatLineText;
    this.padCollabClientInitialized = padCollabClientInitialized;
    this.getOption = getOption;
    this.setOption = setOption;
    
    var defaultOptions = {
        AutoLoadMessagesOnScroll: false,
        HighlightQuotations: true,
        AutoResizeEntryBox: true
    };
    var options = {};
    
    var defaultChatEntryBoxHeight = 16;
    var lastChatEntryBoxText = '';
    var lastChatEntryBoxWidth = -1;
    
    function getOption(name) {
        if (!options.hasOwnProperty(name)) {
            var storageValue = localStorage.getItem('chatEnhancements_' + name);
            if (storageValue === null) {
                if (defaultOptions.hasOwnProperty(name)) {
                    options[name] = defaultOptions[name];
                }
                else {
                    options[name] = null;
                }
            }
            else {
                options[name] = JSON.parse(storageValue);
            }
        }
        return options[name];
    }

    function setOption(name, value) {
        options[name] = value;
        if (value === null) {
            localStorage.removeItem('chatEnhancements_' + name);
        }
        else {
            localStorage.setItem('chatEnhancements_' + name, JSON.stringify(value));
        }
    }

    function adjustChatEntryBox() {
        var chatEntryBox = $('#chatentrybox');
        var chatLines = $('#chatlines');
        var scrollBottom = chatLines.height() + chatLines.scrollTop();
        var heightChanged = false;
        if (chatEntryBox.val().indexOf(lastChatEntryBoxText) == -1 || lastChatEntryBoxWidth != chatEntryBox.width()) {
            chatEntryBox.height(defaultChatEntryBoxHeight + 'px');
            heightChanged = true;
        }
        if (chatEntryBox.innerHeight() < chatEntryBox[0].scrollHeight) {
            var height = chatEntryBox[0].scrollHeight + chatEntryBox.height() - chatEntryBox.innerHeight();
            height = Math.max(Math.min(height, $('#padchat').height()-32), defaultChatEntryBoxHeight);
            chatEntryBox.height(height + 'px');
            heightChanged = true;
        }
        if (heightChanged) {
            chatLines.css('bottom', $('#chatbottom').outerHeight() + 'px');
            chatLines.scrollTop(scrollBottom - chatLines.height());
        }
        lastChatEntryBoxText = chatEntryBox.val();
        lastChatEntryBoxWidth = chatEntryBox.width();
    }
    
    function chatLineText(args) {
        if (getOption('HighlightQuotations')==true) {
            try {
                var tagIntervals = [];
                var linkPattern = /<a [^>]*>[^<]*<\/a>/gi;
                var tagMatch;
                while ((tagMatch = linkPattern.exec(args.html)) !== null) {
                    tagIntervals.push({start: tagMatch.index, end: tagMatch.index+tagMatch[0].length-4});
                }
                var tagPattern = /<[^>]*>/gi;
                while ((tagMatch = tagPattern.exec(args.html)) !== null) {
                    tagIntervals.push({start: tagMatch.index, end: tagMatch.index+tagMatch[0].length});
                }
                function isPositionInsideTag(pos) {
                    return tagIntervals.some(function (interval) {
                        return pos > interval.start && pos < interval.end;
                    });
                }
                var quotationPattern = /((^|<\/a>\]?|:|(#|\u2116|\\|\/|^)[Aa\u0410\u0430]?\d+\s|\[[Aa\u0410\u0430]?\d+\])\s*)((&gt;|&#62;).*)($|[\r\n]|<br\s*\/?>)/ig;
                args.html = args.html.replace(quotationPattern, function(match, p1, p2, p3, p4, p5, p6, offset) {
                    if (isPositionInsideTag(offset + p1.length)) {
                        return match;
                    }
                    else {
                        return p1 + '<span style="font-style:italic;color:#196906;">' + p4 + '</span>' + p6;
                    }
                });
            }
            catch (e) {
                (console.error || console.log).call(console, e);
            }
        }
    }
    
    function padCollabClientInitialized() {
        if ($('#padchat').length == 0) {
            return;
        }
        var chatDiv = $('#chatlines');
        chatDiv.scroll(function() {
            if (getOption('AutoLoadMessagesOnScroll')==true) {
                if(chatDiv.scrollTop() < 25) {
                    padchat.loadMoreHistory();
                }
            }
        });
        if (getOption('AutoResizeEntryBox')==true) {
            $('#chatbottom').css('height', 'auto');
            $('#chatprompt').css('display', 'none');
            $('#chatentryform').css('margin-left', '2px');
            $('#chatentryform').css('margin-right', '8px');
            $('#chatentrybox').replaceWith('<textarea id="chatentrybox" placeholder="Your message"/>');
            $('#chatentrybox').css({
                'resize': 'none',
                'width': '100%',
                'height': defaultChatEntryBoxHeight + 'px',
                'min-height': defaultChatEntryBoxHeight + 'px'/*,
                'overflow': 'hidden'*/});
            padutils.bindEnterAndEscape($('#chatentrybox'), function(evt) {
                evt.preventDefault();
                var lineText = $('#chatentrybox').val();
                if (lineText) {
                    $('#chatentrybox').val('').focus();
                    adjustChatEntryBox();
                    var msg = {
                        type: 'chat',
                        userId: pad.getUserId(),
                        lineText: lineText,
                        senderName: pad.getUserName(),
                        authId: pad.getUserId()
                    };
                    pad.sendClientMessage(msg);
                    padchat.receiveChat(msg);
                    padchat.scrollToBottom();
                }
            }, null);
            $('#chatentrybox').bind('input propertychange', adjustChatEntryBox);
            setInterval(adjustChatEntryBox, 500);
            padchat.scrollToBottom();
        }
    }
}

chatEnhancements = new chatEnhancementsInit();
