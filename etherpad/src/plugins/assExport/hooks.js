import("etherpad.log");
import("faststatic");
import("etherpad.utils.*");
import("etherpad.globals.*");
import("dispatch.{Dispatcher,PrefixMatcher,forward}");
import("plugins.assExport.controllers.assExport");

function handlePath() {
  return [[PrefixMatcher('/assExport'), forward(assExport)]];
}
