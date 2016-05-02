import("etherpad.log");
import("faststatic");
import("etherpad.utils.*");
import("etherpad.globals.*");
import("etherpad.helpers");
import("dispatch.{Dispatcher,PrefixMatcher,forward}");
import("sqlbase.sqlobj");
import("etherpad.pad.model");
import("etherpad.pro.pro_accounts");
import("fastJSON");


var readonlyPad_data = [];

function docBarDropdownsPad(arg) {
    helpers.includeCss('plugins/readonlyPad/readonlyPad.css');
    helpers.includeJs('plugins/readonlyPad/main.js');
    
    return arg.template.include('readonlyPadDropdown.ejs', undefined, ['readonlyPad']);
}

function collabServerUserChanges(args) {
    return [isWritingAllowed(args)];
}

function collabServerClientMessage(args) {
    //log.info({message: 'collabServerClientMessage', args: args});
    if (isWritingAllowed(args) || args.msg && args.msg.payload && args.msg.payload.type=='chat') {
        if (args.msg && args.msg.payload && args.msg.payload.type=='padoptions' && args.msg.payload.options && args.msg.payload.options.view && args.msg.payload.options.view.readonlyPadPolicy!==undefined) {
            log.info({message: 'Changing read-only policy', args: args});
        }
        return [true];
    } else {
        log.info({message: 'Rejected client message', args: args});
        return [false];
    }
}

function collabServerApplyMissedChanges(args) {
    //log.info({message: 'collabServerApplyMissedChanges', args: args});
    if (isWritingAllowed(args)) {
        return [true];
    } else {
        log.info({message: 'Rejected missed changes', args: args});
        return [false];
    }
}

function isWritingToPadAllowed(args) {
    if (isWritingAllowed(args)) {
        return [true];
    } else {
        log.info({message: 'Rejected writing attempt', args: args});
        return [false];
    }
}

function isWritingAllowed(args) {
    var result = true;
    model.accessPadGlobal(args.pad, function(pad) {
        var opts = pad.getPadOptionsObj();
        if(opts.view && opts.view.readonlyPadPolicy==true && !pro_accounts.isAccountSignedIn()) {
            result = false;
        }
    });
    return result;
}
