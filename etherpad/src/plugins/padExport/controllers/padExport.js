
import("faststatic");
import("dispatch.{Dispatcher,PrefixMatcher,forward}");
import("etherpad.pad.padutils");
import("etherpad.pad.model");
import("etherpad.collab.ace.easysync2.*");
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

	function getPadHTML(padId, returnArray){
		var usePadId = padutils.getGlobalPadId(padId);

		var cloneRevNum=getPadRevision(padId);
		if(cloneRevNum===false){
			return false;
		}
		var apool=model.accessPadGlobal(usePadId, function(pad) {
			return new AttribPool(pad.pool());
		});
		var atext=model.getPadInternalRevisionAText(usePadId, cloneRevNum);

		var textlines = Changeset.splitTextLines(atext.text);
		var alines = Changeset.splitAttributionLines(atext.attribs, atext.text);
		var pieces = [];
		if(!returnArray){
			pieces.push('<div class="revision">', cloneRevNum, '</div>\n');
		}
		for(var i=0;i<textlines.length;i++) {
			var line = textlines[i];
			var aline = alines[i];
			var emptyLine = (line == '\n');
			var domInfo = domline.createDomLine(! emptyLine, true);
			linestylefilter.populateDomLine(line, aline, apool, domInfo);
			domInfo.prepareForAdd();
			var node = domInfo.node;
			if(returnArray){
				pieces.push(node.innerHTML);
			}else{
				pieces.push('<div class="', node.className, '">', node.innerHTML, '</div>\n');
			}
		}
		return (returnArray) ? pieces : pieces.join('');
	}

	function parse_str(str, array){
		var glue1 = '=';
		var glue2 = '&';

		var array2 = str.split(glue2);
		var array3 = [];
		for(var x=0; x<array2.length; x++){
			var tmp = array2[x].split(glue1);
			array3[unescape(tmp[0])] = decodeURIComponent(tmp[1]); //.replace(/[+]/g, ' ');
			//array3[tmp[0]] = tmp[1];
		}

		if(array){
			array = array3;
		} else{
			return array3;
		}
	}

	function trim(x) {
		return x.replace(/^\s+|\s+$/gm, '');
	}

	/* Parse request URL */
	var argv = request.path.split('/');
	if(typeof(argv[2])=="undefined"){
		response.write("Missing pad id");
		return true;
	}

	if(typeof(argv[3])=="undefined"){
		/* Get pad text */
		var padText=getPadHTML(argv[2], false);
		response.write(padText ? padText : "No such pad");
	}else if(argv[3]=="rev"){
		/* Get pad revision */
		var padRevision=getPadRevision(argv[2]);
		response.write(padRevision ? padRevision : "No such pad");
	}else if(argv[3].length>0){
		/* Get main pad text */
		var lines=getPadHTML(argv[2], true);
		if(lines){
			response.write("Pad: "+argv[2]+"<br>\r\n");
			/* Prepare filters */
			var q=parse_str(argv[3]);
			var include_regexp=false;
			var exclude_regexp=false;
			var remove_regexp=false;
			var from_regexp=false;
			var to_regexp=false;
			var from_catched=true;
			if(typeof(q["include"])!="undefined"){
				response.write("Including: "+q["include"]+"<br>\r\n");
				include_regexp=new RegExp(q["include"], 'i');
			}
			if(typeof(q["exclude"])!="undefined"){
				response.write("Excluding: "+q["exclude"]+"<br>\r\n");
				exclude_regexp=new RegExp(q["exclude"], 'i');
			}
			if(typeof(q["remove"])!="undefined"){
				response.write("Removing: "+q["remove"]+"<br>\r\n");
				remove_regexp=new RegExp(q["remove"], 'igm');
			}
			if(typeof(q["from"])!="undefined"){
				response.write("From: "+q["from"]+"<br>\r\n");
				from_regexp=new RegExp(q["from"], 'igm');
				from_catched=false;
			}
			if(typeof(q["to"])!="undefined"){
				response.write("To: "+q["to"]+"<br>\r\n");
				to_regexp=new RegExp(q["to"], 'igm');
			}
			response.write("<hr>\r\n");

			/* Run */
			var out="";
			for(var k=0; k<lines.length; k++){
				var v=lines[k];
				if(typeof(q["remove_pad_markup"])!="undefined"){
					v=v.replace(/ class=\"[^\"]*\"/, "");
					v=v.replace(/<[\/]?span[^>]*>/g, "");
					v=v.replace("</b><b>", "");
					v=v.replace("</i><i>", "");
				}
				v=trim(v.replace("&nbsp;", " ").replace(/[\s]{2,}/, " "));
				if(from_catched===false){
					if(v.match(from_regexp)){
						from_catched=true;
					}
					continue;
				}
				if(to_regexp!==false && v.match(to_regexp)){
					break;
				}
				if(typeof(q["keep_empty_lines"])!="undefined" && trim(v)==""){
					out+="<br>\r\n";
					continue;
				}
				if(include_regexp!==false && !v.match(include_regexp)){
					continue;
				}
				if(exclude_regexp!==false && v.match(exclude_regexp)){
					continue;
				}
				if(remove_regexp!==false){
					v=v.replace(remove_regexp, "");
				}
				out+="<div>"+trim(v)+"</div>\r\n";
			}
			response.write(out);
		}else{
			response.write("No such pad");
		}
	}else{
		response.write("Unknown action");
	}

	} catch(e) {
		response.write(e);
	}
	return true;
}
