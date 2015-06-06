function lineNumberLinksInit() {
    this.hooks = [/*'aceInitInnerdocbodyHead', */'aceGetFilterStack', 'aceCreateDomLine', 'chatLineText', 'incorporateUserChanges', 'performDocumentApplyChangeset'];
    //this.aceInitInnerdocbodyHead = aceInitInnerdocbodyHead;
    this.aceGetFilterStack = aceGetFilterStack;
    this.aceCreateDomLine = aceCreateDomLine;
    this.chatLineText = chatLineText;
    this.incorporateUserChanges = incorporateUserChanges;
    this.performDocumentApplyChangeset = performDocumentApplyChangeset;
    this.onLinkClick = onLinkClick;

    var arrowDiv = null;
    var highlightDiv = null;
    
    function goToLine(lineNumberStr) {
        var lineIndex;
        if (window.lineRenumeratorPlugin) {
            if (lineNumberStr[0] == 'A') {
                lineIndex = parseInt(lineNumberStr.substring(1)) - 1;
            }
            else {
                lineIndex = parseInt(lineNumberStr) + lineRenumeratorPlugin.getLinesOffset() - 1;
            }
        }
        else {
            lineIndex = parseInt(lineNumberStr) - 1;
        }
        var outerFrame = $('#padeditor #editorcontainerbox #editorcontainer iframe');
        var outerBody = outerFrame.contents().find('body#outerdocbody');
        var innerFrame = outerBody.find('iframe');
        var innerBody = innerFrame.contents().find('body#innerdocbody');
        var lineDiv = innerBody.find('div').eq(lineIndex);
        if (lineDiv.length > 0) {
            var scrollingElements = outerFrame.contents().find('html,body');
            scrollingElements.scrollTop(innerFrame.offset().top + lineDiv.offset().top + lineDiv.height()/2 - outerFrame.height()/2);
            var scrollTop = Math.max(scrollingElements.eq(0).scrollTop(), scrollingElements.eq(1).scrollTop());
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
            }, 700);
        }
    }

    function onLinkClick(event, lineNumber) {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
        if (event && event.stopPropagation) {
            event.stopPropagation();
        }
        goToLine(lineNumber);
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
                extraOpenTags: '<a href="javascript:void(0)" onclick="top.lineNumberLinks.onLinkClick(event, \'' + lineNumber + '\');return false;">',
                extraCloseTags: '</a>'
            }];
        }
    }
    
    function chatLineText(args) {
        var tagPattern = /<a [^>]*>[^<]*<\/a>/gi;
        var tagMatch;
        var tagIntervals = [];
        while ((tagMatch = tagPattern.exec(args.html)) !== null) {
            tagIntervals.push({start: tagMatch.index, end: tagMatch.index+tagMatch[0].length});
        }
        function isPositionInsideTag(pos) {
            return tagIntervals.some(function (interval) {
                return pos > interval.start && pos < interval.end;
            });
        }

        var lineNumberPattern;
        if (window.lineRenumeratorPlugin) {
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
                    return part1+'<a href="javascript:void(0)" onclick="top.lineNumberLinks.onLinkClick(event, \''+part2+'\');return false;">'+part2+'</a>';
                }
            }
            return match;
        });
    }
    
    function getLineNumberLinkFilter(linestylefilter) {
        return linestylefilter.getTagFilter(function(lineText) {
            var tagPlacement = {splitPoints: [], tagNames: []};
            var lineNumberPattern;
            if (window.lineRenumeratorPlugin) {
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
}

lineNumberLinks = new lineNumberLinksInit();
