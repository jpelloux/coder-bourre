import discord
from discord.ext import commands
import time
import asyncio


class Bot(discord.Client):

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

		if "cheh" in message.content.lower():
			await message.channel.send(file=discord.File("CHEH.gif"))
			user=message.author
			voice_channel=user.voice.channel
			channel=None
			if voice_channel!= None:
				channel=voice_channel.name
				vc= await voice_channel.connect()
				player = vc.play(discord.FFmpegPCMAudio('CHEH.mp3'), after=lambda e: print('done', e))
				while vc.is_playing():
					await asyncio.sleep(1)
				vc.stop()
				await vc.disconnect()
			else:
				await bot.say('User is not in a channel.')

		if "honteux" in message.content.lower():
			await message.channel.send(file=discord.File("Honteux.gif"))
			user=message.author
			voice_channel=user.voice.channel
			channel=None
			if voice_channel!= None:
				channel=voice_channel.name
				vc= await voice_channel.connect()
				player = vc.play(discord.FFmpegPCMAudio('Honteux.mp3'), after=lambda e: print('done', e))
				while vc.is_playing():
					await asyncio.sleep(1)
				vc.stop()
				await vc.disconnect()
			else:
				await bot.say('User is not in a channel.')


if __name__=="__main__":

	bot=Bot()
	key = ''
	with open('discord_key') as f:
		key = f.read()
	bot.run(key)
