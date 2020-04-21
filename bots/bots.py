import discord
from discord.ext import commands
import time
import asyncio
import os,random
import sys
import traceback

class Bot(discord.Client):
	tabWord={'cheh','honteux','kaamelott','suce','baise','wizz','vinjo', '_con', 'picole', 'monique','indignite'}
	
	def __init__(self):
		super().__init__()
		self.queue = []
		self.queue_running = False
		self.voice_client= None
		

	async def on_ready(self):
		print("Logged in as")
		print(self.user.name)
		print(self.user.id)
		await bot.change_presence(activity=discord.Game(name="balancer des CHEH !"))

	async def on_message(self, message):
		
		
		words=[ x for x in self.tabWord if x in message.content.lower() ]
		if (message.author==self.user):
			return
		try:
			if words:
				user=message.author
				voice_channel=user.voice.channel
				if voice_channel!= None:
					# if not voice_channel.name in self.queue:
					# 	print('Create queue for ' + voice_channel.name)
					# 	self.queue[voice_channel.name] = []
					for i in words:
						print('Add queue for ' + voice_channel.name + '   ' + i)
						self.queue.append((i, message.channel, voice_channel))

					if self.queue_running:
						return

					while len(self.queue) > 0:

						print("While queue length left : " + str(len(self.queue)))
						self.queue_running = True
						try:
							self.voice_client = await self.queue[0][2].connect()
						except discord.errors.ClientException as ec:
							log(ec)

						print("before play sound")
						await self.play_sound()
						print("after play sound")
						if len(self.queue) > 0 and self.queue[0][2].name != self.voice_client.channel.name:
							await self.voice_client.disconnect()
						else:
							print('je me deco pas')	
							
					await self.voice_client.disconnect()
					self.queue_running = False

				else:
					await message.channel.send('t\'es pas dans un channel blaireau!')
		except Exception as e :
			log(e)
			log(traceback.print_exc())

	async def play_sound(self):
		sound, channel,voice_channel = self.queue.pop(0)

		
		if sound == 'kaamelott':
			path='sounds/kaamelott/'
			randomFile=random.choice(os.listdir(path))
			self.voice_client.play(discord.FFmpegPCMAudio(path+randomFile), after=lambda e: print('done', e))
			while self.voice_client.is_playing():
				await asyncio.sleep(1)
			self.voice_client.stop()
		else:
			if os.path.isfile("gifs/"+sound+".gif"):
				await channel.send(file=discord.File("gifs/"+sound+".gif"))
				
			self.voice_client.play(discord.FFmpegPCMAudio('sounds/'+sound+'.mp3'), after=lambda e: print('done', e))
			while self.voice_client.is_playing():
				await asyncio.sleep(1)
			self.voice_client.stop()
		

def log(e):
	print('erreur service',e)
	sys.stdout.flush()

if __name__=="__main__":
	bot=Bot()
	key = ''
	with open('discord_key') as f:
		key = f.read()
	bot.run(key)
