'use strict'

const fs = require("fs")
const axios = require("axios")
const moment = require("moment")
const config = require('./config')


// every 12hrs collect all upcoming drop into collections.json
// check release date to see if the collections will drop within 7 days (or 24 hrs?)
// if releasing soon collection the image urls from collection data set *Pending
// Log the upcoming collection data to disord channel
// Project Link: https://github.com/gitmohamed/NFTSniper

const postDropToDiscord = (drop, urgency) => {
    let dateNow = new Date();
    let timeNow = dateNow.toLocaleTimeString();

    const parsedWebsiteLink = drop.Website ? drop.Website.match('https://') ||
    drop.Website.match('http://') ?
    drop.Website :
    "https://" + drop.Website :
    "";

    console.log(drop);

    axios.post(config.Webhook, {
        "username": "NFT Sniper",
        "avatar_url": "https://i.imgur.com/4M34hi2.png",
        "embeds": [
          {
            "author": {
              "name": "Upcoming NFT Notification",
              "icon_url": "https://png.pngitem.com/pimgs/s/521-5212547_vaporwave-purple-bart-bartsimpson-simpsons-aesthetic-profile-picture.png"
            },
            "title": drop.Project,
            "url": parsedWebsiteLink,
            "description": "*" + drop["Short Description"] + "*",
            "color": urgency == "‼️" ? 13041721 : urgency == "❗" ? 15258703 : 3382271,
            "fields": [
              {
                "name": "Launch:",
                "value": "___**" + moment(drop['Sale Date']).from(moment(dateNow).toDate()) + "**___"
              },
              {
                "name": "Twitter:",
                "value": "https://twitter.com/" + drop.TwitterId
              },
              {
                "name": "Discord:",
                "value": drop.Discord ? drop.Discord : "None"
              },
              {
                "name": "Price:", // .replace(/[^0-9]/g, '') filters out letter chars from price string
                "value": drop.Price ? drop.Price + `${drop.Currency ? "[**" + drop.Currency + "**]" : drop.Price.match(/[^0-9 |\.$]/g) ? "" : "[**ETH**]" }` : 
                         drop["Price Text"] + `${drop.Currency ? "[**" + drop.Currency + "**]" : drop["Price Text"].match(/[^0-9 |\.$]/g) ? "" : "[**ETH**]" }`,
                // "value": (drop.Price ? 
                //           drop["Price Text"] ? 
                //           drop["Price Text"].split('.').length > 1 ? 
                //           drop["Price Text"].replace(/[^0-9|\.$]/g, '').split('.').slice(0, 2).join('.') : 
                //           drop["Price Text"].replace(/[^0-9|\.$]/g, '') : 
                //           drop.Price.replace(/[^0-9|.$]/g, '') : "0") + (drop.Currency ? "**" + drop.Currency + "**" : " **ETH**"),
                "inline": true
              },
              {
                "name": "Max Items:",
                "value":  drop["Max Items"],
                "inline": true
              }
            ],
            "image": {
              "url": "https://upload.wikimedia.org/wikipedia/commons/5/5a/A_picture_from_China_every_day_108.jpg"
            },
            "footer": {
              "text": "Data sourced from https://rarity.tools",
              "icon_url": "https://pbs.twimg.com/profile_images/1386583814332305412/BeKFg2UJ_400x400.jpg"
            }
          }
        ]
      }, )
}

const filterNewestFromData = (list, current) => {
    if (current === list.length) return;

    let dayToday;
    let launchDay;
    let launchMonth;

    if (list[current]['Sale Date']) {
        dayToday = parseInt(JSON.stringify(moment()).split('T')[0].split('-')[2]);
        launchDay = parseInt(list[current]['Sale Date'].split('T')[0].split('-')[2]);
        launchMonth = parseInt(list[current]['Sale Date'].split('-')[1].split('-')[0]);
    }

    if (parseInt(moment().month()) + 1 === launchMonth || (parseInt(moment().month()) + 1 === 12 ? 0 : parseInt(moment().month())) + 1 == launchMonth) {
        if (dayToday + 1 === launchDay) { // LAUNCHES TODAY
            postDropToDiscord(list[current], "‼️");
        } else if (dayToday + 2 === launchDay) { // LAUNCHED TOMMORROW
            postDropToDiscord(list[current], "❗");
        } else if (dayToday + 1 <= launchDay && dayToday + 7 >= launchDay) { // Coming soon (greater than 7 days out)
            postDropToDiscord(list[current]);
        } else {
            console.log(list[current].Project + " Coming soon (More Than 7 days from now)");
        }
    }
    setTimeout(() => {
        filterNewestFromData(list, current + 1);
    }, 2300);
    return true;
}

const buildUpcoming = () => {
    console.log("Building upcoming drop data set..");
    let json = [];
    // function that returns all upcoming NFT drops 
    axios.get('https://collections.rarity.tools/upcoming2').then((res) => {
        res.data.forEach(collection => {
            json.push(collection);
        });
        return (json);
    }).then((data) => {
        filterNewestFromData(data, 0);
    }).catch((err) => {
        if (err)
            console.error(err);
    });
}


const init = () => {
    fs.stat("./data/collections.json", function (err, stats) {
        if (err)
            console.log(err)

        var mtime = stats.mtimeMs;
        if (mtime < Date.now() + 86400000) {
            buildUpcoming();
            // listen indefinitely, rebooting every 720 minutes (12 hours)
            setTimeout(() => {
                console.log("Rebooting NFT Tracker...");
                init();
            }, 720 * 60000);
        } else {
            console.log("Already ran");
        }
    });
}

init();