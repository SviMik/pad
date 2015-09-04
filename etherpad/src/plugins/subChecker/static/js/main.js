function subCheckerInit() {
	this.hooks = [];

	this.show = function(){
		if(g("checker_container")){
			g("checker_container").style.display="";
			this.check();
			return;
		}

		// create main div
		var data='\
		<div style="float:left">\
			<select id=c_error_level onchange="subChecker.check()">\
				<option value=0 id=c_error_0>All</option>\
				<option value=10 id=c_error_10>Errors</option>\
				<option value=5 id=c_error_5>Warnings</option>\
				<option value=2 id=c_error_2>Info</option>\
			</select>\
		</div>\
		<div style="float:right">\
			<a href="javascript:subChecker.check();void(0)">Run</a> &nbsp; \
			<a href="javascript:subChecker.hide();void(0)">Close</a><br>\
		</div>\
		<div style="clear:both;height:1px;overflow:hidden"></div>\
		<div id=checker_list style="margin-top:5px">Checking...</div>\
		';
		var tag=document.createElement("div");
		tag.innerHTML=data;
		tag.id="checker_container";
		tag.style.right="10px";
		tag.style.top="10px";
		tag.style.width="560px";
		tag.style.height="230px";
		document.body.appendChild(tag);
		g("checker_list").style.height="200px";
		this.check();
	}

	this.hide = function(){
		g("checker_container").style.display="none";
	}

	this.check = function(){
		if(!pad_parse()){

			g("checker_list").innerHTML="pad_parse() error";
			return;
		}

		var error_level=g("c_error_level") ? parseInt(g("c_error_level").value) : 0;
		var errors = find_errors();
		var cnt=0;
		var res = '<table id="subs_errors">\
				<thead>\
					<tr>\
						<th width=50></th>\
						<th width=40 align=left>Line</th>\
						<th width=40 align=left>Lang</th>\
						<th>Message</th>\
					</tr>\
				</thead>\
				<tbody>';
		
		var tcnt=new Array();
		tcnt[0]=0;
		tcnt[2]=0;
		tcnt[5]=0;
		tcnt[10]=0;
		for (i in errors) {
			tcnt[errors[i].level]++;
			if (errors[i].level == error_level || error_level==0) {
				var line=errors[i].line+1-subChecker.line_renumerator_offset;
				res += '<tr>\
					<td>'+(errors[i].level>5 ? "Error" : "Warn")+'</td>\
					<td><a href="javascript:subChecker.go_to_line('+line+');void(0)">'+line+'</a></td>\
					<td>'+(errors[i].lang==0 ? "EN" : "RU")+'</td>\
					<td>' + errors[i].descr + '</td></tr>';
				cnt++;
			}
			tcnt[0]++;
		}

		res += '</tbody></table>';

		g("c_error_0").innerHTML="All ("+tcnt[0]+")";
		g("c_error_10").innerHTML="Errors ("+tcnt[10]+")";
		g("c_error_5").innerHTML="Warnings ("+tcnt[5]+")";
		g("c_error_2").innerHTML="Info ("+tcnt[2]+")";
		g("checker_list").innerHTML=(cnt>0) ? res : "No errors";
	}

	this.go_to_line = function(line){
		if(typeof(top)!="undefined" && typeof(top.lineNumberLinks)!="undefined"){
			top.lineNumberLinks.onLinkClick(null, line);
		}else{
			alert("lineNumberLinks plugin is not installed");
			console.log("Line: "+(line+1));
		}
	}

	this.pad_prev_data = "";
	this.subs = [];
	this.line_renumerator_offset=0;
	function pad_parse() {
		if(!g("checker_container") || g("checker_container").style.display=="none")
			return false; // stop parsing when checker is hidden
	
		if(typeof(padeditor)=="undefined")
			return false; // no pad - no parsing
	
		var tmp = padeditor.ace.getFormattedCode();
		if(tmp==this.pad_prev_data)
			return true;
		
		this.pad_prev_data=tmp;
	
		var tmp_html = tmp.replace(/&nbsp;/g, ' ').replace(/[ ]{2,}/g, ' ').replace(/<b> /g, ' <b>').split("\n");
		tmp = tmp.replace(/<\/?[^>]+>/gi, '').replace(/\{\\[bi][01]\}/g, ' ').replace(/&nbsp;/g, ' ').replace(/[ ]{2,}/g, ' ').replace(/<b> /g, ' <b>').split("\n");

		var new_subs=[];
		for(k in tmp){
			var str = tmp[k];
			var str_html = tmp_html[k];
			if(typeof(str) != "string"){ // Shit happens in IE
				continue;
			}
			str = str.trim();
			if(str.search('======')==0){
				subChecker.line_renumerator_offset=parseInt(k)+1;
			}

			// build subtitles
			var m = str.match(/^\[?([0-9]{2}):([0-9]{2}\.[0-9]{1,2}),([0-9\.]+)\]?[ ]*([^:]+):([^а-яА-ЯёЁ\u2192]+)(.*)/);
			if(m != null && typeof(m[5]) != "undefined"){
				var t = parseInt(m[1], 10)*60+parseFloat(m[2]);
				var l = parseFloat(m[3]);
				var name = m[4].trim();
				var text_en = m[5].replace(/\[[^\[\]]+\]/g, '').replace(/([a-zA-Z][^ ]*) [^a-zA-Z]+$/g, '$1').trim();
				var text_ru = m[6].replace(/\[[^\[\]]+\]/g, '').trim().replace(/^\u2192[\s]*/, "");
				if(name == "Auto" || name == "Multilang"){
					var text = (text_en+" "+text_ru).trim();
					text_en = text;
					text_ru = text;
				}
				//console.log(t, l, name, text_en, text_ru);
				new_subs.push([parseInt(k), t, l, name, [text_en, text_ru, str_html]]);
			}
		}
		this.subs = new_subs;
		return true;
	}

	function find_errors() {
		errors = [];
		var level_error = 10;
		var level_maybe_error = 5;
		var level_info = 2;
	
		var t_prev_end=0;

		for(k in subs){
			var line = subs[k][0];
			var t = subs[k][1];
			var l = subs[k][2];
			var name = subs[k][3];
			for (lang in subs[k][4]) {
				var text = subs[k][4][lang].replace("\\N", "\n");

				if (lang == 2) { // HTML checks
					if (text.match(/<i>/))
						errors.push({level : level_error, line : line, lang: lang, descr : "Курсив в тексте (не зашито?)"});
					if (text.match(/<s>/))
						errors.push({level : level_error, line : line, lang: lang, descr : "Зачёркнутый текст (не зашито?)"});
					continue;
				}
	
				if (text.match(/\.\.\./))
					errors.push({level : level_error, line : line, lang: lang, descr : "Неверное троеточие. Стоит заменить на это: …"});
				if (text.match(/[^\!\?\.]\.\.[^\.]/))
					errors.push({level : level_maybe_error, line : line, lang: lang, descr : "Две точки без предшествующих ! или ?. Вероятно, имеет место быть ошибка."});
				if (text.match(/\s\-\s/))
					errors.push({level : level_maybe_error, line : line, lang: lang, descr : "Минус, окружённый пробелами. Вероятно, имеет место быть ошибка."});
				if (text.match(/\-\-+/))
					errors.push({level : level_error, line : line, lang: lang, descr : "Несколько минусов подряд. Стоит заменить на – или —."});
				if (text.match(/[\/\\\(\)\[\]]/))
					errors.push({level : level_error, line : line, lang: lang, descr : "Не зашитая строка или комментарии."});
	
				if (lang == 0) { // english subs specific errors
	
				} else { // russian subs specific errors
					if (text.match(/[^\.\?,!…—:]$/) && name!="Auto")
						errors.push({level : level_maybe_error, line : line, lang: lang, descr : "Строка не заканчивается знаком препинания."});
					if (text.match(/a-zA-Z/))
						errors.push({level : level_error, line : line, lang: lang, descr : "Латиница в русских субтитрах."});
				}
				// TODO: unknown symbols
			}
			if(t_prev_end-t>0.006){
				errors.push({level : level_error, line : line, lang: 0, descr : "Наложение реплик в тайминге на "+(t_prev_end-t).toFixed(2)+"с"});
			}
			t_prev_end=t+l;
		}
	
		return errors;
	}
	
	function g(id) {
		return document.getElementById(id);
	}

}

/* used on the client side only */
subChecker = new subCheckerInit();
