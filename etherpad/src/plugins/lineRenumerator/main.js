import("etherpad.log");
import("plugins.lineRenumerator.static.js.main");

function lineRenumeratorInit() {
    this.hooks = [];
    this.description = 'Starts line numeration from ===========';
    this.client = new main.lineRenumeratorPluginInit();
    this.install = install;
    this.uninstall = uninstall;
}

function install() {
    log.info("Installing lineRenumerator");
}

function uninstall() {
    log.info("Uninstalling lineRenumerator");
}

