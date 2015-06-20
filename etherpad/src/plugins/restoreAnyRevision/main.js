import("etherpad.log");
import("dispatch.{PrefixMatcher,forward}");
import("plugins.restoreAnyRevision.controllers.restorerevision");
import("plugins.restoreAnyRevision.static.js.main.restoreAnyRevisionPluginInit");

function restoreAnyRevisionInit() {
    this.hooks = ['handlePath'];
    this.description = 'Allows the user to restore a revision from the time slider page';
    this.handlePath = handlePath;
    this.client = new restoreAnyRevisionPluginInit();
    this.install = install;
    this.uninstall = uninstall;
}

function handlePath() {
    return [[PrefixMatcher('/ep/restorerevision'), forward(restorerevision)]];
}

function install() {
    log.info("Installing restoreAnyRevision");
}

function uninstall() {
    log.info("Uninstalling restoreAnyRevision");
}
