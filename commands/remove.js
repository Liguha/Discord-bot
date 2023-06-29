const errors = require("../json/error_reports.json");
const { rephrase } = require("./chat.js");
const { get_queue, queue_shift } = require("../scripts/player_queue.js");

async function command_remove({args})
{
    var queue = get_queue();
    if (args.length == 0)
        return [await rephrase(errors.player_module.remove_args)];
    var l = Number(args[0]);
    var r = l;
    if (args.length > 1)
        r = Number(args[1]);
    if (isNaN(l) || isNaN(r))
        return [await rephrase(errors.player_module.remove_args)];
    l--;
    r--;
    if (l < 0 || r >= queue.length || r < l)
        return [await rephrase(errors.player_module.out_of_queue)];
    var msg = ["Из очереди удалено:"];
    var k = 0;
    for (var i = l; i <= r; i++)
    {
        var str = queue[i].prompt + " => <" + queue[i].output + ">";
        if (msg[k].length > 1800)
        {
            k++;
            msg.push("");
        }
        msg[k] += "\n" + (i + 1) + ". " + str;
    }
    queue.splice(l, r - l + 1);
    if (l == 0)
        queue_shift();
    return msg;
}

module.exports.command_remove = command_remove;