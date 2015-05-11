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
		var regExp = /^([^a-z]{0,18})(([a-z][a-z0-9]* *){1,3}:)/gi;
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

		var handleRegExpMatchsAfterSplit = (function() {
			var curIndex = 0;
			return function(txt, cls) {
				var txtlen = txt.length;
				if(curIndex >= splitPoints[0] && curIndex < splitPoints[1]){
					var classname=lineText.substring(splitPoints[0], splitPoints[1]).replace(/\s|:/g, '').toLowerCase();
					cls += (cls==""?"":" ")+"pony_name pony_" + classname;
				}else if(curIndex < splitPoints[0]){
					cls += (cls==""?"":" ")+"pony_timing";
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
