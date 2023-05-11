const config = require("../json/dynamic_config.json");

function command_prefix(message, args)
{
    var prefix = '>';
    if (args.length > 0)
        prefix = args.shift();
    message.channel.send("Установлен префикс \'" + prefix + '\'');
    config.prefix = prefix;
}

module.exports.command_prefix = command_prefix;