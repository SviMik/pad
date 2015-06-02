function ponyNamesDecoratorInit() {
	this.hooks = ['aceInitInnerdocbodyHead', 'aceGetFilterStack'];

	this.aceInitInnerdocbodyHead = function(args) {
		args.iframeHTML.push('\'<link rel="stylesheet" type="text/css" href="/static/css/plugins/ponyNamesDecorator/pad.css"/>\'');
	}

	function getPonyNamesFilter(linestylefilter){
        return linestylefilter.getTagFilter(function(lineText) {
            var tagPlacement = {splitPoints: [], tagNames: []};
			var regExp = /^([^a-z#*\u25CF\u25E6\u2022]{0,18})(([a-z][a-z0-9]* *){1,3}:)/gi;
			regExp.lastIndex = 0;
			var execResult;
			if(execResult = regExp.exec(lineText)){
				var from = execResult.index + execResult[1].length;
				var to = from+execResult[2].length;
                if(lineText.substring(to, to+2) != "//"){ // prevents links from highlighting
                    var classname = execResult[2].replace(/\s|:/g, '').toLowerCase();
                    tagPlacement.splitPoints.push(from, to);
                    tagPlacement.tagNames.push("pony_name pony_" + classname);
                    if(from>0) {
                        tagPlacement.splitPoints.push(0, from);
                        tagPlacement.tagNames.push("pony_timing");
                    }
                }
			}
            return tagPlacement;
        });
	}

	this.aceGetFilterStack = function(args) {
		return [getPonyNamesFilter(args.linestylefilter)];
	}
}

/* used on the client side only */
ponyNamesDecorator = new ponyNamesDecoratorInit();
