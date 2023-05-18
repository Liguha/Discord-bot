const config = require("../json/dynamic_config.json");

async function command_vprefix(args)
{
    var vprefix = "жаба";
    if (args.length > 0)
        vprefix = args.shift();
    config.vprefix = vprefix;
    return ["Установлен голосовой префикс \'" + vprefix + '\''];
}

module.exports.command_vprefix = command_vprefix;