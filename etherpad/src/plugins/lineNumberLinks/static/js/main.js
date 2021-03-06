function lineNumberLinksInit() {
    this.hooks = ['aceGetFilterStack', 'aceCreateDomLine', 'chatLineText', 'incorporateUserChanges', 'performDocumentApplyChangeset', 'beforeHandleKeyEventInEditor', 'padCollabClientInitialized'];
    this.aceGetFilterStack = aceGetFilterStack;
    this.aceCreateDomLine = aceCreateDomLine;
    this.chatLineText = chatLineText;
    this.incorporateUserChanges = incorporateUserChanges;
    this.performDocumentApplyChangeset = performDocumentApplyChangeset;
    this.beforeHandleKeyEventInEditor = beforeHandleKeyEventInEditor;
    this.padCollabClientInitialized = padCollabClientInitialized;
    this.onLinkClick = onLinkClick;
    this.onAnchorLinkClick = onAnchorLinkClick;
    this.jumpBackward = jumpBackward;
    this.jumpForward = jumpForward;
   
    function LinePlacement(lineNumberStrOrPlacement, lineCenterTop) {
        if (typeof lineNumberStrOrPlacement == 'object') {
            this.lineNumberStr = lineNumberStrOrPlacement.lineNumberStr;
            this.lineCenterTop = lineNumberStrOrPlacement.lineCenterTop;
        } 
        else {
            this.lineNumberStr = lineNumberStrOrPlacement;
            this.lineCenterTop = lineCenterTop;
        }
    }
    
    function BackAndForthStack() {
        var placements = [];
        var placementIndex = -1;
        
        this.add = function(placement) {
            ++placementIndex;
            placements.splice(placementIndex, placements.length, new LinePlacement(placement));
        }
        
        this.jumpBackward = function() {
            if (!this.canJumpBackward()) {
                return null;
            }
            --placementIndex;
            return new LinePlacement(placements[placementIndex]);
        }
        
        this.jumpForward = function() {
            if (!this.canJumpForward()) {
                return null;
            }
            ++placementIndex;
            return new LinePlacement(placements[placementIndex]);
        }
        
        this.canJumpBackward = function() {
            return placementIndex > 0;
        }
        
        this.canJumpForward = function() {
            return placementIndex < placements.length - 1;
        }
        
        this.clear = function() {
            placementIndex = -1;
            placements = [];
        }
        
        this.get = function() {
            if (placementIndex == -1) {
                return null;
            }
            else {
                return new LinePlacement(placements[placementIndex]);
            }
        }
    }

    var arrowDiv = null;
    var highlightDiv = null;
    var backAndForthStack = new BackAndForthStack();
    
    function getLineDivAtCursor() {
        var outerFrame = $('#padeditor #editorcontainerbox #editorcontainer iframe');
        var outerBody = outerFrame.contents().find('body#outerdocbody');
        var innerFrame = outerBody.find('iframe');
        var selection = innerFrame.contents()[0].getSelection();
        if (selection && selection.focusNode) {
            return $(selection.focusNode).closest('body#innerdocbody>div');
        }
        else {
            return null;
        }
    }
    
    function lineNumberStringToLineIndex(lineNumberStr) {
        if (window.lineRenumerator) {
            if ('Aa\u0410\u0430'.indexOf(lineNumberStr[0]) >= 0) {
                return parseInt(lineNumberStr.substring(1)) - 1;
            }
            else {
                return parseInt(lineNumberStr) + lineRenumerator.getLinesOffset() - 1;
            }
        }
        else {
            return parseInt(lineNumberStr) - 1;
        }
    }
    
    function lineIndexToLineNumberString(lineIndex) {
        lineIndex = parseInt(lineIndex);
        if (window.lineRenumerator) {
            if (lineIndex < lineRenumerator.getLinesOffset()) {
                return 'A' + (lineIndex + 1);
            }
            else {
                return lineIndex - lineRenumerator.getLinesOffset() + 1;
            }
        }
        else {
            return lineIndex + 1;
        }
    }
    
    function encodeAnchor(str) {
        return encodeURIComponent(str).replace(/'/g, '%27');
    }

    function getCurrentPlacement() {
        var outerFrame = $('#padeditor #editorcontainerbox #editorcontainer iframe');
        var scrollingElements = outerFrame.contents().find('html,body');
        var lineDiv = getLineDivAtCursor();
        if (lineDiv) {
            var lineIndex = lineDiv.parent().children().index(lineDiv);
            if (lineIndex >= 0) {
                var scrollTop = Math.max.apply(Math, scrollingElements.map(function() {return $(this).scrollTop();}));
                return new LinePlacement(lineIndexToLineNumberString(lineIndex), scrollTop - lineDiv.offset().top - lineDiv.height()/2);
            }
        }
        return null;
    }
    
    function jump(placement) {
        var currentPlacement = getCurrentPlacement();
        var lastPlacement = backAndForthStack.get();
        if (currentPlacement && currentPlacement.lineNumberStr != placement.lineNumberStr && 
                (!lastPlacement /*&& lineNumberStringToLineIndex(currentPlacement.lineNumberStr) > 0*/ || 
                lastPlacement && lastPlacement.lineNumberStr != currentPlacement.lineNumberStr)) {
            backAndForthStack.add(currentPlacement);
        }
        goToLine(placement.lineNumberStr, placement.lineCenterTop);
        currentPlacement = getCurrentPlacement();
        if (currentPlacement) {
            lastPlacement = backAndForthStack.get();
            if (!lastPlacement || lastPlacement.lineNumberStr != currentPlacement.lineNumberStr) {
                backAndForthStack.add(currentPlacement);
            }
        }
        updateButtons();
    }
    
    function jumpBackward() {
        var currentPlacement = getCurrentPlacement();
        var lastPlacement = backAndForthStack.get();
        if (lastPlacement && currentPlacement && lastPlacement.lineNumberStr != currentPlacement.lineNumberStr) {
            backAndForthStack.add(currentPlacement);
        }
        if (backAndForthStack.canJumpBackward()) {
            var placement = backAndForthStack.jumpBackward();
            goToLine(placement.lineNumberStr, placement.lineCenterTop);
        }
        else {
            var placement = backAndForthStack.get();
            if (placement) {
                goToLine(placement.lineNumberStr, placement.lineCenterTop);
            }
        }
        updateButtons();
    }
    
    function jumpForward() {
        if (backAndForthStack.canJumpForward()) {
            var placement = backAndForthStack.jumpForward();
            goToLine(placement.lineNumberStr, placement.lineCenterTop);
        }
        else {
            var placement = backAndForthStack.get();
            if (placement) {
                goToLine(placement.lineNumberStr, placement.lineCenterTop);
            }
        }
        updateButtons();
    }
    
    function goToLine(lineNumberStr, lineCenterTop) {
        var lineIndex = lineNumberStringToLineIndex(lineNumberStr);
        var outerFrame = $('#padeditor #editorcontainerbox #editorcontainer iframe');
        var outerBody = outerFrame.contents().find('body#outerdocbody');
        var innerFrame = outerBody.find('iframe');
        var innerBody = innerFrame.contents().find('body#innerdocbody');
        var lineDiv = innerBody.find('div').eq(lineIndex);
        if (lineDiv.length > 0) {
            var scrollingElements = outerFrame.contents().find('html,body');
           
            if (lineCenterTop === undefined) {
                lineCenterTop = innerFrame.offset().top - outerFrame.height()/2;
            }
            scrollingElements.scrollTop(lineCenterTop + lineDiv.offset().top + lineDiv.height()/2);
            
            var range = innerFrame.contents()[0].createRange();
            range.setStartAfter(lineDiv.find(':last')[0]);
            range.collapse(true);
            var selection = innerFrame.contents()[0].getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            if (!highlightDiv) {
                highlightDiv = $('<div id="linenumberlinkshighlight"/>').css({
                    display: 'none',
                    position: 'absolute',
                    left: '0px',
                    width: '100%',
                    backgroundColor: 'rgb(60, 137, 255)',
                    zIndex: '1',
                    pointerEvents: 'none'
                }).appendTo(outerBody);
            }
            highlightDiv.stop(true);
            highlightDiv.css({
                opacity: '0.25',
                top: (innerFrame.offset().top + lineDiv.offset().top) + 'px',
                height: lineDiv.height() + 'px',
                display: 'block'
            });
            highlightDiv.updatePadLinePosition = function() {
                var lineDiv = innerBody.find('div').eq(lineIndex);
                highlightDiv.css({
                    top: (innerFrame.offset().top + lineDiv.offset().top) + 'px',
                    height: lineDiv.height() + 'px',
                });
            }
            var animationId = {};
            highlightDiv.animationId = animationId;
            setTimeout(function() {
                if (highlightDiv.animationId === animationId) {
                    highlightDiv.animate({opacity: '0'}, {duration: 300, complete: function() {highlightDiv.css('display', 'none')}});
                }
            }, 2000);
        }
    }

    function onLinkClick(event, lineNumberStr) {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
        if (event && event.stopPropagation) {
            event.stopPropagation();
        }
        jump({lineNumberStr: lineNumberStr});
    }
    
    function onAnchorLinkClick(event, encodedAnchor) {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
        if (event && event.stopPropagation) {
            event.stopPropagation();
        }
        var anchor = decodeURIComponent(encodedAnchor).toLowerCase();
        var lines =  window.padeditor.ace.exportText().split('\n');
        var lineIndexWithAnchor = -1;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim().toLowerCase();
            var indexOfAnchor = line.indexOf(anchor);
            if (indexOfAnchor >= 0 && line.replace(/\[\[[^\[\]]*\]\]/g, '').indexOf(anchor) >= 0) {
                if (indexOfAnchor == 0) {
                    lineIndexWithAnchor = i;
                    break;
                }
                if (lineIndexWithAnchor == -1) {
                    lineIndexWithAnchor = i;
                }
            }
        }
        if (lineIndexWithAnchor >= 0) {
            jump({lineNumberStr: lineIndexToLineNumberString(lineIndexWithAnchor)});
        }
    }
        
    /*function aceInitInnerdocbodyHead(args) {
        args.iframeHTML.push('\'<link rel="stylesheet" type="text/css" href="/static/css/plugins/lineNumberLinks/pad.css"/>\'');
    }*/

    function incorporateUserChanges(args) {
        if (highlightDiv && highlightDiv.updatePadLinePosition) {
            highlightDiv.updatePadLinePosition();
        }
    }

    function performDocumentApplyChangeset(args) {
        if (highlightDiv && highlightDiv.updatePadLinePosition) {
            highlightDiv.updatePadLinePosition();
        }
    }
    
    function aceGetFilterStack(args) {
        return [getLineNumberLinkFilter(args.linestylefilter)];
    }

    function aceCreateDomLine(args) {
        if (args.cls.indexOf('linenumberlink') >= 0) {
            var lineNumber = null;
            cls = args.cls.replace(/linenumberlink:([Aa\u0410\u0430]?\d+)/g, function(text, linktext) {
                lineNumber = linktext;
                return "linenumberlink";
            });
            if (lineNumber != null) {
                if ('Aa\u0410\u0430'.indexOf(lineNumber[0]) >= 0) {
                    lineNumber = 'A'+lineNumber.substring(1);
                }
                return [{
                    cls: cls,
                    extraOpenTags: '<a href="javascript:void(0)" onclick="top.lineNumberLinks.onLinkClick(event, \'' + lineNumber + '\', true);return false;">',
                    extraCloseTags: '</a>'
                }];
            }
        }
        else if (args.cls.indexOf('lineanchorlink') >= 0) {
            var encodedAnchor = null;
            cls = args.cls.replace(/lineanchorlink:([%a-zA-Z0-9\-_.!~*'()]+)/g, function(text, linktext) {
                encodedAnchor = linktext;
                return "lineanchorlink";
            });
            if (encodedAnchor != null) {
                return [{
                    cls: cls,
                    extraOpenTags: '<a href="javascript:void(0)" onclick="top.lineNumberLinks.onAnchorLinkClick(event, \'' + encodedAnchor + '\', true);return false;">',
                    extraCloseTags: '</a>'
                }];
            }
        }
    }
    
    function chatLineText(args) {
        var tagIntervals = [];
        var tagPattern = /<a [^>]*>[^<]*<\/a>/gi;
        var tagMatch;
        while ((tagMatch = tagPattern.exec(args.html)) !== null) {
            tagIntervals.push({start: tagMatch.index, end: tagMatch.index+tagMatch[0].length});
        }
        var tagPattern = /<[^>]*>/gi;
        while ((tagMatch = tagPattern.exec(args.html)) !== null) {
            tagIntervals.push({start: tagMatch.index, end: tagMatch.index+tagMatch[0].length});
        }
        function isPositionInsideTag(pos) {
            try{ // IE8 can't do that
                return tagIntervals.some(function (interval) {
                    return pos > interval.start && pos < interval.end;
                });
            }catch(e){return false;};
        }

        var lineNumberPattern;
        if (window.lineRenumerator) {
            lineNumberPattern = /(^|<br\s*\/?>|[#\u2116\n\\\/\[])([Aa\u0410\u0430]?\d+)|\[\[([^\[\]]+)\]\]/ig;
        }
        else {
            lineNumberPattern = /(^|<br\s*\/?>|[#\u2116\n\\\/\[])(\d+)|(\[\[[^\[\]]+\]\])/ig;
        }
        args.html = args.html.replace(lineNumberPattern, function (match, part1, part2, part3, offset) {
            if (!isPositionInsideTag(offset)) {
                if (part3) {
                    var encodedAnchor = encodeAnchor(part3);
                    return '[[<a href="javascript:void(0)" onclick="top.lineNumberLinks.onAnchorLinkClick(event, \''+encodedAnchor+'\', true);return false;">'+part3+'</a>]]';
                }
                else if (part1=='[' && args.html.charAt(offset+match.length)==']' || 
                    part1!='[' && args.html.substring(offset+match.length).match(/^(<\/span>)?($|[,.;!?+\/\\\s\r\n\u2014\u2013\u2026-]|: |<br\s*\/?>)/i)) {
                    if ('Aa\u0410\u0430'.indexOf(part2[0]) >= 0) {
                        part2 = 'A'+part2.substring(1);
                    }
                    return part1+'<a href="javascript:void(0)" onclick="top.lineNumberLinks.onLinkClick(event, \''+part2+'\', true);return false;">'+part2+'</a>';
                }
            }
            return match;
        });
    }
    
    function getLineNumberLinkFilter(linestylefilter) {
        return linestylefilter.getTagFilter(function(lineText) {
            var tagPlacementItems = [];
            var lineNumberPattern;
            if (window.lineRenumerator) {
                lineNumberPattern = /\[[Aa\u0410\u0430]?\d+\]/g;
            }
            else {
                lineNumberPattern = /\[\d+\]/g;
            }
            var execResult;
            while ((execResult = lineNumberPattern.exec(lineText))) {
                if (execResult.input.charAt(execResult.index-1) != '[' || execResult.input.charAt(execResult.index + execResult[0].length) != ']') {
                    tagPlacementItems.push({
                        start: execResult.index + 1,
                        end: execResult.index + execResult[0].length - 1,
                        name: 'linenumberlink:' + execResult[0].substring(1, execResult[0].length - 1)
                    });
                }
            }
            var lineAnchorPattern = /\[\[[^\[\]]+\]\]/g;
            while ((execResult = lineAnchorPattern.exec(lineText))) {
                var tagValue = encodeAnchor(execResult[0].substring(2, execResult[0].length - 2));
                tagPlacementItems.push({
                    start: execResult.index + 2,
                    end: execResult.index + execResult[0].length - 2,
                    name: 'lineanchorlink:' + tagValue
                });
            }
            tagPlacementItems.sort(function (p1, p2) {
                return p1.start - p2.start;
            });
            var tagPlacement = {splitPoints: [], tagNames: []};
            for (var i = 0; i < tagPlacementItems.length; ++i) {
                if (i == 0 || tagPlacementItems[i].start > tagPlacementItems[i-1].end) {
                    tagPlacement.splitPoints.push(tagPlacementItems[i].start);
                    tagPlacement.splitPoints.push(tagPlacementItems[i].end);
                    tagPlacement.tagNames.push(tagPlacementItems[i].name);
                }
            }
            return tagPlacement;
        });
    }
    
    function onKeyDown(evt) {
        if (evt && evt.type == 'keydown') {
            if (evt.ctrlKey && evt.which == 188) {
                jumpBackward();
                return true;
            }
            else if (evt.ctrlKey && evt.which == 190) {
                jumpForward();
                return true;
            }
        }
        return false;
    }
    
    function updateButtons() {
        var srcBackward =  backAndForthStack.canJumpBackward() ? 'button_jump_backward.png' : 'button_jump_backward_inactive.png';
        var srcForward =  backAndForthStack.canJumpForward() ? 'button_jump_forward.png' : 'button_jump_forward_inactive.png';
        $('#linenumberlinks-jump-backward img').attr('src', '/static/html/plugins/lineNumberLinks/' + srcBackward);
        $('#linenumberlinks-jump-forward img').attr('src', '/static/html/plugins/lineNumberLinks/' + srcForward);
    }
    
    function beforeHandleKeyEventInEditor(args) {
        if (args && args.evt && onKeyDown(args.evt)) {
            return 'stop';
        }
    }
    
    function padCollabClientInitialized() {
        $(document).keydown(function(evt) {
            if (onKeyDown(evt)) {
                event.preventDefault();
            }
        });
    }
}

lineNumberLinks = new lineNumberLinksInit();
