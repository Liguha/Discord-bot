const { joinVoiceChannel } = require('@discordjs/voice');
const { alone_in_voice, same_voice } = require('./members.js');
const errors = require("../json/error_reports.json");
const { rephrase } = require("./openai_module.js");

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

async function command_join(message)
{
    if (!alone_in_voice(message))
    {
        if (!same_voice(message))
            message.channel.send(await rephrase(errors.join.different));
        else
            message.channel.send(await rephrase(errors.join.same));
        return;
    }
    var connection = joinVoiceChannel(
    {
        channelId: message.member.voice.channelId,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
    });
    fix_connection(connection);
}

module.exports.command_join = command_join;