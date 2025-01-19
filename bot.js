'use strict';

const { token } = require('./auth.json');
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,   
    GatewayIntentBits.GuildMessages,  
    GatewayIntentBits.MessageContent,  
    GatewayIntentBits.GuildMembers,  
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages, 
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
  ],
  partials: ['CHANNEL'] });

const fs = require('fs');

// facts from facts.json
let facts = [];
try {
  const jsonData = fs.readFileSync('./facts.json', 'utf-8');
  facts = JSON.parse(jsonData);
} catch (error) {
  console.error('Error reading or parsing facts.json:', error);
}

// quotes from quotes.json
let quotes = [];
try {
  const jsonData = fs.readFileSync('./quotes.json', 'utf-8');
  quotes = JSON.parse(jsonData);
} catch (error) {
  console.error('Error reading or parsing quotes.json:', error);
}

client.login(token).then(() => client.user.setActivity('certamen', { type: 'PLAYING' }));
const guideMsg = ' :)';


var channels = [], processing = false;

function saveQuotesToFile() {
  try {
    fs.writeFileSync('./quotes.json', JSON.stringify(quotes, null, 2), 'utf-8');
    console.log('Quotes successfully saved to file.');
  } catch (error) {
    console.error('Error saving quotes:', error);
  }
}

function saveFactsToFile() {
  try {
    fs.writeFileSync('./facts.json', JSON.stringify(facts, null, 2), 'utf-8');
    console.log('Facts successfully saved to file.');
  } catch (error) {
    console.error('Error saving facts:', error);
  }
}



function processBuzz(msg, author, chan, chanData) {
 if(processing) {
   setTimeout(processBuzz, 1, msg, author, chan, chanData);
 }
 else {
   processing = true;
   var buzzes = chanData.buzzList;
   const TS = buzzes.length ? msg.createdTimestamp - chanData.firstBuzzTS : 0;


   for(var i = 0; i < buzzes.length + 1; i++) {
     if(i === buzzes.length || TS < buzzes[i].TS) {
       var buzzPromise;


       if(i === 0) {
         buzzes.map(buzz => buzz.TS -= TS);
         chanData.firstBuzzTS = msg.createdTimestamp;
         buzzPromise = chan.send(`1. ${author}  buzzed`);
       }
       else {
         buzzPromise = chan.send(`${i + 1}. ${author}  buzzed (+${TS / 1000} s)`);
       }


       buzzPromise.then(messageCreate => {
         buzzes.splice(i, 0, {player : author, TS : TS, buzzMsg : messageCreate});


         if(i === buzzes.length - 1) processing = false;


         for(var j = i + 1; j < buzzes.length; j++) {
           buzzes[j].buzzMsg.delete();
           var k = j;


           chan.send(`${j + 1}. ${buzzes[j].player}  buzzed (+${buzzes[j].TS / 1000} s)`)
               .then(messageCreate => {
                 buzzes[k].buzzMsg = messageCreate;
                 processing = false;
               });
         }
       });


       break;
     }
   }
 }
}


client.login(token).then(() => client.user.setActivity('certamen', { type: 'PLAYING'}));

const buzzTerms = ['buzz', '🐝', 'b', 'buz', 'bu', 'bz', 'yippie', 'buzzz', 'zubb', 'zub'];


client.on('messageCreate', msg => {
  console.log('Received messageCreate: ', msg.content);
 const author = msg.author;
 const chan = msg.channel;
 const cmd = msg.content.toLowerCase();



 if (msg.mentions.has(client.user) && msg.content.toLowerCase().startsWith('<@&1330019271677575182>')) {
  msg.reply('Maybe read my bio instead of pinging me and waking me up. Smh.');
}

if (msg.mentions.has(client.user) && msg.content.toLowerCase().startsWith('<@1329957204543017030>')) {
  msg.reply('Maybe read my bio instead of pinging me and waking me up. Smh. \n\n But because you chose to be so kind and wake me up, I will impart my divine knowledge upon you. I am based off of, and use the same commands as the old certamen bot that dchen made. \n\n If you are moderator, heed these words. First, you will want to give yourself the `mod` role by saying `mod` and being in a voice channel. Quite crazy, huh? \n\n Then, you will press `c` and that will let you clear all buzzers. Make sure to do this between every tossup. Then, as soon as someone buzzes, you will automatically be muted. \n\n To unmute yourself and talk to the common folk playing, press `r` and recognize the buzzes. It does show everyone who buzzed, so make sure to only take answers from the first person from each team that buzzed. \n\n After that, depending on which team scored (either a, b, c), you can assign them points by stating a#. Use `a10` for 10 points to team a and `b-10` for 10 less points to b, if they did that horrible. You can also set them equal to a certain point value by saying `c=10` points. \n\n Once you reach a score check, feel free to humble everyone by saying, `scores`.  If you are not a moderator and you try to change point values...Your name will be announced to the whole lot <3. This bot works in multiple text channels, but be aware that it will not carry over point values from another channel. \n\n @Sameelaughs cannot access administrator priviliges or do any sketchy things through me. That is completely banned in Discord, and she does not know how to do that anyway.  \n\nIf you are a player, heed this. Your buzzes do not always show up immediately- and that is okay. The bot takes a while to display it, but it will still have the correct timestamps.\n\n I currently work with `buzz`, `🐝`, `b`, `buz`, `bu`, `bz`, `yippie`, and `zubb`  \n\n Thank you for reading! Please let @Sameelaughs know if anything arises!');
}


if (msg.channel.type === 'DM' && author !== client.user) {
   if (chan.send) {
     msg.reply('Maybe take me out to dinner before sliding into my DMs...(You can forward the payment to @sameelaughs)');
  } else {
    console.log("Cannot send a message in a partial DM channel.");
  }
}
 else {
   const chan = msg.channel;
   var chanData = channels.find(ch => ch.id === chan.id);


   if(!chanData) {
     chanData = {id : chan.id, scores : [0, 0, 0], buzzList : []};
     channels.push(chanData);
   }


   const cmd = msg.content.toLowerCase(), mod = chanData.moderator;

 const SAMEELAUGHS_ID = 'REPLACE WITH YOUR ID';

if (cmd.startsWith('say ')) {
  if (msg.author.id === SAMEELAUGHS_ID) {
    const messageToSay = msg.content.substring(4).trim(); // Get the text after "say"
    if (messageToSay) {
      msg.delete();  
      chan.send(messageToSay);  
    } else {
      msg.reply('You need to specify something to say!');
    }
  } else {
    msg.reply('Please do not pressure me to say things I do not want to say.');
  }
}

  if (cmd === "quote") {
  if (msg.reference) {
    const repliedMessageId = msg.reference.messageId;
    chan.messages.fetch(repliedMessageId)
      .then(repliedMsg => {
        const quoteContent = repliedMsg.content;
        const quoteAuthor = repliedMsg.author.username;

         quotes.push({ author: quoteAuthor, content: quoteContent });
        saveQuotesToFile();

        msg.reply(`Quote saved: "${quoteContent}" - ${quoteAuthor}`);
      })
      .catch(err => {
        console.error('Error fetching replied message:', err);
        chan.send('Failed to fetch the replied message. Make sure it exists.');
      });
  } else {
    msg.reply("You need to reply to a message to add it to the Dicta Collectanea. If you are trying to pull a quote, say 'quotes'.");
  }
}

if (cmd === "factit") {
  if (msg.author.id === SAMEELAUGHS_ID) {
    if (msg.reference) {
      const repliedMessageId = msg.reference.messageId;
      chan.messages.fetch(repliedMessageId)
        .then(repliedMsg => {
          const factsContent = repliedMsg.content;
          const factsAuthor = repliedMsg.author.username;

           facts.push({ author: factsAuthor, content: factsContent });
          saveFactsToFile();

          msg.reply(`Fact saved: "${factsContent}"`);
        })
        .catch(err => {
          console.error('Error fetching replied message:', err);
          chan.send('Failed to fetch the replied message. Make sure it exists.');
        });
    } else {
      msg.reply("You need to reply to a message to add it to the Facts list.");
    }
  } else {
    msg.reply("You do not have permission to use the `factit` command.");
  }
}





  
   switch(cmd) {
     case 'commands':
       msg.delete();
       chan.send(`Salve ${author}-(vocative)! here is a list of commands, based on the previous certamen bot.\n` +
                 'commands: see commands \nmod: sets the moderator\n' +
                 'c: clears any buzzes\nbuzz: uses `buzz`, `🐝`, `b`, `buz`, `bu`, `bz`, `yippie`, and `zubb` . mutes reader.\nr: recognizes buzzes and unmutes reader\n' +
                 'quotes: pulls a random quote.\nfact: tells you a random certamen fact\n' +
                 'a100: adds 100 points to Team A\'s score\nb-100: subtracts 100 points from Team B\'s score\n' +
                 'c=100: sets Team C\'s score to 100\nscores: updates scores \naureliapassagelatin: pulls up the latin aurelia passage\naureliapassagegreek: pulls up the greek aurelia passage');
       break;
    


     case 'mod':
       chanData.moderator = msg.member;
       chan.send('you are now the moderator.');
       break;


       case 'fact':
        if (facts.length > 0) {
            // fisher-yates
            const shuffledFacts = [...facts].sort(() => Math.random() - 0.5);
            const randomFact = shuffledFacts[0]; //   the first element from the shuffled array
            msg.reply(`📚 Did you know? ${randomFact.content}`);
        } else {
            chan.send("Sorry, I couldn't find any facts to share!");
        }
        break;
          


        // QUOTES PULLING
    case 'quotes':
          if (quotes.length > 0) {
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            chan.send(`"${randomQuote.content}" - ${randomQuote.author}`);
          } else {
            chan.send("Sorry, I couldn't find any quotes to share!");
          }
          break;
          
           

     case 'c':
       msg.delete();
       chan.send(`${mod && mod.user === author ? 'The moderator' : author}` +
                 '  cleared the buzzes.\n**__' + '\\_'.repeat(100) + '__**');
       chanData.buzzList = [];
       break;
    
       case 'aureliapassagelatin':
        msg.delete();
        chan.send('Aurēlia, cuī urbs placēbat, erat in Aegyptō cum familiā suā ingentī et equō suō. Trēdecim ludōs māgnōs Iōvis in amphitheātrō Alexandriae spectābat. tandem, hic equus īratus domum recurrere coepit. Eheu!');
        break;

        case 'aureliapassagegreek':
          msg.delete();
          chan.send('Αὐρηλία, ᾗ ἡ πόλις ἐδόκει, ἐν Αἰγύπτῳ ἦν σὺν τῇ μεγάλῃ οἰκίᾳ καὶ τῇ ἵππῳ. τρεισκαίδεκα τῷ Διὶ ἀγῶνας μεγάλους ἐν τῷ κυνηγετικῷ θεάτρῳ Αλεξανδρείας ἐθεώρουν. τέλος ὠργισμένη ἥδε ἡ ἵππος οἴκαδε ἦρξεν ἀναβαίνουσα. Ζεὺς δὲ, τοῖς ἀγῶσιν χαίρων, δεδοικυῖαν τὴν ἵππον ῥᾳδίως ἀναφέρει εἰς τὸν ἐγγὺς τοῦ θεάτρου σταθμόν. Εὐοῖ.');
          break;
        
          case 'resources':
            msg.reply('https://drive.google.com/drive/folders/0B3O6Vt0UOnUgWkc5Ym1Zb3dlYk0?resourcekey=0-qJIEA19Z-mMycszy1gy1zQ');
            break;

          case 'lit tier list':
              msg.reply('https://docs.google.com/document/d/1DiN4Yc1_RwvQWbmDW1HN1pFKzFrIxCR8vp4V2HzaMTY/edit?tab=t.0');
              break;

          case 'ucl':
              msg.reply('https://www.certamenlibrary.org/');
              break;



       case 'buzz':
        msg.delete();
        
         if (mod.voice && mod.voice.channel) {
          if (mod.voice.channel.permissionsFor(client.user).has('MUTE_MEMBERS')) {
            mod.voice.setMute(true)  // Mutes  
              .then(() => {
                console.log(`${mod.user.tag} has been muted.`);
              })
              .catch(err => {
                console.error(`Failed to mute ${mod.user.tag}: ${err.message}`);
              });
          } else {
            console.log("Bot does not have permission to mute the moderator.");
          }
        } else {
          console.log(`${mod.user.tag} is not in a voice channel.`);
        }
      
        processBuzz(msg, author, chan, chanData);
        break;
      
        // FOR ALL CASES START

        // 
        case '🐝':
        msg.delete();
        
         if (mod.voice && mod.voice.channel) {
          if (mod.voice.channel.permissionsFor(client.user).has('MUTE_MEMBERS')) {
            mod.voice.setMute(true)  // Mutes  
              .then(() => {
                console.log(`${mod.user.tag} has been muted.`);
              })
              .catch(err => {
                console.error(`Failed to mute ${mod.user.tag}: ${err.message}`);
              });
          } else {
            console.log("Bot does not have permission to mute the moderator.");
          }
        } else {
          console.log(`${mod.user.tag} is not in a voice channel.`);
        }
      
        processBuzz(msg, author, chan, chanData);
        break;

        //CASE 'b'
        case 'b':
        msg.delete();
        
         if (mod.voice && mod.voice.channel) {
          if (mod.voice.channel.permissionsFor(client.user).has('MUTE_MEMBERS')) {
            mod.voice.setMute(true)  // Mutes  
              .then(() => {
                console.log(`${mod.user.tag} has been muted.`);
              })
              .catch(err => {
                console.error(`Failed to mute ${mod.user.tag}: ${err.message}`);
              });
          } else {
            console.log("Bot does not have permission to mute the moderator.");
          }
        } else {
          console.log(`${mod.user.tag} is not in a voice channel.`);
        }
      
        processBuzz(msg, author, chan, chanData);
        break;
        //CASE buz
        case 'buz':
          msg.delete();
          
          if (mod.voice && mod.voice.channel) {
            if (mod.voice.channel.permissionsFor(client.user).has('MUTE_MEMBERS')) {
              mod.voice.setMute(true)  // Mutes  
                .then(() => {
                  console.log(`${mod.user.tag} has been muted.`);
                })
                .catch(err => {
                  console.error(`Failed to mute ${mod.user.tag}: ${err.message}`);
                });
            } else {
              console.log("Bot does not have permission to mute the moderator.");
            }
          } else {
            console.log(`${mod.user.tag} is not in a voice channel.`);
          }

          processBuzz(msg, author, chan, chanData);
          break;
        
        //case "BU"
        case 'bu':
        msg.delete();
        
         if (mod.voice && mod.voice.channel) {
          if (mod.voice.channel.permissionsFor(client.user).has('MUTE_MEMBERS')) {
            mod.voice.setMute(true)  // Mutes  
              .then(() => {
                console.log(`${mod.user.tag} has been muted.`);
              })
              .catch(err => {
                console.error(`Failed to mute ${mod.user.tag}: ${err.message}`);
              });
          } else {
            console.log("Bot does not have permission to mute the moderator.");
          }
        } else {
          console.log(`${mod.user.tag} is not in a voice channel.`);
        }
      
        processBuzz(msg, author, chan, chanData);
        break;
                
        // case bz

        case 'bz':
        msg.delete();
        
         if (mod.voice && mod.voice.channel) {
          if (mod.voice.channel.permissionsFor(client.user).has('MUTE_MEMBERS')) {
            mod.voice.setMute(true)  // Mutes  
              .then(() => {
                console.log(`${mod.user.tag} has been muted.`);
              })
              .catch(err => {
                console.error(`Failed to mute ${mod.user.tag}: ${err.message}`);
              });
          } else {
            console.log("Bot does not have permission to mute the moderator.");
          }
        } else {
          console.log(`${mod.user.tag} is not in a voice channel.`);
        }
      
        processBuzz(msg, author, chan, chanData);
        break;

        // case yippie
        case 'yippie':
        msg.delete();
        
         if (mod.voice && mod.voice.channel) {
          if (mod.voice.channel.permissionsFor(client.user).has('MUTE_MEMBERS')) {
            mod.voice.setMute(true)  // Mutes  
              .then(() => {
                console.log(`${mod.user.tag} has been muted.`);
              })
              .catch(err => {
                console.error(`Failed to mute ${mod.user.tag}: ${err.message}`);
              });
          } else {
            console.log("Bot does not have permission to mute the moderator.");
          }
        } else {
          console.log(`${mod.user.tag} is not in a voice channel.`);
        }
      
        processBuzz(msg, author, chan, chanData);
        break;

        case 'zubb':
          msg.delete();
          
           if (mod.voice && mod.voice.channel) {
            if (mod.voice.channel.permissionsFor(client.user).has('MUTE_MEMBERS')) {
              mod.voice.setMute(true)  // Mutes  
                .then(() => {
                  console.log(`${mod.user.tag} has been muted.`);
                })
                .catch(err => {
                  console.error(`Failed to mute ${mod.user.tag}: ${err.message}`);
                });
            } else {
              console.log("Bot does not have permission to mute the moderator.");
            }
          } else {
            console.log(`${mod.user.tag} is not in a voice channel.`);
          }
        
          processBuzz(msg, author, chan, chanData);
          break;

          //FINALLY LETS MOVE ON

        case 'r':
          msg.delete();   
        
          //   moderator is in a voice channel + the bot has permission to unmute?
          if (mod && mod.voice.channel) {
            if (mod.voice.channel.permissionsFor(client.user).has('MUTE_MEMBERS')) {
              mod.voice.setMute(false)  // Unmutes  
                .then(() => {
                  console.log(`${mod.user.tag} has been unmuted.`);
                  chan.send(`${mod && mod.user === author ? 'The moderator' : author} recognized the buzzes.`);
                })
                .catch(err => {
                  console.error(`Failed to unmute ${mod.user.tag}: ${err.message}`);
                  chan.send(`Failed to unmute the moderator.`);
                });
            } else {
              console.log("Bot does not have permission to unmute the moderator.");
              chan.send("I don't have permission to unmute the moderator.");
            }
          } else {
            console.log(`${mod.user.tag} is not in a voice channel.`);
            chan.send(`${mod.user.tag} is not in a voice channel.`);
          }
          break;
        
    
     case 'scores':
       msg.delete();
       const sc = chanData.scores;
       chan.send(`${mod && mod.user === author ? 'The moderator' : author}` +
                 `  displayed the scores.\nTeam A: ${sc[0]}\nTeam B: ${sc[1]}\nTeam C: ${sc[2]}`);
       break;
    
     default:
       const teamLetter = cmd.charAt(0).toUpperCase();


       if(['a=', 'b=', 'c='].includes(cmd.substring(0, 2))) {
         const points = parseFloat(cmd.substring(2));


         if(!isNaN(points)) {
           msg.delete();
           chanData.scores[cmd.charCodeAt(0) - 97] = points;
           chan.send(`${mod && mod.user === author ? 'The moderator' : author}` +
                     `  set Team ${teamLetter}'s score to ${points}.`);
         }
       }
       else if(['A', 'B', 'C'].includes(teamLetter)) {
         const points = parseFloat(cmd.substring(1));


         if(!isNaN(points)) {
           msg.delete();
           chanData.scores[cmd.charCodeAt(0) - 97] += points;


           if(cmd.charAt(1) === '-') {
             chan.send(`${mod && mod.user === author ? 'The moderator' : author}` +
                       `  subtracted ${-points} points from Team ${teamLetter}'s score.`);
           }
           else {
             chan.send(`${mod && mod.user === author ? 'The moderator' : author}` +
                       `  added ${points} points to Team ${teamLetter}'s score.`);
           }
         }
       }
   }
 }
});
