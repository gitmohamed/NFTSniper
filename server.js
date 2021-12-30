'user strict'

const fs = require("fs")
const axios = require("axios")
const moment = require("moment")
// const Discordie = require("discordie")

// const client = new Discordie({ autoReconnect: true});

// client.connect({ token: process.env.DISCORD_KEY });


    
// every 24hrs collect all upcoming drop into collections.json
// check release date to see if the collections will drop within 7 days (or 24 hrs?)
// if releasing soon collection the image urls from collection data set
// Log the upcoming collection data to disord channel

// const getImageLinkForDrop = (id) => {
//     axios.get('https://collections.rarity.tools/collectionsStats').then((data) => {
//         data.data.forEach(collection => {
//             console.log(collection.slug, id)
//             if(collection.slug === id) {
//                 return collection.image_url; // returns image url if found
//             }
//         })
        
//     })
// }

const postDropToDiscord = async (drop) => {
    let dateNow = new Date();
    let timeNow = dateNow.toLocaleTimeString();
    const parsedDiscordUrl = drop.Discord.match('https://') || 
                             drop.Discord.match('http://') ? 
                             drop.Discord : 
                             "https://discord.gg/" + drop.Discord.split('/')[1] || '';

    try {
        console.log(drop)
        await axios.post("https://discord.com/api/webhooks/922286674564755466/2kwYz-4QlhE5iHv6Z6YnZInOVHjnXxrNh-U-8B8kVuMlsvdn57MP7tpXCXxx6fay6eJ2", {
            "tts": false,
            "embeds": [
                {
                    "title": `> __${drop.Project || " "}__`, 
                    "description": `${ drop['Short Description'] || drop.Project}`,
                    "url": `${drop.Website}`,
                    "color": 70113288,
                    "fields": [
                        {
                            name: `Launch Date:`,
                            value: `${moment(drop['Sale Date']).from(moment(dateNow).toDate())}`,
                            inline: false
                        },
                        {
                            name: `Twitter:`,
                            value: `https://twitter.com/${drop.TwitterId || " "}`,
                            inline: false
                        },
                        {
                            name: `Discord:`,
                            value: `${parsedDiscordUrl}`,
                            inline: false
                        },
                        {
                            name: `Currency:`,
                            value: `${drop.Currency || "N/A"}`,
                            inline: true
                        },
                        {
                            name: `Price:`,
                            value: `${drop.Price || ''}`,
                            inline: true
                        },
                        {
                            name: `Max Items:`,
                            value: `${drop['Max Items'] || ''}`,
                            inline: false
                        }
                    ],
                    "author": {
                        name: "NFT Assassin",
                        icon_url: "https://cdn.discordapp.com/app-icons/812522825200959518/ad50c7a29b317455c6a8f94600c74636.png?size=256"
                    },
                    "footer": {
                        text: `${timeNow} [PST] - Data sourced from https://rarity.tools`,
                        icon_url: 'https://icons-for-free.com/iconfiles/png/256/access+time+24px-131985216670620016.png'
                    }
                }
            ]
        });
    } catch (error) {
        console.log("Error: " + JSON.stringify(error.response.data));
        return error.response;
    }
}

const filterNewestFromData = (list, current) => {
        if(current === list.length) return;
        
        let dayToday;
        let launchDay;
        let launchMonth;
        
        if(list[current]['Sale Date']) {
            dayToday = parseInt(JSON.stringify(moment()).split('T')[0].split('-')[2]);
            launchDay = parseInt(list[current]['Sale Date'].split('T')[0].split('-')[2]);
            launchMonth = parseInt(list[current]['Sale Date'].split('-')[1].split('-')[0]);
        }
        
        if(parseInt(moment().month()) + 1 === launchMonth || (parseInt(moment().month()) + 1 === 12 ? 0 : parseInt(moment().month())) + 1 == launchMonth) {
            if(dayToday + 1 === launchDay) { // LAUNCHES TODAY
                postDropToDiscord(list[current]);
            } else if (dayToday + 2 === launchDay) { // LAUNCHED TOMMORROW
                postDropToDiscord(list[current]);
            } else if (dayToday + 1 <= launchDay && dayToday + 7 >= launchDay) { // Coming soon (greater than 7 days out)
                postDropToDiscord(list[current]);
            } else {
                console.log("Coming soon");
            }
        }
        setTimeout(() => {
            filterNewestFromData(list, current + 1);
        }, 1200);
    return true;
}


const getDataForUpcomingDrops = () => {
    try {
        fs.readFile("./data/collections.json", async (err, res) => {
            let list = await JSON.parse(res)
            if (err)
                console.log(err)
            filterNewestFromData(list, 0);
        });
    } catch (error) {
        console.error(error)
    }
}

const buildUpcoming = () => {
    console.log("Building upcoming drop data set..");
    let json = [];
    // function that returns all upcoming NFT drops 
    axios.get('https://collections.rarity.tools/upcoming2').then((res) => {
        res.data.forEach(collection => {
            // console.log(collection); // data set for collection detailed info/image urls
            json.push(collection);
        });
        return (json);
    }).then((data) => {
        // console.log(data);
        fs.writeFile("./data/collections.json", JSON.stringify(data), () => {
            console.log('Wrote to file');
            getDataForUpcomingDrops();
        });
    }).catch((err) => {
        if (err) 
            console.error(err);
    });
}

    
fs.stat("./data/collections.json", function(err, stats) {
    if (err)
        console.log(err)
    
    var mtime = stats.mtimeMs;
    console.log(mtime, Date.now() + 86400000);
    if(mtime < Date.now() + 86400000) {
        // logNewDropToDiscord();
        buildUpcoming();
    } else {
        console.log("Not");
    }
});