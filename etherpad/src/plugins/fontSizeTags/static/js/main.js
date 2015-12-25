function fontSizeTagsInit() {
    this.hooks = ['aceAttribsToClasses', 'aceCreateDomLine', 'collectContentPre', 'collectContentPost'];
    this.aceAttribsToClasses = aceAttribsToClasses;
    this.aceCreateDomLine = aceCreateDomLine;
    this.collectContentPre = collectContentPre;
    this.collectContentPost = collectContentPost;
    this.smallButtonClicked = smallButtonClicked;
    this.bigButtonClicked = bigButtonClicked;
    
    var fontSizePercentBig = 131;
    var fontSizePercentSmall = 70;
    
    function aceAttribsToClasses(args) {
      if (args.key == 'fontSizeTagsBig' && args.value != '') {
        return ['fontSizeTagsBig:' + args.value];
      }
      else if (args.key == 'fontSizeTagsSmall' && args.value != '') {
        return ['fontSizeTagsSmall:' + args.value];
      }
    }

    function aceCreateDomLine(args) {
        if (args.cls.indexOf('fontSizeTagsBig:') >= 0) {
            cls = args.cls.replace(/(^| )fontSizeTagsBig:(\S+)/g, function(x0, space, padtagsearch) { return ''; });
            return [{cls: cls, extraOpenTags: '<big class = "fontSizeTagsBig" style = "font-size: ' + fontSizePercentBig + '%;">', extraCloseTags: '</big>'}];
        }
        else if (args.cls.indexOf('fontSizeTagsSmall:') >= 0) {
            cls = args.cls.replace(/(^| )fontSizeTagsSmall:(\S+)/g, function(x0, space, padtagsearch) { return ''; });
            return [{cls: cls, extraOpenTags: '<small class = "fontSizeTagsSmall" style = "font-size: ' + fontSizePercentSmall + '%;">', extraCloseTags: '</small>'}];
        }
    }

    function bigButtonClicked(event) {
        padeditor.ace.callWithAce(function (ace) {
            ace.ace_setAttributeOnSelection('fontSizeTagsSmall', '');
            ace.ace_toggleAttributeOnSelection('fontSizeTagsBig');
        }, 'fontSizeTags', true);
    }

    function smallButtonClicked(event) {
        padeditor.ace.callWithAce(function (ace) {
            ace.ace_setAttributeOnSelection('fontSizeTagsBig', '');
            ace.ace_toggleAttributeOnSelection('fontSizeTagsSmall');
        }, 'fontSizeTags', true);
    }

    function collectContentPre(args) {
        try {
            var attrib = null;
            if (args.tname == 'big' || args.cls == 'fontSizeTagsBig') {
                attrib = 'fontSizeTagsBig';
            }
            else if (args.tname == 'small' || args.cls == 'fontSizeTagsSmall') {
                attrib = 'fontSizeTagsSmall';
            }
            else if (args.styl && args.styl.indexOf('font') >= 0) {
                var match = args.styl.match(/font(-size)?\s*:\s*([\d.]+)(px|%)/i);
                if (match) {
                    var fontUnit = match[3];
                    var fontSize = parseFloat(match[2]);
                    if(fontUnit == '%' || padeditor.ace.getProperty) {
                        var fontSizePercent = fontUnit == '%' ? fontSize : fontSize * 100 / padeditor.ace.getProperty('textsize');
                        if (fontSizePercent <= fontSizePercentSmall*1.05) {
                            attrib = 'fontSizeTagsSmall';
                        }
                        else if (fontSizePercent >= fontSizePercentBig*0.95) {
                            attrib = 'fontSizeTagsBig';
                        }
                    }
                }
            }
            if (attrib) {
                var oppositeAttrib = attrib == 'fontSizeTagsBig' ? 'fontSizeTagsSmall' : 'fontSizeTagsBig';
                if (typeof args.state.attribs[oppositeAttrib] == 'number') {
                    while (args.state.attribs[oppositeAttrib] > 0) {
                        args.cc.decrementAttrib(args.state, oppositeAttrib);
                        args.excludedLocalAttribs = args.excludedLocalAttribs || {};
                        args.excludedLocalAttribs[oppositeAttrib] = args.excludedLocalAttribs[oppositeAttrib] || 0;
                        args.excludedLocalAttribs[oppositeAttrib]++;
                    }
                }
                args.cc.doAttrib(args.state, attrib);
            }
        }
        catch (e) {
            (console.error || console.log).call(console, e);
        }    
    }

    function collectContentPost(args) {
        if (typeof args.excludedLocalAttribs == 'object') {
            for (attrib in args.excludedLocalAttribs) {
                if (args.excludedLocalAttribs.hasOwnProperty(attrib) && typeof args.excludedLocalAttribs[attrib] == 'number') {
                    while (args.excludedLocalAttribs[attrib] > 0) {
                        args.cc.incrementAttrib(args.state, attrib);
                        --args.excludedLocalAttribs[attrib];
                    }
                }
            }
        }
    }
}

fontSizeTags = new fontSizeTagsInit();
