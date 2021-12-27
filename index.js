const Discord = require("discord.js");
const fs = require("fs");
const net = require('net');
const { homedir } = require("os");
const toolsHeure = require('./other/FormaterHeure.js');
const maDB = require('./other/dbLink.js');

const prefix = ">";

var bot = new Discord.Client();

maDB.setDB();

bot.on('ready', () => {
    console.log("The bot is ready !");

    bot.user.setActivity(`Prisel.fr | GIGN`,{type: 'PLAYING'})

})

bot.commands = new Discord.Collection();

function loadCmds() {
    fs.readdir("./cmds/", (err, files) => {
        if(err) console.error(err);
        var jsFiles = files.filter(f => f.split(".").pop() === "js");
        if(jsFiles.length <= 0) {
            console.log("Aucune commande chargée")
            return;
        }
        console.log(`${jsFiles.length} commandes chargés!`);
        jsFiles.forEach((f, i) => {
            delete require.cache[require.resolve(`./cmds/${f}`)];
            var props = require(`./cmds/${f}`);
            console.log(`${i + 1} : ${f} Chargé`);
            bot.commands.set(props.help.name, props);
        })
    })
};


loadCmds();

bot.on('message', message => {

    var messageArray = message.content.split(/\s+/g);
    var args = messageArray.slice(1);
    var command = messageArray[0];
    var cmd = bot.commands.get(command.slice(prefix.length));
    if(!command.startsWith(prefix)) return;
    if(cmd) cmd.run(bot, message, args);
})

bot.on("message", message => {
    if(message.channel.id == 721033817997049867 && !message.author.bot) //Mettre l'id du channel radio / L'auteur ne doit pas etre le bot
    {
        var mesHeures = message.content.match(/(\d+[h]\d\d)/g);
        if(mesHeures != null && mesHeures.length == 2)
        {
            var debut = parseInt(mesHeures[0].split('h')[0]) * 60 + parseInt(mesHeures[0].split('h')[1]);
            var fin =  parseInt(mesHeures[1].split('h')[0]) * 60 + parseInt(mesHeures[1].split('h')[1]);

            if(maDB.userExist(message.author.id) != null)
            {
                maDB.creatRadio(message.author.id, debut, fin, toolsHeure.logHeure());
            }
            else
            {
                maDB.creatUser(message.author.id, message.author.username);
                maDB.creatRadio(message.author.id, debut, fin, toolsHeure.logHeure());
                console.log(toolsHeure.logHeure() + message.author.username + " viens de ce creer dans la BD !");
            }

            var nombreHeures = 0;
            if(fin > debut)
            {
                nombreHeures = fin - debut;
            }
            else
            {
                nombreHeures = (1440 + fin) - debut;
            }

            const embed = new Discord.MessageEmbed()
            .setColor('#000000')
            .setDescription("Votre prise de service a duré **" + toolsHeure.inMinute(nombreHeures) + "** 🕔")
            .setTimestamp()
            .setFooter("Prise de service de " + message.author.username + " validé !", message.author.displayAvatarURL({ dynamic: true }))
            message.channel.send(embed);
            console.log(toolsHeure.logHeure() + "PS de " + message.author.username + " validé! - Début : " + mesHeures[0] + " - Fin : " + mesHeures[1] + " - Durée : " + toolsHeure.inMinute(nombreHeures));
        }
        else
        {
            const embed = new Discord.MessageEmbed()
            .setColor('#000000')
            .setDescription("Erreur sur le format de la prise de service ... ❌")
            .setTimestamp()
            .setFooter("Prise de service de " + message.author.username + " refusé !", message.author.displayAvatarURL({ dynamic: true }))
            message.channel.send(embed);
            console.log(toolsHeure.logHeure() + "PS de " + message.author.username + " refusé !");
        }
    }
})

bot.login('TOKEN');

