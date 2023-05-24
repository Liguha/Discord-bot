const { command_play, command_queue, command_skip, command_remove, command_clear } = require("../commands/player_module.js");
const { command_prefix } = require("../commands/prefix.js");
const { command_vprefix } = require("../commands/vprefix.js");
const { command_join } = require("../commands/join.js");
const { command_members } = require("../commands/members.js");
const { command_equal } = require('../commands/equal.js');
const { command_playlist } = require('../commands/playlist.js');
const { command_help } = require('../commands/help.js');
const { command_chat, command_draw, command_refresh } = require("../commands/openai_module.js");
const { command_picture } = require("../commands/picture.js");

async function perform_command(client, message, command, args)
{
    var msg = [null];
    switch (command)
    {
        case "sum":
            var res = Number(args.shift()) + Number(args.shift());
            message.channel.send(res.toString());
            break;

        case "prefix":
            msg = await command_prefix(args);
            break;

        case "vprefix":
            msg = await command_vprefix(args);
            break;

        case "join":
            msg = await command_join(message);
            break;

        case "members":
            msg = await command_members(message);
            break;

        case "play":
            msg = await command_play(message, args);
            break;

        case "skip":
            msg = await command_skip();
            break;

        case "remove":
            msg = await command_remove(args);
            break;

        case "clear":
            msg = await command_clear();
            break;

        case "queue":
            msg = await command_queue();
            break;

        case "equal":
            msg = await command_equal(args);
            break;
        
        case "playlist":
            msg = await command_playlist(client, message, args);
            break;

        case "help":
            msg = await command_help(args);
            break;

        case "chat":
            msg = await command_chat(message, args);
            break;

        case "draw":
            msg = await command_draw(message, args);
            break;

        case "refresh":
            msg = await command_refresh();
            break;

        case "picture":
            msg = await command_picture(message, args);
            break;
    }
    for (var i = 0; i < msg.length; i++)
    {
        if (msg[i] == null)
            break;
        message.channel.send(msg[i]);
    }
}

module.exports.perform_command = perform_command;