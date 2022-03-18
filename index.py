import requests
from bs4 import BeautifulSoup
# import re

alphabet = 'abcdefghijklmnopqrstuvwxyz'
number = '0123456789'

# https://www.dictionary.com/
def get_letter_dictionary(letter) -> list:
	url = f"https://api-portal.dictionary.com/dcom/list/{letter}?limit=100000"
	response = requests.get(url)
	print("Server Response Code for char %s: %s" % (letter, response.status_code))
	json = response.json()
	words = [word["displayForm"] for word in json["data"]]
	return words

def scrap_dictionary() -> list:
	word_list = []
	responses = [get_letter_dictionary(char) for char in alphabet]
	for res in responses:
		word_list.extend(res)
	return word_list

def save_dictionary():
	words = scrap_dictionary()
	with open("words/dictonary.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(words))

# https://www.yourdictionary.com/
def get_letter_yourdictionary(letter) -> list:
	url = f"https://www.yourdictionary.com/index/{letter}"
	response = requests.get(url)
	print("Server Response Code for char %s: %s" % (letter, response.status_code))
	soup = BeautifulSoup(response.text, 'html.parser')
	word_elems = soup.find(class_='examples-list').find_all('a')
	words = [word.text.replace("\n", "").strip() for word in word_elems]
	# print(words)
	return words

def scrap_yourdictionary() -> list:
	word_list = []
	responses = [get_letter_yourdictionary(char) for char in alphabet]
	for res in responses:
		word_list.extend(res)
	return word_list

def save_yourdictionary():
	words = scrap_yourdictionary()
	with open("words/yourdictionary.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(words))

# https://www.merriam-webster.com/dictionary/
def get_letter_merriam(letter) -> list:
	url = f"https://www.merriam-webster.com/dictionary/{letter}"
	response = requests.get(url)
	print("Server Response Code for char %s: %s" % (letter, response.status_code))
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

def save_merriam():
	words = scrap_merriam()
	with open("words/merriam.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(words))

# https://www.oxforddictionaries.com/

def scrap_oxford() -> list:
	session = requests.Session()
	response = session.get('https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000/')
	soup = BeautifulSoup(response.text, 'html.parser')
	return [word.text.replace("\n", "").strip() for word in soup.find(class_='top-g').find_all('a')]

def save_oxford():
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

def save_macmillan():
	words = scrap_macmillan()
	with open("words/macmillan.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(words))

def main():
	# save_oxford() # Not Working
	# save_macmillan() # Not Working (Same Reason as Oxford)
	save_yourdictionary()
	save_dictionary()

if __name__ == '__main__':
	main()