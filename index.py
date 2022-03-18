import requests

alphabet = 'abcdefghijklmnopqrstuvwxyz'
number = '0123456789'

# dictionary.com
def get_letter_dictionary_com(letter):
	url = f"https://api-portal.dictionary.com/dcom/list/{letter}?limit=100000"
	response = requests.get(url)
	print("Server Response Code for char %s: %s" % (letter, response.status_code))
	json = response.json()
	words = [word["displayForm"] for word in json["data"]]
	return words

def scrap_dictionary_com():
	word_list = []
	responses = [get_letter_dictionary_com(char) for char in alphabet]
	for res in responses:
		word_list.extend(res)
	return word_list

def save_dictionary_com():
	words = scrap_dictionary_com()
	with open("words/dictonary.txt","w",encoding="utf-8") as file:
		file.write('\n'.join(words))

def main():
	save_dictionary_com()

if __name__ == '__main__':
	main()