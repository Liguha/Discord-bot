const config = require("../json/dynamic_config.json");

function command_vprefix(message, args)
{
    var vprefix = "жаба";
    if (args.length > 0)
        vprefix = args.shift();
    message.channel.send("Установлен голосовой префикс \'" + vprefix + '\'');
    config.vprefix = vprefix;

}

module.exports.command_vprefix = command_vprefix;