  
tabWord={'cheh','honteux','kaamelott','suce','bais'}

phrase=['je','cheh']

d=[ x for x in phrase if  x in tabWord ] 
if  d:
    print ('vide')
print(d)
d=set(d)
print(d)




		if "-command" in message.content.lower():
			await message.channel.send("command possible : \n cheh \n honteux \n kaamelott")

		if "cheh" in message.content.lower():
			await message.channel.send(file=discord.File("bots/gifs/CHEH.gif"))
			user=message.author
			voice_channel=user.voice.channel
			channel=None
			if voice_channel!= None:
				channel=voice_channel.name
				vc= await voice_channel.connect()
				player = vc.play(discord.FFmpegPCMAudio('bots/sounds/CHEH.mp3'), after=lambda e: print('done', e))
				while vc.is_playing():
					await asyncio.sleep(1)
				vc.stop()
				await vc.disconnect()
			else:
				await bot.say('User is not in a channel.')

		if "honteux" in message.content.lower():
			await message.channel.send(file=discord.File("bots/gifs/Honteux.gif"))
			user=message.author
			voice_channel=user.voice.channel
			channel=None
			if voice_channel!= None:
				channel=voice_channel.name
				vc= await voice_channel.connect()
				player = vc.play(discord.FFmpegPCMAudio('bots/sounds/Honteux.mp3'), after=lambda e: print('done', e))
				while vc.is_playing():
					await asyncio.sleep(1)
				vc.stop()
				await vc.disconnect()
			else:
				await bot.say('User is not in a channel.')
		
		if "kaamelott" in message.content.lower():
			user=message.author
			voice_channel=user.voice.channel
			channel=None
			if voice_channel!= None:
				channel=voice_channel.name
				path='bots/sounds/kaamelott/'
				randomFile=random.choice(os.listdir(path))
				vc= await voice_channel.connect()
				player = vc.play(discord.FFmpegPCMAudio(path+randomFile), after=lambda e: print('done', e))
				while vc.is_playing():
					await asyncio.sleep(1)
				vc.stop()
				await vc.disconnect()
			else:
				await bot.say('User is not in a channel.')