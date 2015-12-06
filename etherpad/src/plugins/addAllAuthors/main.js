import("dispatch.{PrefixMatcher,forward}");
import("plugins.addAllAuthors.controllers.addAllAuthors");
import("etherpad.log");

function addAllAuthorsInit() {
    this.hooks = ['handlePath'];
    this.description = 'Adds all registered users\' colors to the specified pad';
    this.handlePath = handlePath;
    this.install = install;
    this.uninstall = uninstall;
}

function handlePath() {
    return [[PrefixMatcher('/ep/addAllAuthors'), forward(addAllAuthors)]];
}

function install() {
    log.info("Installing addAllAuthors");
}

function uninstall() {
    log.info("Uninstalling addAllAuthors");
}
