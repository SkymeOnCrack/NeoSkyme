const { application } = require('express')
const Profile = require("../profile");
const axios = require('axios').default;
const fs = require('fs');

function correctBackendValue(backendValue) {
    switch (backendValue) {
        case 'AthenaSpray':
        case 'AthenaToy':
        case 'AthenaEmoji': return 'AthenaDance';

        case 'AthenaPetCarrier':
        case 'AthenaPet': return 'AthenaBackpack';
        default: return backendValue
    }
}

/**
 * 
 * @param {application} app 
 */
module.exports = (app) => {
    app.post('/account/api/oauth/token', async (req, res, next) => {
        next(); // we can do the work in the background
        var displayName = "";
        var accountId = "";

        switch (req.body.grant_type) {
            case "password":
                if (!req.body.username) {
                    return;
                }

                if (req.body.username.includes("@")) {
                    displayName = req.body.username.split("@")[0]
                }
                else {
                    displayName = req.body.username;
                }

                accountId = displayName.replace(/ /g, "_");
                break;

            case "authorization_code":
                if (!req.body.code) {
                    return;
                }
                accountId = req.body.code;
                break;

            case "device_auth":
                if (!req.body.account_id) {
                    return;
                }
                accountId = req.body.account_id;
                break;


            case "exchange_code":
                if (!req.body.exchange_code) {
                    return;
                }
                accountId = req.body.exchange_code;
                break;

            default:
                return;
        }

        var profileData = Profile.readProfile(accountId, 'athena');

        if (!profileData) {
            profileData = Profile.readProfileTemplate('athena');
            if (!profileData) {
                return;
            }

            fs.mkdirSync(`./config/${accountId}/profiles`, { recursive: true });
        }

        const data = (await axios.get("https://fortnite-api.com/v2/cosmetics/br")).data;
        
        for (cosmetic of data.data) {
            const item = {
                "templateId": correctBackendValue(cosmetic.type.backendValue) + ":" + cosmetic.id.toLowerCase(),
                "attributes": {
                    "max_level_bonus": 0,
                    "level": 1,
                    "item_seen": true,
                    "rnd_sel_cnt": 0,
                    "xp": 0,
                    "variants": cosmetic.variants ? cosmetic.variants.map(it => {
                        return {
                            channel: it.channel,
                            active: it.options[0].tag,
                            owned: it.options.map(it => it.tag)
                        };
                    }) : [],
                    "favorite": false
                },
                "quantity": 1
            };
            profileData.items[item.templateId] = item;
        }

        Profile.saveProfile(accountId, 'athena', profileData);
    })
}