function ponyNamesDecoratorInit() {
	this.hooks = ['aceInitInnerdocbodyHead', 'aceGetFilterStack'];
	this.aceInitInnerdocbodyHead = aceInitInnerdocbodyHead;
	this.aceGetFilterStack = aceGetFilterStack;
}

function aceInitInnerdocbodyHead(args) {
	args.iframeHTML.push('\'<link rel="stylesheet" type="text/css" href="/static/css/plugins/ponyNamesDecorator/pad.css"/>\'');
}

function ponynames(linestylefilter){
	return function (lineText, textAndClassFunc) {
		var regExp = /^([^a-z]{0,16})(([a-zA-Z0-9]+ *){1,3}:)/gi;
		regExp.lastIndex = 0;
		var splitPoints = [];
		var execResult;
		if(execResult = regExp.exec(lineText)){
			var from = execResult.index + execResult[1].length;
			var to = from+execResult[2].length;
			splitPoints.push(from, to);
		}else{
			return textAndClassFunc;
		}

		function regExpMatchForIndex(idx) {
			if(idx >= splitPoints[0] && idx < splitPoints[1]){
				return lineText.substring(splitPoints[0], splitPoints[1]);
			}
			return false;
		}

		var handleRegExpMatchsAfterSplit = (function() {
			var curIndex = 0;
			return function(txt, cls) {
				var txtlen = txt.length;
				var regExpMatch;
				if(regExpMatch = regExpMatchForIndex(curIndex)){
					cls += (cls==""?"":" ")+"pony_name pony_" + regExpMatch.replace(/\s|:/g, '').toLowerCase();
				}
				textAndClassFunc(txt, cls);
				curIndex += txtlen;
			};
		})();

		return linestylefilter.textAndClassFuncSplitter(handleRegExpMatchsAfterSplit, splitPoints);
	};
}

function aceGetFilterStack(args) {
	return [ponynames(args.linestylefilter)];
}

/* used on the client side only */
ponyNamesDecorator = new ponyNamesDecoratorInit();
