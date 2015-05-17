import("etherpad.log");
import("plugins.readonlyPad.hooks");

function readonlyPadInit() {
    this.description = 'With this plugin you can set a public pad to readonly for guests';
    this.hooks = ['docBarDropdownsPad', 'collabServerUserChanges', 'collabServerClientMessage', 'collabServerApplyMissedChanges'];
    this.docBarDropdownsPad = hooks.docBarDropdownsPad;
    this.collabServerUserChanges = hooks.collabServerUserChanges;
	this.collabServerClientMessage = hooks.collabServerClientMessage;
	this.collabServerApplyMissedChanges = hooks.collabServerApplyMissedChanges;
    this.install = install;
    this.uninstall = uninstall;
}

function install() {
    log.info("Installing readonlyPad");
}

function uninstall() {
    log.info("Uninstalling readonlyPad");
}

