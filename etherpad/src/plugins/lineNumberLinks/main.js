import("etherpad.log");
import("plugins.lineNumberLinks.static.js.main");

function lineNumberLinksInit() {
    this.hooks = ['editBarItemsLeftPad'];
    this.client = new main.lineNumberLinksInit();
    this.description = 'Allows the user to link to a specific line in the pad';
	this.editBarItemsLeftPad = editBarItemsLeftPad;
    this.install = install;
    this.uninstall = uninstall;
}

function install() {
    log.info("Installing lineNumberLinks");
}

function uninstall() {
    log.info("Uninstalling lineNumberLinks");
}

function editBarItemsLeftPad(arg) {
    return arg.template.include('lineNumberLinksButtons.ejs', undefined, ['lineNumberLinks']);
}
