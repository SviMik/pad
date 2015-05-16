function lineNumberLinksInit() {
    this.hooks = [/*'aceInitInnerdocbodyHead', */'aceGetFilterStack', 'aceCreateDomLine', 'chatLineText'];
    //this.aceInitInnerdocbodyHead = aceInitInnerdocbodyHead;
    this.aceGetFilterStack = aceGetFilterStack;
    this.aceCreateDomLine = aceCreateDomLine;
    this.chatLineText = chatLineText;
    this.onLinkClick = onLinkClick;

    var arrowDiv = null;
    
    function goToLine(lineNumber) {
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
            cls = args.cls.replace(/linenumberlink:(\d+)/g, function(text, linktext) {
                lineNumber = linktext;
                return "linenumberlink";
            });
            return [{
                cls: cls,
                extraOpenTags: '<a href="javascript:void(0)" onclick="top.lineNumberLinks.onLinkClick(event, ' + lineNumber + ');return false;">',
                extraCloseTags: '</a>'
            }];
        }
    }
    
    function chatLineText(args) {
        args.html = args.html.replace(/\[(\d+)\]/g, '[<a href="javascript:void(0)" onclick="top.lineNumberLinks.onLinkClick(event, $1);return false;">$1</a>]');
        args.html = args.html.replace(/(#|\u2116|^)(\d+)([,.:;!?\/\\ +\u2014\u2013\u2026-]|$)/g, '$1<a href="javascript:void(0)" onclick="top.lineNumberLinks.onLinkClick(event, $2);return false;">$2</a>$3');
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
            var regExp = /\[\d+\]/g;
            var execResult;
            while ((execResult = regExp.exec(lineText))) {
                tagPlacement.splitPoints.push(execResult.index + 1, execResult.index + execResult[0].length - 1);
                tagPlacement.tagNames.push('linenumberlink:' + execResult[0].substring(1, execResult[0].length - 1));
            }
            return tagPlacement;
        });
    }
}

lineNumberLinks = new lineNumberLinksInit();
