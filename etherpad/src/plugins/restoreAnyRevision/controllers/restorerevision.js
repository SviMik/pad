import("etherpad.pad.model");
import("etherpad.pad.padutils");
import("etherpad.log");
import("etherpad.admin.plugins");
import("etherpad.collab.server_utils");
import("etherpad.collab.collab_server");

function onRequest() {
    var parts = request.path.split('/');
    if (parts.length < 5)
        response.sendError(400, 'Invalid request.');
    var localPadId = server_utils.parseUrlId(parts[3]).localPadId;
    var rev = Number(parts[4]);
    if (isNaN(rev)) {
        response.sendError(400, 'Invalid revision number.');
    }
    padutils.accessPadLocal(localPadId, function(pad) {
        if (!pad.exists()) {
            response.sendError(400, 'Pad does not exist.');
        }
        else if (rev < 0 || rev > pad.getHeadRevisionNumber()) {
            response.sendError(400, 'Revision does not exist.');
        } else {
            var writingAccess = plugins.callHook("isWritingToPadAllowed", {pad: pad.getId()}).every(Boolean);
            if (writingAccess) {
                var atext = pad.getInternalRevisionAText(rev);
                collab_server.setPadAText(pad, atext);
                log.info('Restored revision ' + rev);
            }
            else {
                response.sendError(400, 'User doesn\'t have writing access to the pad.');
            }
        }
    }, 'rw');
    return true;
}
