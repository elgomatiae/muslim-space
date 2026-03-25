import type { IslamicStory } from "../types";

/** Main ṣaḥābah overview cards + sh-talha, sh-zubayr, sh-hassan from extraCorpus */
export const SAHABA_OVERVIEW_DEPTH: Partial<Record<string, IslamicStory["sections"]>> = {
  "sh-abubakr": [
    {
      title: "Qurʾān: companions praised",
      paragraphs: [
        "Though not always named by kunya in āyāt, the category ‘first and foremost’ believers (sābiqūn) in al-Wāqiʿah and similar passages frame Abū Bakr’s rank. Madinan verses on spending before victory (al-Ḥashr 9–10) invite comparison to early donors.",
      ],
    },
    {
      title: "Ḥadīth: Siddīq and leadership",
      paragraphs: [
        "Reports on his title al-Ṣiddīq after Isrāʾ, his role at death crisis, and caliph selection appear in Bukhārī/Muslim corpora—always study with scholars for full chains and fiqh of leadership.",
      ],
    },
    {
      title: "Khutbah at the Prophet’s death",
      paragraphs: [
        "The ‘manāya’ āyah recitation stabilizing panic is sīrah’s rhetorical peak; historians compare wordings across ṭabaqāt.",
      ],
    },
  ],
  "sh-umar": [
    {
      title: "Qurʾān: public good",
      paragraphs: [
        "Verses on zakāh collection, spoils administration, and taqwā-based nobility underpin the caliph who walked night patrols. Al-Ḥujurāt’s adab fits his reported self-corrections.",
      ],
    },
    {
      title: "Ḥadīth: paradise assurance reports",
      paragraphs: [
        "The ten promised Paradise lists include ʿUmar in famous aḥādīth—graded and debated like all lists; ethic: aspire without claiming others’ fate.",
      ],
    },
    {
      title: "Jerusalem and registers",
      paragraphs: [
        "Dīwān chronicles and conquest fiqh cite his era as codification moment—power remembered with paperwork.",
      ],
    },
  ],
  "sh-uthman": [
    {
      title: "Qurʾān: two qunūt and purity",
      paragraphs: [
        "Madīnan prayer and community discipline verses echo his long standing in qiyām; Qurʾānic stress on unity of revelation matches mushaf standardization motive.",
      ],
    },
    {
      title: "Ḥadīth: modesty and generosity",
      paragraphs: [
        "Reports describe his shyness praised by the Prophet ﷺ and massive spending—Bukhārī/Muslim routes exist; martyrdom scenes appear in tārīkh with sensitivity to fitnah complexity.",
      ],
    },
    {
      title: "Jamʿ al-Qurʾān",
      paragraphs: [
        "Classical sources detail Ḥafṣah’s muṣḥaf copy and dispatch—critical edition studies continue in universities.",
      ],
    },
  ],
  "sh-ali": [
    {
      title: "Qurʾān: courage and household",
      paragraphs: [
        "Al-Aḥzāb’s trial verses and references to Ahl al-Bayt themes (with scholarly boundaries on what exactly is included) intersect his biography. War verses frame legitimate defense.",
      ],
    },
    {
      title: "Ḥadīth: gate of knowledge, flag at Khaybar",
      paragraphs: [
        "Famous reports on ‘I am the city of knowledge and ʿAlī is its gate’ are authenticity-debated; Khaybar banner reports are more widely transmitted. Study both in rijāl classes.",
      ],
    },
    {
      title: "Later fitnah",
      paragraphs: [
        "Historians separate creed from politics; spirituality extracts patience models without reopening swords.",
      ],
    },
  ],
  "sh-bilal": [
    {
      title: "Qurʾān: steadfastness",
      paragraphs: [
        "Makkan persecution verses on those killed in Allāh’s path and the promise of good news resonate with his torture scene; Sūrah al-ʿAsr frames survival as shared investment.",
      ],
    },
    {
      title: "Ḥadīth: adhān institution",
      paragraphs: [
        "Dream-based adhān origin reports and Bilāl’s role appear in sunan works; fiqh of muʾadhdhin follows.",
      ],
    },
    {
      title: "Black excellence",
      paragraphs: [
        "Modern khutbahs cite Bilāl against racism in ummah claims—textual and ethical warrant.",
      ],
    },
  ],
  "sh-khadija": [
    {
      title: "Qurʾān: reward for believers",
      paragraphs: [
        "Though her name is not in Qurʾān text, categories of believing women and spending before ease parallel her life. Jibrīl’s salām report connects to divine honoring of service.",
      ],
    },
    {
      title: "Ḥadīth: best of women",
      paragraphs: [
        "Aḥādīth rank Khadījah, Fāṭimah, Āsiyah, and Maryam—wording variants exist; spiritual kinship across eras.",
      ],
    },
    {
      title: "Business and marriage",
      paragraphs: [
        "Islamic economics lectures use her caravan trust as due-diligence case study.",
      ],
    },
  ],
  "sh-zayd": [
    {
      title: "Qurʾān: adoption reform",
      paragraphs: [
        "Al-Aḥzāb 4–5 name Zayd then retract naming in lineage—revelation adjusts law while preserving love; Muslims read this as divine pedagogy about social justice and clarity.",
      ],
    },
    {
      title: "Ḥadīth: beloved to the Prophet ﷺ",
      paragraphs: [
        "Reports on his leadership at Muʾtah and emotional bond populate maghāzī chapters.",
      ],
    },
    {
      title: "Modern adoption law",
      paragraphs: [
        "Kafālah practice cites this narrative against Western confusion about Islamic lineage rules.",
      ],
    },
  ],
  "sh-salman": [
    {
      title: "Qurʾān: seekers across borders",
      paragraphs: [
        "Verses on those who divide religion and become sects (e.g. al-Anʿām 159) warn his earlier teachers’ failures; truth-seeking without bigotry is Qurʾānic.",
      ],
    },
    {
      title: "Ḥadīth: dates, trees, signs",
      paragraphs: [
        "The long isnād story appears in major works; scholars discuss composite transmission. Ethic: truth worth decades.",
      ],
    },
    {
      title: "Military intellect",
      paragraphs: [
        "Khandaq tactic validates immigrant knowledge in shūrā.",
      ],
    },
  ],
  "sh-abudarda": [
    {
      title: "Qurʾān: zuhd and ʿilm",
      paragraphs: [
        "Verses warning worldly glitter (e.g. themes in al-Kahf, al-Takāthur) pair with his fiqh circles; knowledge without practice is condemned in hadith corpus echoing Qurʾān.",
      ],
    },
    {
      title: "Ḥadīth: scholar vs desert friend",
      paragraphs: [
        "Reports comparing ranks of simple believers appear in Tirmidhī and others—soft hearts needed, not soft minds.",
      ],
    },
    {
      title: "Damascus legacy",
      paragraphs: [
        "His teaching chair influences Levantine fiqh memory.",
      ],
    },
  ],
  "sh-umaribnmasud": [
    {
      title: "Qurʾān: hidden charity",
      paragraphs: [
        "Verses praising those who spend by night and day, secretly and openly (al-Baqarah 274; al-Nisāʾ 114 themes) frame the ethic attributed to ʿUmar’s night errands.",
      ],
    },
    {
      title: "Ḥadīth: left hand not know",
      paragraphs: [
        "Canonical reports on concealing ṣadaqah make the story plausible even when individual anecdotes vary in strength.",
      ],
    },
    {
      title: "Leadership optics",
      paragraphs: [
        "CEOs learn from ‘public power, private service’ pairing.",
      ],
    },
  ],
  "sh-hamza": [
    {
      title: "Qurʾān: permission to fight",
      paragraphs: [
        "Madīnan permission verses and rules of qitāl contextualize his sword after shahādah; restraint preceded permission.",
      ],
    },
    {
      title: "Ḥadīth: lion imagery",
      paragraphs: [
        "Poetry and reports on Uḥud’s martyrdom and the Prophet’s ﷺ grief appear in sīrah— adab in mourning warriors.",
      ],
    },
    {
      title: "Anger management",
      paragraphs: [
        "His conversion from tribal hothead to disciplined fighter teaches channeling rage.",
      ],
    },
  ],
  "sh-jafar": [
    {
      title: "Qurʾān: recitation moving hearts",
      paragraphs: [
        "Maryam’s sūrah in court exemplifies Qurʾān as proof; verses on ʿĪsā’s true status undergirded his speech.",
      ],
    },
    {
      title: "Ḥadīth: wings in Paradise",
      paragraphs: [
        "Consolation report for the Prophet ﷺ after Muʾtah—graded discussions in commentaries; emotional healing in revelation’s community.",
      ],
    },
    {
      title: "Refugee dignity",
      paragraphs: [
        "Abyssinian hijrah is legal asylum precedent in khutbah.",
      ],
    },
  ],
  "sh-abuubaydah": [
    {
      title: "Qurʾān: trust and fulfillment",
      paragraphs: [
        "Verses on fulfilling trusts and covenant (e.g. al-Anfāl 27 themes) suit ‘trustworthy of this ummah’ title.",
      ],
    },
    {
      title: "Ḥadīth: tooth link removed",
      paragraphs: [
        "Uḥud first-aid reports in canonical collections; plague patience narratives in tārīkh.",
      ],
    },
    {
      title: "Medicine and plague",
      paragraphs: [
        "COVID-era articles cited his stay in ʿAmwās as moral example alongside medical science.",
      ],
    },
  ],
  "sh-muadh": [
    {
      title: "Qurʾān: judging by revelation",
      paragraphs: [
        "Māʾidah 44–50 on judging by what Allāh sent down anchors his Yemen mission; fear of misruling parallels āyah weight.",
      ],
    },
    {
      title: "Ḥadīth: methodology stack",
      paragraphs: [
        "Qurʾān → sunnah → ijtihād report is ḥadīth curriculum pillar—appear in Abū Dāwūd and others with fiqh commentaries.",
      ],
    },
    {
      title: "Remote imām training",
      paragraphs: [
        "Online fatwā ethics cite Muʿādh’s fear model.",
      ],
    },
  ],
  "sh-habbab": [
    {
      title: "Qurʾān: trial and rank",
      paragraphs: [
        "Āyāt on those tested with fire and those who stayed firm (e.g. al-Baqarah 214; al-ʿAnkabūt 2–3 themes) echo torture narratives.",
      ],
    },
    {
      title: "Ḥadīth: do not wish harm on Prophet ﷺ",
      paragraphs: [
        "His answer under coals is cited in sīrah monographs; authenticity discussions accompany ethical teaching.",
      ],
    },
    {
      title: "Asylum advocacy",
      paragraphs: [
        "Modern torture survivors find language of refusing to trade others’ safety.",
      ],
    },
  ],
  "sh-sumayyah": [
    {
      title: "Qurʾān: martyrs alive",
      paragraphs: [
        "Āl ʿImrān 169–171 and related passages on those killed in Allāh’s path being alive with their Lord frame her shahādah theology.",
      ],
    },
    {
      title: "Ḥadīth: first martyr lists",
      paragraphs: [
        "Sīrah sources name her among earliest; chains analyzed in rijāl works.",
      ],
    },
    {
      title: "Gender and class justice",
      paragraphs: [
        "Enslaved woman’s courage interrupts Makkan hierarchy readings.",
      ],
    },
  ],
  "sh-ammar": [
    {
      title: "Qurʾān: compulsion exception",
      paragraphs: [
        "Naḥl 106 on compelled word vs settled heart directly addresses his torture dilemma; scholars parse ‘compelled’ narrowly to prevent excuse abuse.",
      ],
    },
    {
      title: "Ḥadīth: building masjid while broken",
      paragraphs: [
        "Reports on ʿAmmār’s labor and mother’s murder appear in maghāzī; fitnah-era sayings are politically weighted—study with teachers.",
      ],
    },
    {
      title: "Trauma-informed fiqh",
      paragraphs: [
        "Modern scholars revisit Naḥl 106 for PTSD and coercion contexts carefully.",
      ],
    },
  ],
  "sh-talha": [
    {
      title: "Qurʾān: self-sacrifice idiom",
      paragraphs: [
        "Verses on preferring others over selves (al-Ḥashr 9) typologically match shielding with fingers at Uḥud—exact verse-to-event mapping is homiletic, not forensic.",
      ],
    },
    {
      title: "Ḥadīth: ten Paradise, Uḥud bravery",
      paragraphs: [
        "Lists and battle reports intersect; later political life requires nuanced tārīkh reading.",
      ],
    },
    {
      title: "Body as shield theology",
      paragraphs: [
        "Protective reflex discussed in just-war ethics courses.",
      ],
    },
  ],
  "sh-zubayr": [
    {
      title: "Qurʾān: early believers",
      paragraphs: [
        "Categories of those who preceded in good deeds echo his teen acceptance of Islam; war verses contextualize his battles.",
      ],
    },
    {
      title: "Ḥadīth: ten Paradise",
      paragraphs: [
        "Same list discourse; individual virtue vs later civil war complexity is teaching moment.",
      ],
    },
    {
      title: "Horsemanship sunnah",
      paragraphs: [
        "Cavalry ethics in classical works cite early companions.",
      ],
    },
  ],
  "sh-hassan": [
    {
      title: "Qurʾān: reconciliation",
      paragraphs: [
        "Al-Hujurāt’s peace-making verses and permission for truce in al-Anfāl themes frame abdication to stop killing—fiqh of sulḥ applies.",
      ],
    },
    {
      title: "Ḥadīth: sayyid and poison reports",
      paragraphs: [
        "Reports call him sayyid; poison narratives appear with scrutiny. Peace treaty with Muʿāwiyah is major tārīkh chapter.",
      ],
    },
    {
      title: "Political ethics",
      paragraphs: [
        "Debates continue on cost-benefit of unity vs principle—read sympathetically.",
      ],
    },
  ],
};
