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
				<option value=1 id=c_error_1>Length</option>\
			</select>\
		<span style="margin-left: 30px"/>\
			Download: \
		<a href="'+location.origin+'/assExport/'+pad.getPadId()+'/en" target="_blank">en</a> / \
		<a href="'+location.origin+'/assExport/'+pad.getPadId()+'/ru" target="_blank">ru</a> \
		</div>\
		<div style="float:right">\
			<a href="javascript:subChecker.check();void(0)">Refresh</a> &nbsp; \
			<a href="javascript:subChecker.hide();void(0)">Close</a><br>\
		</div>\
		<div style="clear:both;height:1px"></div>\
		<div id=checker_list style="margin-top:5px;overflow:auto">Checking...</div>\
		';
		var tag=document.createElement("div");
		tag.innerHTML=data;
		tag.id="checker_container";
		tag.style.right="10px";
		tag.style.top="10px";
		tag.style.width="560px";
		document.body.appendChild(tag);
		g("checker_list").style.height="300px";
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
		if(error_level==1){
			check_length();
		}else{
			check_errors(error_level);
		}
	}

	function check_errors(error_level){
		var errors = find_errors();
		var cnt=0;
		var res = '<table id="subs_errors" style="border-spacing:0px">\
				<thead>\
					<tr>\
						<th width=40 align=left>Line</th>\
						<th width=50></th>\
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
		var prevLine = -1;
		var whiteTableRow = false;
		for (i in errors) {
			tcnt[errors[i].level]++;
			if (errors[i].level == error_level || error_level==0) {
				var line = errors[i].line+1-subChecker.line_renumerator_offset;
				var lineHtml = '';
				if (line!=prevLine) {
					whiteTableRow = !whiteTableRow;
					lineHtml = '<a href="javascript:subChecker.go_to_line('+line+');void(0)">'+line+'</a>';
				}
				res += '<tr style="background-color:'+(whiteTableRow?'white':'#e8e8e8')+'">\
					<td style="padding:1px">'+lineHtml+'</td>\
					<td style="padding:1px">'+(errors[i].level>5 ? "Error" : errors[i].level>2 ? "Warn" : "Info")+'</td>\
					<td style="padding:1px">'+(errors[i].lang==0 ? "EN" : errors[i].lang==1 ? "RU" : "*")+'</td>\
					<td style="padding:1px">' + errors[i].descr + '</td></tr>';
				prevLine = line;
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
	
		var padHtml = padeditor.ace.getFormattedCode();
		if(padHtml==subChecker.pad_prev_data)
			return true;
		
		subChecker.pad_prev_data=padHtml;
	
		var padTextLines = padeditor.ace.exportText().replace(/&nbsp;/g, ' ').replace(/\{\\[bi][01]\}/g, ' ').replace(/[ ]{2,}/g, ' ').split("\n");
		var padHtmlLines = padHtml.replace(/&nbsp;/g, ' ').replace(/[ ]{2,}/g, ' ').replace(/<b> /g, ' <b>').split("\n");

		var new_subs=[];
		for(k in padTextLines){
			var line = padTextLines[k];
			var line_html = padHtmlLines[k];
			if(typeof(line) != "string"){ // Shit happens in IE
				continue;
			}
			line = line.trim();
			if(line.search('======')==0){
				subChecker.line_renumerator_offset=parseInt(k)+1;
			}

			// build subtitles
			var lineMatch = line.match(/^\[?([0-9]{2}):([0-9]{2}\.[0-9]{1,2}),([0-9\.]+)\]?[ ]*([^:]+):(.*)$/);
			if(lineMatch != null){
				var time = parseInt(lineMatch[1], 10)*60+parseFloat(lineMatch[2]);
				var duration = parseFloat(lineMatch[3]);
				var name = lineMatch[4].trim();
				var text = lineMatch[5];
				var textMatch = text.match(/^([^\u2192]+)\u2192(.*)$/);
				if(textMatch == null) {
					textMatch = text.match(/^([^а-яА-ЯёЁ\u2192]+)(.*)$/);
				}
				text_en = textMatch[1].replace(/\[[^\[\]]+\]/g, '').replace(/\\N/gi, "\n").trim();
				text_ru = textMatch[2].replace(/\[[^\[\]]+\]/g, '').replace(/^\u2192/, '').replace(/\\N/gi, "\n").trim();
				if(text_en || text_ru) {
					if(name == "Auto" || name == "Multilang"){
						var text_both = (text_en+" "+text_ru).trim();
						text_en = text_both;
						text_ru = text_both;
					}
					new_subs.push([parseInt(k), time, duration, name, [text_en, text_ru, line_html]]);
				}
			}
		}
		subChecker.subs = new_subs;
		return true;
	}

	function highlightSuspiciousSymbols(text, pattern) {
		var hasMatch = false;
		var highlighted = '<span style="color:#999999">' + text.replace(pattern, function(match) {
			hasMatch = true;
			return '<span style="color:tomato;font-weight:bold;">' + match + '</span>';
		}) + '</span>';
		return hasMatch ? highlighted : null;
	}
	
	function find_errors() {
		errors = [];
		var level_error = 10;
		var level_maybe_error = 5;
		var level_info = 2;
	
		var t_prev_end=0;

		for(k in subChecker.subs){
			var line = subChecker.subs[k][0];
			var t = subChecker.subs[k][1];
			var l = subChecker.subs[k][2];
			var name = subChecker.subs[k][3];
			for (lang in subChecker.subs[k][4]) {
				var text = subChecker.subs[k][4][lang];

				if (lang == 2) { // HTML checks
					if (text.match(/<i>/))
						errors.push({level : level_error, line : line, lang: lang, descr : "Курсив в тексте (не зашито?)"});
					if (text.match(/<s>/))
						errors.push({level : level_error, line : line, lang: lang, descr : "Зачёркнутый текст (не зашито?)"});
					if (text.match(/<span +class *= *"author/))
						errors.push({level : level_maybe_error, line : line, lang: lang, descr : "Цветной текст"});
					continue;
				}
	
				if (text.match(/\.\.\./))
					errors.push({level : level_info, line : line, lang: lang, descr : "Неверное троеточие. Стоит заменить на это: …"});
				if (text.match(/[^\!\?\.]\.\.([^\.]|$)/))
					errors.push({level : level_error, line : line, lang: lang, descr : "Две точки без предшествующих ! или ?. Вероятно, имеет место быть ошибка."});
				if (text.match(/\s\-\s/))
					errors.push({level : level_error, line : line, lang: lang, descr : "Минус, окружённый пробелами. Вероятно, имеет место быть ошибка."});
				if (text.replace(/\s\-\s/g, ' ').match(/\+|-[^a-zа-яё]|[^a-zа-яё]-|^-|-$/i))
					errors.push({level : level_error, line : line, lang: lang, descr : "Плюсы или минусы в строке."});
				if (text.match(/\{[^\\}][^}]*\}/) || text.replace(/\{[^}]*\}/g, ' ').match(/[\/\\\(\)\[\]]/))
					errors.push({level : level_error, line : line, lang: lang, descr : "Строка с вариантами или комментариями."});
				if (text.match(/\{[^}]*\\[^}]*\}/))
					errors.push({level : level_info, line : line, lang: lang, descr : "Строка с тегами."});

				var textWithoutTagsAndComments = text.replace(/\[[^\]]*\]/g, ' ').replace(/\{[^}]*\}/g, ' ').replace(/  +/g, ' ');

				if (name == "Auto") {
					var textWithHighlightedSymbols = highlightSuspiciousSymbols(textWithoutTagsAndComments, /[^А-Яа-яЁё0-9«»A-Za-z'.,!?:;…"\u21B2\n \/\\\(\)+—–-]+/g);
					if (textWithHighlightedSymbols) {
						errors.push({level : level_maybe_error, line : line, lang: lang, descr : "Подозрительные символы в субтитрах: " + textWithHighlightedSymbols});
					}
				} else if (lang == 0) { // english subs specific errors
					var textWithHighlightedSymbols = highlightSuspiciousSymbols(textWithoutTagsAndComments, /[^A-Za-z'.,!?:;…"\u21B2\n \/\\\(\)+—–-]+/g);
					if (textWithHighlightedSymbols) {
						errors.push({level : level_maybe_error, line : line, lang: lang, descr : "Подозрительные символы в английских субтитрах: " + textWithHighlightedSymbols});
					}
				} else { // russian subs specific errors
					var textWithHighlightedSymbols = highlightSuspiciousSymbols(textWithoutTagsAndComments, /[^А-Яа-яЁё.,!?:;…"«»\u21B2\n \/\\()+—–-]+/g);
					if (textWithHighlightedSymbols) {
						errors.push({level : level_maybe_error, line : line, lang: lang, descr : "Подозрительные символы в русских субтитрах: " + textWithHighlightedSymbols});
					}
					if (textWithoutTagsAndComments.replace(/[+-]+$/g, '').match(/[^\.\?,!…—:]$/) && name!="Auto")
						errors.push({level : level_info, line : line, lang: lang, descr : "Строка не заканчивается знаком препинания."});
				}
			}
			if(t_prev_end-t>0.006){
				errors.push({level : level_error, line : line, lang: 2, descr : "Наложение реплик в тайминге на "+(t_prev_end-t).toFixed(2)+"с"});
			}
			t_prev_end=t+l;
		}
	
		return errors;
	}

	function pbar(a, b){
		var max_width=185;
		if(Math.max(a, b)>max_width){
			var mul=max_width/Math.max(a, b);
			a*=mul;
			b*=mul;
		}
		a=Math.round(a);
		b=Math.round(b);
		if(b<=a){
			return '<span class=pbar style="width:'+a+'px"><span class=green style="width:'+b+'px"></span></span>';
		}else{
			return '<span class=pbar><span class=green style="width:'+a+'px"></span><span class=red style="width:'+(b-a)+'px"></span></span>';
		}
	}

	function check_length(){
		var res = '<table id="subs_errors" style="border-spacing:0px">\
				<thead>\
					<tr>\
						<th width=40 align=left>Line</th>\
						<th width=40 align=left>EN</th>\
						<th width=40 align=left>RU</th>\
						<th width=190>Слоги</th>\
						<th width=190>Буквы</th>\
						<th width=30 align=left>CPS</th>\
					</tr>\
				</thead>\
				<tbody>';

		var whiteTableRow = false;
		for(k in subChecker.subs){
			var line = subChecker.subs[k][0];
			var dur = subChecker.subs[k][2];
			var en=subChecker.subs[k][4][0];
			var ru=subChecker.subs[k][4][1];
			line = line+1-subChecker.line_renumerator_offset;
			var whiteTableRow = !whiteTableRow;
			lineHtml = '<a href="javascript:subChecker.go_to_line('+line+');void(0)">'+line+'</a>';

			if (ru.replace(/\s\-\s/g, ' ').match(/\+|-[^a-zа-яё]|[^a-zа-яё]-|^-|-$/i) || ru.match(/\{[^\\}][^}]*\}/) || ru.replace(/\{[^}]*\}/g, ' ').match(/[\/\\\(\)\[\]]/)){
				res += '<tr style="background-color:'+(whiteTableRow?'white':'#e8e8e8')+'">\
					<td style="padding:1px">'+lineHtml+'</td>\
					<td style="padding:1px">'+c1+'</td>\
					<td style="padding:1px;font-size:11px;color:#888">??</td>\
					<td style="padding:1px;font-size:11px;color:#888;text-align:center" colspan=2>Строка с вариантами или комментариями.</td>\
					<td>&nbsp;</td></tr>';
				continue;
			}

			var cps=Math.floor(ru.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, "").length/dur).toFixed(0);
			var lines=(typeof(wordwrap)!="function" ? 0 : substr_count(wordwrap(ru.replace(/\\n/g, "\n").replace(/\\N/g, "\n").replace(/\n\n/g, "\n"), 58, "\n", false).trim(), "\n"))+1;
			var c1=subChecker.syllable_count(en);
			var c2=subChecker.syllable_count(ru);
			var diff=c2-c1;
			if(cps.length<2){cps="0"+cps;}
			res += '<tr style="background-color:'+(whiteTableRow?'white':'#e8e8e8')+'">\
				<td style="padding:1px">'+lineHtml+'</td>\
				<td style="padding:1px">'+c1+'</td>\
				<td style="padding:1px">'+c2+'</td>\
				<td style="padding:1px">'+pbar(c1*4, c2*4)+(diff==0 ? '' : ' '+(diff>0?'+':'')+diff)+'</td>\
				<td style="padding:1px'+(lines>2 ? ';background:#F00' : '')+'">'+pbar(en.length*1.9, ru.length*1.9)+'</td>\
				<td style="padding:1px">'+(cps<20 ? cps : '<span style="background:#F00">'+cps+'</span>')+'</td></tr>';
		}
		res += '</tbody></table>';

		g("checker_list").innerHTML=res;
	}

	/* Syllable counting functions */

	function syllable_count_en_word(word) {
		word = word.toLowerCase(); //word.downcase!
		word = word.replace(/[^a-z']/g, '').trim(); // clean from punctuation marks, etc.
		if(word.length < 1) { return 0; } // no word = no syllables
		if(word.length <= 2) { return 1; } // 1 or 2 letter words have always 1 syllable... I guess...
		word = word.replace(/in'$/, 'ing'); // just unroll for exception list
		word = word.replace(/'s$/, 's'); // wrong counting on "there's", dirty hack - "theres" counts right
		// Exception list
		if(word=="something"){return 2;} // was 3
		if(word=="someday"){return 2;} // was 3
		if(word=="every"){return 2;} // was 3
		if(word=="maybe"){return 2;} // was 1
		// Main processing, found somewhere on the Internet. Works awfully.
		word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, ''); //word.sub!(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
		word = word.replace(/^y/, ''); //word.sub!(/^y/, '')
		var m=word.match(/[aeiouy]{1,2}/g);
		if(m==null){return 1;}
		return m.length; //word.scan(/[aeiouy]{1,2}/).size
	}

	function syllable_count_ru_word(word) {
		var vowel  = new String ('аеёиоуыэюя'); // Гласные буквы
		var voiced = new String ('бвгджзлмнрхцчшщ'); // Звонкие и шипящие согласные
		var deaf   = new String ('кпстф'); // Глухие согласные
		var brief  = new String ('й'); // Й
		var other  = new String ('ьъ'); // Другие
		var cons   = new String ('бвгджзйклмнпрстфхцчшщ'); // Все согласные

		word = word.toLowerCase(); //word.downcase!
		var s = word.replace(/[^а-яё]/g, '').trim();
		if(s.length < 1) { return 0; }

		// Есть ли в строке гласные?
		function isNotLastSep (remainStr) {
			var is = false;
			for (var i = 0; i < remainStr.length; i++) {
				if (vowel.indexOf (remainStr.substr (i, 1)) != -1) { is = true; break; }
			}
			return is;
		}

		// Собственно функция разбиения слова на слоги
		// Добавляем слог в массив и начинаем новый слог
		function addSep () {
			sepArr.push (tmpS);
			tmpS = '';
		}

		var tmpL   = new String ();  // Текущий символ
		var tmpS   = new String ();  // Текущий слог
		var sepArr = new Array ();   // Массив слогов
		for (var i = 0; i < s.length; i++) {
			tmpL = s.substr (i, 1);
			tmpS += tmpL;
			// Проверка на признаки конца слогов
			// если буква равна 'й' и она не первая и не последняя и это не последний слог
			if (
			  (i != 0) && 
			  (i != s.length -1) && 
			  (brief.indexOf (tmpL) != -1) &&
			  (isNotLastSep (s.substr (i+1, s.length-i+1)))
			) { addSep (); continue; }
			// если текущая гласная и следующая тоже гласная
			if (
				(i < s.length - 1) && 
				(vowel.indexOf (tmpL) != -1) && 
				(vowel.indexOf (s.substr (i+1, 1)) != -1)
			 ) { addSep (); continue; }
			// если текущая гласная, следующая согласная, а после неё гласная
			if (
				(i < s.length - 2) && 
				(vowel.indexOf (tmpL) != -1) && 
				(cons.indexOf (s.substr (i+1, 1)) != -1) && 
				(vowel.indexOf (s.substr (i+2, 1)) != -1)
			 ) { addSep (); continue; }
			// если текущая гласная, следующая глухая согласная, а после согласная и это не последний слог
			if (
				(i < s.length - 2) && 
				(vowel.indexOf (tmpL) != -1) && 
				(deaf.indexOf (s.substr (i+1, 1)) != -1) && 
				(cons.indexOf (s.substr (i+2, 1)) != -1) &&
				(isNotLastSep (s.substr (i+1, s.length-i+1)))
			) { addSep (); continue; }
			// если текущая звонкая или шипящая согласная, перед ней гласная, следующая не гласная и не другая, и это не последний слог
			if (
				(i > 0) && 
				(i < s.length - 1) && 
				(voiced.indexOf (tmpL) != -1) && 
				(vowel.indexOf (s.substr (i-1, 1)) != -1) && 
				(vowel.indexOf (s.substr (i+1, 1)) == -1) && 
				(other.indexOf (s.substr (i+1, 1)) == -1) && 
				(isNotLastSep (s.substr (i+1, s.length-i+1)))
			) { addSep (); continue; }  
			// если текущая другая, а следующая не гласная если это первый слог
			if (
				(i < s.length - 1) && 
				(other.indexOf (tmpL) != -1) &&
				((vowel.indexOf (s.substr (i+1, 1)) == -1) || 
				(isNotLastSep (s.substr (0, i))))
			) { addSep (); continue; } 
		}
		if(isNotLastSep(tmpS)){
			sepArr.push (tmpS);
		}
		return sepArr.length;
	}

	this.syllable_count = function(str){
		var words=str.replace(/&nbsp;/g, ' ').replace(/[ ]{2,}/g, ' ').split(' ');
		var ret=0;
		for(var i = 0; i < words.length; i++){
			var word=words[i];
			if(word.match(/[а-яА-ЯёЁ]/)){
				ret+=syllable_count_ru_word(word);
			}else if(word.match(/[a-zA-Z]/)){
				ret+=syllable_count_en_word(word);
			}
		}
		return ret;
	}

	function g(id) {
		return document.getElementById(id);
	}

}

/* used on the client side only */
subChecker = new subCheckerInit();
