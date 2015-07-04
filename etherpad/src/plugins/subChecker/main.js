import("etherpad.log");
import("plugins.subChecker.hooks");
import("plugins.subChecker.static.js.main");

function subCheckerInit() {
	this.hooks = ['editBarItemsLeftPad'];
	this.description = 'Subtitle checker';
	this.client = new main.subCheckerInit();
	this.editBarItemsLeftPad = hooks.editBarItemsLeftPad;
	this.install = install;
	this.uninstall = uninstall;
}

function install() {
	log.info("Installing subChecker");
}

function uninstall() {
	log.info("Uninstalling subChecker");
}

