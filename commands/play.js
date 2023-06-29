const config = require("../json/static_config.json");
const errors = require("../json/error_reports.json");
const playdl = require("play-dl");
const { createAudioResource } = require('@discordjs/voice');
const { queue_push } = require("../scripts/player_queue.js");
const { rephrase } = require("./chat.js");

async function prepare_args(args)
{
    var prompt = "";
    for (var i = 0; i < args.length; i++)
        prompt += " " + args[i];
    if (prompt.length > 0)
        prompt = prompt.slice(1);
    var res = await playdl.search(prompt, 
    {
        limit: 1
    });
    var url = null;
    if (res.length != 0)
        url = res[0].url;
    return [prompt, url];
}

async function get_resource(url)
{
    var stream = await playdl.stream(url);
    var resource = createAudioResource(stream.stream, 
    {
        silencePaddingFrames: 50,
        inputType: stream.type,
    });
    return resource;
}

async function command_play({message, args})
{
    var prepared = await prepare_args(args);
    var output = null, ok = true;
    if (prepared[1] != null)
        output = prepared[1];
    else
    {
        output = await rephrase(errors.player_module.not_found);
        ok = false;
    }
    
    var song =
    {
        prompt: prepared[0],
        data: prepared[1],
        output: output,
        success: ok,
        get_resource: get_resource
    }
    return await queue_push(message, song);
}

playdl.setToken(
{
    youtube:
    {
        cookie: config.youtube_cookie
    }
});

module.exports.command_play = command_play;