import("etherpad.log");
import("plugins.keyBindings.static.js.main");

function keyBindingsInit() {
 this.hooks = [];
 this.description = 'Adds useful hotkeys.';
 this.client = new main.keyBindingsPluginInit();
 this.install = install;
 this.uninstall = uninstall;
}

function install() {
 log.info("Installing keyBindings");
}

function uninstall() {
 log.info("Uninstalling keyBindings");
}

