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

let facts = [];
let factslit = [];
let factshist = [];
let factsmyth = [];
let factslang = [];


let remainingFacts = []; 
let remainingFactslit = []; 
let remainingFactslang = []; 
let remainingFactsmyth = []; 
let remainingFactshist = []; 

let disabledChannels = [];


try {
  const jsonData = fs.readFileSync('./facts.json', 'utf-8');
  facts = JSON.parse(jsonData);
} catch (error) {
  console.error('Error reading or parsing facts.json:', error);
}

try {
  const jsonDataLit = fs.readFileSync('./factslit.json', 'utf-8');
  factslit = JSON.parse(jsonDataLit);
} catch (error) {
  console.error('Error reading or parsing factslit.json:', error);
}

try {
  const jsonDataHist = fs.readFileSync('./factshist.json', 'utf-8');
  factshist = JSON.parse(jsonDataHist);
} catch (error) {
  console.error('Error reading or parsing factshist.json:', error);
 }

try {
  const jsonDataMyth = fs.readFileSync('./factsmyth.json', 'utf-8');
  factsmyth = JSON.parse(jsonDataMyth);
} catch (error) {
  console.error('Error reading or parsing factsmyth.json:', error);
}

try {
  const jsonDataLang = fs.readFileSync('./factslang.json', 'utf-8');
  factslang = JSON.parse(jsonDataLang);
} catch (error) {
  console.error('Error reading or parsing factslang.json:', error);
}




let quotes = [];
try {
  const jsonData = fs.readFileSync('./quotes.json', 'utf-8');
  quotes = JSON.parse(jsonData);
} catch (error) {
  console.error('Error reading or parsing quotes.json:', error);
}

client.login(token).then(() => client.user.setActivity('certamen', { type: 'PLAYING' }));
const guideMsg = ' :)';

client.once('ready', () => {
  const testingChannel = client.channels.cache.find(channel => channel.name === 'testing');
  if (testingChannel) {
    testingChannel.send("BOT IS ALIVE! Since the bot has been reset, please set a moderator");
  } else {
    console.log('Testing channel not found.');
  }
});


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

function saveFactsToAllFiles() {
  saveFactsToFile('./factslit.json', factslit);
  saveFactsToFile('./factshist.json', factshist);
  saveFactsToFile('./factsmyth.json', factsmyth);
  saveFactsToFile('./factslang.json', factslang);
}


function saveFactsLitToFile() {
  try {
    fs.writeFileSync('./factslit.json', JSON.stringify(factslit, null, 2), 'utf-8');
    console.log('Literature facts saved to file.');
  } catch (error) {
    console.error('Error saving literature facts:', error);
  }
}

function saveFactsHistToFile() {
  try {
    fs.writeFileSync('./factshist.json', JSON.stringify(factshist, null, 2), 'utf-8');
    console.log('History facts saved to file.');
  } catch (error) {
    console.error('Error saving history facts:', error);
  }
}

function saveFactsMythToFile() {
  try {
    fs.writeFileSync('./factsmyth.json', JSON.stringify(factsmyth, null, 2), 'utf-8');
    console.log('Mythology facts saved to file.');
  } catch (error) {
    console.error('Error saving mythology facts:', error);
  }
}

function saveFactsLangToFile() {
  try {
    fs.writeFileSync('./factslang.json', JSON.stringify(factslang, null, 2), 'utf-8');
    console.log('Language facts saved to file.');
  } catch (error) {
    console.error('Error saving language facts:', error);
  }
}



function processBuzz(msg, author, chan, chanData) {
  // If already processing, wait for it to finish
  if (processing) {
    return setTimeout(processBuzz, 1, msg, author, chan, chanData); // Retry after a short delay
  }

  processing = true;  // Flag that processing is happening

  const buzzes = chanData.buzzList;
  const TS = buzzes.length ? msg.createdTimestamp - chanData.firstBuzzTS : 0;

  for (let i = 0; i < buzzes.length + 1; i++) {
    if (i === buzzes.length || TS < buzzes[i].TS) {
      let buzzPromise;

      if (i === 0) {
        // Adjust timestamps and send the first buzz
        buzzes.forEach(buzz => buzz.TS -= TS);  // Normalize timestamps for all previous buzzes
        chanData.firstBuzzTS = msg.createdTimestamp;
        buzzPromise = chan.send(`1. ${author} buzzed`);
      } else {
        buzzPromise = chan.send(`${i + 1}. ${author} buzzed (+${TS / 1000} s)`);
      }

      // Wait for the buzz message to be sent
      buzzPromise.then(messageCreate => {
        buzzes.splice(i, 0, { player: author, TS: TS, buzzMsg: messageCreate });

        // Delete the initial buzz message
        msg.delete().catch(error => {
          if (error.code !== 10008) { // Ignore the "Unknown Message" error
            console.error('Failed to delete the message:', error);
          }
        });

        // Update the list of buzzes, deleting any previous ones
        for (let j = i + 1; j < buzzes.length; j++) {
          buzzes[j].buzzMsg.delete().catch(error => {
            if (error.code !== 10008) {
              console.error('Failed to delete the buzz message:', error);
            }
          });

          const k = j;

          // Send an updated buzz message for each subsequent buzz
          chan.send(`${j + 1}. ${buzzes[j].player} buzzed (+${buzzes[j].TS / 1000} s)`)
            .then(messageCreate => {
              buzzes[k].buzzMsg = messageCreate;  // Update the buzz message reference
            });
        }

        // Reset processing after all buzzes have been processed
        processing = false;
      });

      break;  // Only process the first valid buzz
    }
  }
}

client.login(token).then(() => client.user.setActivity('certamen', { type: 'PLAYING'}));



client.on('messageCreate', msg => {
  console.log('Received messageCreate: ', msg.content);
 const author = msg.author;
 const chan = msg.channel;
 const cmd = msg.content.toLowerCase();



 if (msg.mentions.has(client.user) && msg.content.toLowerCase().startsWith('<@&1330019271677575182>')) {
  msg.reply('Maybe read my bio instead of pinging me and waking me up. Smh.');
}

if (msg.mentions.has(client.user) && msg.content.toLowerCase().startsWith('<@1329957204543017030>')) {
  msg.reply('Maybe read my bio instead of pinging me and waking me up. Smh. \n\n But because you chose to be so kind and wake me up, I will impart my divine knowledge upon you. I am based off of, and use the same commands as the old certamen bot that dchen made. \n\n If you are moderator, heed these words. First, you will want to give yourself the `mod` role by saying `mod` and being in a voice channel. Quite crazy, huh? \n\n Then, you will press `c` and that will let you clear all buzzers. Make sure to do this between every tossup. Then, as soon as someone buzzes, you will automatically be muted. \n\n To unmute yourself and talk to the common folk playing, press `r` and recognize the buzzes. It does show everyone who buzzed, so make sure to only take answers from the first person from each team that buzzed. \n\n After that, depending on which team scored (either a, b, c), you can assign them points by stating a+#. Use `a+10` for 10 points to team a and `b-10` for 10 less points to b, if they did that horrible. You can also set them equal to a certain point value by saying `c=10` points. \n\n Once you reach a score check, feel free to humble everyone by saying, `scores`.  If you are not a moderator and you try to change point values...Your name will be announced to the whole lot <3. This bot works in multiple text channels, but be aware that it will not carry over point values from another channel. \n\n @Sameelaughs cannot access administrator priviliges or do any sketchy things through me. That is completely banned in Discord, and she does not know how to do that anyway.  \n\nIf you are a player, heed this. Your buzzes do not always show up immediately- and that is okay. The bot takes a while to display it, but it will still have the correct timestamps.\n\n I currently work with `buzz`, `🐝`, `b`, `buz`, `bu`, `bz`, `yippie`, and `zubb`  \n\n Thank you for reading! Please let @Sameelaughs know if anything arises!');
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
const SAMEELAUGHS_ID = '931303941998776391';

if (cmd.startsWith('say ')) {
  if (msg.author.id === SAMEELAUGHS_ID) {
    const messageToSay = msg.content.substring(4).trim(); 
    if (messageToSay) {
      msg.delete(); // 
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

        // add the quote to the quotes array
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

// NORMAL FACTIT

if (cmd === "factit" || msg.channel.name === "factorizing" && !msg.author.bot) {
  if (msg.reference) {
    const repliedMessageId = msg.reference.messageId;
    chan.messages.fetch(repliedMessageId)
      .then(repliedMsg => {
        const factsContent = repliedMsg.content;
        const factsAuthor = repliedMsg.author.username;

        // add the quote to the facts array
        facts.push({ author: factsAuthor, content: factsContent });
        saveFactsToFile();

        msg.reply(`Fact saved: "${factsContent}"`);
      })
      .catch(err => {
        console.error('Error fetching replied message:', err);
        chan.send('Failed to fetch the replied message. Make sure it exists.');
      });
  } else if (msg.channel.name === "factorizing") {
    // automatically add messages in 'factorizing' unless they start with 'fact'
    if (!msg.content.toLowerCase().startsWith("fact")) {
      facts.push({ author: msg.author.username, content: msg.content });
      saveFactsToFile();
      msg.reply(`Your message has been factitized! 📚`);
    }
  } else {
    msg.reply("You need to reply to a message to add it to the Facts list.");
  }
}

//factit lit

if (cmd === "factitlit" || msg.channel.name === "factorizing" && !msg.author.bot) {
  if (msg.reference) {
    const repliedMessageId = msg.reference.messageId;
    chan.messages.fetch(repliedMessageId)
      .then(repliedMsg => {
        const factsContent = repliedMsg.content;
        const factsAuthor = repliedMsg.author.username;

        // add the quote to the facts array
        factslit.push({ author: factsAuthor, content: factsContent });
        facts.push({ author: factsAuthor, content: factsContent });
        saveFactsLitToFile();
        saveFactsToFile();


        msg.reply(`Fact saved: "${factsContent}"`);
      })
      .catch(err => {
        console.error('Error fetching replied message:', err);
        chan.send('Failed to fetch the replied message. Make sure it exists.');
      });
  } else if (msg.channel.name === "factorizing") {
    // automatically add messages in 'factorizing' unless they start with 'fact'
    if (!msg.content.toLowerCase().startsWith("fact")) {
      factslit.push({ author: msg.author.username, content: msg.content });
      saveFactsLitToFile();
      saveFactsToFile();
      msg.reply(`Your message has been factitized! 📚`);
    }
  } else {
    msg.reply("You need to reply to a message to add it to the Facts list.");
  }
}

// FACT IT HISTORY

if (cmd === "factithist" || msg.channel.name === "factorizing" && !msg.author.bot) {
  if (msg.reference) {
    const repliedMessageId = msg.reference.messageId;
    chan.messages.fetch(repliedMessageId)
      .then(repliedMsg => {
        const factsContent = repliedMsg.content;
        const factsAuthor = repliedMsg.author.username;

        // add the quote to the facts array
        factshist.push({ author: factsAuthor, content: factsContent });
        facts.push({ author: factsAuthor, content: factsContent });
        saveFactsHistToFile();
        saveFactsToFile();


        msg.reply(`Fact saved: "${factsContent}"`);
      })
      .catch(err => {
        console.error('Error fetching replied message:', err);
        chan.send('Failed to fetch the replied message. Make sure it exists.');
      });
  } else if (msg.channel.name === "factorizing") {
    // automatically add messages in 'factorizing' unless they start with 'fact'
    if (!msg.content.toLowerCase().startsWith("fact")) {
      factshist.push({ author: msg.author.username, content: msg.content });
      saveFactsHistToFile();
      saveFactsToFile();
      msg.reply(`factitized! 📚`);
    }
  } else {
    msg.reply("reply to a message to add it to the hisotry list.");
  }
}

// FACT IT MYTH
if (cmd === "factitmyth" || msg.channel.name === "factorizing" && !msg.author.bot) {
  if (msg.reference) {
    const repliedMessageId = msg.reference.messageId;
    chan.messages.fetch(repliedMessageId)
      .then(repliedMsg => {
        const factsContent = repliedMsg.content;
        const factsAuthor = repliedMsg.author.username;

        // add the quote to the facts array
        factsmyth.push({ author: factsAuthor, content: factsContent });
        facts.push({ author: factsAuthor, content: factsContent });
        saveFactsMythToFile();
        saveFactsToFile();


        msg.reply(`Fact saved: "${factsContent}"`);
      })
      .catch(err => {
        console.error('Error fetching replied message:', err);
        chan.send('Failed to fetch the replied message. Make sure it exists.');
      });
  } else if (msg.channel.name === "factorizing") {
    // automatically add messages in 'factorizing' unless they start with 'fact'
    if (!msg.content.toLowerCase().startsWith("fact")) {
      factsmyth.push({ author: msg.author.username, content: msg.content });
      saveFactsMythToFile();
      saveFactsToFile();
      msg.reply(`Your message has been factitized! 📚`);
    }
  } else {
    msg.reply("You need to reply to a message to add it to the Facts list.");
  }
}

//
if (cmd === "factitlang" || msg.channel.name === "factorizing" && !msg.author.bot) {
  if (msg.reference) {
    const repliedMessageId = msg.reference.messageId;
    chan.messages.fetch(repliedMessageId)
      .then(repliedMsg => {
        const factsContent = repliedMsg.content;
        const factsAuthor = repliedMsg.author.username;

        // add the quote to the facts array
        factslang.push({ author: factsAuthor, content: factsContent });
        facts.push({ author: factsAuthor, content: factsContent });
        saveFactsLangToFile();
        saveFactsToFile();


        msg.reply(`Fact saved: "${factsContent}"`);
      })
      .catch(err => {
        console.error('Error fetching replied message:', err);
        chan.send('Failed to fetch the replied message. Make sure it exists.');
      });
  } else if (msg.channel.name === "factorizing") {
    // automatically add messages in 'factorizing' unless they start with 'fact'
    if (!msg.content.toLowerCase().startsWith("fact")) {
      factslang.push({ author: msg.author.username, content: msg.content });
      saveFactsLangToFile();
      msg.reply(`factitized! 📚`);
    }
  } else {
    msg.reply("reply to a message to add it to the hisotry list.");
  }
}


// SAVE TO ALL FILES 

if (cmd === "factall" || msg.channel.name === "factorizing" && !msg.author.bot) {
  if (msg.reference) {
    const repliedMessageId = msg.reference.messageId;
    chan.messages.fetch(repliedMessageId)
      .then(repliedMsg => {
        const factsContent = repliedMsg.content;
        const factsAuthor = repliedMsg.author.username;

        // Add the quote to each category's facts array
        factslit.push({ author: factsAuthor, content: factsContent });
        factshist.push({ author: factsAuthor, content: factsContent });
        factsmyth.push({ author: factsAuthor, content: factsContent });
        factslang.push({ author: factsAuthor, content: factsContent });

        // Save all facts to their respective files
        saveFactsToAllFiles();

        msg.reply(`Fact saved to all categories: "${factsContent}"`);
      })
      .catch(err => {
        console.error('Error fetching replied message:', err);
        chan.send('Failed to fetch the replied message. Make sure it exists.');
      });
  } else if (msg.channel.name === "factorizing") {
    // Automatically add messages in 'factorizing' unless they start with 'fact'
    if (!msg.content.toLowerCase().startsWith("fact")) {
      factslit.push({ author: msg.author.username, content: msg.content });
      factshist.push({ author: msg.author.username, content: msg.content });
      factsmyth.push({ author: msg.author.username, content: msg.content });
      factslang.push({ author: msg.author.username, content: msg.content });
      
      // Save all facts to their respective files
      saveFactsToAllFiles();
      msg.reply(`Your message has been factitized and saved to all categories! 📚`);
    }
  } else {
    msg.reply("You need to reply to a message to add it to the Facts list.");
  }
}



if (disabledChannels.includes(chan.id) && cmd !== 'enable') return;

if (cmd.startsWith('t')) {
  const timeMatch = msg.content.match(/^t(\d+)$/);
  if (timeMatch) {
    const timeInSeconds = parseInt(timeMatch[1], 10);
    if (!isNaN(timeInSeconds) && timeInSeconds > 0) {
      msg.delete().catch(console.error);

      // Send the initial timer message and store it for later edits
      chan.send(`Timer set for ${timeInSeconds} seconds...`)
        .then(timerMessage => {
          let remainingTime = timeInSeconds;

          // Function to update the timer message
          const updateMessage = () => {
            if (remainingTime > 0) {
              timerMessage.edit(`Time remaining: ${remainingTime} / ${timeInSeconds} seconds.`);
            } else {
             timerMessage.edit(`Time remaining: 0 / ${timeInSeconds} seconds!`);
              chan.send('Time!');
              clearInterval(timerInterval);
            }
          };

          // Update the message every second (1000ms)
          const timerInterval = setInterval(() => {
            remainingTime -= 1; // Deduct 1 second
            updateMessage(); // Update the displayed time
          }, 1000); // Every 1 second

          // Set the final timeout to notify when the timer ends
          setTimeout(() => {
            remainingTime = 0; // Force time to 0
            updateMessage(); // Update the message to show "Time!"
            clearInterval(timerInterval); // Clear the interval
          }, timeInSeconds * 1000); // Timeout aligned to the total time
        });
    } else {
      chan.send('Invalid time format. Use t# (e.g., t15 for 15 seconds).');
    }
  }
}





  
   switch(cmd) {

    case 'disable':
      if (!disabledChannels.includes(chan.id)) {
          disabledChannels.push(chan.id);
          chan.send(`This channel has been disabled for bot interactions.`);
      } else {
          chan.send(`Bot is already disabled in this channel.`);
      }
      break;

  case 'enable':
      if (disabledChannels.includes(chan.id)) {
          disabledChannels = disabledChannels.filter(id => id !== chan.id);
          chan.send(`Bot has been re-enabled in this channel.`);
      } else {
          chan.send(`Bot is already active in this channel.`);
      }
      break;

     
    case 'commands':
       msg.delete();
       chan.send(`Salve ${author}-(vocative)! here is a list of commands, based on the previous certamen bot.\n` +
                 'help: see the certamen apis guide \ncommands: see commands \nmod: sets the moderator\n' +
                 'c: clears any buzzes\nbuzz: uses `buzz`, `🐝`, `b`, `buz`, `bu`, `bz`, `yippie`, and `zubb` . mutes reader.\nr: recognizes buzzes and unmutes reader' +
                 '\n' + 
                 'a+100: adds 100 points to Team A\'s score\nb-100: subtracts 100 points from Team B\'s score\n' +
                 'c=100: sets Team C\'s score to 100\nscores: updates scores \n t15: sets a timer for 15, or t#, of seconds\naureliapassagelatin: pulls up the latin aurelia passage\naureliapassagegreek: pulls up the greek aurelia passage');
       break;
    
     case 'mod':
       chanData.moderator = msg.member;
       chan.send('you are now the moderator.');
       break;


       case 'fact':
    if (facts.length > 0) {
        if (remainingFacts.length === 0) {
            remainingFacts = [...facts]; 
            for (let i = remainingFacts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [remainingFacts[i], remainingFacts[j]] = [remainingFacts[j], remainingFacts[i]];
            }
        }
        const randomFact = remainingFacts.shift(); 

        msg.delete()
            .then(() => {
                msg.channel.send(`📚 ${msg.author}, Did you know? ${randomFact.content}`);
            })
            .catch(err => {
                console.error("Error deleting message:", err);
                msg.channel.send(`📚 Did you know? ${randomFact.content} - ${msg.author}`);
            });
    } else {
        msg.channel.send(`Sorry, ${msg.author}, I couldn't find any facts to share!`);
    }
    break;


// FACT LIT
    case 'factlit':
      if (factslit.length > 0) {
          if (remainingFactslit.length === 0) {
              remainingFactslit = [...factslit]; 
              for (let i = remainingFactslit.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [remainingFactslit[i], remainingFactslit[j]] = [remainingFactslit[j], remainingFactslit[i]];
              }
          }
          const randomFact = remainingFactslit.shift(); 
  
          msg.delete()
              .then(() => {
                  msg.channel.send(`📚 ${msg.author}, Did you know? ${randomFact.content}`);
              })
              .catch(err => {
                  console.error("Error deleting message:", err);
                  msg.channel.send(`📚 Did you know? ${randomFact.content} - ${msg.author}`);
              });
      } else {
          msg.channel.send(`Sorry, ${msg.author}, I couldn't find any facts to share!`);
      }
      break;

      
// FACT HIST
    case 'facthist':
      if (factshist.length > 0) {
          if (remainingFactshist.length === 0) {
              remainingFactshist = [...factshist]; 
              for (let i = remainingFactshist.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [remainingFactshist[i], remainingFactshist[j]] = [remainingFactshist[j], remainingFactshist[i]];
              }
          }
          const randomFact = remainingFactshist.shift(); 
  
          msg.delete()
              .then(() => {
                  msg.channel.send(`📚 ${msg.author}, Did you know? ${randomFact.content}`);
              })
              .catch(err => {
                  console.error("Error deleting message:", err);
                  msg.channel.send(`📚 Did you know? ${randomFact.content} - ${msg.author}`);
              });
      } else {
          msg.channel.send(`Sorry, ${msg.author}, I couldn't find any facts to share!`);
      }
      break;

// FACT MYTH
    case 'factmyth':
      if (factsmyth.length > 0) {
          if (remainingFactsmyth.length === 0) {
              remainingFactsmyth = [...factsmyth]; 
              for (let i = remainingFactsmyth.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [remainingFactsmyth[i], remainingFactsmyth[j]] = [remainingFactsmyth[j], remainingFactsmyth[i]];
              }
          }
          const randomFact = remainingFactsmyth.shift(); 
  
          msg.delete()
              .then(() => {
                  msg.channel.send(`📚 ${msg.author}, Did you know? ${randomFact.content}`);
              })
              .catch(err => {
                  console.error("Error deleting message:", err);
                  msg.channel.send(`📚 Did you know? ${randomFact.content} - ${msg.author}`);
              });
      } else {
          msg.channel.send(`Sorry, ${msg.author}, I couldn't find any facts to share!`);
      }
      break;

      
// FACT LANG
    case 'factlang':
      if (factslang.length > 0) {
          if (remainingFactslang.length === 0) {
              remainingFactslang = [...factslang]; 
              for (let i = remainingFactslang.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [remainingFactslang[i], remainingFactslang[j]] = [remainingFactslang[j], remainingFactslang[i]];
              }
          }
          const randomFact = remainingFactslang.shift(); 
  
          msg.delete()
              .then(() => {
                  msg.channel.send(`📚 ${msg.author}, Did you know? ${randomFact.content}`);
              })
              .catch(err => {
                  console.error("Error deleting message:", err);
                  msg.channel.send(`📚 Did you know? ${randomFact.content} - ${msg.author}`);
              });
      } else {
          msg.channel.send(`Sorry, ${msg.author}, I couldn't find any facts to share!`);
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
       chan.send(`${mod && mod.user === author ? `The moderator <@${author.id}>` : author}` +
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

      case 'help':
                msg.reply('https://docs.google.com/document/d/1z-JrYRgop5erCDAhLoGNcB-QECQNSo1MVZaY-Db_fBo/edit?tab=t.0');
                break;
  

      case 'ucl':
              msg.reply('https://www.certamenlibrary.org/');
              break;



              case 'buzz':
                case '🐝':
                case 'b':
                case 'buzz!':
                case 'buz':
                case 'bu':
                case 'bz':
                case 'yippie':
                case 'zubb':
                case 'buzz!':
                case 'yippee!':


                msg.delete().catch(error => {
                  if (error.code !== 10008) {  // Not "Unknown Message"
                      console.error('Failed to delete the message:', error);
                  }
              });
              
                
                  if (mod && mod.voice && mod.voice.channel) {
                    if (mod.voice.channel.permissionsFor(client.user).has('MUTE_MEMBERS')) {
                      mod.voice.setMute(true)    
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
                    console.log("No moderator assigned or not in a voice channel. Buzz will proceed without muting.");
                    chan.send("⚠ No moderator is assigned or they are not in a voice channel. Buzzes will still be recorded.");
                  }
                
                  processBuzz(msg, author, chan, chanData);
                  break;
                

      
        // FOR ALL CASES START

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
                  chan.send(`i can't unmute you :cry:.`);
                });
            } else {
              console.log("Bot does not have permission to unmute the moderator.");
              chan.send("i don't have permission to unmute u.");
            }
          } else {
            if (!mod || !mod.user) {
              console.log("mod or mod.user is undefined.");
              chan.send("no moderator is set, so i can't unmute u.");
          } else {
              console.log(`${mod.user.tag} is not in a voice channel.`);
              chan.send("mod ur not in a voice channel :ogre:.");

          }
          }
          break;
        
    
     case 'scores':
       msg.delete();
       const sc = chanData.scores;
       chan.send(`${mod && mod.user === author ? 'the moderator' : author}` +
                 `  chose to display the scores.\nTeam A: ${sc[0]}\nTeam B: ${sc[1]}\nTeam C: ${sc[2]}`);
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
       else if (['A', 'B', 'C'].includes(teamLetter)) {
        const points = parseFloat(cmd.substring(2));  // Change to substring(2) to correctly parse after 'A+', 'B-', etc.
        
        if (!isNaN(points)) {
          msg.delete();
          if (cmd.charAt(1) === '+') {
            chanData.scores[cmd.charCodeAt(0) - 65] += points;
            chan.send(`${mod && mod.user === author ? 'The moderator' : author}` +
                      ` added ${points} points to Team ${teamLetter}'s score.`);
          } else if (cmd.charAt(1) === '-') {
            chanData.scores[cmd.charCodeAt(0) - 65] -= points;
            chan.send(`${mod && mod.user === author ? 'The moderator' : author}` +
                      ` subtracted ${points} points from Team ${teamLetter}'s score.`);
          }
        }
      }
      
   }
   
 }
});
