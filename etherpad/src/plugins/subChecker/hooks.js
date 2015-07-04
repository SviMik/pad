import("etherpad.log");
import("faststatic");
import("etherpad.utils.*");
import("etherpad.globals.*");
import("etherpad.helpers");

function editBarItemsLeftPad(arg) {
    helpers.includeCss('plugins/subChecker/pad.css');
    return arg.template.include('subCheckerButton.ejs', undefined, ['subChecker']);
}
