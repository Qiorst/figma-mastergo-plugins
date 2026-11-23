if (typeof figma === "undefined") {
  throw new Error("Figma plugin API was not found.");
}

figma.showUI(__html__, { width: 440, height: 680 });

function postToUi(message) {
  if (figma.ui && typeof figma.ui.postMessage === "function") {
    figma.ui.postMessage(message);
    return true;
  }
  return false;
}

function getSelection() {
  if (figma.currentPage && Array.isArray(figma.currentPage.selection)) {
    return figma.currentPage.selection;
  }

  return [];
}

function getNodeId(node, index) {
  return node && node.id ? String(node.id) : "selection-index-" + index;
}

function nodeCanRename(node) {
  return !!node && typeof node.name === "string";
}

function getSelectionPayload() {
  var selection = getSelection();
  var layers = selection.map(function (node, index) {
    return {
      id: getNodeId(node, index),
      index: index,
      name: node && typeof node.name === "string" ? node.name : "",
      type: node && node.type ? String(node.type) : "UNKNOWN",
      characters: node && node.type === "TEXT" && typeof node.characters === "string" ? node.characters : "",
      canEditText: !!node && node.type === "TEXT" && typeof node.characters === "string",
      canRename: nodeCanRename(node)
    };
  });

  var renameableCount = layers.filter(function (layer) {
    return layer.canRename;
  }).length;

  return {
    type: "selection-status",
    title: selection.length ? "Selection loaded" : "No layers selected",
    detail: selection.length
      ? "Selected " + selection.length + " layer(s), " + renameableCount + " can be renamed."
      : "Select one or more layers, then refresh.",
    hostName: "figma",
    selectionCount: selection.length,
    renameableCount: renameableCount,
    canPostMessage: !!(figma.ui && typeof figma.ui.postMessage === "function"),
    supportsSelectionChange: true,
    layers: layers
  };
}

function sanitizeName(name) {
  var result = String(name || "").replace(/\s+/g, " ").trim();

  if (!result) {
    result = "Untitled";
  }

  if (result.length > 120) {
    result = result.slice(0, 120);
  }

  return result;
}

function applyRenames(items) {
  var selection = getSelection();
  var nodesById = {};
  var nodesByIndex = {};

  selection.forEach(function (node, index) {
    nodesById[getNodeId(node, index)] = node;
    nodesByIndex[index] = node;
  });

  var renamed = 0;
  var failed = [];

  (items || []).forEach(function (item) {
    var node = nodesById[String(item.id)] || nodesByIndex[item.index];
    var nextName = sanitizeName(item.name);

    if (!node) {
      failed.push({ name: nextName, reason: "Layer is no longer selected." });
      return;
    }

    if (!nodeCanRename(node)) {
      failed.push({ name: nextName, reason: "This layer does not expose a writable name." });
      return;
    }

    try {
      node.name = nextName;
      renamed += 1;
    } catch (error) {
      failed.push({
        name: nextName,
        reason: error && error.message ? error.message : "Rename failed."
      });
    }
  });

  postToUi({
    type: failed.length ? "apply-error" : "apply-complete",
    title: failed.length ? "Rename finished with issues" : "Rename complete",
    detail: "Renamed " + renamed + " layer(s)." + (failed.length ? " " + failed.length + " failed." : ""),
    renamed: renamed,
    failed: failed,
    selection: getSelectionPayload()
  });
}


var textApplyBusy = false;
var lastTextRequest = null;
async function applyText(items, requestId) {
  if (textApplyBusy || (requestId && requestId === lastTextRequest)) return;
  textApplyBusy = true;
  lastTextRequest = requestId;
  var renamed = 0;
  var failed = [];
  var selected = {};
  getSelection().forEach(function (node, index) { selected[getNodeId(node, index)] = node; });
  try {
    for (var item of items) {
      var node = selected[String(item.id)];
      try {
        if (!node || node.type !== "TEXT") throw new Error("文字图层已不在选择中，请刷新后重试。");
        if (node.locked) throw new Error("文字图层已锁定。");
        if (typeof figma.loadFontAsync !== "function") throw new Error("当前宿主不支持字体加载。");
        var fonts = [];
        if (node.characters.length && typeof node.getRangeAllFontNames === "function") fonts = node.getRangeAllFontNames(0, node.characters.length);
        else if (node.fontName && node.fontName.family) fonts = [node.fontName];
        if (!fonts.length) throw new Error("无法读取文字字体，请检查字体后重试。");
        for (var font of fonts) await figma.loadFontAsync(font);
        if (!getSelection().some(function (current) { return current.id === node.id; })) throw new Error("选择已改变，请重新预览。");
        var originalName = node.name;
        node.characters = String(item.name == null ? "" : item.name);
        if (node.name !== originalName) node.name = originalName;
        renamed += 1;
      } catch (error) {
        failed.push({ name: item.name, reason: error && error.message ? error.message : "文本更新失败。" });
      }
    }
  } finally { textApplyBusy = false; }
  postToUi({ type: failed.length ? "apply-error" : "apply-complete", renamed: renamed, failed: failed, selection: getSelectionPayload() });
}

function handleMessage(message) {
  var payload = message && message.pluginMessage ? message.pluginMessage : message;

  if (!payload || !payload.type) {
    return;
  }

  if (payload.type === "refresh-selection") {
    postToUi(getSelectionPayload());
    return;
  }

  if (payload.type === "apply-text") {
    applyText(payload.items || [], payload.requestId);
    return;
  }

  if (payload.type === "apply-renames") {
    applyRenames(payload.items || []);
  }
}

figma.ui.onmessage = handleMessage;

figma.on("selectionchange", function () {
  postToUi(getSelectionPayload());
});

postToUi(getSelectionPayload());
