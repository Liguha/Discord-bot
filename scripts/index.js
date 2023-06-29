const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const static_config = require("../json/static_config.json");
const dynamic_config = require("../json/dynamic_config.json");

const { command_recognize } = require("./recognition_module.js");
const { perform_command } = require("./performer.js");
require("./saver.js");

var app = express();
app.set("port", (10804));

app.get("/", (request, response) => 
{
    var result = "Running";
    response.send(result);
}).listen(app.get('port'), () => 
{
    console.log("Приложение работает с портом", app.get("port"));
});

const client = new Client(
{
    intents: 
    [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates, 
    ]
});

client.on("messageCreate", (message) =>
{
    if (!message.content.startsWith(dynamic_config.prefix)) return;

    var commandBody = message.content.slice(dynamic_config.prefix.length);
    var args = commandBody.split(' ');
    var command = args.shift();

    while (command.length == 0 && args.length > 0)
        command = args.shift();

    perform_command(client, message, command, args);
    if (command == "recognize")
        command_recognize(client, message);
});

client.on("error", (err) => console.log("Error!"));

client.login(static_config.bot_token);