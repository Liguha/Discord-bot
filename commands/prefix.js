const config = require("../json/dynamic_config.json");

async function command_prefix(args)
{
    var prefix = '>';
    if (args.length > 0)
        prefix = args.shift();
    config.prefix = prefix;
    return ["Установлен префикс \'" + prefix + '\''];
}

module.exports.command_prefix = command_prefix;