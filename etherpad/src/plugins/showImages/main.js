/*
 * This plugin turns image paths into inline images in the document.
 * Images must be hosted elsewhere.
 *  Note that the same functionality has been hacked into exportHTML,
 *  in a not-too-wonderful way. So you might want to watch out for that.
 */
import("etherpad.log");
import("plugins.showImages.static.js.main");

function showImagesInit() {
 this.hooks = [];
 this.client = new main.showImagesInit(); 
 this.description = 'Render images inline';
 this.install = install;
 this.uninstall = uninstall;
}

function install() {
 log.info("Installing inlineImages");
}

function uninstall() {
 log.info("Uninstalling inlineImages");
}
