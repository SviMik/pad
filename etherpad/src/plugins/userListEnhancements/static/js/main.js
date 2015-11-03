function userListEnhancementsInit() {
    this.hooks = ['padEditorInitialized', 'userListData'];
    var activityDelay = 5000;
    
    function LineEditingActivities() {
        var authorToLineNumber = {};
        var authorToLastUpdate = {};

        var self = {
            update: function(author, lineNumber) {
                if (lineNumber===null) {
                    delete authorToLineNumber[author];
                    delete authorToLastUpdate[author];
                }
                else {
                    authorToLineNumber[author] = lineNumber;
                    authorToLastUpdate[author] = Date.now();
                }
                top.paduserlist.userUpdate(author);
            },
            getLineNumber: function(author) {
                return authorToLineNumber[author];
            }
        };

        window.setInterval(function() {
            var authors = [];
            for (author in authorToLastUpdate) {
                if (authorToLastUpdate.hasOwnProperty(author) && Date.now() - authorToLastUpdate[author] > activityDelay) {
                    authors.push(author);
                }
            }
            for (var i = 0; i < authors.length; ++i) {
                self.update(authors[i], null);
            }
        }, 500);
        
        return self;
    }
    
    var lineEditingActivities;
    
    this.padEditorInitialized = function () {
        var oldApplyChangesToBase = padeditor.ace.applyChangesToBase;
        padeditor.ace.applyChangesToBase = applyChangesToBase;
        lineEditingActivities = new LineEditingActivities();
        var Changeset = $('iframe:not([src])').contents().find('body#outerdocbody iframe')[0].contentWindow.Changeset
        function applyChangesToBase(changeset, author, pool) {
            oldApplyChangesToBase(changeset, author, pool); 
            try {
                var unpacked = Changeset.unpack(changeset);
                var csIter = Changeset.opIterator(unpacked.ops);

                if (csIter.hasNext()) {
                    var op = csIter.next();
                    var lineNumber;
                    if (op.opcode == '=') {
                        lineNumber = parseInt(op.lines);
                    }
                    else {
                        lineNumber = 0;
                    }
                    if (window.lineRenumerator) {
                        if (lineNumber < lineRenumerator.getLinesOffset()) {
                            lineNumber = 'A' + (lineNumber + 1);
                        }
                        else {
                            lineNumber = parseInt(lineNumber) - lineRenumerator.getLinesOffset() + 1;
                        }
                    }
                    lineEditingActivities.update(author, lineNumber);
                }
            }
            catch (e) {
                console.exception(e);
            }
        }
    }
    
    this.userListData = function (args) {
		var canClickOnLink = top && top.lineNumberLinks;
        var lineNumber = lineEditingActivities ? lineEditingActivities.getLineNumber(args.userData.id) : null;
        if (lineNumber) {
            args.userData.activity = 
                '<span style=' + 
                (canClickOnLink?'cursor:pointer;':'') + '" ' + 
                (canClickOnLink?'onclick="top.lineNumberLinks.onLinkClick(event, \'' + lineNumber + '\');return false;"':'') + '>' +
                    '<span style="font-size:15px;">&#9998;</span> ' + lineNumber +
                '</span>';
        }
        else {
            args.userData.activity = '';
        }
    }
}

userListEnhancements = new userListEnhancementsInit();
