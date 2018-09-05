import * as cp from "child_process";
import * as sudo from "sudo-prompt";
import packageInfo from "@/../../package.json";

export default class {

    static sudoPromptOption = {
        name: packageInfo.productName
    };

    static checkHomebrew(callback) {
        cp.exec("/usr/local/bin/brew --version", (err, stdout) => {
            console.log(stdout);
            if(err) {
                callback(false);
                return;
            }

            callback(stdout.trim() !== '');
        });
    }

    static getList(callback) {
        cp.exec('/usr/local/bin/brew services list', {}, (err, stdout, stderr) => {
            if (err) {
                callback(err);
                return;
            }

            if (stderr !== '') {
                callback(new Error(stderr));
                return;
            }

            // console.log("stdout: \n" + stdout);
            // console.log("stderr: \n" + stderr);

            let p = stdout.indexOf("\n");
            let firstline = stdout.substring(0, p);
            let content = stdout.substring(p + 1);

            // console.log("firstline: \n" + firstline);
            // console.log("content: \n" + content);

            let keys = firstline.split(/\s+/).map(value => {
                return value.toLowerCase();
            });

            // console.log(keys);

            let list = [];
            let lines = content.split("\n");
            lines.forEach((line) => {
                line = line.trim();
                if (line === '') return;

                let tokens = line.split(/\s+/, keys.length);
                let obj = {};
                keys.forEach((key, keyIndex) => {
                    obj[key] = tokens[keyIndex] ? tokens[keyIndex] : '';
                });
                list.push(obj);
            });

            // console.log(list);
            callback(undefined, list);
            // callback(undefined, []);
        });
    }

    static async start(name, as_root, auto_start, statusCallback, finalCallback) {
        statusCallback('starting');

        let startOption = 'run';
        if (auto_start) {
            startOption = 'start';
        }

        let cmd = `/usr/local/bin/brew services ${startOption} ${name}`;

        try{
            let suc = await new Promise((resolve, reject) => {
                if (as_root) {
                    sudo.exec(cmd, this.sudoPromptOption, (err, stdout, stderr) => {
                        if(err){
                            reject(err);
                            return;
                        }
                        resolve(stdout.indexOf('Successfully') >= 0);
                    });
                } else {
                    cp.exec(cmd, (err, stdout, stderr) => {
                        if(err){
                            reject(err);
                            return;
                        }
                        resolve(stdout.indexOf('Successfully') >= 0);
                    });
                }
            });

            if(suc){
                statusCallback('started');
                finalCallback(undefined, true);
            }else{
                statusCallback('stopped');
                finalCallback(new Error('started service error'), false);
            }
        }catch(e){
            statusCallback('stopped');
            finalCallback(e, false);
        }
    }

    static async restart(name, as_root, auto_start, statusCallback, finalCallback) {
        await this.stop(name, as_root, statusCallback, finalCallback);
        await this.start(name, as_root, auto_start, statusCallback, finalCallback);
    }

    static async revealPlistInFinder(plist) {
        cp.exec(`open -R \"${plist}\"`);
    }

    static async stop(name, as_root, statusCallback, finalCallback) {
        statusCallback('stopping');

        let cmd = `/usr/local/bin/brew services stop ${name}`;

        try{
            await new Promise((resolve, reject) => {
                if (as_root) {
                    sudo.exec(cmd, this.sudoPromptOption, (err, stdout, stderr) => {
                        if(err){
                            reject(err);
                            return;
                        }
                        resolve(true);
                    });
                } else {
                    cp.exec(cmd, (err, stdout, stderr) => {
                        if(err){
                            reject(err);
                            return;
                        }
                        resolve(true);
                    });
                }
            });

            statusCallback('stopped');
            finalCallback(undefined, true);
        }catch(e){
            statusCallback('stopped');
            finalCallback(undefined, true);
        }
    }
};
