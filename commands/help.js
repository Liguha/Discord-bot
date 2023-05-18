const help = require("../json/help_note.json");
const errors = require("../json/error_reports.json");
const { rephrase } = require("./openai_module.js");

async function command_help(args)
{
    var cur_help = help;
    while (args.length != 0 && cur_help != undefined)
        cur_help = cur_help[args.shift()];
    var msg = "";
    if (cur_help == undefined)
        msg = undefined;
    else
        msg = cur_help.general;
    if (msg == undefined)
        msg = await rephrase(errors.help.general);
    return [msg];
}

module.exports.command_help = command_help;