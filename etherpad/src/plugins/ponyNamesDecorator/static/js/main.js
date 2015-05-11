function ponyNamesDecoratorInit() {
	this.hooks = ['aceCreateDomLine', 'aceGetFilterStack'];
	this.aceCreateDomLine = aceCreateDomLine;
	this.aceGetFilterStack = aceGetFilterStack;
}

var regexpNames = /(Applejack|Fluttershy|Pinkie( *Pie)?|Rarity|Rainbow( *Dash)?|Twilight( *Sparkle)?|Spike|Celestia|Luna|Discord|Shining_Armor|Princess_Cadence|Scootaloo|SweetieBelle|AppleBloom|BabsSeed|Trixie|Zecora|Snips|Snails|MrCake|MrsCake|Granny Smith|Big Mac|Cheerilee|Reference|Somepony):/gi;
var colors = {
	applejack: 'hsl(036, 100%, 71%)',
	fluttershy: 'hsl(055, 94%, 82%)',
	pinkiepie: 'hsl(335, 88%, 84%)',
	pinkie: 'hsl(335, 88%, 84%)',
	rarity: 'hsl(240, 8%, 95%)',
	rainbowdash: 'hsl(195, 100%, 81%)',
	rainbow: 'hsl(195, 100%, 81%)',
	twilightsparkle: 'hsl(283, 65%, 81%)',
	twilight: 'hsl(283, 65%, 81%)',
};

function getRegexpFilter(linestylefilter, regExp, tag) {
	// This function is a modified version of linestylefilter.getRegexpFilter() from Etherpad's linestylefilter.js
	return function (lineText, textAndClassFunc) {
		regExp.lastIndex = 0;
		var splitPoints = [];
		var execResult;
		while(execResult = regExp.exec(lineText))
			splitPoints.push(execResult.index, execResult.index + execResult[0].length);
		if(splitPoints.length==0) 
			return textAndClassFunc;

		function regExpMatchForIndex(idx) {
			for(var k=0; k<splitPoints.length; k+=2) {
				var startIndex = splitPoints[k];
				var endIndex = splitPoints[k+1];
				if(idx >= startIndex && idx < endIndex)
					return lineText.substring(startIndex, endIndex);
			}
			return false;
		}

		var handleRegExpMatchsAfterSplit = (function() {
			var curIndex = 0;
			return function(txt, cls) {
				var txtlen = txt.length;
				var newCls = cls;
				var regExpMatch = regExpMatchForIndex(curIndex);
				if(regExpMatch)
					newCls += " " + tag + ":" + regExpMatch.replace(/\s|:/g, '').toLowerCase();
				textAndClassFunc(txt, newCls);
				curIndex += txtlen;
			};
		})();

		return linestylefilter.textAndClassFuncSplitter(handleRegExpMatchsAfterSplit, splitPoints);
	};
}

function aceGetFilterStack(args) {
	return [getRegexpFilter(args.linestylefilter, regexpNames, 'CharacterName')];
}

function aceCreateDomLine(args) {
	if(args.cls.indexOf('CharacterName:') > -1) {
		var color;
		cls = args.cls.replace(/(^| )CharacterName:(\S+)/g, function(whole, space, name) {
			color = colors[name];
			return '';
		});
		var extraOpenTags = '<span style="font-size:12px; background-color: #fdb; font-weight: bold;">';
		if(color)
			extraOpenTags = '<span style="font-size:12px; background-color: ' + color + '; font-weight: bold;">';
		return [{
			cls: cls,
			extraOpenTags: extraOpenTags,
			extraCloseTags: '</span>'
		}];
	}
}

/* used on the client side only */
ponyNamesDecorator = new ponyNamesDecoratorInit();
