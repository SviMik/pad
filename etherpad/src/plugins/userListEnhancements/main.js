import("etherpad.log");
import("plugins.userListEnhancements.static.js.main");

function userListEnhancementsInit() {
    this.hooks = [];
    this.description = 'Shows the number of the line being edited by the user in the user list.';
    this.client = new main.userListEnhancementsInit();
    this.install = install;
    this.uninstall = uninstall;
}

function install() {
    log.info("Installing userListEnhancements");
}

function uninstall() {
    log.info("Uninstalling userListEnhancements");
}

