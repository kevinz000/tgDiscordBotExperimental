
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const Discord = require('discord.js');
const sleep = require('system-sleep');
const filesystem = require('fs');
const EOL = require('os').EOL;
const process_modules = require('child_process');
const sqlite3 = require('sqlite3');
//DISCORD CLIENT!
const client = new Discord.Client
//DATABASE
let bot_db = new sqlite3.Database('./BotPrimaryDB.db', (err) => {
  if (err) {
    console.error("CRITICAL SQL ERROR:" + err.message);
	hard_shutdown();
  }
  console.log('Connected to primary database.');
});
//DB INIT
//ID = discord snowflake UID, permissions = permissions bitflags, money = money
bot_db.run("CREATE TABLE IF NOT EXISTS Users(id INTEGER PRIMARY KEY,permissions INTEGER NOT NULL);");
//ID = discord snowflake UID, money = money
bot_db.run("CREATE TABLE IF NOT EXISTS Money(id INTEGER PRIMARY KEY, money INTEGER NOT NULL);");
//ID = discord snowflake server ID, log_id = id of logging channel
bot_db.run("CREATE TABLE IF NOT EXISTS LoggingChannels(serverid INTEGER PRIMARY KEY, channelid INTEGER NOT NULL);");



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//DEFINES
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//SYSTEM
const PATH_SEPERATOR = '\\';
const TRUE = 1;
const FALSE = 0;
const NULL = undefined;
//Permissions
const COMMAND_PERMISSION_PUBLIC = 0;
const COMMAND_PERMISSION_OPERATOR = 1;
const COMMAND_PERMISSION_OWNER = 2;
//File extension
const LogExtension = '.txt';
//8ball responses
const eightball_responses = ['It is certain.', 'It is decidedly so.', 'Without a doubt.', 'Yes, definitely.', 'You may rely on it.', 'As I see it, yes.', 'Most Likely.', 'Outlook good.', 'Yes.', 'Signs point to yes.', 'Reply hazy, try again...', 'Ask again later...', 'Better not tell you now~', 'Cannot predict now.', 'Concentrate and ask again...', 'Don\'t count on it.', 'My reply is no.', 'My sources say no.', 'Outlook not so good...', 'Very doubtful'];
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Globally Used Variables
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Command list Object
var commandList = {};
//Command categories
var commandsByCategory = {};
//Silences the bot.
var stealthmin = 0;
//Primary command append - Used in channels
var command_append_primary = '!'
//Temporary Persistence
var persistence_code = TRUE;
//Ships and waifus
var storedwaifus = {};
var storedships = {};
var ship_rig_1 = null;
var ship_rig_2 = null;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BOT CONFIG - MOVE SOMEWHERE ELSE AND CODE IN LOADING FROM FILE LATER!
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Debug switch
const DEBUGGING = 1;
//Bot token
const token = 'MzIxMzIwNDY2NjIxMTM2ODk2.DBgkLA.zjGqHRJYUf7oba03HCBvRTpauC8';
//Owner id
const owner_id = '192143138817572865'
//Operator flag check
const primary_operator_flag = 'MANAGE_GUILD'
//Default Bot Status
const default_presence = 'invisible'
const override_startup_presence = 0
//!roll
const DICEROLL_MAX_DIE = 150
const DICEROLL_MAX_SIDES = 1000000000000
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//HELPERS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////
//Discord Markdown Helpers//
/////////////////////////////
function wrapTextBold(text1){return ("**" + text1 + "**");}
function wrapTextItalics(text1){return ("*" + text1 + "*");}
function wrapTextStrikethrough(text1){return ("~" + text1 + "~");}
/////////////////////////////
//Math Helpers//
/////////////////////////////
//Absolute value.
function abs(number){return Math.abs(number)}
//Random number between low and high, integer specifies whether to round.
function rand(low, high, integer){var ret = (Math.random()*(abs(low)+abs(high)))-abs(low);if(integer == TRUE){ret = Math.round(ret);}debugOut('Random Generated ' + ret);return ret;}
//Gets nearest multiple of nearest_number.
function round(number, nearest_number){if(nearest_number == undefined){nearest_number = 1}if(nearest_number == 0){return NULL}var remain = number % nearest_number;if(remain > (nearest_number / 2)){return (number - remain + nearest_number);}else{return(number - remain)}}
/////////////////////////////
//Array Helpers//
/////////////////////////////
//Array Shuffle from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle_array(array){var currentIndex = array.length, temporaryValue, randomIndex;while(0 !== currentIndex){randomIndex = Math.floor(Math.random() * currentIndex);currentIndex-=1;temporaryValue=array[currentIndex];array[currentIndex]=array[randomIndex];array[randomIndex] = temporaryValue;}return array;}
//Get a random item from an array
function get_random_item_from_array(items){return items[rand(0, items.length-1, TRUE)];}
//Pick BYOND function
function pick(array){return get_random_item_from_array(shuffle_array(array));}
/////////////////////////////
//System Helpers//
/////////////////////////////
async function hard_shutdown(restart){await sleep(100);client.destroy();await sleep(100);if(restart == TRUE){process.exit(45)}else{process.exit()}}
async function debugOut(text){if(DEBUGGING){console.log('Bot Primary: ' + text);}}
/////////////////////////////
//Message Helpers//
/////////////////////////////
//Checks if a message is from a guild
function is_message_from_guild(message){if(message.guild){return TRUE}else{return FALSE}}
//@Sender, [message]
function respond_to_message(message, txt){if(stealthmin == 1){return};message.reply(txt);}
//Send to message channel
function channel_send(channel, txt){if(stealthmin == 1){return}channel.send(txt);}
//Does the message have the primary command append at the start? If so, return the rest of the message. If false, return -1.
function check_message_primary_command_append(message){var string = message.cleanContent;if(string.search(command_append_primary) == 0){var out = message.cleanContent.substring(command_append_primary.length);return out;}else{return FALSE;}}
/////////////////////////////
//Permission Checks
/////////////////////////////
function is_user_owner(User){if(User.id == owner_id){return TRUE}return FALSE}
function check_guildmember_operator(guild_user){if(is_user_owner(guild_user.user)){return TRUE}else if(guild_user.hasPermission(primary_operator_flag)){return TRUE}else{return FALSE}}
function check_operator_from_message(message){if(message.guild){return check_guildmember_operator(message.member)}else{return is_user_owner(message.author)}}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//STARTUP
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Log our bot in
client.login(token);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//SHUTDOWN
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
process.on('exit', function(code) {
    console.log('About to exit with code:', code);
    client.destroy();
 });
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Standardized Commands
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Helpers//
function registerCommand(commandObject, triggerKeyword, category){commandList[triggerKeyword] = commandObject;if(commandsByCategory[category] && commandsByCategory[category].constructor == Object){commandsByCategory[category] += commandObject}else{commandsByCategory[category] = {};commandsByCategory[category][triggerKeyword] = commandObject;}};
function parse_string_for_command_keyword(content){if(content == FALSE){return NULL}var parseString = content.toLowerCase();for(i in commandList){if(commandList.hasOwnProperty(i)){if((parseString.search(i.toLowerCase()) == 0) && (parseString.length == i.length || parseString.charAt(i.length) == " ")){return i;}}}return FALSE}
function getCommandObjectByKey(key){return commandList[key];}
function parseMessageForCommandObject(message){return getCommandObjectByKey(parse_string_for_command_keyword(check_message_primary_command_append(message)));}
function textAfterCommandKeyword(content, keyword){return content.substring(keyword.length+command_append_primary.length);}

///////////////////////////////////////////////////////////////////////////////////////
//Automatic Command Parse
function handle_message_commands(message){var found = parseMessageForCommandObject(message);if(found == NULL){return}found.on_parse(message);}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Primary Definitions
function BotCommand(trigger_key, guild_only, description, category_new, permission_level){
	var newCommand = {};
	newCommand.keyword = trigger_key;
	newCommand.requires_guild = guild_only;
	newCommand.category = category_new
	newCommand.desc = description;
	newCommand.permission_requirement = permission_level;
	newCommand.on_parse = function(triggering_message){if(this.requires_guild && (is_message_from_guild(triggering_message) == FALSE)){return NULL}if(is_message_from_guild(triggering_message) == TRUE){if(this.userHasPermission(triggering_message.member, triggering_message) == TRUE){return this.trigger(triggering_message)}else{triggering_message.reply(wrapTextBold('Access Denied'))}}else{if(this.userHasPermission(triggering_message.author, triggering_message) == TRUE){return this.trigger(triggering_message)}else{triggering_message.reply(wrapTextBold('Access Denied'))}}}
	newCommand.userHasPermission = function(user, message){if(!message.guild){return is_user_owner(user)}if(this.permission_requirement == COMMAND_PERMISSION_OPERATOR){if(is_user_owner(user) || check_guildmember_operator(user)){debugOut(is_user_owner(user));debugOut(check_guildmember_operator(user));return TRUE}}else if(this.permission_requirement == COMMAND_PERMISSION_OWNER){return is_user_owner(user)}else{;return TRUE}}
	newCommand.trigger = function(triggering_message){}
	registerCommand(newCommand, trigger_key, category_new);
	return newCommand;
}
////////////////////////////////////////Commands
const command_eightball = new BotCommand('8ball', FALSE, 'Returns an answer from the Magic 8-ball!', 'Fun', COMMAND_PERMISSION_PUBLIC);
command_eightball.trigger = function(triggering_message){triggering_message.reply(wrapTextBold(get_random_item_from_array(shuffle_array(eightball_responses))));}
const command_coinflip = new BotCommand('coinflip', FALSE, 'Heads/Tails coinflip.', 'Fun', COMMAND_PERMISSION_PUBLIC);
command_coinflip.trigger = function(triggering_message){triggering_message.reply(wrapTextBold(pick(['Heads!', 'Tails!'])));}
const command_shutdown = new BotCommand('shutdown', FALSE, 'Immediate bot shutdown.', 'Admin', COMMAND_PERMISSION_OPERATOR);
command_shutdown.trigger = function(triggering_message){triggering_message.reply(wrapTextBold('Shutting Down'));hard_shutdown();}
const command_commands = new BotCommand('commands', FALSE, 'List all commands.', 'Basic', COMMAND_PERMISSION_PUBLIC);
command_commands.trigger = function(triggering_message){	//Borked.
	var output = wrapTextBold('Commands: ') + EOL;
	for(cat in commandsByCategory){
		output += commandsByCategory[cat] + ': ';
		for(command in cat){
			output += cat[command] += ', ';
		}
		ouput = output.substring(0, output.length-2);
		output += EOL;
	}
	triggering_message.reply(output);
}
const command_forcesay = new BotCommand('forcesay', FALSE, 'Forcesay', 'HIDDEN', COMMAND_PERMISSION_OWNER);
command_forcesay.trigger = function(message){return message.channel.send(textAfterCommandKeyword(message.cleanContent, this.keyword));};
const command_roll = new BotCommand('roll', FALSE, 'Dice roll in 2d6 (number of die = 2, sides of each die = 6)', 'Fun', COMMAND_PERMISSION_PUBLIC);
command_roll.trigger = function(triggering_message){var inputArray = textAfterCommandKeyword(triggering_message.cleanContent, this.keyword).toLowerCase().trim().split("d");if(inputArray.length != 2){triggering_message.reply('Invalid Format');return}var die = parseInt(inputArray[0]);var sides = parseInt(inputArray[1]);if(isNaN(die) || isNaN(sides)){triggering_message.reply('Invalid Format');return}if(die > DICEROLL_MAX_DIE || sides > DICEROLL_MAX_SIDES){triggering_message.reply('Too large.');return}if(die <= 0 || sides <= 0){triggering_message.reply('Invalid.');return}var i;var ret = 0;var rolls = '(';for(i = 0;i < die; i++){var rolled = round(rand(0, sides),1);ret += rolled;rolls += rolled;rolls += '+';}rolls = rolls.substring(0, rolls.length-1);rolls += ')';triggering_message.reply('Rolled: ' + ret + ' ' + rolls);}
const command_rand = new BotCommand('rand', FALSE, '!rand lower upper - Returns a rounded integer.', 'Misc', COMMAND_PERMISSION_PUBLIC);
command_rand.trigger = function(triggering_message){var inputArray = textAfterCommandKeyword(triggering_message.cleanContent, this.keyword).toLowerCase().trim().split(' ');if(inputArray.length != 2){triggering_message.reply('Invalid Format');return}var low = parseInt(inputArray[0]);var high = parseInt(inputArray[1]);if(isNaN(low)||isNaN(high)){triggering_message.reply('Invalid input');return;}if(high < low){triggering_message.reply('High is lower than low!');return;}triggering_message.reply(rand(low,high,TRUE))};
const command_rand_float = new BotCommand('rand_float', FALSE, '!rand_float lower upper - Returns raw value float.', 'Misc', COMMAND_PERMISSION_PUBLIC);
command_rand_float.trigger = function(triggering_message){var inputArray = textAfterCommandKeyword(triggering_message.cleanContent, this.keyword).toLowerCase().trim().split(' ');	if(inputArray.length != 2){triggering_message.reply('Invalid Format');return;}var low = parseInt(inputArray[0]);var high = parseInt(inputArray[1]);if(isNaN(low)||isNaN(high)){triggering_message.reply('Invalid input');return;}if(high < low){triggering_message.reply('High is lower than low!');return;}triggering_message.reply(rand(low,high))};
const command_restart = new BotCommand('restart', FALSE, 'Requires bot start wrapper. Restarts the bot.', 'Misc', COMMAND_PERMISSION_OPERATOR);
command_restart.trigger = function(triggering_message){triggering_message.reply(wrapTextBold('Shutting down and attempting automatic restart.'));hard_shutdown(TRUE);}
const command_ratewaifu = new BotCommand('ratewaifu', TRUE, 'Rates someone in the channel as your waifu.', 'Fun', COMMAND_PERMISSION_PUBLIC);
command_ratewaifu.trigger = function(triggering_message){var name = textAfterCommandKeyword(triggering_message.cleanContent, this.keyword).trim();debugOut(name);if(name == ""){return}if(name.charAt(0) == "@"){name = name.substring(1);}debugOut(name);if(isNaN(storedwaifus[name])||persistence_code == FALSE){storedwaifus[name] = rand(0, 10, TRUE);}triggering_message.reply('I rate ' + name + ' ' + storedwaifus[name] + '/10');};
const command_reset_persistence = new BotCommand('reset_persistence', TRUE, 'Resets persistent non-config variables.', 'Misc', COMMAND_PERMISSION_OPERATOR);
const command_pet = new BotCommand('pet', TRUE, 'Pet', 'HIDDEN', COMMAND_PERMISSION_PUBLIC);
command_pet.trigger = function(msg){var actualcontent = msg.cleanContent.trim(); if(actualcontent.charAt(0) == '@'){actualcontent = actualcontent.substring(1)};msg.reply(wrapTextItalics("pets" + textAfterCommandKeyword(actualcontent,this.keyword)))};

//Logging
const setLogChannelID = new BotCommand('setLogChannelID', TRUE, 'setLogChannelID', 'Administration', COMMAND_PERMISSION_OWNER);
setLogChannelID.trigger = function(msg){
	var newid = textAfterCommandKeyword(msg.cleanContent, this.keyword).toLowerCase().trim();
	
}

//Economy Base
function get_money_amount(userid){
	
}






const command_money = new BotCommand('money', TRUE, 'Money', 'Misc', COMMAND_PERMISSION_PUBLIC;
command_money.trigger = function(msg){msg.reply("You have " + get_money_amount(msg.Author.id) + "$!");

//PERSISTENCE RESET
command_reset_persistence.trigger = function(triggering_message){
//VARIABLES TO RESET
	storedwaifus = {};
	storedships = {};
	triggering_message.reply('Variables Cleared.');
//END
}
//END PERSISTENCE RESET

const command_ship = new BotCommand('ship', FALSE, 'Creates a random pairing!', 'Fun', COMMAND_PERMISSION_PUBLIC);
const HAS_NO_FRIENDS = {'Capital H': TRUE};
command_ship.trigger = function(triggering_message){command_proc_async_ship(triggering_message)}
async function command_proc_async_ship(message, bypass){
	var name1 = null;
	var name2 = null;
	var input = textAfterCommandKeyword(message.cleanContent, command_ship.keyword);
	if(input && input != "" &&(!bypass == TRUE)){
		input = input.trim();
		name1 = input;
		if(name1.charAt(0) == "@"){
			name1 = name1.substring(1);
		}}
	if(ship_rig_1 && ship_rig_2 && !name1 && !name2){
		message.reply('I ship ' + ship_rig_1 + ' and ' + ship_rig_2 + '! May they forever have happiness and their love last forever.');
		ship_rig_1 = null;
		ship_rig_2 = null;
		return;
	}
	var idArray = get_ids_in_channel(message.channel);
	var userNameArray = [];
	var i = 0;
	for(id in idArray){
		await id_to_user(idArray[id]).then(function(user){userNameArray[i] = user;i++},function(reject){});
	}
	i = 0
	var actualNameArray = [];
	var guildNameArray = [];
	for(user in userNameArray){
		await user_to_member(userNameArray[user], message.channel.guild).then(function(guildmember){guildNameArray[i] = guildmember;i++},function(reject){});
	}
	i = 0;
	for(member in guildNameArray){
		if(guildNameArray[member] && (guildNameArray[member].user.presence.status != 'offline')){
			actualNameArray[i] = guildNameArray[member].displayName;
			i++
		}
	}
	i = 0;
	if(!name1){
	name1 = actualNameArray[rand(0, actualNameArray.length, 1)];}
	if(!name2){
	name2 = actualNameArray[rand(0, actualNameArray.length, 1)];}
	if(HAS_NO_FRIENDS[name1]||HAS_NO_FRIENDS[name2]){
		return command_proc_async_ship(message, TRUE);
	}
	if(persistence_code){
		if(storedships[name1]){
			name2 = storedships[name1];
		}
		if(storedships[name2]){
			name1 = storedships[name2];
		}
		storedships[name1] = name2;
		storedships[name2] = name1;
	}
	message.reply('I ship ' + name1 + ' and ' + name2 + '! May they forever have happiness and their love last forever.');
}

const command_rig1 = new BotCommand('rig_one', FALSE, '', 'HIDDEN', COMMAND_PERMISSION_OPERATOR);
command_rig1.trigger = function(message){
	var output = textAfterCommandKeyword(message.cleanContent, this.keyword).trim();
	if(!output || output == ""){
		ship_rig_1 = null;
		message.reply('Cleared!');
	}
	ship_rig_1 = output;
	message.reply(ship_rig_1);
}

const command_rig2 = new BotCommand('rig_two', FALSE, '', 'HIDDEN', COMMAND_PERMISSION_OPERATOR);
command_rig2.trigger = function(message){
	var output = textAfterCommandKeyword(message.cleanContent, this.keyword).trim();
	if(!output || output == ""){
		ship_rig_2 = null;
		message.reply('Cleared!');
	}
	ship_rig_2 = output;
	message.reply(ship_rig_2);
}

const command_script = BotCommand('script', FALSE, '', 'HIDDEN', COMMAND_PERMISSION_OWNER);
command_script.trigger = function(message){try{eval(textAfterCommandKeyword(message.cleanContent,this.keyword));message.reply('Executing: ' + textAfterCommandKeyword(message.cleanContent,this.keyword));}catch(err){message.reply('Execution Failed: ' + err.message);}};
const command_debug_var = BotCommand('debugvar', FALSE, '', 'HIDDEN', COMMAND_PERMISSION_OWNER);
command_debug_var.trigger = function(message){try{message.reply(eval(textAfterCommandKeyword(message.cleanContent, this.keyword)));}catch(err){message.reply('Error: ' + err.message)}};

async function user_to_member(user, guild){return guild.fetchMember(user);}
async function id_to_user(id){return client.fetchUser(id);}
function get_ids_in_channel(channel){var returnArray = [];if(channel.type == 'dm'){returnArray += channel.recipient.id;}else if(channel.type == 'group'){returnArray = channel.recipients.keyArray();}else if(channel.type == 'text' || channel.type == 'voice'){returnArray = channel.members.keyArray();}return returnArray;}





//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//LOGGING
//Directories
//Text channels
const guild_textChannel_base_logging_directory = '.\\logging\\guildTextChat\\'

//File list
var FileArray = new Object();



function set_stealth(stealth_mode){
	stealthmin = stealth_mode;
	if(stealth_mode){
		client.user.setStatus('invisible');
	}
	else{
		client.user.setStatus('online');
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Random Functions
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//FILESYSTEM HELPERS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//File test function
function test_file_logging(){filesystem.appendFile('test.txt','WRITING_SUCCESS', (err) => {if(err) throw err; console.log('test.txt <-- WRITING_SUCCESS');})}
//Directory exists?
function check_directory(path){
	
}
//Make new directory
function make_directory(path){
	
}
//Check if file opened for writing
function is_file_opened(path){
	
}
//Open file for writing
function open_file(path){
	
}
//Automatic File Append
function AutomaticFileAppend(filePath, stringToAppend){
	
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//LOGGING
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//File test function

//Primary message logger. Do not use regular automatic parsing, this has to be standalone!
function log_message_sorted(message){
	switch(message.channel.type){
		case 'text':
			log_message_sorted_guild(message);
			break;
		case'dm':
			log_message_sorted_DM(message);
			break;
		case'group':
			log_message_sorted_groupDM(message);
			break;
	}
}

//Assume message is from a guild channel
function log_message_sorted_guild(message){
	return		//Debug.
	var directoryPath = (guild_textChannel_base_logging_directory + message.guild.name).replace(/['/'|'\']/g,'_');
	var filePath = (directoryPath + PATH_SEPERATOR + message.channel.name + LogExtension).replace(/['/'|'\']/g,'_');
	var currentDate = new Date();
	var logDate = currentDate.toLocaleDateString();
	var logTime = currentDate.toLocaleTimeString();
	var logMessageContents = message.cleanContent;
	var logSender = message.member.displayName;
	var logActualSender = message.author.username;
	var logActualSenderTag = message.author.tag;
	var logString = ('{' + logTime + '} ' + logSender + '[' + logActualSenderTag + '] ' + logMessageContents + EOL);
	debugOut('Message Logging Debug - Guild [' + message.guild.name + '] Channel [' + message.channel.name + ']');
	debugOut('Directory: ' + directoryPath);
	debugOut('File: ' + filePath);
	debugOut('Time: ' + currentDate.toLocaleTimeString());
	debugOut('Date: ' + currentDate.toLocaleDateString());
	debugOut('Sender: ' + logSender + ' [ACTUAL] ' + logActualSender + ' [TAG] ' + logActualSenderTag);
	debugOut('Contents: ' + logMessageContents);
	AutomaticFileAppend(filePath, logString);
}

//Assume message is from a DM
function log_message_sorted_DM(message){
	
}
//Assume message is from a group DM
function log_message_sorted_groupDM(message){
	
}

//When client is successfully logged in.
client.on('ready', () => {
  console.log('Logged in');
  if(override_startup_presence){
	client.user.setStatus(default_presence);
  }
  set_stealth(stealthmin)
  //test_file_logging();
});

// Create an event listener for messages
client.on('message', message => {
	log_message_sorted(message)		//Log the message first
	handle_message_commands(message);	//Automatic command handling
	//Everything below this is to be deprecated and replaced ASAP.
	var guild = is_message_from_guild(message)
	var command_content = check_message_primary_command_append(message)
	if(command_content == 0)
		return
	command_content = command_content.toLowerCase();
	console.log('Command Parse:');
	console.log(command_content);	
	//if(command_content.search('coinflip') == 0){
		//respond_to_message(message, coinflip());
	//}
	if(command_content.search('stealthmin') == 0){
		if(is_user_owner(message.author) == 0){
			return FALSE
		}
		if(stealthmin){
			set_stealth(0)
		}
		else{
			set_stealth(1)
		}
	}

	else if(command_content.search('debug') == 0){
		debugOut(commandList);
	}
	
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//END
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////