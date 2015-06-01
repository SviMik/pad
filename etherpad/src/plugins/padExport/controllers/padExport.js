
import("faststatic");
import("dispatch.{Dispatcher,PrefixMatcher,forward}");
import("etherpad.pad.padutils");
import("etherpad.pad.model");
import("etherpad.collab.ace.easysync2.Changeset");
import("etherpad.collab.ace.linestylefilter.linestylefilter");
import("etherpad.collab.ace.domline.domline");

function onRequest() {
	response.setContentType("text/html; charset=utf-8");
	response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, post-check=0, pre-check=0");
	response.setHeader("Pragma", "no-cache");

	try {

	function getPadRevision(padId){
		var usePadId = padutils.getGlobalPadId(padId);
		return model.accessPadGlobal(usePadId, function(pad) {
			if(!pad.exists()){
				return false;
			}
    			return pad.getHeadRevisionNumber();
		}, 'r');
	}

	function getPadHTML(padId){
		var usePadId = padutils.getGlobalPadId(padId);
		return model.accessPadGlobal(usePadId, function(pad) {
			if(!pad.exists()){
				return false;
			}
    			var cloneRevNum = pad.getHeadRevisionNumber();
    			var atext=pad.getInternalRevisionAText(cloneRevNum);
    			var textlines = Changeset.splitTextLines(atext.text);
    			var alines = Changeset.splitAttributionLines(atext.attribs, atext.text);
    			var pieces = [];
    			pieces.push('<div class="revision">', cloneRevNum, '</div>\n');
    			var apool = pad.pool();
    			for(var i=0;i<textlines.length;i++) {
	    			var line = textlines[i];
	    			var aline = alines[i];
	    			var emptyLine = (line == '\n');
	    			var domInfo = domline.createDomLine(! emptyLine, true);
	    			linestylefilter.populateDomLine(line, aline, apool, domInfo);
	    			domInfo.prepareForAdd();
	    			var node = domInfo.node;
    				pieces.push('<div class="', node.className, '">', node.innerHTML, '</div>\n');
    			}
    			return pieces.join('');
		}, 'r');
	}

	/* Parse request URL */
	var argv = request.path.split('/');
	if(typeof(argv[2])=="undefined"){
		response.write("Missing pad id");
		return true;
	}

	if(typeof(argv[3])=="undefined"){
		/* Get main pad text */
		var padText=getPadHTML(argv[2]);
		response.write(padText ? padText : "No such pad");
	}else if(argv[3]=="rev"){
		/* Get main pad text */
		var padText=getPadRevision(argv[2]);
		response.write(padText ? padText : "No such pad");
	}else{
		response.write("Unknown action");
	}

	} catch(e) {
		response.write(e);
	}
	return true;
}
