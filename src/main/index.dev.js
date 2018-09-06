/**
 * This file is used specifically and only for development. It installs
 * `electron-debug` & `vue-devtools`. There shouldn't be any need to
 *  modify this file, but it can be used to extend your development
 *  environment.
 */

/* eslint-disable */
const electronDebug = require('electron-debug');
const {app} = require('electron');
const electronDevtoolsInstaller = require('electron-devtools-installer');

// Install `electron-debug` with `devtron`
electronDebug({showDevTools: true, devToolsMode: 'undocked'});

// Install `vue-devtools`
app.on('ready', () => {
    electronDevtoolsInstaller.default(electronDevtoolsInstaller.VUEJS_DEVTOOLS)
        .then(() => {
        })
        .catch(err => {
            console.log('Unable to install `vue-devtools`: \n', err);
        })
});

// Require `main` process to boot app
require('./index');
