import grequests
import requests
from bs4 import BeautifulSoup
import asyncio
import re

alphabet = 'abcdefghijklmnopqrstuvwxyz'
number = '0123456789'

# This fix is brilliant. https://stackoverflow.com/a/65662895/13703806
# Took me 2 days to find it
header = {"User-Agent" : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36"}
# https://www.dictionary.com/
def scrap_dictionary() -> list:
	rs = [grequests.get(f"https://api-portal.dictionary.com/dcom/list/{letter}?limit=100000") for letter in alphabet]
	wordlist = []
	for resp in grequests.imap(rs):
		json = resp.json()
		words = [word["displayForm"] for word in json["data"]]
		wordlist.extend(words)
		print("Completed Parsing For %s (dictionary.com)" % resp.url.split('/')[-1].split('?')[0])
	return wordlist

async def save_dictionary():
	words = scrap_dictionary()
	with open("words/dictionary.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(list(set(word.lower() for word in words))))

# https://www.yourdictionary.com/
def parse_letter_yourdictionary(resp) -> list:
	letter = resp.url.split('/')[-1]
	soup = BeautifulSoup(resp.text, 'html.parser')
	word_elems = soup.find(class_='examples-list').find_all('a')
	words = [word.text.replace("\n", "").strip() for word in word_elems]
	print("Completed Parsing For %s (yourdictionary.com)" % letter)
	return words

async def scrap_yourdictionary() -> list:
	rs = grequests.imap([grequests.get(f"https://www.yourdictionary.com/index/{char}") for char in alphabet])
	loop = asyncio.get_event_loop()
	wordlist = await asyncio.gather(*[loop.run_in_executor(None, parse_letter_yourdictionary, resp) for resp in rs])
	# https://www.programiz.com/python-programming/examples/flatten-nested-list
	return sum(wordlist, [])

async def save_yourdictionary():
	words = await scrap_yourdictionary()
	with open("words/yourdictionary.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(list(set(word.lower() for word in words))))

# https://www.merriam-webster.com/dictionary/
# This one was the most trickiest one to scrape
async def parse_letter_merriam(letter) -> list:
	# Blank Request to get the page count
	resp = requests.get(f"https://www.merriam-webster.com/browse/dictionary/{letter}/", headers=header)
	# No need to put it though BS4 to waste time
	total_pages = int(re.search(r"page \d+ of (\d+)", resp.text).group(1))
	print(f"Total Pages for {letter} is {total_pages}")
	# Get all the responses as fast as possible
	rs = grequests.map([grequests.get(f"https://www.merriam-webster.com/browse/dictionary/{letter}/{index}/", headers=header) for index in range(1, total_pages+1)])
	print(f"Requested {total_pages} Pages for {letter}")
	# Convert all resposnes to BS4
	loop = asyncio.get_event_loop()
	soup_list = await asyncio.gather(*[loop.run_in_executor(None, BeautifulSoup, resp.text, 'html.parser') for resp in rs])
	print(f"Completed Parsing For {letter} (merriam-webster.com)")
	# Get all the words
	word_lists = []
	for i, soup in enumerate(soup_list):
		try:
			word_elems = soup.find(class_="entries").find_all("a")
		except AttributeError:
			print(f"No Words for {letter} {i}")
			continue
		words = [word.text.replace("\n", "").strip() for word in word_elems]
		word_lists.extend(words)
	print("Completed Scraping For %s (merriam-webster.com)" % letter)
	return word_lists

async def scrap_merriam() -> list:
	# There is an extra 0 to even get those special numbers
	words = await asyncio.gather(*[parse_letter_merriam(letter) for letter in alphabet + "0"])
	return sum(words, [])

async def save_merriam():
	words = await scrap_merriam()
	with open("words/merriam.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(list(set(word.lower() for word in words))))

# https://www.oxforddictionaries.com/

async def scrap_oxford() -> list:
	# For some reason, this is just showing a list of None
	rs = grequests.map([grequests.get(f"https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000/", headers=header)])
	resp = [*rs][0]
	soup = BeautifulSoup(resp.text, 'html.parser')
	words = [word.text.replace("\n", "").strip() for word in soup.find(class_='top-g').find_all('a')]
	print("Completed Parsing For oxforddictionaries.com")
	return words

async def save_oxford():
	words = await scrap_oxford()
	with open("words/oxford.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(list(set(word.lower() for word in words))))

# https://www.macmillandictionary.com/
def get_letter_macmillan(resp) -> list:
	letter = resp.url.split('/')[-2]
	soup = BeautifulSoup(resp.text, 'html.parser')
	word_elems = soup.find_all(class_='hw')
	words = [word.text.replace("\n", "").strip() for word in word_elems]
	print("Completed Parsing For %s (macmillandictionary.com)" % letter)
	return words

async def scrap_macmillan() -> list:
	# For some reason, this is just showing a list of None
	rs = grequests.imap([grequests.get(f"https://www.macmillandictionary.com/browse/collocations/british/{char}/", headers=header) for char in alphabet])
	loop = asyncio.get_event_loop()
	wordlist = await asyncio.gather(*[loop.run_in_executor(None, get_letter_macmillan, resp) for resp in rs])
	# https://www.programiz.com/python-programming/examples/flatten-nested-list
	return sum(wordlist, [])

async def save_macmillan():
	words = await scrap_macmillan()
	with open("words/macmillan.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(list(set(word.lower() for word in words))))

async def basic_500():
	resp = requests.get("https://gist.githubusercontent.com/theRemix/48181ee5d45c9f01033a/raw/43f509afd334734895b8f0ded93ba8e70c0b5a68/").text
	with open("words/basic_500.txt","w",encoding="utf-8") as file:
		file.write(resp.lower())

async def main():
	await asyncio.gather(
		save_oxford(),
		save_macmillan(),
        save_yourdictionary(), # Second Slowest
        save_dictionary(),
		save_merriam(), # Slow as HELL
		basic_500()
    )

if __name__ == '__main__':
	asyncio.run(main())