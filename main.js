'use strict';
var path = require('path');
var gui = require('nw.gui');
var yeoman = require('yeoman-generator');
var _ = require('lodash');
var _s = require('underscore.string');
var findPkg = require('witwip');
var stripAnsi = require('strip-ansi');
var finderPath = require('finder-path');

var TRAY_UPDATE_INTERVAL = 2000;

function log(str) {
	document.body.textContent = document.body.textContent + stripAnsi(str) + '\n';
}

process.stdout.write = log;
process.stderr.write = log;

function Adapter() {};

Adapter.prototype.prompt = function () {
	// TODO: figure out why it's not called
	console.log('prompt', arguments);
};

Adapter.prototype.log = function () {};

var env = yeoman(null, null, new Adapter());
env.alias(/^([^:]+)$/, '$1:all');
env.alias(/^([^:]+)$/, '$1:app');
env.lookup();

var generators = _.unique(env.namespaces().filter(function (el) {
	return /(app|all)$/.test(el);
}).map(function (el) {
	return el.replace(/(\w+):\w+/, '$1');
}));

function createTrayMenu(name, generators, status) {
	var menu = new gui.Menu();

	menu.append(new gui.MenuItem({
		label: name,
		enabled: false
	}));

	menu.append(new gui.MenuItem({
		type: 'separator'
	}));

	if (status) {
		menu.append(new gui.MenuItem({
			label: status,
			enabled: false
		}));

		menu.append(new gui.MenuItem({type: 'separator'}));
	}

	generators.forEach(function (el) {
		menu.append(new gui.MenuItem({
			label: _s.capitalize(_s.humanize(el)),
			click: function () {
				try {
					env.run(el + ':app');
				} catch (err) {
					log(err.message);
				}
			}
		}));
	});

	menu.append(new gui.MenuItem({type: 'separator'}));

	menu.append(new gui.MenuItem({
		label: 'Quit',
		click: function () {
			gui.App.quit();
		}
	}));

	return menu;
}

function updateTray() {
	finderPath(function (err, dirPath) {
		setTimeout(updateTray, TRAY_UPDATE_INTERVAL);

		if (!dirPath) {
			return;
		}

		findPkg(dirPath, function (err, pkgPath, pkgData) {
			// package.json name or fallback to dir name
			var name = pkgData && pkgData.name || path.basename(dirPath, path.extname(dirPath));
			tray.menu = createTrayMenu(name, generators);
		});
	});
}

var win = gui.Window.get();
var tray = new gui.Tray({
	icon: 'menubar-icon@2x.png',
	alticon: 'menubar-icon@2x.png'
});

var menu = new gui.Menu();
menu.append(new gui.MenuItem({
	label: 'No Yeoman project found',
	enabled: false
}));

tray.menu = menu;
updateTray();
