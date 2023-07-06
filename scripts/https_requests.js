const https = require("https");

async function send_request(options, data = null)
{
    var promise = new Promise((resolve) =>
    {
        var json = "";
        var req = https.request(options, (res) =>
        {
            res.on("data", (chunk) => json += String(chunk));
            res.on("end", () => resolve(json));
        });
        if (data != null)
            req.write(JSON.stringify(data));
        req.end();
    });
    var raw = await promise;
    return JSON.parse(raw);
}

function string_params(data)
{
    var res = "";
    for (var key in data)
    {
        var lhs = String(key);
        var rhs = String(data[key]);
        res += encodeURIComponent(lhs) + "=" + encodeURIComponent(rhs) + "&";
    }
    res = res.substring(0, res.length - 1);
    return res;
}

module.exports.send_request = send_request;
module.exports.string_params = string_params;