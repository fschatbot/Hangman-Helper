import grequests
from bs4 import BeautifulSoup
import asyncio

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
	with open("words/dictonary.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(list(set(words))))

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
		file.write('\n'.join(list(set(words))))

# https://www.merriam-webster.com/dictionary/
def parse_letter_merriam(resp) -> list:
	letter = resp.url.split('/')[-1]
	soup = BeautifulSoup(resp.text, 'html.parser')
	word_elems = soup.find_all(class_='entry-word')
	words = [word.text.replace("\n", "").strip() for word in word_elems]
	print("Completed Parsing For %s (merriam-webster.com)" % letter)
	return words

async def scrap_merriam() -> list:
	rs = grequests.imap([grequests.get(f"https://www.merriam-webster.com/dictionary/{char}") for char in alphabet])
	loop = asyncio.get_event_loop()
	wordlist = await asyncio.gather(*[loop.run_in_executor(None, parse_letter_merriam, resp) for resp in rs])
	# https://www.programiz.com/python-programming/examples/flatten-nested-list
	return sum(wordlist, [])

async def save_merriam():
	words = await scrap_merriam()
	with open("words/merriam.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(list(set(words))))

# https://www.oxforddictionaries.com/

async def scrap_oxford() -> list:
	# For some reason, this is just showing a list of None
	rs = grequests.map([grequests.get(f"https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000/", headers=header)])
	resp = [*rs][0]
	soup = BeautifulSoup(resp.text, 'html.parser')
	return [word.text.replace("\n", "").strip() for word in soup.find(class_='top-g').find_all('a')]

async def save_oxford():
	words = await scrap_oxford()
	with open("words/oxford.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(list(set(words))))

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
		file.write('\n'.join(list(set(words))))

def exception_handler(request, exception):
	print(request.response, exception)

async def main():
	await asyncio.gather(
		save_oxford(),
		save_macmillan(),
        save_yourdictionary(),
        save_dictionary(),
		save_merriam()
    )

if __name__ == '__main__':
	asyncio.run(main())