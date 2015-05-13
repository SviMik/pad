import("etherpad.log");
import("sqlbase.sqlobj");
import("plugins.assExport.hooks");

function assExportInit() {
 this.hooks = ['handlePath'];
 this.description = 'Export .ass subtitles';
 this.handlePath = hooks.handlePath;
 this.install = install;
 this.uninstall = uninstall;
}

function install() {
 log.info("Installing assExport");
}

function uninstall() {
 log.info("Uninstalling assExport");
}
