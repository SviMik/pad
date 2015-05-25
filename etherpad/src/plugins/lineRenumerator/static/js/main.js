function lineRenumeratorPluginInit() {
    this.hooks = [];
    this.version = '0.1';
    this.getLinesOffset = getLinesOffset;

    if(isBrowser()) {
        window.addEventListener('load', executeScript, false);
    }

    function isBrowser() {
        var global = (function() {return this;})();
        return !!global.window;
    }

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

    function executeScript() {
        if(!window.$ || !(window.padeditor && window.padeditor.ace))
            return;

        var currentLineNumber = -1;
        var start = 0;

        setInterval(function() {
            var text =  window.padeditor.ace.exportText();
            var lines = text.split('\n');

            if (lines.length == currentLineNumber && getLinesOffset() == start)
                return;
            currentLineNumber = lines.length;
            start = getLinesOffset();

            var numbers = $("iframe").contents().find('div#sidediv table tbody tr td').contents();
            for (var i = 0; i < start; i++) {
                numbers[i].textContent = '';
            }
            for (var i = start; i < numbers.length; i++) {
                numbers[i].textContent = i - start + 1;
            }
        }, 1000);
    }
}


lineRenumeratorPlugin = new lineRenumeratorPluginInit();
