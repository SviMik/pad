import("etherpad.log");
import("plugins.lineNumberLinks.static.js.main");

function lineNumberLinksInit() {
    this.hooks = [];
    this.client = new main.lineNumberLinksInit();
    this.description = 'Allows the user to link to a specific line in the pad';
    this.install = install;
    this.uninstall = uninstall;
}

function install() {
    log.info("Installing lineNumberLinks");
}

function uninstall() {
    log.info("Uninstalling lineNumberLinks");
}
