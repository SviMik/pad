﻿
import("faststatic");
import("dispatch.{Dispatcher,PrefixMatcher,forward}");
import("etherpad.pad.padutils");
import("etherpad.pad.model");

function onRequest() {
	response.setContentType("text/plain; charset=utf-8");
	response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, post-check=0, pre-check=0");
	response.setHeader("Pragma", "no-cache");

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
		var hour=Math.floor(min/60);
		min-=hour*60;
		if(sec<10){sec="0"+sec;}
		if(min<10){min="0"+min;}
		return hour+":"+min+":"+sec;
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

	/* Output buffer */
	var buf="";

	/* Get header pad text */
	var headerText=getPadText("assheader");
	var styles={};
	if(headerText!=false && headerText!=""){
		var tmp=headerText.replace(/[ ]{2,}/g, ' ').split("\n");
		var prev_str="";
		for(k in tmp){
			var str=trim(tmp[k].replace(/;.*/, ""));
			if(str!=prev_str){
				buf+=str+"\r\n";
				prev_str=str;
			}
			// Style parser
			var m=str.match(/^Style:[ ]*([^,]+),(.*)/);
			if(m!=null && typeof(m[2])!="undefined"){
				var styleName=m[1];
				var styleKey=styleName.toLowerCase().replace(/\s+/g, '');
				styles[styleKey]=styleName;
			}
		}
	}else{
		response.write("Can't read assheader pad");
		return true;
	}

	/* Events block header */
	buf+="[Events]\r\n";
	buf+="Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\r\n";

	var missing_style_map = {};
	var lines_with_missing_styles = [];
	
	var lines=padText.replace(/\{[^\{\}]+\}/g, "").replace(/\[[^\[\]]+\]/g, "").replace(/[ ]{2,}/g, ' ').split("\n");
	for(var iLine = 0; iLine < lines.length; ++iLine){
		var str=trim(lines[iLine]);
		// build subtitles
		var m=str.match(/^\[?([0-9]{2}):([0-9]{2}\.[0-9]{1,2}),([0-9\.]+)\]?[ ]*([^:]+):([^\u2192]+)\u2192(.*)/);
		if(m==null)
			m=str.match(/^\[?([0-9]{2}):([0-9]{2}\.[0-9]{1,2}),([0-9\.]+)\]?[ ]*([^:]+):([^а-яА-ЯёЁ\u2192]+)(.*)/);
		if(m!=null && typeof(m[5])!="undefined"){
			var t=parseInt(m[1], 10)*60+parseFloat(m[2]);
			var l=parseFloat(m[3]);
			var name=m[4];
			var styleKey=name.toLowerCase().replace(/\s+/g, '');
			if(typeof(styles[styleKey])!="undefined"){
				name = styles[styleKey];
			}else{
				missing_style_map[name] = true;
				lines_with_missing_styles.push(str);
			}
			var text_en=trim(m[5].replace(/\{[^\{\}]*\}/g, "").replace(/\[[^\[\]]*\]/g, '').replace(/([a-zA-Z][^ ]*) [^a-zA-Z]+$/g, '$1')); // remove symbols from the end of line
			var text_ru=trim(m[6].replace(/\{[^\{\}]*\}/g, "").replace(/\[[^\[\]]*\]/g, '')).replace(/^\u2192[\s]*/, ""); // remove arrow from the start of line
			var text=(lang=="en") ? text_en : text_ru;
			if(name=="Auto" || name=="Multilang"){
				text=trim(text_en+" "+text_ru);
			}
			text=text.replace(/[\s]*\u21B2[\s]*/g, "\\N"); // newline symbol (downwards arrow with tip leftwards)
			if(text!=""){
				buf+="Dialogue: 0,"+htime(t, 2)+","+htime(t+l, 2)+","+name+",,0,0,0,,"+text+"\r\n";
			}
		}
	}

	var missing_styles = [];
	for(name in missing_style_map){
		if(missing_style_map.hasOwnProperty(name)){
			missing_styles.push(name);
		}
	}
	if(missing_styles.length>0){
		if(missing_styles.length==1) {
			response.write("Error: Missing style for "+missing_styles.sort().join(", ")+"\n\nPlease add the style to the \"assheader\" pad (or fix the name in the \""+argv[2]+"\" pad)");
		}else{
			response.write("Error: Missing styles for "+missing_styles.sort().join(", ")+"\n\nPlease add the styles to the \"assheader\" pad (or fix the names in the \""+argv[2]+"\" pad)");
		}
		response.write("\n\n\nLines with missing styles:\n\n"+lines_with_missing_styles.join("\n"));
		return true;
	}

	/* Make this file downloadable */
	response.setHeader("Content-Disposition", "attachment; filename=\""+argv[2]+"_"+lang+".ass\"");

	/* Write UTF BOM */
	response.write("\uFEFF");

	/* Flush data */
	response.write(buf);

	} catch(e) {
		response.write(e);
	}
	return true;
}
