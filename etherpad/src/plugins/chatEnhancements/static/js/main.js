function chatEnhancementsInit() {
    this.hooks = ['chatLineText', 'padCollabClientInitialized'];
    this.chatLineText = chatLineText;
    this.padCollabClientInitialized = padCollabClientInitialized;

    function findQuotationStart(html) {
        var tagIntervals = [];
        var tagPattern = /<a [^>]*>[^<]*<\/a>/gi;
        var tagMatch;
        while ((tagMatch = tagPattern.exec(html)) !== null) {
            tagIntervals.push({start: tagMatch.index, end: tagMatch.index+tagMatch[0].length});
        }
        var tagPattern = /<[^>]*>/gi;
        while ((tagMatch = tagPattern.exec(html)) !== null) {
            tagIntervals.push({start: tagMatch.index, end: tagMatch.index+tagMatch[0].length});
        }
        function isPositionInsideTag(pos) {
            return tagIntervals.some(function (interval) {
                return pos > interval.start && pos < interval.end;
            });
        }
        var quotationPattern = /&gt;|&#62;|\d\d?:\d\d\s+.*:/ig;
        while ((quotationMatch = quotationPattern.exec(html)) !== null) {
            if (!isPositionInsideTag(quotationMatch.index)) {
                return quotationMatch.index;
            }
        }
        return -1;
    }
    
    function chatLineText(args) {
        var position = findQuotationStart(args.html);
        if (position>=0) {
            args.html = args.html.substring(0, position) + '<span style="font-style:italic;color:#196906;">' + args.html.substring(position) + '</span>';
        }
    }
    
    function padCollabClientInitialized() {
        var chatDiv = $('#chatlines');
        chatDiv.scroll(function() {
            console.log(chatDiv.scrollTop());
            if(chatDiv.scrollTop() < 25) {
                padchat.loadMoreHistory();
            }
        });
    }
    
}

chatEnhancements = new chatEnhancementsInit();
