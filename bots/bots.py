import discord
from discord.ext import commands
import time
import asyncio
import os,random
import sys

class Bot(discord.Client):
	tabWord={'cheh','honteux','kaamelott','suce','baise','wizz','vinjo', '_con', 'picole', 'monique'}
	def __init__(self):
		super().__init__()
		

	async def on_ready(self):
		print("Logged in as")
		print(self.user.name)
		print(self.user.id)
		await bot.change_presence(activity=discord.Game(name="balancer des CHEH !"))

	async def on_message(self, message):
		
		
		if (message.author==self.user):
			return
		try:
			words=[ x for x in self.tabWord if x in message.content.lower() ]
			if words:
				user=message.author
				voice_channel=user.voice.channel
				channel=None
				if voice_channel!= None:
					channel=voice_channel.name
					try:
						vc= await voice_channel.connect()
					except discord.errors.ClientException as ec:
						log(ec)

					for i in words:
						if i == 'kaamelott':
								path='sounds/kaamelott/'
								randomFile=random.choice(os.listdir(path))
								player = vc.play(discord.FFmpegPCMAudio(path+randomFile), after=lambda e: print('done', e))
								while vc.is_playing():
									await asyncio.sleep(1)
								vc.stop()
						else:
							if os.path.isfile("gifs/"+i+".gif"):
								await message.channel.send(file=discord.File("gifs/"+i+".gif"))
								
							player = vc.play(discord.FFmpegPCMAudio('sounds/'+i+'.mp3'), after=lambda e: print('done', e))
							while vc.is_playing():
								await asyncio.sleep(1)
							vc.stop()
					await message.channel.send('fin du for')
					await vc.disconnect()
				else:
					await bot.say('User is not in a channel.')
		except Exception as e :
			log(e)
			

	
def log(e):
	print('erreur service',e)
	sys.stdout.flush()







if __name__=="__main__":
	bot=Bot()
	key = ''
	with open('discord_key') as f:
		key = f.read()
	bot.run(key)
