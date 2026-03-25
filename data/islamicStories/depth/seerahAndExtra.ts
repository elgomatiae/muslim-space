import type { IslamicStory } from "../types";

/** Prophet Muhammad ﷺ stories + pm-badr / pm-uhud / pm-tayammum from extraCorpus */
export const SEERAH_DEPTH: Partial<Record<string, IslamicStory["sections"]>> = {
  "pm-hira": [
    {
      title: "Qurʾān: the opening of revelation",
      paragraphs: [
        "Sūrah al-ʿAlaq (96) opens with the command to recite in the name of the Lord who created—who taught by the pen, taught man what he knew not. Muslims read this as the textual crystallization of what began in Ḥirāʾ: knowledge as divine gift, not self-invention.",
        "Themes in al-Muddaththir (74)—arise, warn, magnify your Lord, purify garments, abandon filth—mirror the moral architecture that soon shaped the Prophet’s ﷺ public life. Tafsīr works link these sūrahs to the earliest Makkan phase.",
        "Sūrah al-Najm (53) later alludes to seeing Jibrīl once more; scholars debate how much of the Isrāʾ/Miʿrāj language belongs to the same continuum of unseen encounter. The point for readers: Qurʾān and experience interlock rather than compete.",
      ],
    },
    {
      title: "Ḥadīth: what the ummah preserved",
      paragraphs: [
        "The account of Jibrīl squeezing him until difficulty, then releasing and reciting, appears across Ṣaḥīḥ al-Bukhārī and Ṣaḥīḥ Muslim with companion chains—often via ʿĀʾishah or Ibn ʿAbbās in various wordings. Variation in detail is normal; the core of iqraʾ and awe is stable.",
        "Reports describe Khadījah taking him to Warqah ibn Nawfal, who affirmed tidings resembling Moses—early Muslim memory framed reassurance through biblical typology without confusing prophethoods.",
        "Students should study these aḥādīth with teachers: isnād science, abrogation of certain standing practices, and the sequencing of revelation remain specialist topics.",
      ],
    },
    {
      title: "Sīrah narrators and layers",
      paragraphs: [
        "Ibn Isḥāq / Ibn Hishām compile the cave narrative with literary power; later historians compare riwāyāt on whether the first words were al-ʿAlaq or another sūrah. Critical sīrah scholarship treats such lists as memory traditions, not courtroom transcripts.",
        "Modern readers balance awe with humility: we inherit meaning through trustworthy transmission, not private imagination of angels.",
      ],
    },
  ],
  "pm-taif": [
    {
      title: "Qurʾān: consolation after weight",
      paragraphs: [
        "Sūrah al-Ḍuḥā (93) and al-Inshirāḥ (94)—‘your Lord has not forsaken nor hated’—are often recited in trauma care because they match the emotional temperature after Ṭāʾif: exhaustion without divine abandonment.",
        "Earlier Makkan sūrahs stress patience (ṣabr) and trust (tawakkul) when mockery is the currency of debate; Ṭāʾif embodies that curriculum in geography and blood.",
      ],
    },
    {
      title: "Ḥadīth: duʿāʾ and the mountains",
      paragraphs: [
        "The supplication for guidance or replacement of a people, and the angel of mountains offering to crush the valley, appear in major collections (e.g. Bukhārī/Muslim routes—wording varies). The Prophet’s ﷺ refusal models restraint when power is offered as revenge.",
        "Reports on Addās the slave and the gift of grapes thread human tenderness into the same day’s cruelty—hadith literature keeps social texture, not only speeches.",
      ],
    },
    {
      title: "Reading the city later",
      paragraphs: [
        "Ṭāʾif eventually opened to Islam; mercy’s long arc is a historical argument against despair after rejection. Sīrah teachers use the journey to discuss healthy grief and when to relocate daʿwah tactically.",
      ],
    },
  ],
  "pm-hudaybiyah": [
    {
      title: "Qurʾān: ‘clear victory’",
      paragraphs: [
        "Sūrah al-Fatḥ (48) names the treaty a manifest victory—training believers to read outcomes Allāh’s way when optics look like retreat. The sūrah’s pledges of forgiveness and help frame political humility as spiritual strength.",
        "Verses on obedience to Allāh and His Messenger in the same period reinforce that signing under instruction was worship-shaped politics, not cowardice.",
      ],
    },
    {
      title: "Ḥadīth: ink, allegiance, emotion",
      paragraphs: [
        "Reports describe companions’ shock at terms, the erased ‘Messenger of Allāh’ line, and the Prophet’s ﷺ calm execution of what revelation affirmed. Such aḥādīth appear in maghāzī chapters of Bukhārī/Muslim and related works.",
        "The bayʿah al-ridwān narrative—pledge under a tree—became a proof of love; Qurʾān 48:18 mentions satisfaction for those who pledged.",
      ],
    },
    {
      title: "Fiqh and statecraft echoes",
      paragraphs: [
        "Treaties, hudnah, and prisoner exchange in classical fiqh cite Ḥudaybiyah as precedent for timed peace when greater good is protected. Modern readers find language for diplomacy without theological surrender.",
      ],
    },
  ],
  "pm-khandaq": [
    {
      title: "Qurʾān: coalition and wind",
      paragraphs: [
        "Sūrah al-Aḥzāb (33) names the Confederates, tests on the hypocrites, and divine casting of fear into hearts—Qurʾānic memory of the trench crisis. Verses on the Prophet’s ﷺ wives and adab in the same sūrah link public siege to household ethics.",
        "The sūrah’s standards for truthful speech against rumor (ifk themes adjacent in tradition) remind communities that internal fracture aids external enemies.",
      ],
    },
    {
      title: "Ḥadīth: Salmān’s counsel and hunger",
      paragraphs: [
        "Aḥādīth praise Salmān’s trench idea and describe fasting, cold, and the barter of dates—human limits beside divine aid. Collections vary in emphasis; maghāzī specialists compare chains.",
        "Hypocrite behavior (withdrawing before battle) is narrated to teach discernment between complaint and nifāq.",
      ],
    },
    {
      title: "Siege as civic theology",
      paragraphs: [
        "Muslim cities today read Khandaq as infrastructure plus trust: legitimate defense, counsel (shūrā), and refusal to outsource security to panic.",
      ],
    },
  ],
  "pm-fath": [
    {
      title: "Qurʾān: opening and restraint",
      paragraphs: [
        "Sūrah al-Naṣr (110) and themes of nasr in al-Fatḥ connect victory with gratitude and seeking forgiveness—Makkah’s opening is spiritually book-ended, not merely military.",
        "Earlier verses on the sacred months and sanctity of the Ḥaram frame how force was disciplined once entry occurred.",
      ],
    },
    {
      title: "Ḥadīth: amnesty and the Kaʿbah",
      paragraphs: [
        "Reports in Bukhārī/Muslim describe cleansing idols, key imagery of Bilāl’s adhān from the House, and the general safety declaration—‘no blame today’—echoing Yūsuf’s idiom. Scholars extract adab of conquest: minimal blood, maximal mercy where possible.",
      ],
    },
    {
      title: "Historiography",
      paragraphs: [
        "Chronicles list specific exceptions for hardened criminals; reading lists with scholars prevents flattening amnesty into amnesia about justice.",
      ],
    },
  ],
  "pm-miraj": [
    {
      title: "Qurʾān: Isrāʾ anchor",
      paragraphs: [
        "Sūrah al-Isrāʾ (17:1) mentions night journey from Masjid al-Ḥarām to al-Aqṣā—blessed environs. Muslims differ on how much detail beyond the āyah is binding, but all affirm Allāh’s power over distance and time.",
        "Prayer (ṣalāh) as gift after ascension narratives ties worship to cosmic nearness in devotional preaching, even when hadith wording is parsed carefully.",
      ],
    },
    {
      title: "Ḥadīth: steps, prophets, gifts",
      paragraphs: [
        "Long reports in Bukhārī/Muslim describe ascension through heavens, meeting prophets, and the command of fifty prayers reduced to five with fivefold reward. Isnād and variant narrations are textbook material for advanced ḥadīth seminars.",
      ],
    },
    {
      title: "ʿAqīdah humility",
      paragraphs: [
        "Theologians warn against speculative maps of heaven; the lesson is obedience and awe, not cartoon physics.",
      ],
    },
  ],
  "pm-orphan": [
    {
      title: "Qurʾān: orphans elevated",
      paragraphs: [
        "Makkan and Madinan passages command kindness to orphans, warn devouring their wealth, and praise feeding the needy (e.g. themes in Sūrah al-Māʿūn, al-Ḍuḥā, al-Insān, al-Balad). The Prophet’s ﷺ biography becomes commentary on those āyāt lived forward.",
      ],
    },
    {
      title: "Ḥadīth: mercy as branding",
      paragraphs: [
        "He reportedly said the one who cares for an orphan is like this in Paradise—fingers joined—(Bukhārī/Muslim sense). Orphan sponsorship in fiqh inherits that emotional weight.",
      ],
    },
    {
      title: "Psychology and policy",
      paragraphs: [
        "Modern foster systems can map onto Islamic kafālah with legal care; sīrah supplies motive, fiqh supplies structure.",
      ],
    },
  ],
  "pm-service": [
    {
      title: "Qurʾān: household as mercy",
      paragraphs: [
        "Verses on spouses as garments, on living kindly with wives, and on the Prophet’s ﷺ burdens (e.g. themes in al-Aḥzāb) frame domestic life as revelation-adjacent, not a private free-for-all.",
      ],
    },
    {
      title: "Ḥadīth: chores and humor",
      paragraphs: [
        "Reports describe mending sandals, milking, serving himself—collected to combat clerical ego. Authenticity grades vary by report; ethic is widely preached.",
      ],
    },
    {
      title: "Masculinity re-read",
      paragraphs: [
        "Sīrah workshops use these aḥādīth against domestic tyranny dressed as ‘tradition.’",
      ],
    },
  ],
  "pm-jewishNeighbor": [
    {
      title: "Qurʾān: People of the Book and justice",
      paragraphs: [
        "Madīnan verses permit eating their lawful food, debate theology without mockery, and honor covenants—Qurʾānic baseline for neighbor ethics across faith.",
      ],
    },
    {
      title: "Ḥadīth: illness, gifts, funerals",
      paragraphs: [
        "Multiple reports command visiting the sick, honoring neighbors, and fair treatment; the Jewish neighbor story in sīrah anthologies illustrates applied fiqh before manuals codified every case.",
      ],
    },
    {
      title: "Contemporary adab",
      paragraphs: [
        "Muslim minorities and majorities both retrieve this pattern: sharīʿah includes decent neighborliness as worship.",
      ],
    },
  ],
  "pm-youth": [
    {
      title: "Qurʾān: age and responsibility",
      paragraphs: [
        "Stories of young helpers in Qurʾān (Yūsuf’s youth, assistants to prophets) parallel Anas’s service years. Tests of puberty and accountability appear in fiqh, not always in one āyah, but ethos aligns.",
      ],
    },
    {
      title: "Ḥadīth: Anas and adab",
      paragraphs: [
        "Long companionship of Anas yields countless reports on play permitted, boundaries kept, and trust given—core texts for youth ministry design.",
      ],
    },
    {
      title: "Community programming",
      paragraphs: [
        "Masjids balancing safety and belonging cite these models instead of only ‘be quiet’ culture.",
      ],
    },
  ],
  "pm-prisoner": [
    {
      title: "Qurʾān: war ethics seeds",
      paragraphs: [
        "Madīnan permission for fighting with conditions, feeding prisoners, and ransom verses (e.g. themes in al-Baqarah, al-Anfāl, Muḥammad) frame Badr’s aftermath as legally intelligible, not vendetta.",
      ],
    },
    {
      title: "Ḥadīth: teach ten Muslims",
      paragraphs: [
        "The ransom of teaching literacy appears in canonical collections; scholars discuss how literal the policy was versus exemplary. Either way, education ranks above gratuitous harm.",
      ],
    },
    {
      title: "Geneva echoes",
      paragraphs: [
        "Comparative ethics classes use this policy beside modern POW law—overlap and divergence both instruct.",
      ],
    },
  ],
  "pm-lastsermon": [
    {
      title: "Qurʾān: equality and sanctity",
      paragraphs: [
        "Āyāt on taqwā as nobility (al-Ḥujurāt 49:13), blood/money/property inviolability themes, and ribā prohibition underpin the farewell themes without needing one-to-one verse quotes in the sermon text itself.",
      ],
    },
    {
      title: "Ḥadīth: full transcripts",
      paragraphs: [
        "Several companions narrate versions; scholars compare wording. The ‘feet of Satan lost’ line and women’s rights reminders appear in hadith compilations and are staples of ʿArafah khutbah echoes yearly.",
      ],
    },
    {
      title: "Living constitution",
      paragraphs: [
        "Activists against racism and misogyny in Muslim spaces cite this sermon as prophetic baseline, then argue implementation.",
      ],
    },
  ],
  "pm-honey": [
    {
      title: "Qurʾān: family law revealed",
      paragraphs: [
        "Sūrah al-Tahrīm (66) and related passages address marital tension, oaths, and expiation—revealed through real household pain, not abstract casuistry.",
      ],
    },
    {
      title: "Ḥadīth: honey, oath, expiation",
      paragraphs: [
        "Contextual reports appear in tafsīr/hadith crossroads; jurists build rules on ẓihār, oaths, and kaffārah from these materials.",
      ],
    },
    {
      title: "Pastoral care",
      paragraphs: [
        "Counselors note: revelation did not side with cruelty to wives nor license gossip; it regulated and healed.",
      ],
    },
  ],
  "pm-burial": [
    {
      title: "Qurʾān: souls belong to Allāh",
      paragraphs: [
        "Funeral themes in Qurʾān stress return to God, dignity, and prayer for the dead—without specifying every standing practice’s evolution.",
      ],
    },
    {
      title: "Ḥadīth: standing, then clarification",
      paragraphs: [
        "The Jewish funeral report includes later sunnah refinement; fiqh schools teach final forms. Students learn abrogation/clarification as normal prophetic pedagogy.",
      ],
    },
    {
      title: "Plural societies",
      paragraphs: [
        "The story grounds respect at death across faiths within evolving fiqh limits.",
      ],
    },
  ],
  "pm-badr": [
    {
      title: "Qurʾān: the day truth met armies",
      paragraphs: [
        "Āyāt in Āl ʿImrān (3:123–125) and al-Anfāl (8) describe angels aiding believers, discipline in battle lines, and divine knowledge of what you fear. Badr becomes proof-text that numbers are not the only variable.",
      ],
    },
    {
      title: "Ḥadīth: duʿāʾ, sand, prisoners",
      paragraphs: [
        "Reports on throwing sand, sleep before battle, and treatment of captives populate Bukhārī/Muslim; each report feeds ethics of conflict.",
      ],
    },
    {
      title: "Aftermath",
      paragraphs: [
        "Debate over ransom vs execution for specific captives shows prophetic judgment calls, not bloodlust default.",
      ],
    },
  ],
  "pm-uhud": [
    {
      title: "Qurʾān: trial after victory",
      paragraphs: [
        "Āl ʿImrān (3:139–143) addresses setback, patience, and not weakening or grieve—fitting Uḥud’s mood. Hypocrisy verses in al-Aḥzāb later deepen the social diagnosis.",
      ],
    },
    {
      title: "Ḥadīth: archers, rumor, tooth injury",
      paragraphs: [
        "Canonical collections narrate disobedience at the hill, the Prophet’s ﷺ wounded face, and companion shields—texts for leadership under fire.",
      ],
    },
    {
      title: "Military obedience ethics",
      paragraphs: [
        "Officer training analogies are common in khuṭbah: orders exist for collective safety, not ego.",
      ],
    },
  ],
  "pm-tayammum": [
    {
      title: "Qurʾān: earth as purification",
      paragraphs: [
        "Al-Nisāʾ (4:43) and al-Māʾidah (5:6) name tayammum when water is unavailable or harmful—mercy clauses inside ṭahārah law.",
      ],
    },
    {
      title: "Ḥadīth: dusty strike, timing",
      paragraphs: [
        "Detailed aḥādīth describe hand strikes on soil/earth and face wipe—schools refine surfaces and repeats; students memorize matn then learn fiqh variants.",
      ],
    },
    {
      title: "Hospital chaplaincy",
      paragraphs: [
        "Burn units and chronic illness scenarios use this fiqh daily; revelation anticipated hardship.",
      ],
    },
  ],
};
