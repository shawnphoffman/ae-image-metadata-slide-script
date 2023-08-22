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

var panelGlobal = this;

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
  createCompDuration: 5,
  createLayerScale: 188,
  createPrefix: "comp_",
  fontNameLoc: "OpenSans-Bold",
  fontSizeLoc: 110,
  fontTopLoc: 1800,
  fontLeftLoc: 200,
  fontNameDate: "OpenSans-Bold",
  fontSizeDate: 140,
  fontTopDate: 1975,
  fontLeftDate: 200,
  outTransition: 0.4,
  outImageDuration: 1.0,
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
  try {
    compsFolder = app.project.itemByID(Number(s));
  } catch (err) {
    $.writeln("Error loading compsFolder: " + err);
  }
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

var dialog = (function () {
  $.writeln("Creating the window...");

  // ==================================================
  // DIALOG
  // ==================================================
  var dialog =
    panelGlobal instanceof Panel ? panelGlobal : new Window("palette");
  if (!(panelGlobal instanceof Panel)) {
    dialog.text = "Photo Helper";
  }
  dialog.preferredSize.width = 300;
  dialog.orientation = "column";
  dialog.alignChildren = ["fill", "top"];
  dialog.spacing = 10;
  dialog.margins = 16;

  // PANEL1
  // ======
  var panel1 = dialog.add("panel", undefined, undefined, { name: "panel1" });
  panel1.text = "Create Composition";
  panel1.orientation = "column";
  panel1.alignChildren = ["fill", "top"];
  panel1.spacing = 10;
  panel1.margins = 10;
  panel1.alignment = ["fill", "top"];

  // PANEL2
  // ======
  var panel2 = panel1.add("panel", undefined, undefined, { name: "panel2" });
  panel2.text = compsFolder
    ? "Comps Folder: " + compsFolder.name
    : "Not set...";
  panel2.orientation = "column";
  panel2.alignChildren = ["fill", "center"];
  panel2.spacing = 10;
  panel2.margins = 10;

  var button1 = panel2.add("button", undefined, undefined, { name: "button1" });
  button1.text = "Set Comps Folder";
  button1.alignment = ["fill", "center"];
  button1.onClick = function () {
    $.writeln("Setting comps folder...");
    var selection = app.project.selection[0];
    if (selection instanceof FolderItem) {
      compsFolder = selection;
      panel2.text = "Comps Folder: " + selection.name;
      app.settings.saveSetting(
        scriptSection,
        scriptSettingStrings.compsFolder,
        selection.id
      );
    }
  };

  // GROUP1
  // ======
  var group1 = panel1.add("group", undefined, { name: "group1" });
  group1.orientation = "row";
  group1.alignChildren = ["center", "center"];
  group1.spacing = 5;
  group1.margins = 0;

  var statictext2 = group1.add("statictext", undefined, undefined, {
    name: "statictext2",
  });
  statictext2.text = "Duration (s)";

  var createCompDuration = group1.add(
    'edittext {properties: {name: "edittext1"}}'
  );
  createCompDuration.text = defaults.createCompDuration;
  createCompDuration.preferredSize.width = 35;

  var divider1 = group1.add("panel", undefined, undefined, {
    name: "divider1",
  });
  divider1.alignment = "fill";

  var statictext3 = group1.add("statictext", undefined, undefined, {
    name: "statictext3",
  });
  statictext3.text = "Image Scale (%)";

  var createLayerScale = group1.add(
    'edittext {properties: {name: "edittext2"}}'
  );
  createLayerScale.text = defaults.createLayerScale;
  createLayerScale.preferredSize.width = 40;

  // GROUP2
  // ======
  var group2 = panel1.add("group", undefined, { name: "group2" });
  group2.orientation = "row";
  group2.alignChildren = ["center", "center"];
  group2.spacing = 5;
  group2.margins = 0;

  var statictext4 = group2.add("statictext", undefined, undefined, {
    name: "statictext4",
  });
  statictext4.text = "Prefix";

  var createPrefix = group2.add(
    'edittext {properties: {name: "createPrefix"}}'
  );
  createPrefix.text = defaults.createPrefix;
  createPrefix.preferredSize.width = 75;

  // PANEL1
  // ======
  var button2 = panel1.add("button", undefined, undefined, { name: "button2" });
  button2.text = "Create Comps from Selection";
  button2.onClick = function () {
    app.beginUndoGroup("Create comps from images");
    $.writeln("Creating comps from images...");
    var selection = app.project.selection;
    doSomethingRecursively(selection, createCompFromItem);
    app.endUndoGroup();
  };

  // PANEL3
  // ======
  var panel3 = dialog.add("panel", undefined, undefined, { name: "panel3" });
  panel3.text = "Location Text";
  panel3.orientation = "column";
  panel3.alignChildren = ["left", "top"];
  panel3.spacing = 10;
  panel3.margins = 10;

  // PANEL4
  // ======
  var panel4 = panel3.add("panel", undefined, undefined, { name: "panel4" });
  panel4.text = "XMP";
  panel4.orientation = "column";
  panel4.alignChildren = ["center", "top"];
  panel4.spacing = 10;
  panel4.margins = 10;
  panel4.alignment = ["fill", "top"];

  var xmpNsOptions = getXmpKeys();
  var selectedXmpNs = panel4.add("dropdownlist", undefined, undefined, {
    name: "selectedXmpNs",
    items: xmpNsOptions,
  });
  selectedXmpNs.helpTip = "Namespace";
  selectedXmpNs.selection = selectedXmpNs.find(defaults.xmpNs);
  selectedXmpNs.alignment = ["fill", "top"];

  // GROUP3
  // ======
  var group3 = panel4.add("group", undefined, { name: "group3" });
  group3.orientation = "row";
  group3.alignChildren = ["center", "center"];
  group3.spacing = 10;
  group3.margins = 0;
  group3.alignment = ["fill", "top"];

  var statictext5 = group3.add("statictext", undefined, undefined, {
    name: "statictext5",
  });
  statictext5.text = "Property";

  var xmpProperty = group3.add('edittext {properties: {name: "xmpProperty"}}');
  xmpProperty.text = defaults.xmpProperty;
  xmpProperty.preferredSize.width = 175;
  xmpProperty.alignment = ["center", "fill"];

  // PANEL5
  // ======
  var panel5 = panel3.add("panel", undefined, undefined, { name: "panel5" });
  panel5.text = "Font";
  panel5.orientation = "column";
  panel5.alignChildren = ["left", "top"];
  panel5.spacing = 10;
  panel5.margins = 10;
  panel5.alignment = ["fill", "top"];

  var fontFamilies = fontsEnabled
    ? flattenArray(app.fonts.allFonts)
        .map(function (font) {
          return font.postScriptName;
        })
        .sort()
    : ["AlegreyaSansSC-BlackItalic"];
  var selectedFontFamily = panel5.add("dropdownlist", undefined, undefined, {
    name: "selectedFontFamily",
    items: fontFamilies,
  });
  selectedFontFamily.helpTip = "Font Family";
  selectedFontFamily.selection = selectedFontFamily.find(defaults.fontNameLoc);
  selectedFontFamily.alignment = ["fill", "top"];

  // GROUP4
  // ======
  var group4 = panel5.add("group", undefined, { name: "group4" });
  group4.orientation = "row";
  group4.alignChildren = ["center", "center"];
  group4.spacing = 5;
  group4.margins = 0;
  group4.alignment = ["fill", "top"];

  var statictext6 = group4.add("statictext", undefined, undefined, {
    name: "statictext6",
  });
  statictext6.text = "Size";

  var selectedFontSize = group4.add(
    'edittext {properties: {name: "selectedFontSize"}}'
  );
  selectedFontSize.text = defaults.fontSizeLoc;

  var divider2 = group4.add("panel", undefined, undefined, {
    name: "divider2",
  });
  divider2.alignment = "fill";

  var statictext7 = group4.add("statictext", undefined, undefined, {
    name: "statictext7",
  });
  statictext7.text = "Top";

  var textLocationTop = group4.add(
    'edittext {properties: {name: "textLocationTop"}}'
  );
  textLocationTop.text = defaults.fontTopLoc;

  var divider3 = group4.add("panel", undefined, undefined, {
    name: "divider3",
  });
  divider3.alignment = "fill";

  var statictext8 = group4.add("statictext", undefined, undefined, {
    name: "statictext8",
  });
  statictext8.text = "Left";

  var textLocationLeft = group4.add(
    'edittext {properties: {name: "textLocationLeft"}}'
  );
  textLocationLeft.text = defaults.fontLeftLoc;

  var divider4 = group4.add("panel", undefined, undefined, {
    name: "divider4",
  });
  divider4.alignment = "fill";

  var colorColorColorLocation = "0xFFFFFF";
  var button3 = group4.add("button", undefined, undefined, { name: "button3" });
  button3.size = [20, 20];
  button3.fillBrush = button3.graphics.newBrush(
    button3.graphics.BrushType.SOLID_COLOR,
    [1, 1, 1]
  );
  button3.preferredSize.height = 20;
  button3.justify = "left";
  updateButtonColour(button3, [1, 1, 1]);

  button3.onClick = function () {
    var colorPickerRes = $.colorPicker(colorColorColorLocation);
    if (colorPickerRes != -1) {
      var r = colorPickerRes >> 16;
      var g = (colorPickerRes & 0x00ff00) >> 8;
      var b = colorPickerRes & 0xff;
      $.writeln("selected a colour");
      colorColorColorLocation = colorPickerRes;
      updateButtonColour(button3, [r / 255, g / 255, b / 255]);
    } else {
      $.writeln("did not select a colour");
    }
  };

  // GROUP5
  // ======
  var group5 = panel3.add("group", undefined, { name: "group5" });
  group5.orientation = "row";
  group5.alignChildren = ["left", "center"];
  group5.spacing = 20;
  group5.margins = 0;
  group5.alignment = ["center", "top"];

  // TODO
  // var checkbox1 = group5.add("checkbox", undefined, undefined, {
  //   name: "checkbox1",
  // });
  // checkbox1.text = "Replace?";

  var buttonAddLocationText = group5.add("button", undefined, undefined, {
    name: "buttonAddLocationText",
  });
  buttonAddLocationText.text = "Add Location to Selection";
  buttonAddLocationText.alignment = ["left", "fill"];
  buttonAddLocationText.onClick = function () {
    app.beginUndoGroup("Add location to comps");
    $.writeln("Adding location to comps...");
    var selection = app.project.selection;
    doSomethingRecursively(selection, addLocationTextToComp);
    app.endUndoGroup();
  };

  // PANEL6
  // ======
  var panel6 = dialog.add("panel", undefined, undefined, { name: "panel6" });
  panel6.text = "Date Text";
  panel6.orientation = "column";
  panel6.alignChildren = ["left", "top"];
  panel6.spacing = 10;
  panel6.margins = 10;

  // PANEL7
  // ======
  var panel7 = panel6.add("panel", undefined, undefined, { name: "panel7" });
  panel7.text = "Font";
  panel7.orientation = "column";
  panel7.alignChildren = ["left", "top"];
  panel7.spacing = 10;
  panel7.margins = 10;
  panel7.alignment = ["fill", "top"];

  var selectedFontFamilyDate = panel7.add(
    "dropdownlist",
    undefined,
    undefined,
    {
      name: "selectedFontFamilyDate",
      items: fontFamilies,
    }
  );
  selectedFontFamilyDate.helpTip = "Font Family";
  selectedFontFamilyDate.selection = selectedFontFamilyDate.find(
    defaults.fontNameDate
  );
  selectedFontFamilyDate.alignment = ["fill", "top"];

  // GROUP6
  // ======
  var group6 = panel7.add("group", undefined, { name: "group6" });
  group6.orientation = "row";
  group6.alignChildren = ["center", "center"];
  group6.spacing = 6;
  group6.margins = 0;
  group6.alignment = ["fill", "top"];

  var statictext9 = group6.add("statictext", undefined, undefined, {
    name: "statictext9",
  });
  statictext9.text = "Size";

  var selectedFontSizeDate = group6.add(
    'edittext {properties: {name: "selectedFontSizeDate"}}'
  );
  selectedFontSizeDate.text = defaults.fontSizeDate;

  var divider5 = group6.add("panel", undefined, undefined, {
    name: "divider5",
  });
  divider5.alignment = "fill";

  var statictext10 = group6.add("statictext", undefined, undefined, {
    name: "statictext10",
  });
  statictext10.text = "Top";

  var textDateTop = group6.add('edittext {properties: {name: "textDateTop"}}');
  textDateTop.text = defaults.fontTopDate;

  var divider6 = group6.add("panel", undefined, undefined, {
    name: "divider6",
  });
  divider6.alignment = "fill";

  var statictext11 = group6.add("statictext", undefined, undefined, {
    name: "statictext11",
  });
  statictext11.text = "Left";

  var textDateLeft = group6.add(
    'edittext {properties: {name: "textDateLeft"}}'
  );
  textDateLeft.text = defaults.fontLeftDate;

  var divider7 = group6.add("panel", undefined, undefined, {
    name: "divider7",
  });
  divider7.alignment = "fill";

  var colorColorColorDate = "0xFFFFFF";
  var button5 = group6.add("button", undefined, undefined, { name: "button5" });
  button5.size = [20, 20];
  button5.fillBrush = button5.graphics.newBrush(
    button5.graphics.BrushType.SOLID_COLOR,
    [1, 1, 1]
  );
  button5.preferredSize.height = 20;
  button5.justify = "left";
  updateButtonColour(button5, [1, 1, 1]);

  button5.onClick = function () {
    var colorPickerRes = $.colorPicker(colorColorColorDate);
    if (colorPickerRes != -1) {
      var r = colorPickerRes >> 16;
      var g = (colorPickerRes & 0x00ff00) >> 8;
      var b = colorPickerRes & 0xff;
      $.writeln("selected a colour");
      colorColorColorDate = colorPickerRes;
      updateButtonColour(button5, [r / 255, g / 255, b / 255]);
    } else {
      $.writeln("did not select a colour");
    }
  };

  // GROUP7
  // ======
  var group7 = panel6.add("group", undefined, { name: "group7" });
  group7.orientation = "row";
  group7.alignChildren = ["left", "center"];
  group7.spacing = 20;
  group7.margins = 0;
  group7.alignment = ["center", "top"];

  // TODO
  // var checkbox2 = group7.add("checkbox", undefined, undefined, {
  //   name: "checkbox2",
  // });
  // checkbox2.text = "Replace?";

  var buttonAddDateText = group7.add("button", undefined, undefined, {
    name: "buttonAddDateText",
  });
  buttonAddDateText.text = "Add Date to Selection";
  buttonAddDateText.alignment = ["left", "fill"];
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

  // TODO
  // // PANEL8
  // // ======
  // var panel8 = dialog.add("panel", undefined, undefined, { name: "panel8" });
  // panel8.text = "Composition Adjustments";
  // panel8.orientation = "column";
  // panel8.alignChildren = ["left", "top"];
  // panel8.spacing = 10;
  // panel8.margins = 10;

  // // GROUP8
  // // ======
  // var group8 = panel8.add("group", undefined, { name: "group8" });
  // group8.orientation = "row";
  // group8.alignChildren = ["center", "center"];
  // group8.spacing = 10;
  // group8.margins = 0;
  // group8.alignment = ["fill", "top"];

  // var statictext12 = group8.add("statictext", undefined, undefined, {
  //   name: "statictext12",
  // });
  // statictext12.text = "Duration (s)";

  // var edittext11 = group8.add('edittext {properties: {name: "edittext11"}}');
  // edittext11.text = "5";

  // var divider8 = group8.add("panel", undefined, undefined, {
  //   name: "divider8",
  // });
  // divider8.alignment = "fill";

  // var button7 = group8.add("button", undefined, undefined, { name: "button7" });
  // button7.text = "Set Duration for Selection";
  // button7.alignment = ["center", "fill"];

  // PANEL9
  // ======
  var panel9 = dialog.add("panel", undefined, undefined, { name: "panel9" });
  panel9.text = "Output";
  panel9.orientation = "column";
  panel9.alignChildren = ["left", "top"];
  panel9.spacing = 10;
  panel9.margins = 10;

  // PANEL10
  // =======
  var panel10 = panel9.add("panel", undefined, undefined, { name: "panel10" });
  panel10.text = finalComp ? "Final Comp: " + finalComp.name : "Not set...";
  panel10.orientation = "column";
  panel10.alignChildren = ["fill", "center"];
  panel10.spacing = 10;
  panel10.margins = 10;
  panel10.alignment = ["fill", "top"];

  var buttonSetOutputComp = panel10.add("button", undefined, undefined, {
    name: "buttonSetOutputComp",
  });
  buttonSetOutputComp.text = "Set Output Comp";
  buttonSetOutputComp.alignment = ["fill", "center"];
  buttonSetOutputComp.onClick = function () {
    $.writeln("Setting output comp...");
    var selection = app.project.selection[0];
    if (selection instanceof CompItem) {
      finalComp = selection;
      panel10.text = "Final Comp: " + selection.name;
      app.settings.saveSetting(
        scriptSection,
        scriptSettingStrings.finalComp,
        selection.id
      );
    }
  };

  // PANEL9
  // ======
  var buttonAddToOutputComp = panel9.add("button", undefined, undefined, {
    name: "buttonAddToOutputComp",
  });
  buttonAddToOutputComp.text = "Add Selection to Output";
  buttonAddToOutputComp.alignment = ["fill", "top"];
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

  // GROUP9
  // ======
  var group9 = panel9.add("group", undefined, { name: "group9" });
  group9.orientation = "row";
  group9.alignChildren = ["center", "center"];
  group9.spacing = 10;
  group9.margins = 0;
  group9.alignment = ["fill", "top"];

  var statictext13 = group9.add("statictext", undefined, undefined, {
    name: "statictext13",
  });
  statictext13.text = "Image Duration (s)";

  var secondsPerImage = group9.add(
    'edittext {properties: {name: "secondsPerImage"}}'
  );
  secondsPerImage.text = defaults.outImageDuration;

  var divider9 = group9.add("panel", undefined, undefined, {
    name: "divider9",
  });
  divider9.alignment = "fill";

  var statictext14 = group9.add("statictext", undefined, undefined, {
    name: "statictext14",
  });
  statictext14.text = "Transition (s)";

  var secondsPerTransition = group9.add(
    'edittext {properties: {name: "secondsPerTransition"}}'
  );
  secondsPerTransition.text = defaults.outTransition;

  // PANEL9
  // ======
  var buttonProcessOutput = panel9.add("button", undefined, undefined, {
    name: "buttonProcessOutput",
  });
  buttonProcessOutput.text = "Process Output";
  buttonProcessOutput.alignment = ["fill", "top"];
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
      /\.(jpg|jpeg|png|gif|mov)$/i.test(item.file.fsName)
    ) {
      $.writeln("Creating comp from " + item.name);
      var name = getFileNameWithoutExtension(item.name);
      var compName = createPrefix.text + name;
      var duration = Number(createCompDuration.text);

      var scale = Number(createLayerScale.text);
      var height = finalComp.height;

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

    var distanceFromTop = Number(textLocationTop.text);
    var distanceFromLeft = Number(textLocationLeft.text);
    var position = [distanceFromLeft, distanceFromTop];

    var textLayer = comp.layers.addText(location);
    textLayer.startTime = startTime;
    textLayer.inPoint = startTime;
    textLayer.outPoint = endTime;
    textLayer.name = "LOC - " + location;
    textLayer.property("Position").setValue(position);
    var sourceText = textLayer.property("Source Text");
    var sourceDoc = sourceText.value;
    sourceDoc.fontSize = Number(selectedFontSize.text);
    sourceDoc.font = selectedFontFamily.selection.text;
    // sourceDoc.fillColor = colorColorColorLocation;
    sourceDoc.fillColor = [1, 1, 1];
    sourceText.setValue(sourceDoc);

    // CREATE THE DROP SHADOW
    $.writeln("Adding drop shadow to " + comp.name);
    addDropShadowToTextLayer(textLayer, comp);
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
    var sizeScale = 1;
    var distanceFromTop = Number(textDateTop.text);
    var distanceFromLeft = Number(textDateLeft.text);
    var position = [distanceFromLeft, distanceFromTop];

    var textLayer = comp.layers.addText(dateString);
    textLayer.name = "DATE - " + dateString;

    textLayer.startTime = startTime;
    textLayer.inPoint = startTime;
    textLayer.outPoint = endTime;
    textLayer.property("Position").setValue(position);

    var sourceText = textLayer.property("Source Text");
    var sourceDoc = sourceText.value;
    sourceDoc.fontSize = Number(selectedFontSizeDate.text);
    sourceDoc.font = selectedFontFamilyDate.selection.text;
    // sourceDoc.fillColor = colorColorColorDate;
    sourceDoc.fillColor = [1, 1, 1];
    sourceText.setValue(sourceDoc);

    // CREATE THE DROP SHADOW
    $.writeln("Adding drop shadow to " + comp.name);
    addDropShadowToTextLayer(textLayer, comp);
  }

  function addDropShadowToTextLayer(textLayer, comp) {
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
    var scale = textLayer.height / 1080;
    ds("Opacity").setValue(100);
    ds("Size").setValue(17 * scale);
    ds("Distance").setValue(5 * scale);

    if (app.project.selection && app.project.selection[0].id !== comp.id) {
      closeComp(comp);
    }
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
    $.writeln(
      "Adding comp (" + comp.name + ") to comp (" + destComp.name + ")"
    );
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
    integer = Math.min(Math.max(integer, 0), 16777215);
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

  function closeComp(comp) {
    comp.openInViewer();
    var closeCommand = 4;
    app.executeCommand(closeCommand);
  }

  function customDraw() {
    with (this) {
      graphics.drawOSControl();
      graphics.rectPath(0, 0, size[0], size[1]);
      graphics.fillPath(fillBrush);
    }
  }

  function updateButtonColour(button, rgbArray) {
    button.fillBrush = button.graphics.newBrush(
      button.graphics.BrushType.SOLID_COLOR,
      rgbArray
    );
    button.onDraw = customDraw;
    button.enabled = false;
    button.enabled = true;
  }

  dialog.layout.layout(true);
  dialog.layout.resize();
  dialog.onResizing = dialog.onResize = function () {
    this.layout.resize();
  };

  if (dialog instanceof Window) dialog.show();

  return dialog;
})();

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

function closeOpenComps() {
  var comps = app.project.items;
  for (var i = 1; i <= comps.length; i++) {
    var comp = comps[i];
    if (comp instanceof CompItem) {
      closeComp(comp);
    }
  }
}
