// TODO: Remove layer index assumptions and check instanceof
// TODO: Add inputs for folder names instead of hard-coding it
// TODO: Replace drop shadow menu clicking with actual assignment
// TODO: Add input for XMP tag to use for text layer

$.writeln('=== STARTING SCRIPT ===');

var globals = {
	compWidth: 1920,
	compHeight: 1080,
	compFrameRate: 29.97,
	compPixelAspect: 1,
};

var defaults = {
	createCompDuration: 10,
	createLayerScale: 71,
	createPrefix: 'comp_',
	fontName: 'AlegreyaSansSC-BlackItalic',
	fontSize: 150,
	fontTop: 50,
	fontLeft: 25,
	outTransition: 0.5,
	outImageDuration: 2,
};
var minSizeTextNumber = [40, -1];

var project = app.project;
var compsFolder = getFolderByName('-comps', project, true);
var finalComp = app.project.item(1);
var bgSolid = app.project.item(app.project.numItems);

// ==================================================
// CREATE THE WINDOW
// ==================================================
$.writeln('Creating the window...');

var dims = getWindowDims();
var mainWindow = new Window('window', 'PCT Helpers');
var windowX = dims.width - 375;
var windowY = 0;
mainWindow.location = [windowX, windowY];
mainWindow.preferredSize = [250, -1];
mainWindow.alignChildren = 'fill';

var title = mainWindow.add('statictext', undefined, 'PCT Selfie Video');

// ==================================================
// CREATE COMP FROM IMAGE
// ==================================================
var panelCreate = mainWindow.add('panel', undefined, 'panelCreate');
panelCreate.orientation = 'column';
panelCreate.alignChildren = 'fill';
panelCreate.text = 'Create Composition(s)';

//
var groupCreateDur = panelCreate.add('group', undefined, 'groupCreateDur');
groupCreateDur.orientation = 'row';
groupCreateDur.add('statictext', undefined, 'Duration (s)');
var createCompDuration = groupCreateDur.add('edittext', undefined, defaults.createCompDuration);
createCompDuration.minimumSize = minSizeTextNumber;
groupCreateDur.add('statictext', undefined, 'Image Scale (%)');
var createLayerScale = groupCreateDur.add('edittext', undefined, defaults.createLayerScale);
createLayerScale.minimumSize = minSizeTextNumber;

//
var groupCreatePrefix = panelCreate.add('group', undefined, 'groupCreatePrefix');
groupCreatePrefix.orientation = 'row';
groupCreatePrefix.alignChildren = 'fill';
groupCreatePrefix.add('statictext', undefined, 'Prefix');
var createPrefix = groupCreatePrefix.add('edittext', undefined, defaults.createPrefix);
createPrefix.minimumSize = [80, -1];

//
var buttonCreateComp = panelCreate.add('button', undefined, 'Create comps from selection');
buttonCreateComp.onClick = function () {
	app.beginUndoGroup('Create comps from images');
	$.writeln('Creating comps from images...');
	var selection = app.project.selection;
	doSomethingRecursively(selection, createCompFromItem);
	app.endUndoGroup();
};

// ==================================================
// ADD LOCATION TEXT
// ==================================================
var panelLocation = mainWindow.add('panel', undefined, 'PanelLocation');
panelLocation.orientation = 'column';
panelLocation.alignChildren = 'fill';
panelLocation.text = 'Location Text Layers';

var fontFamilies = flattenArray(app.fonts.allFonts)
	.map(function (font) {
		return font.postScriptName;
	})
	.sort();
var selectedFontFamily = panelLocation.add('dropdownlist', undefined, fontFamilies);
selectedFontFamily.title = 'Font Family';
selectedFontFamily.selection = selectedFontFamily.find(defaults.fontName);

var groupTextLocation = panelLocation.add('group', undefined, 'groupTextLocation');
groupTextLocation.orientation = 'row';

groupTextLocation.add('statictext', undefined, 'Size');
var selectedFontSize = groupTextLocation.add('edittext', undefined, defaults.fontSize);
selectedFontSize.minimumSize = minSizeTextNumber;

groupTextLocation.add('statictext', undefined, 'Top');
var textLocationTop = groupTextLocation.add('edittext', undefined, defaults.fontTop);
textLocationTop.minimumSize = minSizeTextNumber;

groupTextLocation.add('statictext', undefined, 'Left');
var textLocationLeft = groupTextLocation.add('edittext', undefined, defaults.fontLeft);
textLocationLeft.minimumSize = minSizeTextNumber;

var buttonAddLocationText = panelLocation.add('button', undefined, 'Add locations to selection');
buttonAddLocationText.onClick = function () {
	app.beginUndoGroup('Add location to comps');
	$.writeln('Adding location to comps...');
	var selection = app.project.selection;
	doSomethingRecursively(selection, addLocationTextToComp);
	app.endUndoGroup();
};

// ==================================================
// CHANGE COMP DURATION
// ==================================================
var panelDuration = mainWindow.add('panel', undefined, 'PanelDuration');
panelDuration.orientation = 'column';
panelDuration.alignChildren = 'fill';
panelDuration.text = 'Composition(s) Duration';

var groupDuration = panelDuration.add('group', undefined, 'groupDuration');
groupDuration.orientation = 'row';
groupDuration.alignChildren = 'fill';
groupDuration.add('statictext', undefined, 'Duration (s)');
var durationPerComp = groupDuration.add('edittext', undefined, defaults.createCompDuration);
durationPerComp.minimumSize = minSizeTextNumber;

var buttonDuration = panelDuration.add('button', undefined, 'Set duration for selection');
buttonDuration.onClick = function () {
	app.beginUndoGroup('Set comp duration');
	$.writeln('Setting comp duration...');
	var selection = app.project.selection;
	doSomethingRecursively(selection, adjustCompDuration);
	app.endUndoGroup();
};

// ==================================================
// ADD COMPS TO OUTPUT
// ==================================================
var groupAddToOutput = mainWindow.add('panel', undefined);
groupAddToOutput.orientation = 'column';
groupAddToOutput.alignChildren = 'fill';

var buttonAddToOutputComp = groupAddToOutput.add('button', undefined, 'Add selection to output comp');
buttonAddToOutputComp.onClick = function () {
	app.beginUndoGroup('Add comps to final');
	$.writeln('Adding comps to output comp...');
	var selection = app.project.selection;
	doSomethingRecursively(selection, addCompToFinal);
	app.endUndoGroup();
};

// ==================================================
// PROCESS OUTPUT COMP
// ==================================================
var panelOut = mainWindow.add('panel', undefined, 'PanelOutput');
panelOut.orientation = 'column';
panelOut.alignChildren = 'fill';
panelOut.text = 'Output Settings';

var groupOut = panelOut.add('group', undefined, 'groupOut');
groupOut.orientation = 'row';
groupOut.alignChildren = 'fill';
groupOut.add('statictext', undefined, 'Image Duration (s)');
var secondsPerImage = groupOut.add('edittext', undefined, defaults.outImageDuration);
secondsPerImage.minimumSize = minSizeTextNumber;

groupOut.add('statictext', undefined, 'Transition Time (s)');
var secondsPerTransition = groupOut.add('edittext', undefined, defaults.outTransition);
secondsPerTransition.minimumSize = minSizeTextNumber;

var buttonProcessOutput = panelOut.add('button', undefined, 'Process output comp');
buttonProcessOutput.onClick = function () {
	app.beginUndoGroup('Process final comp');
	$.writeln('Processing final comp...');
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
	if (item instanceof FootageItem && /\.(jpg|jpeg|png|gif)$/i.test(item.file.fsName)) {
		$.writeln('Creating comp from ' + item.name);
		var name = getFileNameWithoutExtension(item.name);
		var compName = createPrefix.text + name;
		var duration = Number(createCompDuration.text);
		var scale = Number(createLayerScale.text);

		// Create the comp
		var compItem = compsFolder.items.addComp(
			compName,
			globals.compWidth,
			globals.compHeight,
			globals.compPixelAspect,
			duration,
			globals.compFrameRate
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

	$.writeln('Adding location text to ' + comp.name);

	// GET THE LOCATION DATA FROM THE IMAGE
	var imageLayer = comp.layers[comp.numLayers - 1];
	var fsName = imageLayer.source.file.fsName;

	if (ExternalObject.AdobeXMPScript === undefined) {
		ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript');
	}

	var xmpFile = new XMPFile(fsName, XMPConst.FILE_UNKNOWN, XMPConst.OPEN_FOR_READ);
	var xmp = xmpFile.getXMP();
	var location = xmp.getProperty(XMPConst.NS_IPTC_CORE, 'Location').toString();

	if (!location) {
		alert('No location data found in image (' + imageLayer.name + ')');
		return;
	}

	// CREATE THE TEXT LAYER
	var startTime = 0;
	var endTime = comp.duration;
	var width = comp.width;
	var height = comp.height;
	var distanceFromTop = Number(textLocationTop.text);
	var distanceFromLeft = Number(textLocationLeft.text);
	var position = [width / 2 + distanceFromLeft, height / 2 + distanceFromTop];

	var textLayer = comp.layers.addBoxText([width, height]);
	textLayer.property('Source Text').setValue(location);
	textLayer.startTime = startTime;
	textLayer.inPoint = startTime;
	textLayer.outPoint = endTime;
	textLayer.name = 'Dynamic Layer';
	textLayer.property('Position').setValue(position);
	textLayer.property('Scale').setValue([100, 100]);

	var sourceText = textLayer.property('Source Text');
	var sourceDoc = sourceText.value;
	sourceDoc.fontSize = Number(selectedFontSize.text);
	sourceDoc.font = selectedFontFamily.selection.text;
	sourceText.setValue(sourceDoc);

	// CREATE THE DROP SHADOW
	$.writeln('Adding drop shadow to ' + comp.name);
	addDropShadowToTextLayer(textLayer);
}

function addDropShadowToTextLayer(textLayer) {
	// NOTE This is unverified
	// EFFECT NAME: Drop Shadow
	// MATCH NAME: AE.ADBE Drop Shadow
	// • Property 0: Shadow Color
	// • Property 1: Opacity
	// • Property 2: Direction
	// • Property 3: Distance
	// • Property 4: Softness
	// • Property 5: Shadow Only
	var ls = textLayer.property('Layer Styles');
	if (!ls.enabled) {
		textLayer.selected = true;
		app.executeCommand(app.findMenuCommandId('Drop Shadow'));
	}
	var ds = textLayer.property('Layer Styles').property('Drop Shadow');
	ds('Opacity').setValue(100);
	ds('Size').setValue(17);
	ds('Distance').setValue(5);
}

function addBackgroundToComp(comp) {
	$.writeln('Adding background to ' + comp.name);
	var bgLayer = comp.layers.add(bgSolid);
	bgLayer.moveToEnd();
}

function addCompToFinal(comp) {
	addCompToComp(comp, finalComp);
}

function addCompToComp(comp, destComp) {
	$.writeln('Adding comp (' + comp.name + ') to comp (' + destComp.name + ')');
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
	var effectsProperty = 'ADBE Effect Parade';
	var dissolveProperty = 'ADBE Block Dissolve';
	var durVisible = Number(secondsPerImage.text);
	var durTrans = Number(secondsPerTransition.text);
	var durTotal = durVisible + durTrans;

	var compTotalTime = durVisible * finalComp.numLayers;
	finalComp.duration = compTotalTime + 3;
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

		dis.property('Feather').setValue(100);

		var transComplete = dis.property('Transition Completion');
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

	$.writeln('Setting ' + comp.name + ' duration to ' + dur);

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
		if (Array.isArray(arr[i])) {
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
	var lastDotIndex = filename.lastIndexOf('.');
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

// ==================================================
// UNUSED BUT LIKELY HELPFUL
// ==================================================
function createFolder(parent, name) {
	if (activeItem.typeName !== 'Folder') {
		alert('Please select a folder');
	}

	var folder = parent.items.addFolder(name);
	return folder;
}
