// just for webstorm to resolve @ path, useless
module.exports = {
    resolve: {
        alias: {
            "@": require("path").resolve(__dirname, "src", "renderer")
        }
    }
};
