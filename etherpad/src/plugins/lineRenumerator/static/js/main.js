function lineRenumeratorPluginInit() {
    this.hooks = ['padEditorInitialized'];
    this.version = '0.2';
    this.getLinesOffset = getLinesOffset;
    this.padEditorInitialized = padEditorInitialized;

    function getLinesOffset() {
        var text =  window.padeditor.ace.exportText();
        var lines = text.split('\n');

        for (var i = 0; i < lines.length; i++) {
            if (lines[i].search('======') == 0) {
                return i+1;
            }
        };
        return 0;
    }

    function padEditorInitialized() {
        if (!window.$ || !(window.padeditor && window.padeditor.ace))
            return;

        var lastLineCount = -1;
        var lastLineNumberDivCount = -1;
        var start = 0;
        
        setInterval(function() {
            var text =  window.padeditor.ace.exportText();
            var numbers = $('#editorcontainer iframe').contents().find('div#sidediv table tbody tr td#sidedivinner').contents();
            
            if (typeof(text) == "undefined" || numbers.length == 0)
                return;

            var lines = text.split('\n');

            if (lines.length == lastLineCount && numbers.length == lastLineNumberDivCount && getLinesOffset() == start)
                return;
            lastLineCount = lines.length;
            lastLineNumberDivCount = numbers.length;
            start = getLinesOffset();

            for (var i = 0; i < start && i < numbers.length; i++) {
                numbers[i].textContent = 'A' + (i+1);
            }
            for (var i = start; i < numbers.length; i++) {
                numbers[i].textContent = i - start + 1;
            }
        }, 1000);
    }
}


lineRenumerator = new lineRenumeratorPluginInit();
