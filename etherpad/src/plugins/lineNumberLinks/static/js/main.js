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
        
        this.jumpBack = function() {
            if (!this.canJumpBack()) {
                return null;
            }
            --placementIndex;
            return new LinePlacement(placements[placementIndex]);
        }
        
        this.jumpForth = function() {
            if (!this.canJumpForth()) {
                return null;
            }
            ++placementIndex;
            return new LinePlacement(placements[placementIndex]);
        }
        
        this.canJumpBack = function() {
            return placementIndex > 0;
        }
        
        this.canJumpForth = function() {
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
        if (selection) {
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
        if (currentPlacement.lineNumberStr != placement.lineNumberStr && 
                (!lastPlacement && lineNumberStringToLineIndex(currentPlacement.lineNumberStr) > 0 || 
                lastPlacement && lastPlacement.lineNumberStr != currentPlacement.lineNumberStr)) {
            backAndForthStack.add(currentPlacement);
        }
        goToLine(placement.lineNumberStr, placement.lineCenterTop);
        currentPlacement = getCurrentPlacement();
        lastPlacement = backAndForthStack.get();
        if (!lastPlacement || lastPlacement.lineNumberStr != currentPlacement.lineNumberStr) {
            backAndForthStack.add(currentPlacement);
        }
    }
    
    function jumpBack() {
        var currentPlacement = getCurrentPlacement();
        var lastPlacement = backAndForthStack.get();
        if (lastPlacement && lastPlacement.lineNumberStr != currentPlacement.lineNumberStr) {
            backAndForthStack.add(currentPlacement);
        }
        if (backAndForthStack.canJumpBack()) {
            var placement = backAndForthStack.jumpBack();
            goToLine(placement.lineNumberStr, placement.lineCenterTop);
        }
        else {
            var placement = backAndForthStack.get();
            if (placement) {
                goToLine(placement.lineNumberStr, placement.lineCenterTop);
            }
        }
    }
    
    function jumpForth() {
        if (backAndForthStack.canJumpForth()) {
            var placement = backAndForthStack.jumpForth();
            goToLine(placement.lineNumberStr, placement.lineCenterTop);
        }
        else {
            var placement = backAndForthStack.get();
            if (placement) {
                goToLine(placement.lineNumberStr, placement.lineCenterTop);
            }
        }
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
            var lineNumber;
            cls = args.cls.replace(/linenumberlink:([Aa\u0410\u0430]?\d+)/g, function(text, linktext) {
                lineNumber = linktext;
                return "linenumberlink";
            });
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
            return tagIntervals.some(function (interval) {
                return pos > interval.start && pos < interval.end;
            });
        }

        var lineNumberPattern;
        if (window.lineRenumerator) {
            lineNumberPattern = /(#|\u2116|\\|\/|\[|^)([Aa\u0410\u0430]?\d+)/g;
        }
        else {
            lineNumberPattern = /(#|\u2116|\\|\/|\[|^)(\d+)/g;
        }
        args.html = args.html.replace(lineNumberPattern, function (match, part1, part2, offset) {
            if (!isPositionInsideTag(offset)) {
                var next_char = offset+match.length==args.html.length ? '' : args.html[offset+match.length];
                if (part1=='[' && next_char==']' || part1!='[' && (next_char=='' || ',.;!?/\\ +\u2014\u2013\u2026-'.indexOf(next_char) >= 0)) {
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
            var tagPlacement = {splitPoints: [], tagNames: []};
            var lineNumberPattern;
            if (window.lineRenumerator) {
                lineNumberPattern = /\[[Aa\u0410\u0430]?\d+\]/g;
            }
            else {
                lineNumberPattern = /\[\d+\]/g;
            }
            var execResult;
            while ((execResult = lineNumberPattern.exec(lineText))) {
                tagPlacement.splitPoints.push(execResult.index + 1, execResult.index + execResult[0].length - 1);
                tagPlacement.tagNames.push('linenumberlink:' + execResult[0].substring(1, execResult[0].length - 1));
            }
            return tagPlacement;
        });
    }
    
    function onKeyDown(evt) {
        if (evt && evt.type == 'keydown') {
            if (evt.ctrlKey && evt.which == 188) {
                jumpBack();
                return true;
            }
            else if (evt.ctrlKey && evt.which == 190) {
                jumpForth();
                return true;
            }
        }
        return false;
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
