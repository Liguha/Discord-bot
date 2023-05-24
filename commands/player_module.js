const config = require("../json/static_config.json");
const errors = require("../json/error_reports.json");
const { rephrase } = require("./openai_module.js");
const playdl = require("play-dl");
const { getVoiceConnection, joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const { createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { createAudioPlayer, NoSubscriberBehavior } = require('@discordjs/voice');
const { alone_in_voice, same_voice } = require('./members.js');
const { DiscordAPIError, Attachment } = require("discord.js");

var songsQueue = [];
var player, connection;

// ммм, кайф, как говорят разрабы диса "change ... that brokes some apps"
function fix_connection(voiceConnection)
{
    const networkStateChangeHandler = (oldNetworkState, newNetworkState) => 
    {
        const newUdp = Reflect.get(newNetworkState, 'udp');
        clearInterval(newUdp?.keepAliveInterval);
    }
    voiceConnection.on('stateChange', (oldState, newState) => 
    {
        const oldNetworking = Reflect.get(oldState, 'networking');
        const newNetworking = Reflect.get(newState, 'networking');
        
        oldNetworking?.off('stateChange', networkStateChangeHandler);
        newNetworking?.on('stateChange', networkStateChangeHandler);
    });
    voiceConnection.on('error', () => console.log("Error voice")); 
}

async function prepare_args(args)
{
    var query = "";
    while (args.length > 0)
        query += " " + args.shift();
    if (query.length > 0)
        query = query.slice(1);
    var res = await playdl.search(query, 
    {
        limit: 1
    });
    if (res.length == 0)
        return null;
    var url = res[0].url;
    return [query, url];
}

async function queue_shift()
{
    if (songsQueue.length == 0)
    {
        player.stop();
        return;
    }
    var q = songsQueue[0];
    var query = q[0];
    var url = q[1];  

    var stream = await playdl.stream(url);
    var resource = createAudioResource(stream.stream, 
    {
        silencePaddingFrames: 50,
        inputType: stream.type,
        metadata: 
        {
            title: query,
        }
    });
    player.play(resource);
}

async function command_play(message, args)
{
    if (alone_in_voice(message))
    {
        connection = joinVoiceChannel(
        {
            channelId: message.member.voice.channelId,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator
        });
        fix_connection(connection);
        songsQueue = [];
        var query = await prepare_args(args);
        var msg = "";
        if (query == null)
            msg = await rephrase(errors.player_module.not_found);
        else
        {
            songsQueue.push(query);
            msg = query[0] +  " => " + query[1];
            connection.subscribe(player);
            queue_shift();
        }
        return [msg];
    }
    if (same_voice(message))
    {
        var cur_connection = getVoiceConnection(message.guild.id);
        if (connection != cur_connection)
        {
            connection = cur_connection;
            connection.subscribe(player);
        }
        var query = await prepare_args(args);
        var msg;
        if (query == null)
            msg = await rephrase(errors.player_module.not_found);
        else
        {
            songsQueue.push(query);
            if (songsQueue.length === 1)
                queue_shift();
            msg = query[0] +  " => " + query[1];
        }
        return [msg];
    }
}

async function command_queue()
{
    var msg = "Список запросов:";
    for (var i = 0; i < songsQueue.length; i++)
        msg += "\n" + (i + 1) + ". " + songsQueue[i][0] +  " => <" + songsQueue[i][1] + ">";
    return [msg];
}

async function command_skip()
{
    if (songsQueue.length === 0)
        return [await rephrase(errors.player_module.empty_queue)];
    var skipped = songsQueue.shift();
    queue_shift();
    return ["Пропускаю " + skipped[1]];
}

async function command_remove(args)
{
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
    if (l < 0 || r >= songsQueue.length || r < l)
        return [await rephrase(errors.player_module.out_of_queue)];
    var msg = "Из очереди удалено:";
    for (var i = l; i <= r; i++)
    {
        var k = i + 1;
        msg += "\n" + k + ". " + songsQueue[i][0] + " => <" + songsQueue[i][1] + ">";
    }
    songsQueue.splice(l, r - l + 1);
    if (l == 0)
        queue_shift();
    return [msg];
}

async function command_clear()
{
    var n = String(songsQueue.length);
    return await command_remove(["1", n]);
}

// подготовка плеера
playdl.setToken(
{
    youtube:
    {
        cookie: config.youtube_coockie
    }
});
player = createAudioPlayer(
{
    behaviors: 
    {
        noSubscriber: NoSubscriberBehavior.Play,
    }
});
player.addListener("stateChange", (oldOne, newOne) => 
{
    if (newOne.status == "idle" && oldOne != newOne)
    {
        songsQueue.shift();
        queue_shift();
    }
});
player.on('error', error => 
{
    console.log(error.message);
    queue_shift();
});

module.exports.command_skip = command_skip;
module.exports.command_remove = command_remove;
module.exports.command_clear = command_clear;
module.exports.command_queue = command_queue;
module.exports.command_play = command_play;