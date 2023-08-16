// ==================================================
// POLYFILLS
// ==================================================
$.writeln("=== POLYFILLS ===");
if (!Array.prototype.map) {
  $.writeln("Polyfilling Array.map...");
  Array.prototype.map = function (callBack) {
    if (this === null) {
      throw new TypeError("this is null or not defined");
    }
    var newArray = [];
    for (var i = 0; i < this.length; i++) {
      newArray.push(callBack(this[i]));
    }
    return newArray;
  };
}
if (!Array.prototype.filter) {
  $.writeln("Polyfilling Array.filter...");
  Array.prototype.filter = function (callback) {
    if (this === null) {
      throw new TypeError("this is null or not defined");
    }
    var output = [];
    for (var i = 0; i < this.length; i++) {
      if (callback(this[i])) {
        output.push(this[i]);
      }
    }
    return output;
  };
}
if (!String.prototype.repeat) {
  $.writeln("Polyfilling String.repeat...");
  String.prototype.repeat = function (count) {
    var str = this.toString();

    count = +count;

    if (count != count) count = 0;

    if (count < 0) return this;

    count = Math.floor(count);
    if (str.length == 0 || count == 0) return "";

    var maxCount = str.length * count;
    count = Math.floor(Math.log(count) / Math.log(2));
    while (count) {
      str += str;
      count--;
    }
    str += str.substring(0, maxCount - str.length);
    return str;
  };
}
// External Objects
if (ExternalObject.AdobeXMPScript === undefined) {
  ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
}

// ==================================================
// MAIN
// ==================================================

$.writeln("=== STARTING SCRIPT ===");

var appVersion = Number(app.version.substring(0, 2));
var fontsEnabled = appVersion >= 24;

var scriptSection = "PCT Selfie Video";
var scriptSettingStrings = {
  compsFolder: "compsFolder",
  finalComp: "finalComp",
};
var bgSolidName = "BG-DO NOT DELETE OR RENAME";
var bgSolid = getByName(bgSolidName, app.project, true);

var defaults = {
  createCompDuration: 10,
  createLayerScale: 100,
  createPrefix: "comp_",
  fontNameLoc: "AlegreyaSansSC-BlackItalic",
  fontSizeLoc: 150,
  fontTopLoc: 130,
  fontLeftLoc: 25,
  fontNameDate: "AlegreyaSansSC-BlackItalic",
  fontSizeDate: 80,
  fontBottomDate: 50,
  fontLeftDate: 25,
  outTransition: 0.5,
  outImageDuration: 1.25,
  xmpNs: "NS_IPTC_CORE",
  xmpProperty: "Location",
};
var minSizeTextNumber = [40, -1];

var project = app.project;
var compsFolder;
if (app.settings.haveSetting(scriptSection, scriptSettingStrings.compsFolder)) {
  var s = app.settings.getSetting(
    scriptSection,
    scriptSettingStrings.compsFolder
  );
  compsFolder = app.project.itemByID(Number(s));
  if (compsFolder) {
    $.writeln("Loading compsFolder as '" + compsFolder.name + "'...");
  }
}
var finalComp;
if (app.settings.haveSetting(scriptSection, scriptSettingStrings.finalComp)) {
  var s = app.settings.getSetting(
    scriptSection,
    scriptSettingStrings.finalComp
  );
  finalComp = app.project.itemByID(Number(s));
  if (finalComp) {
    $.writeln("Loading finalComp as '" + finalComp.name + "'...");
  }
}

// ==================================================
// CREATE THE WINDOW
// ==================================================
$.writeln("Creating the window...");

var dims = getWindowDims();
var mainWindow = new Window("window", "PCT Helpers");
var windowX = dims.width - 375;
var windowY = 0;
mainWindow.location = [windowX, windowY];
mainWindow.preferredSize = [350, -1];
mainWindow.alignChildren = "fill";

var title = mainWindow.add("statictext", undefined, "PCT Selfie Video");

// ==================================================
// CREATE COMP FROM IMAGE
// ==================================================
var panelCreate = mainWindow.add("panel", undefined, "panelCreate");
panelCreate.orientation = "column";
panelCreate.alignChildren = "fill";
panelCreate.text = "Create Composition(s)";

// Set the comps folder
var compsFolderLabel = panelCreate.add(
  "statictext",
  undefined,
  compsFolder ? "Comps Folder: " + compsFolder.name : "Not set..."
);
var buttonSetCompsFolder = panelCreate.add(
  "button",
  undefined,
  "Set comps folder"
);
buttonSetCompsFolder.onClick = function () {
  $.writeln("Setting comps folder...");
  var selection = app.project.selection[0];
  if (selection instanceof FolderItem) {
    compsFolder = selection;
    compsFolderLabel.text = "Comps Folder: " + selection.name;
    app.settings.saveSetting(
      scriptSection,
      scriptSettingStrings.compsFolder,
      selection.id
    );
  }
};

// Create settings
var groupCreateDur = panelCreate.add("group", undefined, "groupCreateDur");
groupCreateDur.orientation = "row";
groupCreateDur.add("statictext", undefined, "Duration (s)");
var createCompDuration = groupCreateDur.add(
  "edittext",
  undefined,
  defaults.createCompDuration
);
createCompDuration.minimumSize = minSizeTextNumber;
groupCreateDur.add("statictext", undefined, "Image Scale (%)");
var createLayerScale = groupCreateDur.add(
  "edittext",
  undefined,
  defaults.createLayerScale
);
createLayerScale.minimumSize = minSizeTextNumber;

//
var groupCreatePrefix = panelCreate.add(
  "group",
  undefined,
  "groupCreatePrefix"
);
groupCreatePrefix.orientation = "row";
groupCreatePrefix.alignChildren = "fill";
groupCreatePrefix.add("statictext", undefined, "Prefix");
var createPrefix = groupCreatePrefix.add(
  "edittext",
  undefined,
  defaults.createPrefix
);
createPrefix.minimumSize = [80, -1];

//
var buttonCreateComp = panelCreate.add(
  "button",
  undefined,
  "Create comps from selection"
);
buttonCreateComp.onClick = function () {
  app.beginUndoGroup("Create comps from images");
  $.writeln("Creating comps from images...");
  var selection = app.project.selection;
  doSomethingRecursively(selection, createCompFromItem);
  app.endUndoGroup();
};

// ==================================================
// ADD LOCATION TEXT
// ==================================================
var panelLocation = mainWindow.add("panel", undefined, "PanelLocation");
panelLocation.orientation = "column";
panelLocation.alignChildren = "fill";
panelLocation.text = "Location Text Layers";

var fontFamilies = fontsEnabled
  ? flattenArray(app.fonts.allFonts)
      .map(function (font) {
        return font.postScriptName;
      })
      .sort()
  : ["AlegreyaSansSC-BlackItalic"];
var selectedFontFamily = panelLocation.add(
  "dropdownlist",
  undefined,
  fontFamilies
);
selectedFontFamily.title = "Font Family";
selectedFontFamily.selection = selectedFontFamily.find(defaults.fontNameLoc);

var groupTextLocation = panelLocation.add(
  "group",
  undefined,
  "groupTextLocation"
);
groupTextLocation.orientation = "row";

groupTextLocation.add("statictext", undefined, "Size");
var selectedFontSize = groupTextLocation.add(
  "edittext",
  undefined,
  defaults.fontSizeLoc
);
selectedFontSize.minimumSize = minSizeTextNumber;

groupTextLocation.add("statictext", undefined, "Top");
var textLocationTop = groupTextLocation.add(
  "edittext",
  undefined,
  defaults.fontTopLoc
);
textLocationTop.minimumSize = minSizeTextNumber;

groupTextLocation.add("statictext", undefined, "Left");
var textLocationLeft = groupTextLocation.add(
  "edittext",
  undefined,
  defaults.fontLeftLoc
);
textLocationLeft.minimumSize = minSizeTextNumber;

var xmpNsOptions = getXmpKeys();
var selectedXmpNs = panelLocation.add("dropdownlist", undefined, xmpNsOptions);
selectedXmpNs.title = "XMP Namespace";
selectedXmpNs.selection = selectedXmpNs.find(defaults.xmpNs);

var groupXmp = panelLocation.add("group", undefined, "groupXmp");
groupXmp.orientation = "row";

groupXmp.add("statictext", undefined, "XMP Property");
var xmpProperty = groupXmp.add("edittext", undefined, defaults.xmpProperty);
xmpProperty.minimumSize = [80, -1];

var colorColorColorLocation = [1, 1, 1];
var buttonColorLoc = panelLocation.add(
  "button",
  undefined,
  "Color: " + colorColorColorLocation.toString()
);
buttonColorLoc.onClick = function () {
  $.writeln("Picking a location color...");
  var color = $.colorPicker(-1);
  colorColorColorLocation = integerToRgbArray(color);
  buttonColorLoc.text = "Color: " + colorColorColorLocation.toString();
};

var buttonAddLocationText = panelLocation.add(
  "button",
  undefined,
  "Add locations to selection"
);
buttonAddLocationText.onClick = function () {
  app.beginUndoGroup("Add location to comps");
  $.writeln("Adding location to comps...");
  var selection = app.project.selection;
  doSomethingRecursively(selection, addLocationTextToComp);
  app.endUndoGroup();
};

// ==================================================
// ADD DATE TEXT
// ==================================================
var panelDate = mainWindow.add("panel", undefined, "panelDate");
panelDate.orientation = "column";
panelDate.alignChildren = "fill";
panelDate.text = "Date Text Layers";

var selectedFontFamilyDate = panelDate.add(
  "dropdownlist",
  undefined,
  fontFamilies
);
selectedFontFamilyDate.title = "Font Family";
selectedFontFamilyDate.selection = selectedFontFamilyDate.find(
  defaults.fontNameDate
);

var groupTextDate = panelDate.add("group", undefined, "groupTextDate");
groupTextDate.orientation = "row";

groupTextDate.add("statictext", undefined, "Size");
var selectedFontSizeDate = groupTextDate.add(
  "edittext",
  undefined,
  defaults.fontSizeDate
);
selectedFontSizeDate.minimumSize = minSizeTextNumber;

groupTextDate.add("statictext", undefined, "Bottom");
var textDateBottom = groupTextDate.add(
  "edittext",
  undefined,
  defaults.fontBottomDate
);
textDateBottom.minimumSize = minSizeTextNumber;

groupTextDate.add("statictext", undefined, "Left");
var textDateLeft = groupTextDate.add(
  "edittext",
  undefined,
  defaults.fontLeftDate
);
textDateLeft.minimumSize = minSizeTextNumber;

var colorColorColorDate = [1, 1, 1];
var buttonColor = panelDate.add(
  "button",
  undefined,
  "Color: " + colorColorColorDate.toString()
);
buttonColor.onClick = function () {
  $.writeln("Picking a color...");
  var color = $.colorPicker(-1);
  colorColorColorDate = integerToRgbArray(color);
  buttonColor.text = "Color: " + colorColorColorDate.toString();
};

var buttonAddDateText = panelDate.add(
  "button",
  undefined,
  "Add dates to selection"
);
buttonAddDateText.onClick = function () {
  app.beginUndoGroup("Add dates to comps");
  $.writeln("Adding dates to comps...");
  var selection = app.project.selection;
  if (!selection) {
    alert("Select a comp first");
    return;
  }
  doSomethingRecursively(selection, addDateTextToComp);
  app.endUndoGroup();
};

// ==================================================
// CHANGE COMP DURATION
// ==================================================
var panelDuration = mainWindow.add("panel", undefined, "PanelDuration");
panelDuration.orientation = "column";
panelDuration.alignChildren = "fill";
panelDuration.text = "Composition(s) Duration";

var groupDuration = panelDuration.add("group", undefined, "groupDuration");
groupDuration.orientation = "row";
groupDuration.alignChildren = "fill";
groupDuration.add("statictext", undefined, "Duration (s)");
var durationPerComp = groupDuration.add(
  "edittext",
  undefined,
  defaults.createCompDuration
);
durationPerComp.minimumSize = minSizeTextNumber;

var buttonDuration = panelDuration.add(
  "button",
  undefined,
  "Set duration for selection"
);
buttonDuration.onClick = function () {
  app.beginUndoGroup("Set comp duration");
  $.writeln("Setting comp duration...");
  var selection = app.project.selection;
  doSomethingRecursively(selection, adjustCompDuration);
  app.endUndoGroup();
};

// ==================================================
// OUTPUT COMP
// ==================================================
var panelOut = mainWindow.add("panel", undefined, "PanelOutput");
panelOut.orientation = "column";
panelOut.alignChildren = "fill";
panelOut.text = "Output";

// Set output comp
var finalCompLabel = panelOut.add(
  "statictext",
  undefined,
  finalComp ? "Final Comp: " + finalComp.name : "Not set..."
);
var buttonSetOutputComp = panelOut.add("button", undefined, "Set output comp");
buttonSetOutputComp.onClick = function () {
  $.writeln("Setting output comp...");
  var selection = app.project.selection[0];
  if (selection instanceof CompItem) {
    finalComp = selection;
    finalCompLabel.text = "Final Comp: " + selection.name;
    app.settings.saveSetting(
      scriptSection,
      scriptSettingStrings.finalComp,
      selection.id
    );
  }
};

// Add comps to output
var buttonAddToOutputComp = panelOut.add(
  "button",
  undefined,
  "Add selection to output comp"
);
buttonAddToOutputComp.onClick = function () {
  if (!finalComp instanceof FolderItem) {
    alert("Select a output comp first");
    return;
  }
  app.beginUndoGroup("Add comps to final");
  $.writeln("Adding comps to output comp...");
  var selection = app.project.selection;
  doSomethingRecursively(selection, addCompToFinal);
  app.endUndoGroup();
};

var groupOut = panelOut.add("group", undefined, "groupOut");
groupOut.orientation = "row";
groupOut.alignChildren = "fill";
groupOut.add("statictext", undefined, "Image Duration (s)");
var secondsPerImage = groupOut.add(
  "edittext",
  undefined,
  defaults.outImageDuration
);
secondsPerImage.minimumSize = minSizeTextNumber;

groupOut.add("statictext", undefined, "Transition Time (s)");
var secondsPerTransition = groupOut.add(
  "edittext",
  undefined,
  defaults.outTransition
);
secondsPerTransition.minimumSize = minSizeTextNumber;

var buttonProcessOutput = panelOut.add(
  "button",
  undefined,
  "Process output comp"
);
buttonProcessOutput.onClick = function () {
  if (!finalComp instanceof FolderItem) {
    alert("Select a output comp first");
    return;
  }

  app.beginUndoGroup("Process final comp");
  $.writeln("Processing final comp...");
  processFinalCompLayers();
  app.endUndoGroup();
};

// ==================================================
// SHOW WINDOW
// ==================================================
mainWindow.show();

// ==================================================
// FUNCTIONS
// ==================================================
function createCompFromItem(item) {
  if (!compsFolder instanceof FolderItem) {
    alert("Select a comps folder first");
    return;
  }
  if (!finalComp instanceof FolderItem) {
    alert(
      "Select a output comp first.\nThis will be used to determine comp dimensions, etc."
    );
    return;
  }

  if (
    item instanceof FootageItem &&
    /\.(jpg|jpeg|png|gif)$/i.test(item.file.fsName)
  ) {
    $.writeln("Creating comp from " + item.name);
    var name = getFileNameWithoutExtension(item.name);
    var compName = createPrefix.text + name;
    var duration = Number(createCompDuration.text);

    var scale = Number(createLayerScale.text);
    var height = finalComp.height;
    if (item.height < height) {
      scale = (height / item.height) * scale;
    }

    // Create the comp
    var compItem = compsFolder.items.addComp(
      compName,
      finalComp.width,
      height,
      finalComp.pixelAspect,
      duration,
      finalComp.frameRate.toFixed(4)
    );

    // Add the image
    var layer = compItem.layers.add(item);
    layer.startTime = 0;
    layer.duration = duration;
    layer.scale.setValue([scale, scale]);
    layer.name = name;
    // layer.width = finalComp.width;
    // layer.height = finalComp.height;

    // Add a black background
    addBackgroundToComp(compItem);
  }
}

function addLocationTextToComp(comp) {
  comp.openInViewer();

  $.writeln("Adding location text to " + comp.name);

  // GET THE LOCATION DATA FROM THE IMAGE
  var imageLayer = comp.layers[comp.numLayers - 1];
  var fsName = imageLayer.source.file.fsName;

  var xmpFile = new XMPFile(
    fsName,
    XMPConst.FILE_UNKNOWN,
    // XMPConst.OPEN_FOR_READ
    XMPConst.OPEN_ONLY_XMP
  );
  var xmp = xmpFile.getXMP();
  var locationProp = xmp.getProperty(
    XMPConst[selectedXmpNs.selection.text],
    xmpProperty.text
  );

  if (!locationProp) {
    alert(
      "Property: " +
        xmpProperty.text +
        " not found in namespace (" +
        XMPConst[selectedXmpNs.selection.text] +
        ") for file " +
        imageLayer.name
    );
    return;
  }

  var location = locationProp.toString();

  // CREATE THE TEXT LAYER
  var startTime = 0;
  var endTime = comp.duration;

  var sizeScale = finalComp.height / 1080;
  var distanceFromTop = Number(textLocationTop.text) * sizeScale;
  var distanceFromLeft = Number(textLocationLeft.text) * sizeScale;
  var position = [0 + distanceFromLeft, distanceFromTop];

  var textLayer = comp.layers.addText(location);
  textLayer.startTime = startTime;
  textLayer.inPoint = startTime;
  textLayer.outPoint = endTime;
  textLayer.name = "Text - " + location;
  textLayer.property("Position").setValue(position);
  var sourceText = textLayer.property("Source Text");
  var sourceDoc = sourceText.value;
  sourceDoc.fontSize = Number(selectedFontSize.text) * sizeScale;
  sourceDoc.font = selectedFontFamily.selection.text;
  sourceDoc.fillColor = colorColorColorLocation;
  sourceText.setValue(sourceDoc);

  // CREATE THE DROP SHADOW
  $.writeln("Adding drop shadow to " + comp.name);
  addDropShadowToTextLayer(textLayer);
}

function addDateTextToComp(comp) {
  comp.openInViewer();

  $.writeln("Adding date text to " + comp.name);

  // GET THE DATE DATA FROM THE IMAGE
  var imageLayer = comp.layers[comp.numLayers - 1];
  var fsName = imageLayer.source.file.fsName;

  var xmpFile = new XMPFile(
    fsName,
    XMPConst.FILE_UNKNOWN,
    XMPConst.OPEN_ONLY_XMP
  );
  var xmp = xmpFile.getXMP();
  var dateProp = xmp.getProperty(XMPConst.NS_XMP, "CreateDate");

  if (!dateProp) {
    alert("No creation date found in image metadata");
    return;
  }

  var dateString = formatDateString(dateProp.toString());

  // CREATE THE TEXT LAYER
  var startTime = 0;
  var endTime = comp.duration;
  var sizeScale = finalComp.height / 1080;
  var height = comp.height;
  var distanceFromBottom = Number(textDateBottom.text) * sizeScale;
  var distanceFromLeft = Number(textDateLeft.text) * sizeScale;
  var position = [0 + distanceFromLeft, height - distanceFromBottom];

  // textLayer.property("Source Text").setValue(dateString);
  var textLayer = comp.layers.addText(dateString);
  textLayer.name = "Text - " + dateString;

  textLayer.startTime = startTime;
  textLayer.inPoint = startTime;
  textLayer.outPoint = endTime;
  textLayer.property("Position").setValue(position);

  var sourceText = textLayer.property("Source Text");
  var sourceDoc = sourceText.value;
  sourceDoc.fontSize = Number(selectedFontSizeDate.text) * sizeScale;
  sourceDoc.font = selectedFontFamilyDate.selection.text;
  sourceDoc.fillColor = colorColorColorDate;
  sourceText.setValue(sourceDoc);

  // CREATE THE DROP SHADOW
  $.writeln("Adding drop shadow to " + comp.name);
  addDropShadowToTextLayer(textLayer);
}

function addDropShadowToTextLayer(textLayer) {
  var stylesProperty = "Layer Styles";
  var shadowProperty = "Drop Shadow";
  var dropShadowCommandId = 9000;

  var ls = textLayer(stylesProperty);
  if (!ls.enabled || !ls(shadowProperty).enabled) {
    textLayer.selected = true;
    // Execute the menu command. You can't do this through code.
    app.executeCommand(dropShadowCommandId);
  }
  var ds = textLayer(stylesProperty)(shadowProperty);
  var scale = comp.height / bgLayer.height;
  ds("Opacity").setValue(100);
  ds("Size").setValue(17 * scale);
  ds("Distance").setValue(5 * scale);
}

function addBackgroundToComp(comp) {
  $.writeln("Adding background to " + comp.name);

  var bgLayer;
  if (!isValid(bgSolid)) {
    bgLayer = comp.layers.addSolid(
      [0, 0, 0],
      bgSolidName,
      comp.width,
      comp.height,
      comp.pixelAspect,
      comp.duration
    );
    bgSolid = getByName(bgSolidName, app.project, true);
  } else {
    bgLayer = comp.layers.add(bgSolid);
    var scale = (comp.height / bgLayer.height) * 100;
    bgLayer.scale.setValue([scale, scale]);
  }
  bgLayer.moveToEnd();
}

function addCompToFinal(comp) {
  addCompToComp(comp, finalComp);
}

function addCompToComp(comp, destComp) {
  $.writeln("Adding comp (" + comp.name + ") to comp (" + destComp.name + ")");
  var newLayer = destComp.layers.add(comp);
  newLayer.moveToEnd();
}

function processFinalCompLayers() {
  finalComp.openInViewer();

  // NOTE The order of properties is the same as it is displayed inside the app
  // EFFECT NAME: Block Dissolve
  // MATCH NAME: AE.ADBE Block Dissolve
  // • Property 0: Transition Completion
  // • Property 1: Block Width
  // • Property 2: Block Height
  // • Property 3: Feather
  // • Property 4:
  var effectsProperty = "ADBE Effect Parade";
  var dissolveProperty = "ADBE Block Dissolve";
  var durVisible = Number(secondsPerImage.text);
  var durTrans = Number(secondsPerTransition.text);
  var durTotal = durVisible + durTrans;

  var compTotalTime = durVisible * finalComp.numLayers;
  finalComp.duration = compTotalTime + 1;
  finalComp.time = 0;
  finalComp.workAreaStart = 0.0;
  finalComp.workAreaDuration = finalComp.duration;

  for (var i = 0; i < finalComp.numLayers; i++) {
    var layer = finalComp.layers[i + 1];

    var pointStart = i * durVisible - durTrans;
    var pointOut = pointStart + durTotal;
    var transStart = pointOut - durTrans;

    layer.startTime = pointStart;
    layer.inPoint = 0;
    layer.outPoint = pointOut;

    if (layer(effectsProperty)(dissolveProperty)) {
      layer(effectsProperty)(dissolveProperty).remove();
    }
    layer(effectsProperty).addProperty(dissolveProperty);
    var dis = layer.property(effectsProperty)(dissolveProperty);

    dis.property("Feather").setValue(100);

    var transComplete = dis.property("Transition Completion");
    var keyIn = transComplete.addKey(pointStart);
    var keyTransStart = transComplete.addKey(transStart);
    var keyOut = transComplete.addKey(pointOut);

    transComplete.setValueAtKey(keyIn, 0);
    transComplete.setValueAtKey(keyTransStart, 0);
    transComplete.setValueAtKey(keyOut, 100);
  }
}

function adjustCompDuration(comp) {
  // comp.openInViewer();

  var dur = Number(durationPerComp.text);

  $.writeln("Setting " + comp.name + " duration to " + dur);

  comp.duration = dur;

  for (var i = 0; i < comp.numLayers; i++) {
    var layer = comp.layers[i + 1];
    layer.startTime = 0;
    layer.inPoint = 0;
    layer.outPoint = dur;
  }
}

// ==================================================
// UTILITIES
// ==================================================
function flattenArray(arr) {
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    // if (Array.isArray(arr[i])) {
    if (arr[i] instanceof Array) {
      result = result.concat(flattenArray(arr[i]));
    } else {
      result.push(arr[i]);
    }
  }
  return result;
}

function getFolderByName(name, parent, recursive) {
  for (var i = 1; i <= parent.numItems; i++) {
    var currentItem = parent.item(i);
    if (currentItem instanceof FolderItem) {
      if (currentItem.name === name) {
        return currentItem;
      } else if (recursive) {
        var temp = getFolderByName(name, currentItem, true);
        if (temp instanceof FolderItem) {
          return temp;
        }
      }
    }
  }
}

function doSomethingRecursively(items, fn) {
  for (var i = 0; i < items.length; i++) {
    var item = items instanceof ItemCollection ? items[i + 1] : items[i];
    if (item instanceof FolderItem) {
      doSomethingRecursively(item.items, fn);
    } else if (item instanceof CompItem || item instanceof FootageItem) {
      fn(item);
    }
  }
}

function getFileNameWithoutExtension(filename) {
  var lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex <= 0) {
    return filename;
  }
  var filenameWithoutExtension = filename.substring(0, lastDotIndex);
  return filenameWithoutExtension;
}

function getWindowDims() {
  var raw = $.screens.toString();
  var regex = /(\d+):(\d+)-(\d+):(\d+)/;
  var match = raw.match(regex);

  if (match) {
    var width = parseInt(match[3]);
    var height = parseInt(match[4]);
    return { width: width, height: height };
  } else {
    return null;
  }
}

function getByName(name, parent, recursive, type) {
  for (var i = 1; i <= parent.numItems; i++) {
    var currentItem = parent.item(i);
    if (currentItem.name === name) {
      return currentItem;
    }
    if (recursive && currentItem instanceof FolderItem) {
      var temp = getFolderByName(name, currentItem, true);
      if (isValid(temp)) {
        return temp;
      }
    }
  }
}

function getKeys(obj) {
  var out = [];
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      out.push(key);
    }
  }
  return out;
}

function getXmpKeys() {
  return [
    "NS_DC",
    "NS_IPTC_CORE",
    "NS_RDF",
    "NS_XML",
    "NS_XMP",
    "NS_XMP_RIGHTS",
    "NS_XMP_MM",
    "NS_XMP_BJ",
    "NS_XMP_NOTE",
    "NS_PDF",
    "NS_PDFX",
    "NS_PHOTOSHOP",
    "NS_PS_ALBUM",
    "NS_EXIF",
    "NS_EXIF_AUX",
    "NS_TIFF",
    "NS_PNG",
    "NS_JPEG",
    "NS_SWF",
    "NS_JPK",
    "NS_CAMERA_RAW",
    "NS_DM",
    "NS_ADOBE_STOCK_PHOTO",
    "NS_ASF",
  ];
}

function integerToRgbArray(integer) {
  integer = Math.min(Math.max(integer, 0), 16777215); // 16777215 is the decimal equivalent of the maximum hex color value (FFFFFF).
  // var red = Math.floor(integer / (256 * 256)) % 256;
  // var green = Math.floor(integer / 256) % 256;
  // var blue = integer % 256;
  var red = ((Math.floor(integer / (256 * 256)) % 256) / 255).toFixed(2);
  var green = ((Math.floor(integer / 256) % 256) / 255).toFixed(2);
  var blue = ((integer % 256) / 255).toFixed(2);
  return [red, green, blue];
}

function formatDateString(inputDate) {
  var months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Split the input string into date and time parts
  var dateTimeParts = inputDate.split("T");
  var datePart = dateTimeParts[0];

  // Split the date part into year, month, and day
  var dateComponents = datePart.split("-");
  var year = parseInt(dateComponents[0]);
  var monthIndex = parseInt(dateComponents[1]) - 1; // Month index starts from 0
  var day = parseInt(dateComponents[2]);

  // Get the abbreviated month name
  var monthAbbrev = months[monthIndex];

  // Construct the formatted date string
  var formattedDate = monthAbbrev + " " + day + " " + year;

  return formattedDate;
}

// ==================================================
// UNUSED BUT LIKELY HELPFUL
// ==================================================
function createFolder(parent, name) {
  if (activeItem.typeName !== "Folder") {
    alert("Please select a folder");
  }

  var folder = parent.items.addFolder(name);
  return folder;
}

function renameItem(item, name) {
  item.name = name;
}

function padNumberWithZeros(number, length) {
  var numberString = number.toString();

  var zerosToAdd = Math.max(0, length - numberString.length);

  var zeroString = "0".repeat(zerosToAdd);

  var paddedNumberString = zeroString + numberString;

  return paddedNumberString;
}

function formatDateToCustomString(inputDate) {
  var months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  var year = inputDate.getFullYear();
  var monthIndex = inputDate.getMonth();
  var day = inputDate.getDate();

  var formattedDate = months[monthIndex] + " " + day + " " + year;

  return formattedDate;
}
