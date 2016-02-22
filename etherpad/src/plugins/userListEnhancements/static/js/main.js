function userListEnhancementsInit() {
    this.hooks = ['padEditorInitialized', 'userListData'];
    var activityDelay = 30000;
    var pencilDelay = 5000;
    var editEventCallbacks = [];
    
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
            },
            getLastUpdateTime: function(author) {
                return authorToLastUpdate[author];
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
            for (author in authorToLastUpdate) {
                top.paduserlist.userUpdate(author);
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
                    for (var iCallback = 0; iCallback < editEventCallbacks.length; iCallback++) {
                        editEventCallbacks[iCallback](author, lineNumber);
                    }
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
        var lastUpdateTime = lineEditingActivities ? lineEditingActivities.getLastUpdateTime(args.userData.id) : null;
        if (lineNumber && lastUpdateTime) {
            var showPencil = Date.now() - lastUpdateTime <= pencilDelay;
            args.userData.activity = 
                '<span style=' + 
                (canClickOnLink?'cursor:pointer;':'') + '" ' + 
                (canClickOnLink?'onclick="top.lineNumberLinks.onLinkClick(event, \'' + lineNumber + '\');return false;"':'') + '>' +
                    '<span style="font-size:15px;' + (showPencil?'':'visibility:hidden') + '">&#9998;</span> ' + lineNumber +
                '</span>';
        }
        else {
            args.userData.activity = '';
        }
    }
    
    this.addEventListener = function (name, callback) {
        if (name == 'useredit') {
            editEventCallbacks.push(callback);
        }
    }
}

userListEnhancements = new userListEnhancementsInit();
