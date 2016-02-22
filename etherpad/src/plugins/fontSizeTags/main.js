import("etherpad.log");
import("plugins.fontSizeTags.static.js.main");

function fontSizeTagsInit() {
 this.hooks = ['editBarItemsLeftPad', 'aceAttribsToClasses', 'aceCreateDomLine'];
 this.description = 'fontSizeTags';
 this.client = new main.fontSizeTagsInit();
 this.editBarItemsLeftPad = editBarItemsLeftPad;
 this.aceAttribsToClasses = this.client.aceAttribsToClasses;
 this.aceCreateDomLine = this.client.aceCreateDomLine;
 this.install = install;
 this.uninstall = uninstall;
}

function install() {
 log.info("Installing fontSizeTags");
}

function uninstall() {
 log.info("Uninstalling fontSizeTags");
}

function editBarItemsLeftPad(arg) {
  return arg.template.include('fontSizeTagsEditbarButtons.ejs', undefined, ['fontSizeTags']);
}
