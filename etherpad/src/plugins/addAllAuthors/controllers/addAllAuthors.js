import("etherpad.pad.padutils");
import("etherpad.log");
import("etherpad.admin.plugins");
import("etherpad.collab.server_utils");
import("etherpad.pro.pro_pad_db");
import("fastJSON");

function onRequest() {
    var parts = request.path.split('/');
    if (parts.length < 4)
        response.sendError(400, 'Invalid request.');
    var localPadId = server_utils.parseUrlId(parts[3]).localPadId;

    var authors = {};
    var padRecords = pro_pad_db.listAllDomainPads();
    padRecords.sort(function(a, b) {return (+a.lastEditedDate)-(+b.lastEditedDate)});
    padRecords.forEach(function(padRecord) {
        //response.write('<br/><br/>\nPad: ' + (padRecord.localPadId || '') + '<br/>\n');
        //response.write(fastJSON.stringify(padRecord));
        padutils.accessPadLocal(padRecord.localPadId, function(pad) {
            if (pad.exists()) {
                pad.pool().eachAttrib(function (attrib, id) {
                    if (attrib == 'author' && id !== '') {
                        //response.write('<br/>\n');
                        //response.write('author: ' + id);
                        //response.write('&nbsp;&nbsp;&nbsp;&nbsp;');
                        var author = pad.getAuthorData(id);
                        if (author) {
                            //response.write(fastJSON.stringify(author));
                            authors[id] = {};
                            for (key in author) {
                                if (author.hasOwnProperty(key)) {
                                    authors[id][key] = author[key];
                                }
                            }
                        }
                    }
                });
            }
        });
    });
    //response.write('<br/><br/><br/><br/>Authors<br/>\n');
    //response.write(fastJSON.stringify(authors));
    //response.write('<br/><br/><br/><br/>\n');
    
    padutils.accessPadLocal(localPadId, function(pad) {
        if (!pad.exists()) {
            response.sendError(400, 'Pad does not exist.');
        } else {
            var writingAccess = plugins.callHook("isWritingToPadAllowed", {pad: pad.getId()}).every(Boolean);
            if (writingAccess) {
                for (id in authors) {
                    if (authors.hasOwnProperty(id)) {
                        if (!pad.getAuthorData(id)) {
                            pad.setAuthorData(id, authors[id]);
                        }
                    }
                }
                
                var authorsFromText = {};
                pad.eachATextAuthor(pad.atext(), function(id) {
                    authorsFromText[id] = true;
                });

                var authorIds = [];
                pad.pool().eachAttrib(function (attrib, id) {
                    if (attrib == 'author' && id !== '') {
                        authorIds.push(id);
                    }
                });
                authorIds.sort(function (id1, id2) {
                    var prefix1 = id1.charAt(0);
                    var prefix2 = id2.charAt(0);
                    if (prefix1 == 'p' && prefix2 != 'p')
                        return -1;
                    if (prefix1 != 'p' && prefix2 == 'p')
                        return 1;
                    if (prefix1 == 'p' && prefix2 == 'p')
                        return parseInt(id1.substring(2)) - parseInt(id2.substring(2));
                    if (id1 < id2)
                        return -1;
                    if (id1 > id2)
                        return 1;
                    return 0;
                });
                
                response.write('The authors have been added successfully.<br/><br/>');
                response.write('<table style = "border-spacing: 5px;">');
                for (var i = 0; i < authorIds.length; ++i) {
                    var id = authorIds[i];
                    var author = pad.getAuthorData(id);
                    var rowColor = authorsFromText[id] ? 'black' : 'silver';
                    response.write('<tr style = "color: ' + rowColor + ';">');
                    response.write('<td>' + id + '</td>');
                    response.write('<td>' + (author ? fastJSON.stringify(author) : '') + '</td>');
                    response.write('</tr>');
                }
                response.write('</table>');
            }
            else {
                response.sendError(400, 'User doesn\'t have writing access to the pad.');
            }
        }
    }, 'rw');
    return true;
}
