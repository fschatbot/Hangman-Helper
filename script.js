document.querySelectorAll("#current_info > input").forEach((elem) => {
	elem.addEventListener("keydown", (e) => {
		e.preventDefault();
		if (
			match(e, "ArrowRight", 39) ||
			match(e, "ArrowDown", 40) ||
			(match(e, "Tab", 9) && !e.shiftKey)
		) {
			elem.nextElementSibling?.focus();
		} else if (
			match(e, "ArrowLeft", 37) ||
			match(e, "ArrowUp", 38) ||
			(match(e, "Tab", 9) && e.shiftKey)
		) {
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

let blacklistedChar = () => {
	return [
		...[...document.querySelectorAll(".keyboard > span[blacklisted]")].map(
			(elem) => elem.textContent
		),
		...[...document.querySelectorAll("#current_info > input")]
			.map((inp) => inp.value)
			.filter((a) => a),
	];
};

function match(event, code, keycode) {
	return (
		event.code == code || event.key == code || event.keyCode == keycode || event.which == keycode
	);
}

let wordlist = [];
fetch("words/basic_500.txt")
	.then((res) => res.text())
	.then((text) => text.replaceAll("\r", "").split("\n"))
	.then((words) => (wordlist = wordlist.concat(words)));

const FindGuess = () => {
	let currentKeys = [...document.querySelectorAll("#current_info > input")]
		.map((elem) => elem.value)
		.filter((a) => a);
	Object.values(keyboard).forEach((elem) => {
		if (currentKeys.includes(elem.textContent)) elem.setAttribute("used", "");
		else elem.removeAttribute("used");
	});
	let value = RegExp(
		`^${[...document.querySelectorAll("#current_info > input")]
			.map((inp) => (inp.value ? inp.value : `[^${[...new Set(currentKeys.join(""))]}]`))
			.join("")}$`
	);
	document.getElementById("matched_words").innerHTML = "";
	// Filter the list of words
	matchedWords = wordlist
		.filter((word) => value.test(word.toLowerCase()))
		.filter(
			(word) =>
				![...document.querySelectorAll(".keyboard > span[blacklisted]")]
					.map((elem) => elem.textContent)
					.some((l) => word.includes(l))
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
			let elem = document.importNode(
				document.querySelector("template[letter-stats]").content.querySelector("div"),
				true
			);

			elem.querySelector("[letter-name]").textContent = char.toUpperCase();
			elem.querySelector("[letter-percentage]").textContent = percent + "%";
			elem.querySelector("[progressbar-thumb]").style.width = percent + "%";
			document.getElementById("char_stats").appendChild(elem);
		});
};

document.getElementById("purge_dup").addEventListener("click", () => {
	wordlist = [...new Set(wordlist)];
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
let wordlistNew = {};

Promise.all([
	fetch("words/basic_500.txt"),
	fetch("words/dictionary.txt"),
	fetch("words/macmillan.txt"),
	fetch("words/merriam.txt"),
	fetch("words/oxford.txt"),
	fetch("words/yourdictionary.txt"),
])
	.then((res) => Promise.all(res.map((res) => res.text())))
	.then(([basic_500, dictionary, macmillian, merriam, oxford, yourdictionary]) => {
		console.log(new Date(), "All wordlists have been fetched");
		wordlistNew.basic_500 = basic_500.replaceAll("\r", "").split("\n");
		wordlistNew.dictionary = dictionary.replaceAll("\r", "").split("\n");
		wordlistNew.macmillian = macmillian.replaceAll("\r", "").split("\n");
		wordlistNew.merriam = merriam.replaceAll("\r", "").split("\n");
		wordlistNew.oxford = oxford.replaceAll("\r", "").split("\n");
		wordlistNew.yourdictionary = yourdictionary.replaceAll("\r", "").split("\n");
		console.log(new Date(), "All wordlists have been loaded");
	})
	.catch((err) => {
		console.error("Error while fetching wordlists", err);
	});

const updateWordlist = () => {
	wordlist = wordlistNew.basic_500;
	if (document.querySelector('input[name="dictionary"]').checked)
		wordlist = wordlist.concat(wordlistNew.dictionary);
	if (document.querySelector('input[name="macmillan"]').checked)
		wordlist = wordlist.concat(wordlistNew.macmillian);
	if (document.querySelector('input[name="merriam-webster"]').checked)
		wordlist = wordlist.concat(wordlistNew.merriam);
	if (document.querySelector('input[name="oxford"]').checked)
		wordlist = wordlist.concat(wordlistNew.oxford);
	if (document.querySelector('input[name="yourdictionary"]').checked)
		wordlist = wordlist.concat(wordlistNew.yourdictionary);
	FindGuess();
};

document
	.querySelectorAll("#dictionary")
	.forEach((elem) => elem.addEventListener("change", updateWordlist));
