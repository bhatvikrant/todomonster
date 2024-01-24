const quotes = [
  "Hire character, train skills",
  "Appreciation goes a long way",
  "Take every experience in life as an experiment then there are no failures, only learning opportunities",
  "Persuasion is an art that requires a paintbrush, not a sledgehammer",
  "True genius is the ability to simplify, not complicate",
  "What the smartest people do on the weekend is what everyone else will do during the week in ten years",
  "You are not stupid you are unfamiliar with the codebase",
  "He who asks a question is a fool for five minutes; he who does not ask a question remains a fool forever.",
  "A good relationship with money is created in your childhood.",
  "It's okay to stand against the crowd if you're doing the right thing.",
  "The master has missed more times than the beginner has even tried",
];

function getRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}

export default getRandomQuote;
