import("etherpad.log");
import("plugins.desktopNotifications.static.js.main");

function desktopNotificationsInit() {
    this.hooks = [];
    this.description = 'Show a desktop notification when a chat message is received';
    this.client = new main.desktopNotificationsPluginInit();
    this.install = install;
    this.uninstall = uninstall;
}

function install() {
    log.info("Installing desktopNotifications");
}

function uninstall() {
    log.info("Uninstalling desktopNotifications");
}

