import("etherpad.log");
import("plugins.moreColors.static.js.main");

function moreColorsInit() {
    this.hooks = [];
    this.description = 'Adds more colors to pad.';
    this.client = new main.moreColorsPluginInit();
    this.install = install;
    this.uninstall = uninstall;
}

function install() {
    log.info("Installing moreColors");
}

function uninstall() {
    log.info("Uninstalling moreColors");
}

