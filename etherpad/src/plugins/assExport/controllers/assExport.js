
import("faststatic");
import("dispatch.{Dispatcher,PrefixMatcher,forward}");
import("etherpad.pad.padutils");
import("etherpad.pad.model");

function onRequest() {
	response.setContentType("text/plain; charset=utf-8");
	response.setHeader("Cache-Control: no-store, no-cache, must-revalidate");
	response.setHeader("Cache-Control: post-check=0, pre-check=0", false);
	response.setHeader("Pragma: no-cache");

	try {

	function trim(str) {
		return str.replace(/^\s+|\s+$/g, '');
	}

	function htime(t, frac){
		if(typeof(frac)=="undefined"){
			frac=0;
		}
		t=t.toFixed(frac);
		if(t<0){return t;}
		var sec=(t%60).toFixed(frac);
		var min=Math.floor(t/60);
		if(sec<10){sec="0"+sec;}
		if(min<10){min="0"+min;}
		return min+":"+sec;
	}

	function getPadText(padId){
		var usePadId = padutils.getGlobalPadId(padId);
		var padText = model.accessPadGlobal(usePadId, function(pad) {
			if(!pad.exists()){
				return false;
			}
			var cloneRevNum = pad.getHeadRevisionNumber();
			return pad.getRevisionText(cloneRevNum);
		}, 'r');
		return padText;
	}

	/* Parse request URL */
	var argv = request.path.split('/');
	if(typeof(argv[2])=="undefined"){
		response.write("Missing pad id");
		return true;
	}

	/* Get lang settings */
	var lang="en";
	if(typeof(argv[3])!="undefined" && argv[3]=="ru"){
		lang="ru";
	}

	/* Get main pad text */
	var padText=getPadText(argv[2]);
	if(padText==false){
		response.write("No such pad");
		return true;
	}

	/* Make this file downloadable */
	response.setHeader("Content-Disposition", "attachment; filename=\""+argv[2]+"_"+lang+".ass");

	/* Get header pad text */
	var headerText=getPadText("assheader");
	if(headerText!=false && headerText!=""){
		var tmp=headerText.replace(/[ ]{2,}/g, ' ').split("\n");
		var prev_str="";
		for(k in tmp){
			var str=trim(tmp[k].replace(/;.*/, ""));
			if(str!=prev_str){
				response.write(str+"\r\n");
				prev_str=str;
			}
		}
	}

	/* Events block header */
	response.write("[Events]\r\n");
	response.write("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\r\n");

	var tmp=padText.replace(/\[[^\]]+\]/g, "").replace(/[ ]{2,}/g, ' ').split("\n");
	for(k in tmp){
		var str=trim(tmp[k]);
		// build subtitles
		m=str.match(/^\[?([0-9]{2}):([0-9]{2}\.[0-9]{1,2}),([0-9\.]+)\]?[ ]*([^:]+):([^а-яА-ЯёЁ]+)(.*)/);
		if(m!=null && typeof(m[5])!="undefined"){
			var t=parseInt(m[1], 10)*60+parseFloat(m[2]);
			var l=parseFloat(m[3]);
			var name=m[4].replace(/\s/, '');
			var text_en=trim(m[5].replace(/\[[^\[\]]+\]/g, '').replace(/([a-zA-Z][^ ]+) [^a-zA-Z]+$/g, '$1'));
			var text_ru=trim(m[6].replace(/\[[^\[\]]+\]/g, ''));
			var text=(lang=="en") ? text_en : text_ru;
			if(text!=""){
				response.write("Dialogue: 0,0:"+htime(t, 2)+",0:"+htime(t+l, 2)+","+name+",,0,0,0,,"+text+"\r\n");
			}
		}
	}

	} catch(e) {
		response.write(e);
	}
	return true;
}
