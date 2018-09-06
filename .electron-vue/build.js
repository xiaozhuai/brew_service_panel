'use strict';

process.env.NODE_ENV = 'production';

const chalk = require('chalk');
const del = require('del');
const packager = require('electron-packager');
const webpack = require('webpack');
const packagerConfig = require('./packager.config');
const mainConfig = require('./webpack.main.config');
const rendererConfig = require('./webpack.renderer.config');

const isCI = process.env.CI || false;

if (process.env.BUILD_TARGET === 'clean') clean();
else build();

function clean() {
    del.sync(['build/*', '!build/icons', '!build/icons/icon.*']);
    process.exit();
}

async function build() {
    greeting();

    del.sync(['dist/*']);

    console.log(chalk.blue.bold('building main process...\n'));
    try{
        let result = await pack(mainConfig);
        console.log(`\n\n${result}\n\n`);
    }catch(err){
        console.log(chalk.red.bold(`\nfailed to build main process\n`));
        console.log(`\n${err}\n`);
        process.exit(1);
        return;
    }

    console.log(chalk.blue.bold('building renderer process...\n'));
    try{
        let result = await pack(rendererConfig);
        console.log(`\n\n${result}\n\n`);
    }catch (err) {
        console.log(chalk.red.bold(`\nfailed to build renderer process\n`));
        console.log(`\n${err}\n`);
        process.exit(1);
        return;
    }

    bundleApp();
}

function pack(config) {
    return new Promise((resolve, reject) => {
        config.mode = 'production';
        webpack(config, (err, stats) => {
            if (err) reject(err.stack || err);
            else if (stats.hasErrors()) {
                reject(stats.toString({
                    chunks: false,
                    colors: true
                }))
            } else {
                resolve(stats.toString({
                    chunks: false,
                    colors: true
                }))
            }
        })
    })
}

function bundleApp() {
    packager(packagerConfig).then(appPath => {
        console.log(`package app suc ${chalk.blue(appPath)}\n`);
    }).catch(err => {
        console.log(`\n${chalk.yellow('electron-packager')} says...\n`);
        console.log(err + '\n');
    });
}

function greeting() {
    console.log(chalk.yellow.bold('\nBuild BrewServicePanel\n'));
}
