const config = require("../json/dynamic_config.json");
const playlists = require("../json/playlists.json");

var fs = require("fs");

setInterval(() =>
{
    var json_config = JSON.stringify(config);
    fs.writeFileSync("json/dynamic_config.json", json_config);
    var json_playlists = JSON.stringify(playlists);
    fs.writeFileSync("json/playlists.json", json_playlists );
}, 600000);