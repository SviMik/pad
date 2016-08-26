function showImagesInit() {
	this.hooks = ['aceGetFilterStack', 'aceCreateDomLine'];

	var imagewas=-1;

	function imagefilter(linestylefilter){
		return function (lineText, textAndClassFunc) {
			imagewas=-1;
			var regExp = /https?:\/\/.+((\.png)|(\.jpg)|(\.jpeg))/gi;
			regExp.lastIndex = 0;
			var splitPoints = [];
			var execResult;
			if(execResult = regExp.exec(lineText)){
				var from = execResult.index;
				var to = from+execResult[0].length;
				splitPoints.push(from, to);
			}else{
				return textAndClassFunc;
			}

			var handleRegExpMatchsAfterSplit = (function() {
				var curIndex = 0;
				return function(txt, cls) {
					var txtlen = txt.length;
					if(curIndex >= splitPoints[0] && curIndex < splitPoints[1]){
						var url=lineText.substring(splitPoints[0], splitPoints[1]);
						cls += (cls==""?"":" ")+"image_"+curIndex+"_" + url;
					}
					textAndClassFunc(txt, cls);
					curIndex += txtlen;
				};
			})();

			return linestylefilter.textAndClassFuncSplitter(handleRegExpMatchsAfterSplit, splitPoints);
		};
	}

	this.aceGetFilterStack = function(args) {
		return [imagefilter(args.linestylefilter)];
	}

	this.aceCreateDomLine = function(args) {
		if (args.cls.indexOf('image') > -1) {
			var src=false;
			var id=false;
			cls = args.cls.replace(/(^| )image_([^_]+)_(\S+)/g, function(x0, space, id, image) {
				id = id;
				src = image;
				return space + "image";
			});

			var tag='';
			if(src!==false && imagewas!=id){
				imagewas=id;
				tag='<img src="' + src + '" style="max-width:500px"/>';
			}

			return [{
				cls: cls,
				extraOpenTags: tag,
				extraCloseTags:''
			}];
		}
	}
}

showImages = new showImagesInit();
