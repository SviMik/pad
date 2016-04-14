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
    var messageLenghtLimit = 5000;
    var messageNumLinesLimit = 5;
    
    function getOption(name) {
        if (!options.hasOwnProperty(name)) {
            var storageValue = (typeof(window.localStorage)=="undefined") ? null : localStorage.getItem('chatEnhancements_' + name);
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
        if(typeof(window.localStorage)=="undefined"){return;}
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
        if (lastChatEntryBoxText != chatEntryBox.val()) {
            if (checkMessageRestrictions($.trim(chatEntryBox.val()))) {
                chatEntryBox.css('outline', '');
                chatEntryBox.css('border', '');
            }
            else {
                chatEntryBox.css('outline', 'none');
                chatEntryBox.css('border', '1px solid red');
            }
        }
        lastChatEntryBoxText = chatEntryBox.val();
        lastChatEntryBoxWidth = chatEntryBox.width();
    }
    
    function insertTextAtCaret(elem, text) {
        if (elem.selectionStart !== undefined) {
            var selStart = elem.selectionStart;
            var selEnd = elem.selectionEnd;
            elem.value = elem.value.substring(0, selStart) + text + elem.value.substring(selEnd, elem.value.length);
            elem.selectionStart = selStart + text.length;
            elem.selectionEnd = selStart + text.length;
        } 
        else if (document.selection) {
            elem.focus();
            document.selection.createRange().text = text;
        }
        else {
            elem.focus();
            elem.value += text;
        }
    }
    
    function checkMessageRestrictions(text) {
        return text.length <= messageLenghtLimit && text.split('\n').length <= messageNumLinesLimit;
    }

    function chatLineText(args) {
        if (getOption('HighlightQuotations')==true) {
            try {
                lines = args.html.replace(/^\s+|\s+$/g, '').split(/\r*\n|<br\s*\/?>/g);
                for (var iLine = 0; iLine < lines.length; ++iLine) {
                    var line = lines[iLine];
                    var tagIntervals = [];
                    var linkPattern = /<a [^>]*>[^<]*<\/a>/gi;
                    var tagMatch;
                    while ((tagMatch = linkPattern.exec(line)) !== null) {
                        tagIntervals.push({start: tagMatch.index, end: tagMatch.index+tagMatch[0].length-4});
                    }
                    var tagPattern = /<[^>]*>/gi;
                    while ((tagMatch = tagPattern.exec(line)) !== null) {
                        tagIntervals.push({start: tagMatch.index, end: tagMatch.index+tagMatch[0].length});
                    }
                    function isPositionInsideTag(pos) {
                        return tagIntervals.some(function (interval) {
                            return pos > interval.start && pos < interval.end;
                        });
                    }
                    var quotationPattern = /((^|<\/a>\]?\s|:|(^|[#\u2116\\\/])[Aa\u0410\u0430]?\d+\s|\[[Aa\u0410\u0430]?\d+\])\s*)((&gt;|&#62;).*)$/ig;
                    lines[iLine] = line.replace(quotationPattern, function(match, p1, p2, p3, p4, p5, offset) {
                        if (isPositionInsideTag(offset + p1.length)) {
                            return match;
                        }
                        else {
                            return p1 + '<span style="font-style:italic;color:#196906;">' + p4 + '</span>';
                        }
                    });
                }
                args.html = lines.join('<br/>');
            }
            catch (e) {
                (console.error || console.log).call(console, e);
            }
        }
    }
    
    function padCollabClientInitialized() {
        if ($('#padchat').length == 0 || typeof(window.localStorage)=="undefined") {
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
            $('#chatentrybox').keypress(function(evt) {
                if (evt.which == 13) {
                    evt.preventDefault();
                    if (!evt.ctrlKey && !evt.shiftKey) {
                        var lineText = $.trim($('#chatentrybox').val());
                        if (lineText && checkMessageRestrictions(lineText)) {
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
                    }
                }
            });
            $('#chatentrybox').keydown(function(evt) {
                if (evt.which == 13 && (evt.ctrlKey || evt.shiftKey)) {
                    evt.preventDefault();
                    insertTextAtCaret($('#chatentrybox')[0], '\n');
                    adjustChatEntryBox();
                }
            });
            $('#chatentrybox').bind('input propertychange', adjustChatEntryBox);
            setInterval(adjustChatEntryBox, 500);
            padchat.scrollToBottom();
        }
    }
}

chatEnhancements = new chatEnhancementsInit();
