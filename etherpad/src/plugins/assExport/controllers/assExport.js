
import("faststatic");
import("dispatch.{Dispatcher,PrefixMatcher,forward}");

import("etherpad.log");
import("sqlbase.sqlbase");
import("sqlbase.sqlcommon");
import("sqlbase.sqlobj");
import("etherpad.pad.padutils");
import("etherpad.pad.model");

function onRequest() {
	response.setContentType("text/plain; charset=utf-8");
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

	var parts = request.path.split('/');
	if(typeof(parts[2])=="undefined"){
		response.write("Missing pad id");
		return true;
	}
	var usePadId = padutils.getGlobalPadId(parts[2]);
	var padText = model.accessPadGlobal(usePadId, function(pad) {
		if(!pad.exists()){
			return false;
		}
		var cloneRevNum = pad.getHeadRevisionNumber();
		return pad.getRevisionText(cloneRevNum);
	}, 'r');

	if(padText==false){
		response.write("No such pad");
		return true;
	}

	var lang="en";
	if(typeof(parts[3])!="undefined" && parts[3]=="ru"){
		lang="ru";
	}

	//response.setHeader("Content-Disposition", "attachment; filename=\""+shownPadID+"-"+revisionId+"."+format+"\"");
	response.write("[Events]\n");
	response.write("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n");

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
				response.write("Dialogue: 0,0:"+htime(t, 2)+",0:"+htime(t+l, 2)+","+name+",,0,0,0,,"+text+"\n");
			}
		}
	}

	} catch(e) {
		response.write(e);
	}
	return true;
}
