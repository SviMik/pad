import("etherpad.log");
import("faststatic");
import("etherpad.utils.*");
import("etherpad.globals.*");

function editBarItemsLeftPad(arg) {
    return arg.template.include('subCheckerButton.ejs', undefined, ['subChecker']);
}
