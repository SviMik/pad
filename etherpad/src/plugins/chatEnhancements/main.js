import("etherpad.log");
import("plugins.chatEnhancements.static.js.main");

function chatEnhancementsInit() {
    this.hooks = [];
    this.description = 'Highlights quotations in the chat; automatically loads the older messages as the user scrolls the chat up';
    this.client = new main.chatEnhancementsInit();
    this.install = install;
    this.uninstall = uninstall;
}

function install() {
    log.info("Installing chatEnhancements");
}

function uninstall() {
    log.info("Uninstalling chatEnhancements");
}

