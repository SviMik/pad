function fontSizeTagsInit() {
    this.hooks = ['aceAttribsToClasses', 'aceCreateDomLine', 'collectContentPre'];
    this.aceAttribsToClasses = aceAttribsToClasses;
    this.aceCreateDomLine = aceCreateDomLine;
    this.collectContentPre = collectContentPre;
    this.smallButtonClicked = smallButtonClicked;
    this.bigButtonClicked = bigButtonClicked;
    
    var fontSizeBig = 17;
    var fontSizeSmall = 11;
    
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
            var fontSizeStr = top && top.pad ? fontSizeBig + 'px' : '130%';
            return [{cls: cls, extraOpenTags: '<big class = "fontSizeTagsBig" style = "font-size: ' + fontSizeStr + ';">', extraCloseTags: '</big>'}];
        }
        else if (args.cls.indexOf('fontSizeTagsSmall:') >= 0) {
            cls = args.cls.replace(/(^| )fontSizeTagsSmall:(\S+)/g, function(x0, space, padtagsearch) { return ''; });
            var fontSizeStr = top && top.pad ? fontSizeSmall + 'px' : '80%';
            return [{cls: cls, extraOpenTags: '<small class = "fontSizeTagsSmall" style = "font-size: ' + fontSizeStr + ';">', extraCloseTags: '</small>'}];
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
        if (args.tname == 'big' || args.cls == 'fontSizeTagsBig') {
            args.cc.doAttrib(args.state, 'fontSizeTagsBig');
        }
        else if (args.tname == 'small' || args.cls == 'fontSizeTagsSmall') {
            args.cc.doAttrib(args.state, 'fontSizeTagsSmall');
        }
        else if (args.styl && args.styl.indexOf('font') >= 0) {
            var match = args.styl.match(/font(-size)?\s*:\s*(\d+)px/i);
            if (match) {
                if (parseInt(match[2]) <= fontSizeSmall) {
                    args.cc.doAttrib(args.state, 'fontSizeTagsSmall');
                }
                else if (parseInt(match[2]) >= fontSizeBig) {
                    args.cc.doAttrib(args.state, 'fontSizeTagsBig');
                }
            }
        }
    }
}

fontSizeTags = new fontSizeTagsInit();
