
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const Discord = require('discord.js');
const sleep = require('system-sleep');
const filesystem = require('fs');
const EOL = require('os').EOL;
//DISCORD CLIENT!
const client = new Discord.Client();
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
//Silences the bot.
var stealthmin = 0;
//Primary command append - Used in channels
var command_append_primary = '!'
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
function round(number, nearest_number){if(nearest_number == undefined){nearest_number = 1}if(nearest_number == 0){return NULL}return (number - (number % nearest_number));}
/////////////////////////////
//Array Helpers//
/////////////////////////////
//Array Shuffle from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle_array(array){var currentIndex = array.length, temporaryValue, randomIndex;while(0 !== currentIndex){randomIndex = Math.floor(Math.random() * currentIndex);currentIndex-=1;temporaryValue=array[currentIndex];array[currentIndex]=array[randomIndex];array[randomIndex] = temporaryValue;}return array;}
//Get a random item from an array
function get_random_item_from_array(items){return items[rand(0, items.length-1, TRUE)];}
/////////////////////////////
//System Helpers//
/////////////////////////////
async function hard_shutdown(){await sleep(100);client.destroy();await sleep(100);process.exit();}
async function debugOut(text){if(DEBUGGING){console.log(text);}}
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
function is_user_owner(user){if(user.id == owner_id){return TRUE}return FALSE}
function check_guildmember_operator(guild_user){if(is_user_owner(guild_user.user)){return TRUE}else if(guild_user.hasPermission(primary_operator_flag)){return TRUE}else{return FALSE}}
function check_operator_from_message(message, guild){if(guild){return check_guildmember_operator(message.member)}else{return is_user_owner(message.author)}}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//STARTUP
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Log our bot in
client.login(token);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Standardized Commands
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Helpers//
function registerCommand(commandObject, triggerKeyword){commandList[triggerKeyword] = commandObject};
function parse_string_for_command_keyword(content){
	if(content == FALSE){
		return NULL
	}
	var parseString = content.toLowerCase();
	for(i in commandList){
		if(commandList.hasOwnProperty(i)){
			if(parseString.search(i.toLowerCase()) == 0){
				return i;
			}
		}
	}
	return FALSE
}
function getCommandObjectByKey(key){
	return commandList[key];
}
function parseMessageForCommandObject(message){
	return getCommandObjectByKey(parse_string_for_command_keyword(check_message_primary_command_append(message)));
}
///////////////////////////////////////////////////////////////////////////////////////
//Automatic Command Parse
function handle_message_commands(message){
	var found = parseMessageForCommandObject(message);
	if(found == NULL){
		return
	}
	found.on_parse(message);
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Primary Definitions
var BotCommand = {
	keyword: '',
	requires_guild: FALSE,
	desc: '',
	permission_requirement: COMMAND_PERMISSION_PUBLIC,
	on_parse: function(triggering_message){if(this.requires_guild && !is_message_from_guild(triggering_message)){return NULL}if(is_message_from_guild(triggering_message)){if(this.userHasPermission(triggering_message.member)){return this.trigger(triggering_message)}}else{if(this.userHasPermission(triggering_message.author)){return this.trigger(triggering_message)}}}, 
	userHasPermission: function(user){if(this.permission_level == COMMAND_PERMISSION_OPERATOR){return (check_guildmember_operator(user)|is_user_owner(user))}else if(this.permission_level == COMMAND_PERMISSION_OWNER){return is_user_owner(user)}else{return TRUE}},
	trigger: function(triggering_message){}
};
function newBotCommand(trigger_key, guild_only, description, permission_level){
	var newCommand = BotCommand;
	newCommand.keyword = trigger_key;
	newCommand.requires_guild = guild_only;
	newCommand.desc = description;
	newCommand.permission_requirement = permission_level;
	registerCommand(newCommand, trigger_key);
	return newCommand;
}
////////////////////////////////////////Commands
const command_eightball = new newBotCommand('8ball', FALSE, 'Returns an answer from the Magic 8-ball!', COMMAND_PERMISSION_PUBLIC);
command_eightball.trigger = function(triggering_message){
	triggering_message.reply(wrapTextBold(get_random_item_from_array(shuffle_array(eightball_responses))));
}
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

function reply_with_commands(message){
	var response = ""
	response += "Primary Trigger Word:" + command_append_primary + EOL
	response += "Commands: " + EOL
	for(i in commandList)
		response += command_append_primary + commandList[i] + " "
	respond_to_message(message, response);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Random Functions
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Generates "Heads" or "Tails"
function coinflip(){var result = Math.round(Math.random());if(result == 1){result = 'Heads!'}else{result = 'Tails!'}return result}
//8ball!
function generate_8ball_response(message){
	message.reply(wrapTextBold(get_random_item_from_array(shuffle_array(eightball_responses))));
}

function generate_dice_roll(message){
		
}



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
	if(command_content.search('coinflip') == 0){
		respond_to_message(message, coinflip());
	}
	else if(command_content.search('shutdown') == 0){
		if(check_operator_from_message(message, guild)){
			respond_to_message(message, 'Shutting Down');
			hard_shutdown();
		}
		else{
			respond_to_message(message, 'No.');
		}
	}
	else if(command_content.search('stealthmin') == 0){
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
	//else if(command_content.search('8ball') == 0){
	//	generate_8ball_response(message);
	//	}
	else if(command_content.search('commands') == 0){
		reply_with_commands(message);
	}
	else if(command_content.search('roll') == 0){
		respond_to_message(message, generate_dice_roll(message));
	}
	else if(command_content.search('debug') ==0){

	}
	
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//END
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////