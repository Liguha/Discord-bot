const WebSocket = require("ws");
const { AttachmentBuilder } = require('discord.js');
const errors = require("../json/error_reports.json");
const { rephrase } = require("./openai_module.js");

const formats = 
{
    "vertical": [512, 768],
    "horizontal": [768, 512],
    "square": [512, 512]
}

async function command_picture(args)
{   
    var size = formats[args[0]];
    if (size == undefined)
        return [await rephrase(errors.picture.format_err)];
    
    var width = size[0];
    var height = size[1];
    var prompt = "";
    for (var i = 1; i < args.length; i++)
        prompt += args[i] + ' ';
    var data = 
    {
        prompt: prompt, 
        negative_prompt: "", 
        width: width, 
        height: height
    };

    var socket = new WebSocket("wss://api.stablediffusionai.org/v1/txt2img");
    socket.onopen = function() { socket.send(JSON.stringify(data)) };
    var waiting = true;
    var msg = null;
    socket.onmessage = async function(event) 
    {
        var ans = JSON.parse(event.data);
        if (ans.success == "process")
            return;
        waiting = false;
        if (ans.success == true)
        {
            msg = { files: [] };
            for (var i = 0; i < ans.images.length; i++)
            {
                var encoded = ans.images[i].split(';base64,');
                var img = Buffer.from(encoded[1], "base64");
                msg.files.push(new AttachmentBuilder(img));
            }
            return;
        }
        if (ans.success == "ttl_remaining")
            msg = (await rephrase(errors.picture.time_limit)) + " Осталось: " + ans.time + " сек.";
        else
            msg = await rephrase(errors.picture.general);
        return 
    };
    socket.onclose = async function(event)
    {
        if (waiting)
        {
            waiting = false;
            msg = await rephrase(errors.picture.conection_err);
        }
    };
    let promise = new Promise((resolve, reject) => 
    {
        var interval = setInterval(() => 
        {
            if (!waiting)
            {
                clearInterval(interval);
                resolve();
            }
        }, 500);
    });
    await promise;
    return [msg];
}

module.exports.command_picture = command_picture;