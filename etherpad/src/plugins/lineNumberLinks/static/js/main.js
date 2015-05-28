function lineNumberLinksInit() {
    this.hooks = [/*'aceInitInnerdocbodyHead', */'aceGetFilterStack', 'aceCreateDomLine', 'chatLineText'];
    //this.aceInitInnerdocbodyHead = aceInitInnerdocbodyHead;
    this.aceGetFilterStack = aceGetFilterStack;
    this.aceCreateDomLine = aceCreateDomLine;
    this.chatLineText = chatLineText;
    this.onLinkClick = onLinkClick;

    var arrowDiv = null;
    
    function goToLine(lineNumberStr) {
        var lineNumber;
        if (window.lineRenumeratorPlugin) {
            if (lineNumberStr[0] == 'A') {
                lineNumber = parseInt(lineNumberStr.substring(1));
            }
            else {
                lineNumber = parseInt(lineNumberStr) + lineRenumeratorPlugin.getLinesOffset();
            }
        }
        else {
            lineNumber = parseInt(lineNumberStr);
        }
        var outerFrame = $('#padeditor #editorcontainerbox #editorcontainer iframe');
        var outerBody = outerFrame.contents().find('body#outerdocbody');
        var innerFrame = outerBody.find('iframe');
        var innerBody = innerFrame.contents().find('body#innerdocbody');
        var lineDiv = innerBody.find('div').eq(lineNumber - 1);
        if (lineDiv.length > 0) {
            var scrollingElements = outerFrame.contents().find('html,body');
            scrollingElements.scrollTop(innerFrame.offset().top + lineDiv.offset().top + lineDiv.height()/2 - outerFrame.height()/2);
            var scrollTop = Math.max(scrollingElements.eq(0).scrollTop(), scrollingElements.eq(1).scrollTop());
            if (!arrowDiv)
            {
                $(document.body).append('<link rel="stylesheet" type="text/css" href="/static/css/plugins/lineNumberLinks/pad.css">');
                var overlayDiv = $('<div id="linenumberlinksarrowoverlay"/>').appendTo($(document.body));
                arrowDiv = $('<div id="linenumberlinksarrow"/>').css('display', 'none').appendTo(overlayDiv);
            }
            var arrowTop = outerFrame.offset().top + innerFrame.offset().top + lineDiv.offset().top + lineDiv.height()/2 - scrollTop;
            var arrowRight = $('#padpage').offset().left;
            arrowDiv.stop();
            arrowDiv.css({
                opacity: '1', 
                left: (arrowRight-110) + 'px', 
                top: (arrowTop-50) + 'px',
                display: 'block'
            });
            arrowDiv.animate({opacity: '0'}, {duration: 'slow', complete: function() {arrowDiv.css('display', 'none')}});
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
    
    function getTagFilter(linestylefilter, tagFunc) {
        return function (lineText, textAndClassFunc) {
            var tagPlacement = tagFunc(lineText);
            if (!tagPlacement || !tagPlacement.splitPoints && !tagPlacement.tagNames || 
                    tagPlacement.splitPoints.length == 0 && tagPlacement.tagNames.length == 0) {
                return textAndClassFunc;
            }
            if (tagPlacement.splitPoints.length != tagPlacement.tagNames.length*2) {
                throw new Error("getTagFilter");
            }

            function getTagByIndex(idx) {
                for(var i = 0; i < tagPlacement.tagNames.length; i++) {
                    if (idx >= tagPlacement.splitPoints[i*2] && idx < tagPlacement.splitPoints[i*2 + 1]) {
                        return tagPlacement.tagNames[i];
                    }
                }
                return null;
            }

            var handleTagsAfterSplit = (function() {
                var currentIndex = 0;
                return function(txt, cls) {
                    var textLength = txt.length;
                    var newCls = cls;
                    var tag = getTagByIndex(currentIndex);
                    if (tag) {
                        newCls += " "+tag;
                    }
                    textAndClassFunc(txt, newCls);
                    currentIndex += textLength;
                };
            })();

            return linestylefilter.textAndClassFuncSplitter(handleTagsAfterSplit, tagPlacement.splitPoints);
        };
    }
    
    function getLineNumberLinkFilter(linestylefilter) {
        return getTagFilter(linestylefilter, function(lineText) {
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
