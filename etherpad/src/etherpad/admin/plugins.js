/**
 * Copyright 2009 RedHog, Egil Möller <egil.moller@piratpartiet.se>
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import("faststatic");
import("dispatch.{Dispatcher,PrefixMatcher,forward}");

import("etherpad.utils.*");
import("etherpad.collab.server_utils");
import("etherpad.globals.*");
import("etherpad.log");
import("etherpad.pad.padusers");
import("etherpad.pro.pro_utils");
import("etherpad.helpers");
import("etherpad.pro.pro_accounts.getSessionProAccount");
import("sqlbase.sqlbase");
import("sqlbase.sqlcommon");
import("sqlbase.sqlobj");
import("exceptionutils");
import("execution");
import("cache_utils.syncedWithCache");

jimport("java.io.File",
        "java.io.DataInputStream", 
        "java.io.FileInputStream",
        "java.lang.Byte",
        "java.io.FileReader",
        "java.io.BufferedReader",
        "net.appjet.oui.JarVirtualFile");


function selectOrInsert(table, columns) {
  var res = sqlobj.selectSingle(table, columns);
  if (res !== null)
    return res;
  sqlobj.insert(table, columns);
  return sqlobj.selectSingle(table, columns);
}


function PluginRegistry() {
  this.pluginModules = {};
  this.plugins = {};
  this.hooks = {};
  this.clientHooks = {}; 
}

PluginRegistry.prototype.loadAvailablePlugin = function (pluginName) {
  if (this.pluginModules[pluginName] != undefined)
    return this.pluginModules[pluginName];

  var pluginsDir = new Packages.java.io.File("src/plugins");

  var pluginFile = new Packages.java.io.File(pluginsDir, pluginName + '/main.js');
  if (pluginFile.exists()) {
    var pluginModulePath = pluginFile.getPath().replace("\\", "/", "g").replace(new RegExp("src/\(.*\)\.js"), "$1").replace("/", ".", "g");
    var importStmt = "import('" + pluginModulePath + "')";
    try {
      var res = execution.fancyAssEval(importStmt, "main;");
      res = new res[pluginName + "Init"]();
      return res;
    } catch (e) {
      log.info({errorLoadingPlugin:exceptionutils.getStackTracePlain(e)});
    }
  }
  return null;
}

PluginRegistry.prototype.loadAvailablePlugins = function () {
  var pluginsDir = new Packages.java.io.File("src/plugins");

  var pluginNames = pluginsDir.list();

  for (i = 0; i < pluginNames.length; i++) {
    var plugin = this.loadAvailablePlugin(pluginNames[i]);
    if (plugin != null)
	this.pluginModules[pluginNames[i]] = plugin
  }
}

PluginRegistry.prototype.loadPluginHooks = function (pluginName) {
  function registerHookNames(hookSet, type) {
    return function (hook) {
      var row = {hook:hook, type:type, plugin:pluginName};
      if (hookSet[hook] == undefined) hookSet[hook] = [];
      hookSet[hook].push(row);
      return row;
    }
  }
  this.plugins[pluginName] = this.pluginModules[pluginName].hooks.map(registerHookNames(this.hooks, 'server'));
  if (this.pluginModules[pluginName].client != undefined && this.pluginModules[pluginName].client.hooks != undefined)
    this.plugins[pluginName] = this.plugins[pluginName].concat(this.pluginModules[pluginName].client.hooks.map(registerHookNames(this.clientHooks, 'client')));
}

PluginRegistry.prototype.unloadPluginHooks = function (pluginName) {
  [this.hooks, this.clientHooks].forEach(function (hookSet) {
    for (var hookName in hookSet) {
      var hook = hookSet[hookName];
      for (i = hook.length - 1; i >= 0; i--)
       if (hook[i].plugin == pluginName) {
	 hook.splice(i, 1);
      }
    }
  });
  delete this.plugins[pluginName];
}

PluginRegistry.prototype.loadInstalledHooks = function () {
  var sql = '' +
   'select ' +
   ' hook.name as hook, ' +
   ' hook_type.name as type, ' +
   ' plugin.name as plugin, ' +
   ' plugin_hook.original_name as original ' +
   'from ' +
   ' plugin ' +
   ' left outer join plugin_hook on ' +
   '  plugin.id = plugin_hook.plugin_id ' +
   ' left outer join hook on ' +
   '  plugin_hook.hook_id = hook.id ' +
   ' left outer join hook_type on ' +
   '  hook.type_id = hook_type.id ' +
   'order by hook.name, plugin.name';

  var rows = sqlobj.executeRaw(sql, {});
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];	

    if (this.plugins[row.plugin] == undefined)
      this.plugins[row.plugin] = [];
    this.plugins[row.plugin].push(row);

    var hookSet;

    if (row.type == 'server')
      hookSet = this.hooks;
    else if (row.type == 'client')
      hookSet = this.clientHooks;

    if (hookSet[row.hook] == undefined)
      hookSet[row.hook] = [];
    if (row.hook != 'null')
      hookSet[row.hook].push(row);
  }
}

PluginRegistry.prototype.saveInstalledHooks = function (pluginName) {
  var plugin = sqlobj.selectSingle('plugin', {name:pluginName});

  if (plugin !== null) {
    sqlobj.deleteRows('plugin_hook', {plugin_id:plugin.id});
    if (this.plugins[pluginName] === undefined)
      sqlobj.deleteRows('plugin', {name:pluginName});
  }

  if (this.plugins[pluginName] !== undefined) {
    if (plugin === null)
      plugin = selectOrInsert('plugin', {name:pluginName});

    for (var i = 0; i < this.plugins[pluginName].length; i++) {
      var row = this.plugins[pluginName][i];

      var hook_type = selectOrInsert('hook_type', {name:row.type});
      var hook = selectOrInsert('hook', {name:row.hook, type_id:hook_type.id});

      sqlobj.insert("plugin_hook", {plugin_id:plugin.id, hook_id:hook.id});
    }
  }
}

PluginRegistry.prototype.enablePlugin = function (pluginName) {
  log.info("enablePlugin(" + pluginName + ")");
  this.loadPluginHooks(pluginName);
  try {
    this.pluginModules[pluginName].install();
    this.saveInstalledHooks(pluginName);
  } catch (e) {
    this.unloadPluginHooks(pluginName);
    throw e;
  }
}

PluginRegistry.prototype.disablePlugin = function (pluginName) {
  log.info("disablePlugin(" + pluginName + ")");
  try {
    this.pluginModules[pluginName].uninstall();
  } catch (e) {
    log.info({errorUninstallingPlugin:exceptionutils.getStackTracePlain(e)});
  }
  this.unloadPluginHooks(pluginName);
  this.saveInstalledHooks(pluginName);
}

PluginRegistry.prototype.registerClientHandlerJS = function () {
  for (pluginName in this.plugins) {
    var plugin = this.pluginModules[pluginName];

    if (this.pluginModules[pluginName] === undefined) {
      log.logException("this.pluginModules doesn't contain registered plugin " + pluginName);
      continue;
    }
    if (this.pluginModules[pluginName].hooks === undefined) {
      log.logException("plugin " + pluginName + " doesn't seem to be a plugin module");
      continue;
    }

    if (plugin.client !== undefined) {
      helpers.includeJs("plugins/" + pluginName + "/main.js");
      if (plugin.client.modules != undefined)
        for (j = 0; j < client.modules.length; j++)
          helpers.includeJs("plugins/" + pluginName + "/" + plugin.client.modules[j] + ".js");
    }
  }
  helpers.addClientVars({hooks:this.clientHooks});
  helpers.includeJs("plugins.js");
}

PluginRegistry.prototype.callHook = function (hookName, args) {
  if (this.hooks[hookName] === undefined)
    return [];
  var res = [];

  for (var i = 0; i < this.hooks[hookName].length; i++) {
    var plugin = this.hooks[hookName][i];

    /* Just assert that the earth is still round sort of... */
    if (this.pluginModules[plugin.plugin] === undefined) {
     log.logException("this.pluginModules doesn't contain registered plugin " + plugin.plugin);
      continue;
    }
    if (this.pluginModules[plugin.plugin].hooks === undefined) {
      log.logException("plugin " + plugin.plugin + " doesn't seem to be a plugin module");
      continue;
    }
    if (this.pluginModules[plugin.plugin][plugin.original || hookName] === undefined) {
      log.logException("plugin " + plugin.plugin + " doesn't contain registered hook " + (plugin.original || hookName));
      continue;
    }
    if (this.plugins[plugin.plugin] === undefined) {
      log.logException("plugin " + plugin.plugin + " isn't registered, but has a registered hook: " + hookName);
      continue;
    }

    var pluginRes = this.pluginModules[plugin.plugin][plugin.original || hookName](args);
    if (pluginRes != undefined && pluginRes != null)
      for (var j = 0; j < pluginRes.length; j++)
        res.push(pluginRes[j]); /* Don't use Array.concat as it flatterns arrays within the array */
  }
  return res;
}

function loadPlugins(force) {
  return syncedWithCache("plugin_registry", function(cache) {
    if (force !== undefined || cache.plugin_registry === undefined) {
      cache.plugin_registry = new PluginRegistry();
      cache.plugin_registry.loadAvailablePlugins();
      cache.plugin_registry.loadInstalledHooks();
    }
    return cache.plugin_registry;
  });
}


/* User API */
function enablePlugin(pluginName) { loadPlugins().enablePlugin(pluginName); }
function disablePlugin(pluginName) { loadPlugins().disablePlugin(pluginName); }
function registerClientHandlerJS() { loadPlugins().registerClientHandlerJS(); }
function callHook(hookName, args) { return loadPlugins().callHook(hookName, args); }

function callHookStr(hookName, args, sep, pre, post) {
  if (sep == undefined) sep = '';
  if (pre == undefined) pre = '';
  if (post == undefined) post = '';
  return callHook(hookName, args).map(function (x) { return pre + x + post}).join(sep || "");
}
