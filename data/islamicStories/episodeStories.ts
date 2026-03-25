import type { IslamicStory } from "./types";

/**
 * Stand-alone episodes: specific moments alongside the general “life overview” stories
 * in sahabaStories, otherProphets, and prophetMuhammad.
 */
export const episodeIslamicStories: IslamicStory[] = [
  // —— Abū Bakr ——
  {
    id: "ep-sh-abubakr-hijrah",
    category: "sahaba",
    title: "Abū Bakr: the hijrah as companion, not tourist",
    tagline: "Two men, one mount, trust measured in steps",
    sections: [
      {
        title: "Choosing the harder road",
        paragraphs: [
          "When the permission to leave Makkah finally came, Abū Bakr had prepared two riding camels and provisions with care—not luxury, but endurance. He did not wait to be pushed; he had been waiting on Allāh’s word. That difference marks sincere migration: readiness without recklessness.",
          "The Prophet ﷺ accepted his company but made the path clear: only true necessity should bind them. Abū Bakr wept—not from fear of the desert, but from fear of being a burden. Love sometimes looks like wanting to step aside so the mission stays light.",
        ],
      },
      {
        title: "The cave and vigilance",
        paragraphs: [
          "In Thawr’s shelter, detail became devotion: plugging holes, listening through rock, minimizing noise. Abū Bakr’s body shielded the Messenger where rumor said assassins searched. Historians differ on small particulars, but the moral is stable: he risked skin before reputation.",
          "Spiders’ webs and nesting birds appear in popular memory as concealment—whether literal in every report or symbolic, the lesson holds: sometimes divine care wears ordinary masks. Abū Bakr’s foot reportedly bled; he stayed silent so sleep would not break.",
        ],
      },
      {
        title: "Arrival in Yathrib",
        paragraphs: [
          "When Madīnah’s palms appeared, exhaustion did not erase adab. The ansār’s welcome was loud with joy; Abū Bakr walked slightly behind, letting the Prophet ﷺ receive first embrace. Leadership here is knowing when to be foreground and when to be frame.",
          "For us, hijrah is rarely geographic today—it is leaving what Allāh forbids. Abū Bakr models packing light ego and heavy trust.",
        ],
      },
    ],
    takeaway: "Prepare sincerely for obedience; protect truth quietly; rejoice in others’ welcome without grasping center stage.",
    sourceNote: "Hijrah narratives in Ibn Isḥāq/Ibn Hishām and later sīrah works; details vary by riwāyah.",
  },
  {
    id: "ep-sh-abubakr-wealth",
    category: "sahaba",
    title: "Abū Bakr: wealth as runway for the ummah",
    tagline: "Freeing bodies, funding caravans, leaving little for show",
    sections: [
      {
        title: "People before portfolios",
        paragraphs: [
          "Before titles like caliph existed for him, Abū Bakr was known for buying freedom. Believers trapped in slavery—Bilāl, ʿĀmir ibn Fuhayrah, others—met a man who treated money as rescue currency, not status jewelry.",
          "He did not publicize every coin; much of his spending left only traces in someone else’s breath of relief. That pattern challenges fundraisers who need applause: the best ṣadaqah often forgets the camera.",
        ],
      },
      {
        title: "The expedition of hardship",
        paragraphs: [
          "When the Prophet ﷺ encouraged gifts for Tabūk, Abū Bakr brought what he had, not a curated fraction. Companions noticed; some tried to outdo. He smiled through competition that benefited the poor.",
          "Later, as khalīfah, he continued a simple home while directing treasury to soldiers and widows. Soft living did not soften his nerve when ridda threatened the fragile unity of prayer direction.",
        ],
      },
    ],
    takeaway: "Spend where Allāh’s cause frees and feeds; let simplicity guard your intention.",
    sourceNote: "Accounts of manumission and charity in early biographical literature.",
  },
  // —— ʿUmar ——
  {
    id: "ep-sh-umar-conversion",
    category: "sahaba",
    title: "ʿUmar: when strength pivots toward truth",
    tagline: "From sword drawn to learn Qurʾān to sword in just defense",
    sections: [
      {
        title: "Pride interrogated",
        paragraphs: [
          "ʿUmar entered the story of Islam as a man whose temper could clear a room. His conversion narrative—sister’s recitation, resolve hardened then melted—shows that courage is not only physical. It includes admitting wrong when ego prefers armor.",
          "He did not ask for a private, painless shift. He walked toward the Prophet’s gathering openly, declaring faith where he had threatened harm. Public repentance costs more than whispered regret; that was his style.",
        ],
      },
      {
        title: "Discipline after shahādah",
        paragraphs: [
          "Strength redirected became structure: learning, salah in congregation, defense of the weak. Later anecdotes of night walks checking on strangers blend legend and ethos; the core is accountability culture.",
          "Modern Muslims remember ʿUmar when power tempts them: use firmness for justice, not for humiliation.",
        ],
      },
    ],
    takeaway: "Let truth reorganize temper; make repentance visible when safety allows; channel force into protection.",
    sourceNote: "Conversion accounts in sīrah; multiple versions emphasize family and courage.",
  },
  {
    id: "ep-sh-umar-jerusalem",
    category: "sahaba",
    title: "ʿUmar: keys to Jerusalem, humility at the door",
    tagline: "A patched cloak and a city’s patience",
    sections: [
      {
        title: "Travel without theatre",
        paragraphs: [
          "When Jerusalem opened to Muslim stewardship, ʿUmar traveled from Madīnah with a servant, sharing the mount by turns. No victory parade preceded him; dust on his clothes mattered less than clarity of treaty.",
          "Sophronius, patriarch, reportedly expected pomp; he met a man who patched his garments. The contrast was itself daʿwah: power need not costume itself in arrogance.",
        ],
      },
      {
        title: "Prayer and long sight",
        paragraphs: [
          "He declined to pray inside the Church of the Resurrection as a personal preference that became precedent—worship elsewhere lest later generations confuse annexation with faith. That foresight is statecraft married to taqwā.",
          "The document of assurance to Jerusalem’s people—places of worship, property, safety—echoes in later fiqh discussions on dhimmah and ʿahd. Details in copies vary; the principle of protected worship communities remains instructive.",
        ],
      },
    ],
    takeaway: "Lead conquered cities with contracts, not contempt; prefer humble appearance when it serves communal trust.",
    sourceNote: "Early Islamic chronicles on Jerusalem’s surrender; scholarly study of ʿUmar’s assurance.",
  },
  // —— ʿUthmān ——
  {
    id: "ep-sh-uthman-jurf",
    category: "sahaba",
    title: "ʿUthmān: the well of Rūmah and thirsty troops",
    tagline: "Buying access so soldiers could drink without ransom",
    sections: [
      {
        title: "Thirst as warfare",
        paragraphs: [
          "In Madīnah’s growth, water was strategy. A merchant controlled a well and charged believers; ʿUthmān offered purchase price until the well became public endowment. Critics of wealth forget: sometimes capital buys communal breath.",
          "He did not wait for a campaign slogan; he saw friction and removed it. That is entrepreneurial zakāh—risk turned into shared resource.",
        ],
      },
      {
        title: "Pattern of quiet rescue",
        paragraphs: [
          "Similar stories cluster around his name: equipping expeditions, funding ships. Historians debate which tale matches which year; the ethical silhouette is consistent. He preferred writing checks—metaphorically—over writing speeches about himself.",
          "When later turmoil exploded, earlier generosity did not immunize him politically, reminding us virtue does not cancel human conflict—but it does leave a record for impartial history.",
        ],
      },
    ],
    takeaway: "Remove bottlenecks that exploit believers; endow resources for the public when you can.",
    sourceNote: "Well of Rūmah narrative in sīrah/tārīkh literature; variants exist.",
  },
  {
    id: "ep-sh-uthman-mushaf",
    category: "sahaba",
    title: "ʿUthmān: uniting recitation around one muṣḥaf",
    tagline: "Dialect spread, revelation stayed one",
    sections: [
      {
        title: "Expansion’s linguistic risk",
        paragraphs: [
          "As Islam crossed regions, recitation differences risked becoming identity battlegrounds. Ḥudhayfah ibn al-Yamān, returning from Azerbaijan, heard disputes that alarmed him— not trivial accent fights, but community fracture.",
          "ʿUthmān, now khalīfah, convened companions skilled in Qurʾān. Copies were sent with reciters to teach uniform text. Personal attachment to alternate oral forms had to yield to ummah-scale clarity.",
        ],
      },
      {
        title: "Sacrifice of preference",
        paragraphs: [
          "Some companions’ private maṣāḥif were adjusted; feelings were real, but unity was prioritized. The decision was administrative, not theological redefinition—paper and ink serving what angelic recitation had fixed.",
          "Today’s Muslim benefits without remembering the political courage. Copying a mushaf is easy; signing off on standardization across proud teachers was not.",
        ],
      },
    ],
    takeaway: "Prefer communal clarity in revelation over private pride in variant copies when unity is at stake.",
    sourceNote: "Jamʿ al-Qurʾān accounts under ʿUthmān; classical and modern critical discussions.",
  },
  // —— ʿAlī ——
  {
    id: "ep-sh-ali-hijrah-night",
    category: "sahaba",
    title: "ʿAlī: sleeping in the Prophet’s bed",
    tagline: "Decoy as devotion, not stunt",
    sections: [
      {
        title: "The plot and the substitute",
        paragraphs: [
          "Assassins circled the house, Quraysh’s patience worn thin. The Prophet ﷺ slipped away, but someone had to lie in his bedding so watchers would not immediately sound alarm. ʿAlī, young and beloved, accepted the role knowing steel might follow discovery.",
          "He was not pretending bravery for camera; he was covering a gap so revelation could walk to Madīnah. Risk here is love expressed as willingness to be struck first.",
        ],
      },
      {
        title: "Morning confrontation",
        paragraphs: [
          "When they tore the cloak, they found ʿAlī. Their anger spilled, yet he survived that round—destiny reserving him for later tests. The story teaches households: sometimes protection means absorbing suspicion.",
          "Readers today ask what they would trade for a friend’s safety. ʿAlī’s answer was sleep in a dangerous bed.",
        ],
      },
    ],
    takeaway: "Protect others at real personal risk when trust and mission demand it; trust Allāh with the morning after.",
    sourceNote: "Hijrah accounts mentioning ʿAlī’s ruse; standard sīrah sources.",
  },
  {
    id: "ep-sh-ali-khaybar",
    category: "sahaba",
    title: "ʿAlī: the banner at Khaybar",
    tagline: "Eyesight, fatigue, and reluctant leadership",
    sections: [
      {
        title: "When others return tired",
        paragraphs: [
          "Khaybar’s fortresses mocked early attempts. The Prophet ﷺ declared he would give the banner to a man who loves Allāh and His Messenger, through whom victory would come. The next morning ʿAlī arrived, eyes inflamed, and was given charge.",
          "Physical pain did not disqualify him; commitment did. Sometimes leadership lands on the one who shows up hurting but upright.",
        ],
      },
      {
        title: "Breaking the gate",
        paragraphs: [
          "Legend magnifies the iron gate; archaeology may whisper otherwise. Symbolically, the lesson remains: persistence plus reliance on Allāh moves obstacles that intimidate crowds.",
          "ʿAlī later became a reservoir of fiqh and courage in civil strife—topics debated historically—but Khaybar is early proof that youth trusted with pain can carry heavy cloth.",
        ],
      },
    ],
    takeaway: "Accept responsibility when called despite weakness; pair effort with reliance on Allāh.",
    sourceNote: "Khaybar narratives in maghāzī works; details vary.",
  },
  // —— Bilāl ——
  {
    id: "ep-sh-bilal-torture",
    category: "sahaba",
    title: "Bilāl: sand, stone, and “Aḥad, Aḥad”",
    tagline: "Heat on skin, coolness in conviction",
    sections: [
      {
        title: "Economics of persecution",
        paragraphs: [
          "Slavery in Makkah meant bodies could be leveraged against ideas. Bilāl’s master Umayyah ibn Khalaf made torture public pedagogy: break the slave, scare the free. Hot stones, dragging, deprivation—each was a lesson tyrants still use.",
          "Bilāl’s syllables shortened to one refrain: One God. Repetition under duress is theology under fire. He was not debating; he was surviving while refusing to lie.",
        ],
      },
      {
        title: "Purchase and ascent",
        paragraphs: [
          "Abū Bakr’s intervention was transactional mercy—coins for soul. After manumission, Bilāl did not waste bitterness on revenge tours; he climbed minarets. The adhān turned his voice from evidence of torture to clock of tawḥīd.",
          "Later life took him to Syria; some reports say he never called adhān again after the Prophet’s death, grief rewriting habit. Memory complicates hagiography—human hearts miss friends.",
        ],
      },
    ],
    takeaway: "Cling to tawḥīd when pain demands performance; let freedom become worship, not vendetta theater.",
    sourceNote: "Early Makkan persecution narratives; widely transmitted biography of Bilāl.",
  },
  {
    id: "ep-sh-bilal-fajr",
    category: "sahaba",
    title: "Bilāl: calling fajr while Madīnah slept",
    tagline: "Rhythm of a city learning to wake for God",
    sections: [
      {
        title: "Sound architecture",
        paragraphs: [
          "The adhān was not aesthetic garnish; it organized public time around prayer. Bilāl’s voice learned pitch that carried without amplifiers—human technology trained by need.",
          "Neighbors who grumbled in other cities heard here invitation. Sound became map: direction, discipline, belonging.",
        ],
      },
      {
        title: "Identity after the Prophet ﷺ",
        paragraphs: [
          "When the Messenger passed, Bilāl’s grief questioned routine. Yet his legacy was already communal: thousands knew the words because his lungs had rehearsed them daily.",
          "We inherit adhān through chain and speaker; remembering Bilāl reminds us it began with bruised feet and clear breath.",
        ],
      },
    ],
    takeaway: "Let public worship cues be consistent and sincere; grief may change your role, not your love.",
    sourceNote: "Institution of adhān in sīrah; Bilāl as muʾadhdhin in major sources.",
  },
  // —— Khadījah ——
  {
    id: "ep-sh-khadija-comfort",
    category: "sahaba",
    title: "Khadījah: the first hour after Ḥirāʾ",
    tagline: "Blankets, words, and theology in a kitchen",
    sections: [
      {
        title: "Trembling arrival",
        paragraphs: [
          "He came down the mountain shaking, saying “zammilūnī”—cover me. Fear and awe braided; Khadījah did not demand a calm report first. She wrapped him, validating somatic shock before intellectual curiosity.",
          "Care sequence matters in trauma: warmth, then listening. She modeled it before modern psychology labeled it.",
        ],
      },
      {
        title: "Warqah’s window",
        paragraphs: [
          "She connected him to Warqah ibn Nawfal, who recognized tidings of Moses-like burden. Khadījah brokered theological language when Muhammad ﷺ still searched vocabulary. Partnership here is spiritual logistics.",
          "Her wealth had always funded trust; now it funded the first community cell of prophethood.",
        ],
      },
    ],
    takeaway: "Comfort the overwhelmed before interrogating them; use networks to connect seekers to knowledge.",
    sourceNote: "Sīrah on first revelation; Khadījah’s role widely reported.",
  },
  {
    id: "ep-sh-khadija-boycott",
    category: "sahaba",
    title: "Khadījah: lean years in Shiʿb Abī Ṭālib",
    tagline: "Wealth spent, solidarity kept",
    sections: [
      {
        title: "Boycott’s arithmetic",
        paragraphs: [
          "Banished to the valley, clans starved together on paper lists of non-trade. Khadījah’s resources thinned feeding others. Her prior prosperity became collective buffer.",
          "She did not exit marriage when comfort exited finances—that steadiness is part of sīrah’s quiet epic.",
        ],
      },
      {
        title: "Death before migration",
        paragraphs: [
          "She died in Makkah, before the triumph of Madīnah. Grief carved the Prophet ﷺ; Jibrīl’s salām upon her honored what community under-appreciates: believing women as load-bearing walls.",
          "Year of sorrow links her passing with Abū Ṭālib’s—loss of intimate shelter and tribal shield back to back.",
        ],
      },
    ],
    takeaway: "Stand with truth in economic siege; know that some victories arrive only in the next life.",
    sourceNote: "Boycott of Banū Hāshim; death of Khadījah in sīrah sources.",
  },
  // —— Zayd & Salmān ——
  {
    id: "ep-sh-zayd-muttah",
    category: "sahaba",
    title: "Zayd at Muʾtah: banner after banner",
    tagline: "Three commanders, one refusal to scatter",
    sections: [
      {
        title: "Outnumbered realism",
        paragraphs: [
          "Roman-aligned forces dwarfed the Muslim detachment. Zayd carried the first standard, knowing odds. When he fell, Jaʿfar took it; when Jaʿfar fell, ʿAbdullāh ibn Rawāḥah hesitated with poetry of his own mortality, then advanced.",
          "Zayd’s love for the Prophet ﷺ was parental in structure—he had been adopted in custom before Qurʾān refined lineage terms. Battlefield promotion was trust, not nepotism.",
        ],
      },
      {
        title: "Retreat as order",
        paragraphs: [
          "Khalid’s rearguard maneuver saved lives; theology of martyrdom never erased tactical sense. Zayd’s death became data point: empires bite, but commitment endures in narrative.",
          "Families reading this remember adopted and chosen bonds are real bonds.",
        ],
      },
    ],
    takeaway: "Hold the line when leadership falls; accept orderly retreat when the mission says survive to fight wisely.",
    sourceNote: "Battle of Muʾtah in maghāzī literature.",
  },
  {
    id: "ep-sh-salman-search",
    category: "sahaba",
    title: "Salmān: priests, betrayal, and the final sign",
    tagline: "Decades of steps toward one Messenger",
    sections: [
      {
        title: "Geography of seeking",
        paragraphs: [
          "From Persia through Christianity’s cellars, Salmān chased honesty more than comfort. Each teacher revealed a crack: hidden money, moral compromise. He did not cynically quit faith; he quit false representatives.",
          "Sold into slavery, he landed in Madīnah with clues: palm trees, avoidance of dates, a prophet who accepts ṣadaqah without asking reward.",
        ],
      },
      {
        title: "The orchard test",
        paragraphs: [
          "His freedom was staged through planting and payment—effort plus community solidarity. When he stood free, he was not “converted” fresh; he was finally aligned.",
          "His foreign memory became military insight at Khandaq. Exile sometimes trains specialists.",
        ],
      },
    ],
    takeaway: "Keep seeking truth past betrayals; let suffering refine skills that serve the ummah.",
    sourceNote: "Salmān’s story in sīrah with scholarly notes on layering of reports.",
  },
  // —— Ḥamzah & Jaʿfar ——
  {
    id: "ep-sh-hamza-badr",
    category: "sahaba",
    title: "Ḥamzah: Islam and the lion’s discipline",
    tagline: "Uncle’s sword sworn to nephew’s message",
    sections: [
      {
        title: "Public conversion’s weight",
        paragraphs: [
          "When Ḥamzah accepted Islam, Quraysh lost the illusion that Muhammad ﷺ’s clan was uniformly hostile. His hunting skill and social rank made insult costlier for mockers.",
          "Strength without revelation is dangerous; Ḥamzah tried to weld both. Badr saw him in combat where strategy met spirit.",
        ],
      },
      {
        title: "Controlled ferocity",
        paragraphs: [
          "Islam did not pacify him into passivity; it aimed his violence toward legitimate defense. Modern readers note difference between toxic machismo and protective duty.",
          "His later martyrdom at Uḥud—after tactical vulnerability—closed arc quickly, leaving the ummah grief lessons.",
        ],
      },
    ],
    takeaway: "Let faith direct strength; use renown to shield the oppressed, not to bully the searching.",
    sourceNote: "Ḥamzah’s conversion and battles in sīrah/maghāzī.",
  },
  {
    id: "ep-sh-jafar-abyssinia",
    category: "sahaba",
    title: "Jaʿfar: Sūrah Maryam before Najāshī",
    tagline: "Recitation as diplomacy, tears as verdict",
    sections: [
      {
        title: "Refugee eloquence",
        paragraphs: [
          "Muslims fled Makkah’s heat to Abyssinia’s court. Asked to explain, Jaʿfar recited Maryam’s sūrah—Jesus born of virgin, miracle worker by God’s leave, not divine son. Najāshī wept; bishops murmured.",
          "The moment was dawah through text, not sword. Theology aligned with vulnerable honesty.",
        ],
      },
      {
        title: "Protection secured",
        paragraphs: [
          "Quraysh’s envoys brought gifts and slander; Najāshī tested truth with lines drawn in sand. The Muslims’ integrity held; return was delayed until Madīnah opened.",
          "Jaʿfar’s later years folded into Muʾtah’s tragedy—wings narrative in consolation hadith—but Abyssinia was his diplomatic masterpiece.",
        ],
      },
    ],
    takeaway: "Explain Islam with Qurʾān’s own language; seek just rulers who listen past bribery.",
    sourceNote: "Migration to Abyssinia accounts; role of Jaʿfar prominent in many narrations.",
  },
  // —— Abū ʿUbaydah & Muʿādh ——
  {
    id: "ep-sh-abuubaydah-tooth",
    category: "sahaba",
    title: "Abū ʿUbaydah: the link in the lip",
    tagline: "Pulling armor out of a prophet’s face",
    sections: [
      {
        title: "Battlefield first aid",
        paragraphs: [
          "At Uḥud, rumor and blades chaos; two helmet links pierced the Prophet’s cheek. Abū ʿUbaydah used teeth and nerve to extract metal, risking his own teeth. Blood mixed; friendship deepened.",
          "Medieval field surgery was crude; love was not.",
        ],
      },
      {
        title: "Trustee of the ummah",
        paragraphs: [
          "Named amīn in a generation of giants, he led armies without hoarding glory. Death by plague in Jordan while others fled—some narrations say he stayed to nurse—fits his silhouette.",
          "Biographers argue details; ethics remain: soft hands in hard offices.",
        ],
      },
    ],
    takeaway: "Serve wounded leaders sacrificially; stay with the sick when flight is selfish.",
    sourceNote: "Uḥud injury reports; plague of ʿAmwās narratives.",
  },
  {
    id: "ep-sh-muadh-yemen",
    category: "sahaba",
    title: "Muʿādh: teaching Yemen to fear misguiding Allāh",
    tagline: "A young qāḍī’s trembling responsibility",
    sections: [
      {
        title: "Farewell instructions",
        paragraphs: [
          "The Prophet ﷺ sent him to teach and judge. Take from Qurʾān; if not, sunnah; if not, analogize with care—classic encapsulation of method. Muʿādh’s fear of wrong ijtihād made him lighter, not lazy.",
          "He asked how to rule if texts silent; the answer empowered disciplined reasoning, not whims.",
        ],
      },
      {
        title: "Local texture",
        paragraphs: [
          "Yemen’s tribes needed law that felt just, not merely imported. Muʿādh’s youth meant stamina; his knowledge meant boundaries. Later death from plague—some say during Khilāfah of ʿUmar—ended a meteor of fiqh.",
          "Students today should copy his dread of misleading, not his age timeline.",
        ],
      },
    ],
    takeaway: "Judge from revelation first; reason carefully; fear leading people astray more than personal error.",
    sourceNote: "Sending of Muʿādh to Yemen; hadith on legal methodology.",
  },
  // —— Ḥabbāb, Sumayyah, ʿAmmār, Abū al-Dardāʾ ——
  {
    id: "ep-sh-habbab-coals",
    category: "sahaba",
    title: "Ḥabbāb: coals on skin, refusal to bargain away the Prophet ﷺ",
    tagline: "Torturers offered a cruel trade",
    sections: [
      {
        title: "The question",
        paragraphs: [
          "They burned his back and asked if he wished harm on Muhammad ﷺ instead. Ḥabbāb said no—his body could burn; the Messenger must stay untouched. Torture seeks not only pain but moral inversion; he declined.",
          "Such moments define sīrah’s moral ceiling: companions measured against swapping innocent harm.",
        ],
      },
      {
        title: "Scars as curriculum",
        paragraphs: [
          "Later he showed ʿUmar his marks; tears and resolve mixed. Memory of pain became pedagogy for rulers. Physical evidence argued where speeches might bounce.",
          "Today’s discomforts rarely involve coals; his baseline humbles complaints.",
        ],
      },
    ],
    takeaway: "Never trade another believer’s safety for your relief; let past pain teach justice.",
    sourceNote: "Makkan torture accounts; Ḥabbāb’s reports in sīrah literature.",
  },
  {
    id: "ep-sh-yasir-patience",
    category: "sahaba",
    title: "Yāsir ibn ʿĀmir: husband and father in the fire’s shadow",
    tagline: "Family tied together under Makkah’s cruelty",
    sections: [
      {
        title: "Three names, one bench of pain",
        paragraphs: [
          "Yāsir, Sumayyah, and ʿAmmār were displayed as pedagogy of persecution—see what happens to slaves and strangers who follow Muhammad ﷺ. Tribal immunity did not cover them; wealth did not shield them.",
          "Yāsir’s patience was not numbness; he chose words carefully under blows, teaching ʿAmmār that dignity survives when body does not.",
        ],
      },
      {
        title: "Widower in the story’s middle",
        paragraphs: [
          "When Sumayyah died first, his grief doubled as example: loss would not reverse shahādah. He continued until his own death under torture—reports cluster martyrdom for him as well.",
          "Their household is early Islam in miniature: cost, courage, continuity.",
        ],
      },
    ],
    takeaway: "Stand as a family for truth; absorb loss without abandoning conviction.",
    sourceNote: "Yāsir family persecution in sīrah; martyrdom lists vary slightly by source.",
  },
  {
    id: "ep-sh-sumayyah-martyr",
    category: "sahaba",
    title: "Sumayyah: first shahādah under Abū Jahl’s spear",
    tagline: "When the first life given was a woman’s",
    sections: [
      {
        title: "Powerless by dunyā, mighty by imān",
        paragraphs: [
          "Enslaved, without tribal umbrella, she faced Abū Jahl’s violence. Refusing apostasy, she became first martyr. Gender and status did not dilute Allāh’s acceptance.",
          "Her husband Yāsir and son ʿAmmār shared line of fire; family as mini-ummah under torture.",
        ],
      },
      {
        title: "Legacy beyond statistics",
        paragraphs: [
          "Chronology debates exist—some list others early—but her place in Muslim memory is fixed: tawḥīd chosen when steel demanded denial.",
          "Modern activism against oppression drinks from these wells quietly.",
        ],
      },
    ],
    takeaway: "Nobility is taqwā; stand though the world calls you weak.",
    sourceNote: "Early martyrdom narratives in sīrah.",
  },
  {
    id: "ep-sh-ammar-compulsion",
    category: "sahaba",
    title: "ʿAmmār: forced words and divine excuse",
    tagline: "Bodies break; hearts may remain",
    sections: [
      {
        title: "The edge of survival",
        paragraphs: [
          "Torture pushed tongue to speak what soul denied. The Prophet ﷺ cleaned the stain with revelation: except him who is compelled while heart rests in faith. Mercy met realism.",
          "ʿAmmār did not celebrate the excuse; he lived with complexity—builder of mosques, witness to fitnah.",
        ],
      },
      {
        title: "Old age clarity",
        paragraphs: [
          "At Ṣiffīn, his voice warned against confusing leadership disputes with core creed. Death in battle left slogan and sorrow; historians parse sides, believers parse intention.",
          "His arc teaches trauma-informed fiqh before the term existed.",
        ],
      },
    ],
    takeaway: "Allāh knows the forced tongue; rebuild community service after survival guilt.",
    sourceNote: "Torture of ʿAmmār; Qurʾān on compulsion; Ṣiffīn contexts in tārīkh.",
  },
  {
    id: "ep-sh-abudarda-marriage",
    category: "sahaba",
    title: "Abū al-Dardāʾ: learning and love negotiated",
    tagline: "When two ascetics share a roof",
    sections: [
      {
        title: "Expectations clarified",
        paragraphs: [
          "Stories tell of Umm al-Dardāʾ’s zeal and Abū al-Dardāʾ’s devotion to fasting and night prayer. They negotiated boundaries so worship would not erase kindness.",
          "Not every report matches modern marriage counseling paperwork, but the theme recurs: fiqh of family includes emotional fairness.",
        ],
      },
      {
        title: "Damascus wisdom",
        paragraphs: [
          "His later teaching circles mixed zuhd with jurisprudence. He reminded students a desert friend with little might exceed a city celebrity before Allāh.",
          "Knowledge without practice bored him; he chased alignment.",
        ],
      },
    ],
    takeaway: "Balance rigorous worship with spouse mercy; let knowledge shrink attachment to show.",
    sourceNote: "Biographical anecdotes in adab and rijāl works; some stories flagged weak by critics.",
  },
  // —— Prophets: Ibrāhīm, Mūsā, Yūsuf ——
  {
    id: "ep-np-ibrahim-hajar",
    category: "prophets",
    title: "Ibrāhīm: Hājar, Ismāʿīl, and the running between Ṣafā and Marwah",
    tagline: "Desert trial that became ritual memory",
    sections: [
      {
        title: "Command that hurt",
        paragraphs: [
          "Allāh tested Ibrāhīm with separation—leave mother and infant in arid valley with minimal supplies. Faith here is not emotionless; his steps away weighed.",
          "Hājar’s question—did Allāh command this?—turned pain into obedience anchored in trust, not mood.",
        ],
      },
      {
        title: "Zamzam and return",
        paragraphs: [
          "Her sprint between hills seeking vision for her child became sunnah for millions. Water rose; survival flipped. Ibrāhīm later built with Ismāʿīl; family reunited under divine plan, not accident.",
          "ʿUmrah and Ḥajj reenact her urgency—sweat as liturgy.",
        ],
      },
    ],
    takeaway: "Obey difficult commands trusting wisdom; desperate seeking can become worship preserved.",
    sourceNote: "Isrāʾīliyyāt and tafsīr layers on Makkah’s origins; ritual links in Ḥajj.",
  },
  {
    id: "ep-np-ibrahim-idols",
    category: "prophets",
    title: "Ibrāhīm: smashing idols, carrying the axe of questions",
    tagline: "Satire that exposed silent gods",
    sections: [
      {
        title: "The feast trick",
        paragraphs: [
          "He invited idols to dinner; they did not eat. Mockery had theological point: beings that cannot act cannot sustain you. When people returned, truth-telling became vandalism in their eyes.",
          "Breaking statues risked riot; he owned the act so smaller minds might awaken.",
        ],
      },
      {
        title: "Fire as classroom",
        paragraphs: [
          "Thrown into blaze, reliance made heat irrelevant narratively. Tyrants need spectacle; prophets need integrity.",
          "Muslim kids grow up with this story as courage template against peer pressure.",
        ],
      },
    ],
    takeaway: "Expose false gods with wit and courage; rely on Allāh when crowds rage.",
    sourceNote: "Qurʾān stories of Ibrāhīm; tafsīr and qisas collections.",
  },
  {
    id: "ep-np-musa-childhood",
    category: "prophets",
    title: "Mūsā: basket, palace, and a flame on the road",
    tagline: "Rescue, privilege, then exile before call",
    sections: [
      {
        title: "River and sister’s watch",
        paragraphs: [
          "Infanticide policy floated Hebrew boys; his mother’s inspiration sealed him in a chest. River carried him to Pharaoh’s household—enemy throne raising the one who would dismantle it.",
          "Sister’s suggestion linked mother back to nursling; divine plots use women’s quick thinking at edges of power.",
        ],
      },
      {
        title: "Fire and staff",
        paragraphs: [
          "Fleeing after accidental killing, years in Midian refined temper. The burning bush conversation renamed his tongue; staff became serpent lesson—tools ordinary until God commands.",
          "Return to Pharaoh was not revenge tour but liberation mandate.",
        ],
      },
    ],
    takeaway: "Trust small acts in crisis; accept long preparation before public mission.",
    sourceNote: "Qurʾān narratives of Mūsā’s early life; extensive tafsīr.",
  },
  {
    id: "ep-np-musa-sea",
    category: "prophets",
    title: "Mūsā: strike the sea, walk, do not look back in panic",
    tagline: "Pharaoh’s chariots and the trap of doubt",
    sections: [
      {
        title: "Caught between",
        paragraphs: [
          "Sea ahead, army behind—Banū Isrāʾīl’s complaint blamed Mūsā as if he invented geography. He answered: my Lord is with me; He will guide. Panic wants immediate doors; faith accepts strange openings.",
          "Staff struck water; path appeared dry enough to walk; tyranny drowned chasing greed.",
        ],
      },
      {
        title: "Aftermath caution",
        paragraphs: [
          "Survival did not erase grumbling; nostalgia for Egypt’s pots haunted them. Mūsā’s leadership lesson: miracles feed bodies briefly; hearts need law and patience.",
          "Readers note: leaving oppression mentally lags behind leaving physically.",
        ],
      },
    ],
    takeaway: "Move when Allāh commands; expect ingratitude; keep leading with patience.",
    sourceNote: "Qurʾān sea crossing accounts; tafsīr.",
  },
  {
    id: "ep-np-yusuf-well",
    category: "prophets",
    title: "Yūsuf: the well, the caravan, the price tag",
    tagline: "Brotherhood broken by jealousy, repaired by time",
    sections: [
      {
        title: "Plot in the name of love",
        paragraphs: [
          "Brothers framed removal as protection from wolf; father’s intuition saw wolf in sons’ eyes. Jealousy wore concern’s mask—common in families today.",
          "The well was not bottomless; commerce pulled him up. Slavery replaced brotherhood; price was counted coins.",
        ],
      },
      {
        title: "Household test incoming",
        paragraphs: [
          "Egypt’s palace tested chastity, then prison tested patience, then dream interpretation tested wisdom. Each stage stored skill for famine years ahead.",
          "No single moment wasted in divine pacing.",
        ],
      },
    ],
    takeaway: "Survive family betrayal without becoming bitter; let integrity prepare unexpected rescue.",
    sourceNote: "Sūrah Yūsuf; classical tafsīr.",
  },
  {
    id: "ep-np-yusuf-throne",
    category: "prophets",
    title: "Yūsuf: brothers at the throne, forgiveness with boundaries",
    tagline: "No blame today — accountability met mercy",
    sections: [
      {
        title: "Recognition delayed",
        paragraphs: [
          "He knew them; they did not know him—power asymmetry used for instruction, not revenge porn. Grain measured; cup planted; brothers cornered ethically mirroring their old deceit.",
          "When revelation came, tears broke dam; identity disclosed.",
        ],
      },
      {
        title: "Healing speech",
        paragraphs: [
          "No reproach today—yet not amnesia. He attributed plot to shayṭān, uplifted parents, framed unity under Allāh’s favor. Forgiveness here is leadership medicine.",
          "Brothers feared retaliation; mercy disarmed fear enough for repair.",
        ],
      },
    ],
    takeaway: "Forgive when safe; use power to reunite families without humiliating revenge.",
    sourceNote: "Sūrah Yūsuf climax; tafsīr on forgiveness themes.",
  },
  {
    id: "ep-np-nuh-long-call",
    category: "prophets",
    title: "Nūḥ: centuries of calling, one boat, one door",
    tagline: "When almost nobody believes, keep building",
    sections: [
      {
        title: "Ridicule as routine",
        paragraphs: [
          "Mockers passed the shipyard daily; Nūḥ answered with steadiness. His son’s emotional distance cut deeper than strangers’ jokes. Prophetic stamina is not sprint.",
          "Qurʾān stretches his mission across long years—exact counts are interpretive, but the feel is exhaustion met by refusal to invent easier message.",
        ],
      },
      {
        title: "Flood and finality",
        paragraphs: [
          "Water rose; ark floated; wrong refused board. Even his son’s plea could not bend divine line when son chose separation. Grief in prophets is real; law is still law.",
          "Survivors restarted humanity’s seed; rainbow of mercy in broader tradition echoes differently in Islamic sources, but judgment’s seriousness remains.",
        ],
      },
    ],
    takeaway: "Persist in truth without customizing message for likes; accept family limits when they reject guidance.",
    sourceNote: "Qurʾān narratives of Nūḥ in multiple sūrahs.",
  },
  {
    id: "ep-np-dawud-case",
    category: "prophets",
    title: "Dāwūd: two disputants and the sheep under the cloak",
    tagline: "Kings must fear their own bias",
    sections: [
      {
        title: "Court theater",
        paragraphs: [
          "Two men argued; one had many sheep, one had one ewe beloved. The powerful demanded she merge into his flock—classic extraction. Dāwūd initially ruled swap; night brought reminder: do not follow desire without proof.",
          "He repented publicly; throne did not exempt him from moral audit.",
        ],
      },
      {
        title: "Iron and dhikr",
        paragraphs: [
          "Softened iron and ordered praise—strength and devotion paired. Muslim memory links him to Zabūr, song that steadies justice.",
          "Leaders today need his fear of partiality more than his military skill.",
        ],
      },
    ],
    takeaway: "Listen to the weak litigant twice; repent rulings tainted by unconscious favor.",
    sourceNote: "Qurʾān narrative involving Dāwūd’s test; tafsīr variants.",
  },
  // —— Prophet Muhammad ﷺ: extra depth episodes ——
  {
    id: "ep-pm-ascent-maqam",
    category: "prophet_muhammad",
    title: "Muḥammad ﷺ: the prayer gift from above Maqām Maḥmūd",
    tagline: "From fifty to five — mercy in repetition",
    sections: [
      {
        title: "Ascent’s workload",
        paragraphs: [
          "Miʿrāj layered wonder upon wonder; salah obligation arrived heavy—fifty daily prayers. Mūsā’s counsel on human stamina led to incremental reduction until five remained, counted as fifty in reward.",
          "The story teaches negotiation between divine command and human capacity is not arrogance when mediated by prophets’ advice and Allāh’s mercy.",
        ],
      },
      {
        title: "Daily tether",
        paragraphs: [
          "Five times resets ego’s scatter. Each adhān recalls night journey without requiring repetition of miracle. Ordinary rhythm carries extraordinary memory.",
          "Communities arguing about mosque politics might return to this origin: prayer as gift, not burden.",
        ],
      },
    ],
    takeaway: "Treat the five prayers as condensed mercy; build life around their anchors.",
    sourceNote: "Isrāʾ/Miʿrāj hadith corpus; scholarly discussion on narration strength.",
  },
  {
    id: "ep-pm-taif-return",
    category: "prophet_muhammad",
    title: "Muḥammad ﷺ: after Ṭāʾif, the angel of mountains",
    tagline: "Power offered, mercy chosen",
    sections: [
      {
        title: "Exhausted descent",
        paragraphs: [
          "Bleeding, driven out, he rested under a tree. Slave messengers Addās touched his hand and tasted different theology briefly—kindness in microcosm.",
          "Jibrīl brought angelic offer: crush the valley between mountains. The Prophet ﷺ refused, hoping for descendants who would worship Allāh.",
        ],
      },
      {
        title: "Generations later",
        paragraphs: [
          "Ṭāʾif eventually opened; refusal of vengeance aged into fruit. History does not always fast-forward; mercy plants slow trees.",
          "Readers carrying grudges from small slights might measure against this scale.",
        ],
      },
    ],
    takeaway: "Decline destructive revenge; hope for future guidance in those who hurt you now.",
    sourceNote: "Ṭāʾif journey in sīrah; hadith on mountain angels.",
  },
];
