import("etherpad.log");
import("plugins.ponyNamesDecorator.static.js.main");

function ponyNamesDecoratorInit() {
	this.hooks = [];
	this.description = 'Colors ponies names.';
	this.client = new main.ponyNamesDecoratorInit();
	this.install = install;
	this.uninstall = uninstall;
}

function install() {
	log.info("Installing ponyNamesDecorator");
}

function uninstall() {
	log.info("Uninstalling ponyNamesDecorator");
}

