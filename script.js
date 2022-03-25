let Config = {
	onlyAlpha: false,
	NoSpaces: false,
	NoNumbers: false,
	NoFreaky: false,
};
let GlobalWordList = [];
let wordlist = {};

let addEventListenerToInput = () => {
	document.querySelectorAll("#current_info > input").forEach((elem) => {
		elem.addEventListener("keydown", (e) => {
			e.preventDefault();
			if (match(e, "ArrowRight", 39) || match(e, "ArrowDown", 40) || (match(e, "Tab", 9) && !e.shiftKey)) {
				elem.nextElementSibling?.focus();
			} else if (match(e, "ArrowLeft", 37) || match(e, "ArrowUp", 38) || (match(e, "Tab", 9) && e.shiftKey)) {
				elem.previousElementSibling?.focus();
			} else if (match(e, "Backspace", 8)) {
				elem.previousElementSibling?.focus();
				if (elem.value != "") elem.value = "";
				FindGuess();
			} else if (e.key.toLowerCase().match(/^[a-z0-9\-]$/)) {
				if (elem.value == "") elem.value = e.key.toLowerCase();
				else if (elem.nextElementSibling) elem.nextElementSibling.value = e.key.toLowerCase();
				elem.nextElementSibling?.focus();
				FindGuess();
			} else {
				console.log(e, e.keyCode);
			}
		});
	});
};
addEventListenerToInput();

let blacklistedChar = () => {
	return [
		...[...document.querySelectorAll(".keyboard > span[blacklisted]")].map((elem) => elem.textContent),
		...[...document.querySelectorAll("#current_info > input")].map((inp) => inp.value).filter((a) => a),
	];
};

function match(event, code, keycode) {
	return event.code == code || event.key == code || event.keyCode == keycode || event.which == keycode;
}

const FindGuess = () => {
	let currentKeys = [...document.querySelectorAll("#current_info > input")].map((elem) => elem.value).filter((a) => a);
	Object.values(keyboard).forEach((elem) => {
		if (currentKeys.includes(elem.textContent)) elem.setAttribute("used", "");
		else elem.removeAttribute("used");
	});
	let value = RegExp(`^${[...document.querySelectorAll("#current_info > input")].map((inp) => (inp.value ? inp.value : `[^${[...new Set(currentKeys.join(""))]}]`)).join("")}$`);
	document.getElementById("matched_words").innerHTML = "";
	// Filter the list of words
	matchedWords = GlobalWordList.filter((word) => value.test(word.toLowerCase())).filter(
		(word) => ![...document.querySelectorAll(".keyboard > span[blacklisted]")].map((elem) => elem.textContent).some((l) => word.includes(l))
	);
	// Add sample words
	matchedWords
		.slice(0, 100)
		.map((word) => {
			// Convert String to Span
			let span = document.createElement("span");
			span.textContent = word;
			return span;
		})
		.forEach((word) => document.getElementById("matched_words").appendChild(word));
	// Get how many times does a char appears in the list of words
	let charCount = {};
	matchedWords.forEach((word) => {
		[...new Set(word.split(""))].forEach((char) => {
			if (charCount[char.toLowerCase()]) charCount[char.toLowerCase()]++;
			else charCount[char.toLowerCase()] = 1;
		});
	});
	document.querySelectorAll("#char_stats > div").forEach((elem) => elem.remove());
	let BlackListed = blacklistedChar();
	Object.entries(charCount)
		.sort((a, b) => b[1] - a[1])
		.filter((a) => !BlackListed.includes(a[0]))
		.slice(0, 10)
		.forEach(([char, count]) => {
			let percent = Math.round((count / matchedWords.length) * 100);
			let elem = document.importNode(document.querySelector("template[letter-stats]").content.querySelector("div"), true);

			elem.querySelector("[letter-name]").textContent = char.toUpperCase();
			elem.querySelector("[letter-percentage]").textContent = percent + "%";
			elem.querySelector("[progressbar-thumb]").style.width = percent + "%";
			document.getElementById("char_stats").appendChild(elem);
		});
};

document.getElementById("purge_dup").addEventListener("click", () => {
	GlobalWordList = [...new Set(GlobalWordList)];
	FindGuess();
});

let keyboard = [...document.querySelectorAll(".keyboard > span")].reduce((acc, elem) => {
	acc[elem.textContent] = elem;
	return acc;
}, {});

Object.values(keyboard).forEach((elem) => {
	elem.addEventListener("click", () => {
		if (!elem.hasAttribute("used")) {
			elem.toggleAttribute("blacklisted");
			FindGuess();
		}
	});
});

// JS for Config

Promise.all([fetch("words/basic_500.txt"), fetch("words/dictionary.txt"), fetch("words/macmillan.txt"), fetch("words/merriam.txt"), fetch("words/oxford.txt"), fetch("words/yourdictionary.txt")])
	.then((res) => Promise.all(res.map((res) => res.text())))
	.then(([basic_500, dictionary, macmillian, merriam, oxford, yourdictionary]) => {
		console.log(new Date(), "All wordlists have been fetched");
		wordlist.basic_500 = basic_500.replaceAll("\r", "").split("\n");
		wordlist.dictionary = dictionary.replaceAll("\r", "").split("\n");
		wordlist.macmillian = macmillian.replaceAll("\r", "").split("\n");
		wordlist.merriam = merriam.replaceAll("\r", "").split("\n");
		wordlist.oxford = oxford.replaceAll("\r", "").split("\n");
		wordlist.yourdictionary = yourdictionary.replaceAll("\r", "").split("\n");
		GlobalWordList = wordlist.basic_500;
		document.querySelectorAll("#dictionary").forEach((elem) => (elem.disabled = false));
		console.log(new Date(), "All wordlists have been loaded");
	})
	.then(FindGuess)
	.catch((err) => {
		console.error("Error while fetching wordlists", err);
	});

const updateWordlist = () => {
	GlobalWordList = wordlist.basic_500;
	if (document.querySelector('input[name="dictionary"]').checked) GlobalWordList = GlobalWordList.concat(wordlist.dictionary);
	if (document.querySelector('input[name="macmillan"]').checked) GlobalWordList = GlobalWordList.concat(wordlist.macmillian);
	if (document.querySelector('input[name="merriam-webster"]').checked) GlobalWordList = GlobalWordList.concat(wordlist.merriam);
	if (document.querySelector('input[name="oxford"]').checked) GlobalWordList = GlobalWordList.concat(wordlist.oxford);
	if (document.querySelector('input[name="yourdictionary"]').checked) GlobalWordList = GlobalWordList.concat(wordlist.yourdictionary);
	document.querySelectorAll("#dictionary").forEach((elem) => elem.removeAttribute("disabled"));
	FindGuess();
};

document.querySelectorAll("#dictionary").forEach((elem) => elem.addEventListener("change", updateWordlist));

// JS for letter updater
let letters = 8;
let addInputs = () => {
	document.querySelector("#current_info").innerHTML = "";
	new Array(letters)
		.fill(0)
		.map((_, i) => {
			let elem = document.createElement("input");
			elem.type = "text";
			// elem.maxLength = 1;
			elem.classList.add("guess");
			elem.setAttribute("n", i + 1);
			return elem;
		})
		.forEach((elem) => document.querySelector("#current_info").appendChild(elem));
	addEventListenerToInput();
	document.getElementById("no_of_letters").value = letters;
	FindGuess();
};

document.querySelector('[data-action="increment"]').addEventListener("click", () => {
	letters++;
	addInputs();
});

document.querySelector('[data-action="decrement"]').addEventListener("click", () => {
	if (letters > 1) {
		letters--;
		addInputs();
	}
});

document.querySelector("#onlyAlpha[word-rules]").addEventListener("change", () => {
	if (document.querySelector("#onlyAlpha[word-rules]").checked) {
		document.querySelector("#NoSpaces[word-rules]").setAttribute("disabled", "");
		document.querySelector("#NoNumbers[word-rules]").setAttribute("disabled", "");
		document.querySelector("#NoFreaky[word-rules]").setAttribute("disabled", "");
	} else {
		document.querySelector("#NoSpaces[word-rules]").removeAttribute("disabled");
		document.querySelector("#NoNumbers[word-rules]").removeAttribute("disabled");
		document.querySelector("#NoFreaky[word-rules]").removeAttribute("disabled");
	}
	FindGuess();
});
