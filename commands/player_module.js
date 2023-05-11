const config = require("../json/static_config.json");
const errors = require("../json/error_reports.json");
const { rephrase } = require("./openai_module.js");
const ytdl = require("ytdl-core");
const searchYoutube = require('youtube-api-v3-search');
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
}

async function prepare_args(args)
{
    var query = "";
    while (args.length > 0)
        query += " " + args.shift();
    if (query.length > 0)
        query = query.slice(1);
    var res = await searchYoutube(config.google_api, 
    {   
        q: query,
        part: 'snippet',
        type: 'video',
        maxResults: 1 
    });
    if (res.items.length == 0)
        return null;
    var url = "https://www.youtube.com/watch?v=" + res.items[0].id.videoId;
    var is_live = res.items[0].snippet.liveBroadcastContent == 'live';
    return [query, url, is_live];
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
    var is_live = q[2];

    if (!ytdl.validateURL(url))
    {
        songsQueue.shift();
        queue_shift();
        return;
    }

    var frames = 5;
    var options = 
    {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
        requestOptions: 
        {
            headers: 
            {
                Cookie: config.youtube_coockie
            }
        }
    };
    if (is_live)
    {
        frames = 100;
        options = 
        {
            liveBuffer: 4900,
            quality: 'lowestaudio',
            highWaterMark: 1 << 25,
            requestOptions: 
            {
                headers: 
                {
                    Cookie: config.youtube_coockie
                }
            }
        };
    }    

    var stream = ytdl(url, options);
    var resource = createAudioResource(stream, 
    {
        silencePaddingFrames: frames,
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
        if (query == null)
            message.channel.send(await rephrase(errors.player_module.not_found));
        else
        {
            songsQueue.push(query);
            message.channel.send(query[0] +  " => " + query[1]);
            connection.subscribe(player);
            queue_shift();
        }
        return;
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
        if (query == null)
            message.channel.send(await rephrase(errors.player_module.not_found));
        else
        {
            songsQueue.push(query);
            if (songsQueue.length === 1)
                queue_shift();
            message.channel.send(query[0] +  " => " + query[1]);
        }
    }
}

async function command_queue(message)
{
    var msg = "Список запросов:";
    for (var i = 0; i < songsQueue.length; i++)
        msg += "\n" + (i + 1) + ". " + songsQueue[i][0] +  " => <" + songsQueue[i][1] + ">";
    message.channel.send(msg);
}

async function command_skip(message)
{
    if (songsQueue.length === 0)
    {
        message.channel.send(await rephrase(errors.player_module.empty_queue));
        return;
    }
    var skipped = songsQueue.shift();
    message.channel.send("Пропускаю " + skipped[1]);
    queue_shift();
}

// подготовка плеера
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
module.exports.command_queue = command_queue;
module.exports.command_play = command_play;