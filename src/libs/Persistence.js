import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export default class {
    static storeDir = path.resolve(os.homedir(), '.brew_service_panel');

    static checkAndGetPath(key, defaultData) {
        try{
            const stat = fs.statSync(this.storeDir);
        }catch (e) {
            fs.mkdirSync(this.storeDir);
        }

        let filePath = path.resolve(this.storeDir, `${key}.json`);

        try{
            const stat = fs.statSync(filePath);
        }catch (e) {
            fs.writeFileSync(filePath, JSON.stringify({
                data: defaultData
            }, null, 4));
        }

        return filePath;
    }

    static set(key, data) {
        let filePath = this.checkAndGetPath(key, null);
        fs.writeFileSync(filePath, JSON.stringify({
            data: data
        }, null, 4));
    }

    static get(key, defaultData) {
        let filePath = this.checkAndGetPath(key, defaultData);
        try{
            let obj = JSON.parse(fs.readFileSync(filePath).toString());
            return obj.data;
        }catch (e) {
            return defaultData;
        }
    }

};
