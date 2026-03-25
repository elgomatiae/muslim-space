export interface StoryQuote {
  text: string;
  source: string;
}

export const STORY_QURAN_QUOTES: Partial<Record<string, StoryQuote[]>> = {
  "pm-hira": [
    {
      text: "Read in the name of your Lord who created.",
      source: "Qur'an 96:1",
    },
  ],
  "pm-taif": [
    {
      text: "And We have not sent you, [O Muhammad], except as a mercy to the worlds.",
      source: "Qur'an 21:107",
    },
  ],
  "pm-hudaybiyah": [
    {
      text: "Indeed, We have given you a clear conquest.",
      source: "Qur'an 48:1",
    },
  ],
  "pm-khandaq": [
    {
      text: "O you who have believed, remember the favor of Allah upon you when armies came to [attack] you and We sent upon them a wind and armies [of angels] you did not see.",
      source: "Qur'an 33:9",
    },
  ],
  "pm-fath": [
    {
      text: "When the victory of Allah has come and the conquest.",
      source: "Qur'an 110:1",
    },
  ],
  "pm-miraj": [
    {
      text: "Exalted is He who took His Servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa.",
      source: "Qur'an 17:1",
    },
  ],
  "pm-orphan": [
    {
      text: "So as for the orphan, do not oppress [him].",
      source: "Qur'an 93:9",
    },
  ],
  "pm-lastsermon": [
    {
      text: "Indeed, the most noble of you in the sight of Allah is the most righteous of you.",
      source: "Qur'an 49:13",
    },
  ],
  "np-ibrahim": [
    {
      text: "Allah said, O fire, be coolness and safety upon Abraham.",
      source: "Qur'an 21:69",
    },
  ],
  "np-musa": [
    {
      text: "Strike with your staff the sea, and it parted, and each portion was like a great towering mountain.",
      source: "Qur'an 26:63",
    },
  ],
  "np-yusuf": [
    {
      text: "Indeed, whoever fears Allah and is patient, then indeed, Allah does not allow to be lost the reward of those who do good.",
      source: "Qur'an 12:90",
    },
  ],
  "np-maryam": [
    {
      text: "The example of Jesus to Allah is like that of Adam. He created him from dust; then He said to him, Be, and he was.",
      source: "Qur'an 3:59",
    },
  ],
  "np-nuh": [
    {
      text: "And I called my people night and day.",
      source: "Qur'an 71:5",
    },
  ],
  "np-ayyub": [
    {
      text: "Indeed, adversity has touched me, and You are the Most Merciful of the merciful.",
      source: "Qur'an 21:83",
    },
  ],
  "np-yunus": [
    {
      text: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.",
      source: "Qur'an 21:87",
    },
  ],
  "np-zakariyya": [
    {
      text: "My Lord, do not leave me alone [with no heir], while You are the best of inheritors.",
      source: "Qur'an 21:89",
    },
  ],
  "np-shuayb": [
    {
      text: "Give full measure and weight in justice and do not deprive the people of their due.",
      source: "Qur'an 11:85",
    },
  ],
  "np-salih": [
    {
      text: "This is the she-camel of Allah for you as a sign.",
      source: "Qur'an 7:73",
    },
  ],
  "np-dawud": [
    {
      text: "O David, indeed We have made you a successor upon the earth, so judge between the people in truth.",
      source: "Qur'an 38:26",
    },
  ],
  "sh-abubakr": [
    {
      text: "If you do not aid him, Allah has already aided him when those who disbelieved had driven him out as one of two, when they were in the cave, and he said to his companion, Do not grieve; indeed Allah is with us.",
      source: "Qur'an 9:40",
    },
  ],
  "sh-umar": [
    {
      text: "O you who have believed, stand out firmly for Allah, witnesses in justice.",
      source: "Qur'an 5:8",
    },
  ],
  "sh-uthman": [
    {
      text: "Indeed, it is We who sent down the Reminder, and indeed, We will be its guardian.",
      source: "Qur'an 15:9",
    },
  ],
  "sh-ali": [
    {
      text: "And among the people is he who sells himself, seeking means to the approval of Allah.",
      source: "Qur'an 2:207",
    },
  ],
  "sh-bilal": [
    {
      text: "And those who strive for Us - We will surely guide them to Our ways.",
      source: "Qur'an 29:69",
    },
  ],
  "sh-khadija": [
    {
      text: "And We found you lost and guided [you].",
      source: "Qur'an 93:7",
    },
  ],
};

export const STORY_HADITH_QUOTES: Partial<Record<string, StoryQuote[]>> = {
  "pm-hira": [
    {
      text: "The angel came to me and said: Read.",
      source: "Sahih al-Bukhari 3; Sahih Muslim 160",
    },
  ],
  "pm-taif": [
    {
      text: "I hope that Allah will bring from their descendants people who worship Allah alone.",
      source: "Sahih al-Bukhari 3231; Sahih Muslim 1795",
    },
  ],
  "pm-miraj": [
    {
      text: "They were reduced to five prayers, and they are five while [rewarded as] fifty.",
      source: "Sahih al-Bukhari 349; Sahih Muslim 162",
    },
  ],
  "pm-orphan": [
    {
      text: "I and the one who cares for an orphan will be in Paradise like this.",
      source: "Sahih al-Bukhari 5304",
    },
  ],
  "pm-service": [
    {
      text: "He used to serve his family, and when prayer time came, he would go out to prayer.",
      source: "Sahih al-Bukhari 676",
    },
  ],
  "pm-prisoner": [
    {
      text: "Feed the hungry, visit the sick, and free the captives.",
      source: "Sahih al-Bukhari 5373",
    },
  ],
  "pm-lastsermon": [
    {
      text: "No Arab has superiority over a non-Arab, nor a non-Arab over an Arab, except by taqwa.",
      source: "Musnad Ahmad 23489 (meaning widely transmitted)",
    },
  ],
  "np-yunus": [
    {
      text: "The supplication of Dhun-Nun ... no Muslim supplicates with it for anything except that Allah responds to him.",
      source: "Jami al-Tirmidhi 3505",
    },
  ],
  "np-ayyub": [
    {
      text: "No fatigue, nor disease, nor sorrow ... afflicts a Muslim, but that Allah expiates some of his sins for it.",
      source: "Sahih al-Bukhari 5641; Sahih Muslim 2573",
    },
  ],
  "sh-abubakr": [
    {
      text: "If I were to take a close friend from my ummah, I would have taken Abu Bakr.",
      source: "Sahih al-Bukhari 3656; Sahih Muslim 2383",
    },
  ],
  "sh-umar": [
    {
      text: "Indeed, Allah has placed truth upon Umar's tongue and heart.",
      source: "Jami al-Tirmidhi 3682",
    },
  ],
  "sh-uthman": [
    {
      text: "Should I not be shy before a man whom even the angels are shy before?",
      source: "Sahih Muslim 2401",
    },
  ],
  "sh-ali": [
    {
      text: "Tomorrow I will give the flag to a man who loves Allah and His Messenger, and Allah and His Messenger love him.",
      source: "Sahih al-Bukhari 3701; Sahih Muslim 2405",
    },
  ],
  "sh-bilal": [
    {
      text: "I heard your footsteps before me in Paradise.",
      source: "Sahih al-Bukhari 1149; Sahih Muslim 2458",
    },
  ],
  "sh-khadija": [
    {
      text: "Give Khadijah glad tidings of a house in Paradise made of pearls wherein there is neither noise nor fatigue.",
      source: "Sahih al-Bukhari 3820; Sahih Muslim 2432",
    },
  ],
  "sh-salman": [
    {
      text: "Salman is from us, the People of the House.",
      source: "Al-Mustadrak 6542 (well-known report in sira literature)",
    },
  ],
  "sh-sumayyah": [
    {
      text: "Patience, O family of Yasir, for your meeting place is Paradise.",
      source: "Sira report (reported in multiple early sources)",
    },
  ],
  "sh-ammar": [
    {
      text: "Ammar will be killed by the transgressing group.",
      source: "Sahih al-Bukhari 447; Sahih Muslim 2915",
    },
  ],
  "pm-badr": [
    {
      text: "Perhaps Allah looked at the people of Badr and said: Do what you wish, for I have forgiven you.",
      source: "Sahih al-Bukhari 3007; Sahih Muslim 2494",
    },
  ],
  "pm-uhud": [
    {
      text: "Allah did not send down a disease except that He also sent down its cure.",
      source: "Sahih al-Bukhari 5678",
    },
  ],
};

