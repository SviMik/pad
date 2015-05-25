function lineRenumeratorPluginInit() {
    this.hooks = [];
    this.version = '0.1';

    if(isBrowser()) {
        window.addEventListener('load', executeScript, false);
    }

    function isBrowser() {
        var global = (function() {return this;})();
        return !!global.window;
    }

    function executeScript() {
        if(!window.$ || !$('#padpage #padmain').length)
            return;

        var currentLineNumber = -1;
        var start = 0;

        setInterval(function() {
            var text =  window.padeditor.ace.exportText();
            var lines = text.split('\n');
            var newStart = 0;
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].search('======') == 0) {
                    newStart = i + 1;
                    break;
                }
            };

            if (lines.length == currentLineNumber && start == newStart)
                return;
            currentLineNumber = lines.length;
            start = newStart;

            var numbers = $("iframe").contents().find('div#sidediv table tbody tr td').contents();
            for (var i = 0; i < start; i++) {
                numbers[i].textContent = '';
            }
            for (var i = start; i < numbers.length; i++) {
                numbers[i].textContent = i - start + 1;
            }
        }, 1000);
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
}


lineRenumeratorPlugin = new lineRenumeratorPluginInit();
