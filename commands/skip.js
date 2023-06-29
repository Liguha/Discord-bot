const errors = require("../json/error_reports.json")
const { rephrase } = require("./chat.js");
const { get_queue, queue_shift } = require("../scripts/player_queue.js");

async function command_skip()
{
    var queue = get_queue();
    if (queue.length === 0)
        return [await rephrase(errors.player_module.empty_queue)];
    var skipped = queue.shift();
    queue_shift();
    return ["Пропускаю " + skipped.output];
}

module.exports.command_skip = command_skip;