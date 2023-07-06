const errors = require("../json/error_reports.json");
const { rephrase } = require("../commands/chat.js");
const { alone_in_voice, same_voice } = require('../commands/members.js');
const { createAudioPlayer, NoSubscriberBehavior } = require('@discordjs/voice');
const { getVoiceConnection, joinVoiceChannel } = require('@discordjs/voice');

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

async function queue_shift()
{
    if (songsQueue.length == 0)
    {
        player.stop();
        return;
    }

    var song = songsQueue[0];
    var resource = await song.get_resource(song.data);
    player.play(resource);
}

async function queue_push(message, song)
{
    if (!song.success)
        return [song.output];
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
        songsQueue.push(song);
        connection.subscribe(player);
        await queue_shift();
        return [song.prompt + " => " + song.output];
    }
    if (same_voice(message))
    {
        var cur_connection = getVoiceConnection(message.guild.id);
        if (connection != cur_connection)
        {
            connection = cur_connection;
            connection.subscribe(player);
        }
        songsQueue.push(song);
        if (songsQueue.length === 1)
            await queue_shift();
        return [song.prompt + " => " + song.output];
    }
    return [await rephrase(errors.player_module.already_use)];
}

function get_queue()
{
    return songsQueue;
}

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

module.exports.queue_push = queue_push;
module.exports.queue_shift = queue_shift;
module.exports.get_queue = get_queue;