const config = require("../json/dynamic_config.json");
const errors = require("../json/error_reports.json");
const { rephrase } = require("./openai_module.js");

async function command_equal(args)
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
            return [msg];

        case "set":
            var orig = args.shift();
            var equal = args.shift();
            if (!orig || !equal)
                return [await rephrase(errors.equal.set)];
            config.recognition[orig] = equal;
            var msg = "Установлено: " + orig + " = \'" + config.recognition[orig] + "\'";
            return [msg];
    }
    return [await rephrase(errors.equal.general)];
}

module.exports.command_equal = command_equal;