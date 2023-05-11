const config = require("../json/dynamic_config.json");
const errors = require("../json/error_reports.json");
const { rephrase } = require("./openai_module.js");

async function command_equal(message, args)
{
    switch (args.shift())
    {
        case "list":
            var msg = "Список голосовых эквивалентов:";
            var i = 1;
            for (var key in config.recognition)
            {
                msg += "\n" + i + ". " + key + " = " + config.recognition[key];
                i++;
            }
            message.channel.send(msg);
            break;

        case "set":
            var orig = args.shift();
            var equal = args.shift();
            if (!orig || !equal)
            {
                message.channel.send(await rephrase(errors.equal.set));
                break;
            }
            config.recognition[orig] = equal;
            message.channel.send("Установлено: " + orig + " = \'" + config.recognition[orig] + "\'");
            break;
            
        default:
            message.channel.send(await rephrase(errors.equal.general));
            break;
    }
}

module.exports.command_equal = command_equal;