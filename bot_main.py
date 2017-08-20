#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#IMPORTS
import discord
import asyncio
import sqlite3
import os.path
import random
import datetime

#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#CONSTANTS
#PRIMARY
MAIN_VERSION = '0'
SUB_VERSION = '.01'
VERSION = MAIN_VERSION + SUB_VERSION
AUDIO_CACHE_PATH = os.path.join(os.getcwd(), 'audio_cache')
DISCORD_MSG_CHAR_LIMIT = 2000
CLIENT_TOKEN = 'MzIxMzIwNDY2NjIxMTM2ODk2.DHmnTA.MVcMb1kqPzrnnbIEl3u5fGclX28'
OWNER_ID = '192143138817572865'
#LOGGING
LOG_MESSAGE_DELETE = "LOG_MESSAGE_DELETE"
LOG_MESSAGE_EDIT = "LOG_MESSAGE_EDIT"
LOG_MESSAGE_SEND = "LOG_MESSAGE_SEND"

#LOGGING BITFLAGS, MUST BE THE DEFINE AND _FLAG!
LOG_MESSAGE_DELETE_FLAG = 2 ** 0
LOG_MESSAGE_EDIT_FLAG = 2 ** 1
LOG_MESSAGE_SEND_FLAG = 2 ** 2

#LIST OF LOGGING OPTIONS, KEEP UP TO DATE OR EXPECT CRASHES.
LOG_TYPES = ("LOG_MESSAGE_DELETE", "LOG_MESSAGE_EDIT", "LOG_MESSAGE_SEND")
#DEFAULT LOGGING BITFLAG
LOG_BITFLAGS_DEFAULT = LOG_MESSAGE_DELETE_FLAG | LOG_MESSAGE_EDIT_FLAG



#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#CLIENT INITIALIZATION
client = discord.Client()
DB = sqlite3.connect('Bot_DB.db')
DBC = DB.cursor()

#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#DATABASE INITIALIZATION
def initialize_database():
	DBC.execute("CREATE TABLE IF NOT EXISTS server_main(id INTEGER PRIMARY KEY, logging_channel_id INTEGER NOT NULL, logging_bitflag INTEGER NOT NULL)")
	DB.commit()

#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#WRAPPERS AND HELPERS

#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#LOGGING
async def log_server(server, logtype, text, embeds):
	logging_channel_id = await get_logging_channel_id_by_server_id(server.id)
	if logging_channel_id == None or check_server_logging_bitflag_by_id(server.id, get_logging_bitflag_by_log_type(logtype)) == False:
		return False
	channel_found = await server.get_channel(logging_channel_id)
	newcontent = "```LOG: **" + str(logtype).strip() + "** (" + str(datetime.now()) + ")\n" + text.strip() + "```"
	if channel_found:
		client.send_message(channel_found, content=text, tts=False, embed=embeds)
		return True
	return False

async def log_message_send(message):
	if message.server is discord.Server:
		compile += "\n**Message:\n**" + str(message.content)
		compile += "\n**Channel:\n**" + str(message.channel.name) + " (ID = " + str(message.channel.id) + ")"
		compile += "\n**USER:\n**" + str(message.author.nickname) + " (" + str(message.author.name) + " - " + str(message.author.id) + ")"
		return log_server(message.server, LOG_MESSAGE_SEND, compile, message.embeds)
	return False
	
async def log_message_delete(message):
	if message.server is discord.Server:
		compile += "\n**Message:**\n" + str(message.content)
		compile += "\n**Channel:**\n" + str(message.channel.name) + " (ID = " + str(message.channel.id) + ")"
		compile += "\n**USER:**\n" + str(message.author.nickname) + " (" + str(message.author.name) + " - " + str(message.author.id) + ")"
		return log_server(message.server, LOG_MESSAGE_DELETE, compile, message.embeds)
	return False
	
async def log_message_edit(message, new_message):
	if message.server is discord.Server:
		compile += "\n**Message: BEFORE:**\n" + str(message.content)
		compile += "\n**MESSAGE: AFTER:**\n" + str(new_message.content)
		compile += "\n**Channel:**\n" + str(message.channel.name) + " (ID = " + str(message.channel.id) + ")"
		compile += "\n**USER:**\n" + str(message.author.nickname) + " (" + str(message.author.name) + " - " + str(message.author.id) + ")"
		return log_server(message.server, LOG_MESSAGE_EDIT, compile, message.embeds)
	return False

async def log_reaction_add(reaction, user):
	return #NOT IMPLEMENTED!

async def log_reaction_remove(reaction, user):
	return #NOT IMPLEMENTED!

async def log_reaction_clear(message, reactions):
	return #NOT IMPLEMENTED!
	
async def log_channel_delete(channel):
	return #NOT IMPLEMENTED!
	
async def log_channel_create(channel):
	return #NOT IMPLEMENTED!
	
async def log_channel_update(before, after):
	return #NOT IMPLEMENTED!
	
async def log_member_join(member):
	return #NOT IMPLEMENTED!
	
async def log_member_remove(member):
	return #NOT IMPLEMENTED!
	
async def log_member_update(before, after):
	return #NOT IMPLEMENTED!
	
async def log_server_add(server):
	return #NOT IMPLEMENTED!
	
async def log_server_remove(server):
	return #NOT IMPLEMENTED!
	
async def log_server_update(before, after):
	return #NOT IMPLEMENTED!
	
async def log_server_role_add(role):
	return #NOT IMPLEMENTED!
	
async def log_server_role_remove(role):
	return #NOT IMPLEMENTED!
	
async def log_server_role_update(before, after):
	return #NOT IMPLEMENTED!
	
async def log_server_emojis_update(before, after):
	return #NOT IMPLEMENTED!
	
async def log_server_available(server):
	return #NOT IMPLEMENTED!
	
async def log_voice_state_update(before, after):
	return #NOT IMPLEMENTED!
	
async def log_typing(channel, user, when):
	return #NOT IMPLEMENTED!
	
async def log_member_ban(member):
	return #NOT IMPLEMENTED!
	
async def log_member_unban(server, user):
	return #NOT IMPLEMENTED!
	
async def log_voice_join(channel, user):
	return #NOT IMPLEMENTED!
	
async def log_voice_leave(channel, user):
	return #NOT IMPLEMENTED!
	
#LOGGING HELPERS
async def get_logging_bitflag_by_log_type(log_type):
	return eval(str(log_type) + "_FLAG")

async def check_server_logging_bitflag_by_id(server_id, bitflag):
	bitflags = get_logging_bitflags_by_server_id(server_id)
	return bool(bitflags & bitflag)
	
#LOGGING DATABASE FUNCTIONS
async def set_logging_channel_id_by_server_id(server_id, logging_channel_id):
	if bool(DBC.execute("INSERT INTO server_main(id, logging_channel_id) VALUES (?, ?);", (int(server_id), int(logging_channel_id)))) == True:
		db.commit()
		return True
	else:
		return False
		
async def get_logging_channel_id_by_server_id(server_id):
	ret1 = DBC.execute("SELECT logging_channel_id FROM server_main WHERE id = ?", (int(server_id),))
	ret2 = ret1.fetchone()
	if ret2 == None:
		return None
	return ret2[1]

async def get_logging_bitflags_by_server_id(server_id):
	ret1 = DBC.execute("SELECT logging_bitflag FROM server_main WHERE id = ?", (int(server_id),))
	ret2 = ret1.fetchone()
	if ret2 == None:
		set_logging_bitflags_by_server_id(server_id, LOG_BITFLAGS_DEFAULT)
		return LOG_BITFLAGS_DEFAULT
	return ret2[1]

async def set_logging_bitflags_by_server_id(server_id, bitflags):
	if bool(DBC.execute("INSERT INTO server_main(id, logging_bitflag) VALUES (?, ?);", (int(server_id), int(bitflags)))) == True:
		db.commit()
		return True
	else:
		return False

async def set_logging_bitflag_by_server_id(server_id, bitflag, on_off):
	old_bitflags = get_logging_bitflags_by_server_id(server_id)
	new_bitflags = old_bitflags
	if on_off == True:
		new_bitflags = new_bitflags | bitflag
	elif on_off == False:
		new_bitflags = new_bitflags & ~bitflag
	else:
		return None
	return await set_logging_bitflags_by_server_id(server_id, new_bitflags)

#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#EVENTS
@client.event
async def on_ready():
    print('Logged in as')
    print(client.user.name)
    print(client.user.id)
    print('------')

@client.event
async def on_message_delete(message):
	if message.author.id == client.user.id:
		return		#SELF-LOOP PROTECTION
	await log_message_delete(message)

@client.event
async def on_message_edit(before, after):
	if before.author.id == client.user.id:
		return		#SELF-LOOP PROTECTION
	await log_message_edit(before, after)
	
@client.event
async def on_reaction_add(reaction, user):
	await log_reaction_add(reaction, user)

@client.event
async def on_reaction_remove(reaction, user):
	await log_reaction_remove(reaction, user)

@client.event
async def on_reaction_clear(message, reactions):
	await log_reaction_clear(message, reactions)

@client.event
async def on_channel_delete(channel):
	await log_channel_delete(channel)
	
@client.event
async def on_channel_create(channel):
	await log_channel_create(channel)

@client.event
async def on_channel_update(before, after):
	await log_channel_update(before, after)

@client.event
async def on_member_join(member):
	if member.id == client.user.id:
		return		#SELF-LOOP PROTECTION
	await log_member_join(member)

@client.event
async def on_member_remove(member):
	if member.id == client.user.id:
		return		#SELF-LOOP PROTECTION
	await log_member_remove(member)

@client.event
async def on_member_update(before, after):
	if before.id == client.user.id:
		return		#SELF-LOOP PROTECTION
	await log_member_update(before, after)

@client.event
async def on_server_join(server):
	await log_server_add(server)

@client.event
async def on_server_remove(server):
	await log_server_remove(server)

@client.event
async def on_server_update(before, after):
	await log_server_update(before, after)

@client.event
async def on_server_role_create(role):
	await log_server_role_add(role)
	
@client.event
async def on_server_role_delete(role):
	await log_server_role_remove(role)

@client.event
async def on_server_role_update(before, after):
	await log_server_role_update(before, after)

@client.event
async def on_server_emojis_update(before, after):
	await log_server_emojis_update(before, after)

@client.event
async def on_server_available(server):
	await log_server_available(server)

@client.event
async def on_voice_state_update(before, after):
	await log_voice_state_update(before, after)

@client.event
async def on_member_ban(member):
	if member.id == client.user.id:
		return		#SELF-LOOP PROTECTION
	await log_member_ban(member)
	
@client.event
async def on_member_unban(server, user):
	if user.id == client.user.id:
		return		#SELF-LOOP PROTECTION
	await log_member_unban(server, user)

@client.event
async def on_typing(channel, user, when):
	if user.id == client.user.id:
		return		#SELF-LOOP PROTECTION
	await log_typing(channel, user, when)

@client.event
async def on_group_join(channel, user):
	if user.id == client.user.id:
		return		#SELF-LOOP PROTECTION
	await log_voice_join(channel, user)
		
@client.event
async def on_group_leave(channel, user):
	if user.id == client.user.id:
		return		#SELF-LOOP PROTECTION
	await log_voice_leave(channel, user)
	
@client.event
async def on_message(message):
	if message.author.id == client.user.id:
		return		#SELF-LOOP PROTECTION
	await log_message_send(message)
	
	
	
#	if message.content.startswith('!'):
#		await command_parse_message(message)
#	counter = 0
#		tmp = await client.send_message(message.channel, 'Calculating messages...')
#		async for log in client.logs_from(message.channel, limit=100):
#			if log.author == message.author:
#				counter += 1
#
#		await client.edit_message(tmp, 'You have {} messages.'.format(counter))
#	if message.content.startswith('!DBtest'):
#		await set_logging_channel_id_by_server_id(int(message.server.id), int(message.channel.id))
#		await get_logging_channel_id_by_server_id(int(message.server.id))
#	elif message.content.startswith('!sleep'):
#		await asyncio.sleep(5)
#		await client.send_message(message.channel, 'Done sleeping')

	
	
async def command_parse_message(message):
	return
	

#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#EXECUTE
initialize_database()
client.run(CLIENT_TOKEN)

