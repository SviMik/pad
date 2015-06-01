import("etherpad.log");
import("sqlbase.sqlobj");
import("plugins.padExport.hooks");

function padExportInit() {
 this.hooks = ['handlePath'];
 this.description = 'Export pad to HTML with shipping markup';
 this.handlePath = hooks.handlePath;
 this.install = install;
 this.uninstall = uninstall;
}

function install() {
 log.info("Installing padExport");
}

function uninstall() {
 log.info("Uninstalling padExport");
}
