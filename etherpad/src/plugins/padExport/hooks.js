import("etherpad.log");
import("faststatic");
import("etherpad.utils.*");
import("etherpad.globals.*");
import("dispatch.{Dispatcher,PrefixMatcher,forward}");
import("plugins.padExport.controllers.padExport");

function handlePath() {
  return [[PrefixMatcher('/padExport'), forward(padExport)]];
}
