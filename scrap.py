import grequests
import requests
from bs4 import BeautifulSoup
import asyncio

alphabet = 'abcdefghijklmnopqrstuvwxyz'
number = '0123456789'

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
	with open("words/dictonary.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(words))

# https://www.yourdictionary.com/
def parse_letter_yourdictionary(resp) -> list:
	letter = resp.url.split('/')[-1]
	soup = BeautifulSoup(resp.text, 'html.parser')
	word_elems = soup.find(class_='examples-list').find_all('a')
	words = [word.text.replace("\n", "").strip() for word in word_elems]
	print("Completed Parsing For %s (yourdictionary.com)" % letter)
	return words

async def scrap_yourdictionary() -> list:
	rs = [grequests.get(f"https://www.yourdictionary.com/index/{char}") for char in alphabet]
	wordlist = []
	loop = asyncio.get_event_loop()
	for resp in grequests.imap(rs):
		words = await loop.run_in_executor(None, parse_letter_yourdictionary, resp)
		wordlist.extend(words)
	return wordlist

async def save_yourdictionary():
	words = await scrap_yourdictionary()
	with open("words/yourdictionary.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(words))

# https://www.merriam-webster.com/dictionary/
def get_letter_merriam(letter) -> list:
	url = f"https://www.merriam-webster.com/dictionary/{letter}"
	response = requests.get(url)
	print("merriam-webster.com responsed with %s for %s" % (response.status_code, letter))
	soup = BeautifulSoup(response.text, 'html.parser')
	word_elems = soup.find_all(class_='entry-word')
	words = [word.text.replace("\n", "").strip() for word in word_elems]
	# print(words)
	return words

def scrap_merriam() -> list:
	word_list = []
	responses = [get_letter_merriam(char) for char in alphabet]
	for res in responses:
		word_list.extend(res)
	return word_list

async def save_merriam():
	words = scrap_merriam()
	with open("words/merriam.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(words))

# https://www.oxforddictionaries.com/

def scrap_oxford() -> list:
	session = requests.Session()
	response = session.get('https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000/')
	soup = BeautifulSoup(response.text, 'html.parser')
	return [word.text.replace("\n", "").strip() for word in soup.find(class_='top-g').find_all('a')]

async def save_oxford():
	words = scrap_oxford()
	with open("words/oxford.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(words))

# https://www.macmillandictionary.com/
def get_letter_macmillan(letter) -> list:
	url = f"https://www.macmillandictionary.com/dictionary/british/{letter}"
	response = requests.get(url)
	print("Server Response Code for char %s: %s" % (letter, response.status_code))
	soup = BeautifulSoup(response.text, 'html.parser')
	word_elems = soup.find_all(class_='hw')
	words = [word.text.replace("\n", "").strip() for word in word_elems]
	# print(words)
	return words

def scrap_macmillan() -> list:
	word_list = []
	responses = [get_letter_macmillan(char) for char in alphabet]
	for res in responses:
		word_list.extend(res)
	return word_list

async def save_macmillan():
	words = scrap_macmillan()
	with open("words/macmillan.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(words))

async def main():
	await asyncio.gather(
		# save_oxford(), # Not Working
		# save_macmillan(), # Not Working (Same Reason as Oxford)
        save_yourdictionary(),
        save_dictionary()
    )

if __name__ == '__main__':
	asyncio.run(main())