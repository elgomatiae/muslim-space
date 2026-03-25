import type { IslamicStory } from "../types";

/** Stand-alone episode cards: Qurʾān, ḥadīth, and narration layers */
export const EPISODES_DEPTH: Partial<Record<string, IslamicStory["sections"]>> = {
  "ep-sh-abubakr-hijrah": [
    {
      title: "Qurʾān: hijrah as template",
      paragraphs: [
        "Verses on migration for Allāh’s sake (e.g. al-Nisāʾ 97–100 themes) and on the Prophet’s companions who gave shelter and help (al-Anfāl 72–75) frame hijrah ethics beyond geography.",
      ],
    },
    {
      title: "Ḥadīth: cave, spider, companionship",
      paragraphs: [
        "Bukhārī/Muslim report routes on Thawr, Abū Bakr’s fear and reassurance, and Allāh’s words ‘Do not grieve; indeed Allāh is with us’ (Tawbah 40) in context—comfort texts for anxiety.",
      ],
    },
    {
      title: "Sīrah maps",
      paragraphs: [
        "Historians compare escape paths and pursuit timing; spiritual reading stresses tawakkul logistics.",
      ],
    },
  ],
  "ep-sh-abubakr-wealth": [
    {
      title: "Qurʾān: spend before victory",
      paragraphs: [
        "Al-Ḥashr 9 praises those who gave before conquest and after—Abū Bakr’s pattern of early spending matches the divine aesthetic.",
      ],
    },
    {
      title: "Ḥadīth: freeing Bilāl and others",
      paragraphs: [
        "Manumission reports cluster around him in sīrah; zakāh after Prophethood structured earlier generosity.",
      ],
    },
    {
      title: "Wealth counseling",
      paragraphs: [
        "Financial advisors in Muslim spaces cite his ratio of retained vs given.",
      ],
    },
  ],
  "ep-sh-umar-conversion": [
    {
      title: "Qurʾān: hard hearts opened",
      paragraphs: [
        "Verses on Allāh guiding whom He wills after signs (e.g. al-Baqarah 118 themes) resist cynicism about ‘tough’ converts.",
      ],
    },
    {
      title: "Ḥadīth: door and sister",
      paragraphs: [
        "Conversion narrative with Ḥafṣah’s document and striking door appears in major collections— adab of family conflict turned tawbah.",
      ],
    },
    {
      title: "Masculinity studies",
      paragraphs: [
        "Programs on anger use ʿUmar before/after as case file.",
      ],
    },
  ],
  "ep-sh-umar-jerusalem": [
    {
      title: "Qurʾān: People of Scripture",
      paragraphs: [
        "Madīnan verses on honoring covenants and not attacking places of worship unjustly underpin the assurance document spirit.",
      ],
    },
    {
      title: "Ḥadīth: patched garment, cleanliness of prayer",
      paragraphs: [
        "Chronicles plus fiqh on praying in churches—later schools differ; humility anecdote is cultural capital.",
      ],
    },
    {
      title: "Interfaith city governance",
      paragraphs: [
        "Urban policy seminars cite Jerusalem surrender terms.",
      ],
    },
  ],
  "ep-sh-uthman-jurf": [
    {
      title: "Qurʾān: feeding and water rights",
      paragraphs: [
        "Verses on not consuming orphan wealth and feeding poor neighbor echo endowing water as communal trust.",
      ],
    },
    {
      title: "Ḥadīth: Muslim brother’s thirst",
      paragraphs: [
        "Reports on sharing water and removing harm from road pair with well purchase stories.",
      ],
    },
    {
      title: "Waqf law",
      paragraphs: [
        "Classical waqf manuals list well endowments as paradigmatic.",
      ],
    },
  ],
  "ep-sh-uthman-mushaf": [
    {
      title: "Qurʾān: guard revelation",
      paragraphs: [
        "Qāf 29–30 on Qurʾān as reminder guarded in a Book; Ḥijr 9 on dhikr and purity of text—theological warrant for careful copying.",
      ],
    },
    {
      title: "Ḥadīth: Ḥudhayfah’s alarm",
      paragraphs: [
        "Reports from expedition to Syria about recitation differences led to jamʿ—preserved in tārīkh with names of copyists.",
      ],
    },
    {
      title: "Textual criticism",
      paragraphs: [
        "Modern mushaf printing still traces to ʿUthmānic rasm conventions.",
      ],
    },
  ],
  "ep-sh-ali-hijrah-night": [
    {
      title: "Qurʾān: sacrifice idiom",
      paragraphs: [
        "Āyāt on selling life for Hereafter (al-Baqarah 207 typology) and on protecting the Messenger appear in tafsīr beside this night.",
      ],
    },
    {
      title: "Ḥadīth: sleeping in his bed",
      paragraphs: [
        "Hijrah stratagem reports in Bukhārī/Muslim—risk allocation in prophetic mission.",
      ],
    },
    {
      title: "Security studies",
      paragraphs: [
        "Leaders discuss decoy tactics ethically in light of prophetic precedent.",
      ],
    },
  ],
  "ep-sh-ali-khaybar": [
    {
      title: "Qurʾān: permission to fight broken treaty",
      paragraphs: [
        "Madīnan verses on treaty-breakers (e.g. al-Tawbah) contextualize Khaybar’s chronology in fiqh of war.",
      ],
    },
    {
      title: "Ḥadīth: ‘I will give the flag…’",
      paragraphs: [
        "Love of Allāh and His Messenger condition for victory reports; eye infection detail in collections.",
      ],
    },
    {
      title: "Chronic illness leadership",
      paragraphs: [
        "Disability advocates cite banner moment.",
      ],
    },
  ],
  "ep-sh-bilal-torture": [
    {
      title: "Qurʾān: upright in trial",
      paragraphs: [
        "Al-Burūj, al-Fajr, and early Makkan sūrahs on persecuted witnesses frame ‘Aḥad Aḥad’ endurance.",
      ],
    },
    {
      title: "Ḥadīth: torture and manumission",
      paragraphs: [
        "Sīrah chains on Umayyah ibn Khalaf and Abū Bakr’s purchase—study rijāl for each.",
      ],
    },
    {
      title: "Anti-slavery theology",
      paragraphs: [
        "Khuṭbah tie tawḥīd to abolitionist ethics historically.",
      ],
    },
  ],
  "ep-sh-bilal-fajr": [
    {
      title: "Qurʾān: prayer times announced",
      paragraphs: [
        "Though adhān wording is sunnah not Qurʾān, verses commanding ṣalāh and calling to good root the institution.",
      ],
    },
    {
      title: "Ḥadīth: dream adhān and Bilāl’s voice",
      paragraphs: [
        "Formation narratives in sunan; preference for strong voice without music excess—fiqh of microphone follows.",
      ],
    },
    {
      title: "Soundscape of cities",
      paragraphs: [
        "Anthropologists study adhān as public time discipline.",
      ],
    },
  ],
  "ep-sh-khadija-comfort": [
    {
      title: "Qurʾān: ‘Your Lord has not forsaken’",
      paragraphs: [
        "Later revelation to the Prophet ﷺ mirrors her instinct: al-Ḍuḥā’s consolation rhymes with her first-hour words.",
      ],
    },
    {
      title: "Ḥadīth: wrap him, take him to Warqah",
      paragraphs: [
        "First revelation reports in Bukhārī/Muslim—psychological first aid before theology debate.",
      ],
    },
    {
      title: "Marriage therapy",
      paragraphs: [
        "Counselors cite validating fear before fixing doctrine.",
      ],
    },
  ],
  "ep-sh-khadija-boycott": [
    {
      title: "Qurʾān: hunger in valley",
      paragraphs: [
        "Verses promising help and eventual relief after trial (e.g. al-Sharḥ, al-Inshirāḥ) fit Shiʿb years.",
      ],
    },
    {
      title: "Ḥadīth: boycott document, leaf eater",
      paragraphs: [
        "Sīrah reports on written boycott and eating leaves—economic warfare memory.",
      ],
    },
    {
      title: "Sanctions ethics",
      paragraphs: [
        "Activists compare boycott to modern siege with caution.",
      ],
    },
  ],
  "ep-sh-zayd-muttah": [
    {
      title: "Qurʾān: martyrdom truth",
      paragraphs: [
        "Āl ʿImrān 169–171 and al-Baqarah 154 shape reading of Muʾtah’s losses—never call dead shahīds ‘lifeless’ in theology.",
      ],
    },
    {
      title: "Ḥadīth: banner relay",
      paragraphs: [
        "Zayd, Jaʿfar, Ibn Rawāḥah sequence in maghāzī hadith—discipline under Roman-scale fear.",
      ],
    },
    {
      title: "Retreat fiqh",
      paragraphs: [
        "Khalid’s withdrawal analyzed in military fiqh seminars.",
      ],
    },
  ],
  "ep-sh-salman-search": [
    {
      title: "Qurʾān: those on a path",
      paragraphs: [
        "Verses distinguishing guidance from misguidance and warning priests who consume wealth falsely (e.g. al-Tawbah 31–34 themes) illuminate his journey.",
      ],
    },
    {
      title: "Ḥadīth: long story, palm test",
      paragraphs: [
        "Isnād-heavy report; scholars discuss composite layers—still ethically instructive.",
      ],
    },
    {
      title: "Interfaith honesty",
      paragraphs: [
        "Leaving bad teachers is sunnah when truth appears.",
      ],
    },
  ],
  "ep-sh-hamza-badr": [
    {
      title: "Qurʾān: permission and ranks",
      paragraphs: [
        "Al-Anfāl’s battle ethics verses pair with his first major combat after Islam.",
      ],
    },
    {
      title: "Ḥadīth: Islam after insult",
      paragraphs: [
        "Sīrah timing of conversion; wine cup report variants.",
      ],
    },
    {
      title: "Protective uncle archetype",
      paragraphs: [
        "Family defense within law—not tribal vendetta.",
      ],
    },
  ],
  "ep-sh-jafar-abyssinia": [
    {
      title: "Qurʾān: Maryam as proof",
      paragraphs: [
        "Reciting Sūrah Maryam in court used Qurʾān to define ʿĪsā correctly—textual strategy.",
      ],
    },
    {
      title: "Ḥadīth: Najāshī weeps",
      paragraphs: [
        "Migration accounts in sīrah collections; cross-empire asylum law today cites Najāshī justice.",
      ],
    },
    {
      title: "Rhetoric training",
      paragraphs: [
        "Daʿwah through tajwīd and meaning, not volume alone.",
      ],
    },
  ],
  "ep-sh-abuubaydah-tooth": [
    {
      title: "Qurʾān: love of the Messenger",
      paragraphs: [
        "Āl ʿImrān 31 and related obedience themes frame risking body for his safety.",
      ],
    },
    {
      title: "Ḥadīth: helmet link injury",
      paragraphs: [
        "Uḥud medical detail in Bukhārī/Muslim—field medicine sunnah.",
      ],
    },
    {
      title: "Dental sacrifice idiom",
      paragraphs: [
        "First responders analogies in sermons.",
      ],
    },
  ],
  "ep-sh-muadh-yemen": [
    {
      title: "Qurʾān: judge by revelation",
      paragraphs: [
        "Māʾidah 42–50 commands judging by what Allāh sent—Muʿādh’s mission text.",
      ],
    },
    {
      title: "Ḥadīth: lighten prayer for travelers",
      paragraphs: [
        "Reports on his advice from the Prophet ﷺ show fiqh tied to human fatigue.",
      ],
    },
    {
      title: "Colonial justice contrast",
      paragraphs: [
        "Scholars compare sharīʿah courts to extractive empire courts historically.",
      ],
    },
  ],
  "ep-sh-habbab-coals": [
    {
      title: "Qurʾān: sitr of the Messenger",
      paragraphs: [
        "Verses guarding the Prophet’s reputation and punishing slanderers (al-Aḥzāb, al-Nūr themes) parallel refusing to redirect torture to him.",
      ],
    },
    {
      title: "Ḥadīth: coals on back question",
      paragraphs: [
        "Torture scene in sīrah monographs; authenticity discussions alongside moral clarity.",
      ],
    },
    {
      title: "Prisoner solidarity",
      paragraphs: [
        "Refusing to bargain another’s pain appears in human-rights education.",
      ],
    },
  ],
  "ep-sh-yasir-patience": [
    {
      title: "Qurʾān: family under trial",
      paragraphs: [
        "Luqmān-style patience verses and stories of earlier communities tested together frame Yāsir household.",
      ],
    },
    {
      title: "Ḥadīth: ‘patience, family of Yāsir’",
      paragraphs: [
        "Famous consolation report from the Prophet ﷺ—wording in Musnad and others; grading taught in hadith seminars.",
      ],
    },
    {
      title: "Household shahādah",
      paragraphs: [
        "Parenting in persecution contexts today.",
      ],
    },
  ],
  "ep-sh-sumayyah-martyr": [
    {
      title: "Qurʾān: purchase of souls",
      paragraphs: [
        "Āl ʿImrān 169–171; al-Baqarah 207 typologies—martyrdom as divine transaction of love.",
      ],
    },
    {
      title: "Ḥadīth: first martyr listings",
      paragraphs: [
        "Sīrah riwāyāt on Abū Jahl’s spear—historical caution with spiritual fact.",
      ],
    },
    {
      title: "Gendered violence awareness",
      paragraphs: [
        "Khutbah tie to protecting vulnerable believers.",
      ],
    },
  ],
  "ep-sh-ammar-compulsion": [
    {
      title: "Qurʾān: Naḥl 106",
      paragraphs: [
        "Memorize precise exception language with tafsīr—never expand ‘compelled’ beyond qualified scholarship.",
      ],
    },
    {
      title: "Ḥadīth: building masjid, fitnah years",
      paragraphs: [
        "Reports on torture, construction, and later battles—read with political history courses.",
      ],
    },
    {
      title: "Mental health fiqh",
      paragraphs: [
        "Therapists and muftis collaborate on coercion OCD vs real force.",
      ],
    },
  ],
  "ep-sh-abudarda-marriage": [
    {
      title: "Qurʾān: spouses as garments",
      paragraphs: [
        "Al-Baqarah 187 and kindness verses frame negotiating worship and intimacy in one roof.",
      ],
    },
    {
      title: "Ḥadīth: zuhd couples",
      paragraphs: [
        "Anecdotes in adab books—some weak, some strong; ethics still teach balance.",
      ],
    },
    {
      title: "Dual-career devotion",
      paragraphs: [
        "Modern couples map fiqh of kufūw and time boundaries.",
      ],
    },
  ],
  "ep-np-ibrahim-hajar": [
    {
      title: "Qurʾān: running between Ṣafā and Marwah",
      paragraphs: [
        "Al-Baqarah 158 makes saʿy remembrance of Allāh—Hājar’s urgency becomes ritual for billions.",
      ],
    },
    {
      title: "Ḥadīth: Zamzam and duʿāʾ",
      paragraphs: [
        "Reports on Zamzam fulfilling intent—drink with purposeful supplication; grading varies.",
      ],
    },
    {
      title: "Single-parent desert theology",
      paragraphs: [
        "Mothers’ tawakkul in hardship camps cited.",
      ],
    },
  ],
  "ep-np-ibrahim-idols": [
    {
      title: "Qurʾān: smashing and debate",
      paragraphs: [
        "Al-Anbiyāʾ and al-Ṣāffāt narrate idol confrontation and fire—logic and miracle together.",
      ],
    },
    {
      title: "Ḥadīth: big idol left",
      paragraphs: [
        "Axe in hand report in tafsīr literature—wit as dawah tool within adab.",
      ],
    },
    {
      title: "Iconoclasm ethics",
      paragraphs: [
        "Modern law distinguishes worship spaces vs hate crimes—scholars warn against confusion.",
      ],
    },
  ],
  "ep-np-musa-childhood": [
    {
      title: "Qurʾān: cast into river, restored",
      paragraphs: [
        "Qāṣaṣ 7–13 narrates chest, sister’s watch, mother’s suckling—women’s agency in prophetic rescue.",
      ],
    },
    {
      title: "Ḥadīth: Pharaoh’s wife as believer",
      paragraphs: [
        "Āsiyah reports in tafsīr/Qiṣaṣ books—creed lessons beside Mūsā’s arc.",
      ],
    },
    {
      title: "Adoption and foster care",
      paragraphs: [
        "Pharaoh’s house vs divine return sparks fiqh talks.",
      ],
    },
  ],
  "ep-np-musa-sea": [
    {
      title: "Qurʾān: split sea passages",
      paragraphs: [
        "Al-Baqarah 50, al-Shuʿarāʾ 63–68, Yūnus 90—multiple retellings stress fear then rescue.",
      ],
    },
    {
      title: "Ḥadīth: follow prophet when livestock floats",
      paragraphs: [
        "Exodus-type trust reports in tafsīr lore—discern sound from isrāʾīliyyāt with teachers.",
      ],
    },
    {
      title: "Panic management",
      paragraphs: [
        "‘Strike the sea’ as obedience before optics.",
      ],
    },
  ],
  "ep-np-yusuf-well": [
    {
      title: "Qurʾān: brothers’ plot",
      paragraphs: [
        "Yūsuf 11–18 details jealousy mechanics—Qurʾān as family systems theory.",
      ],
    },
    {
      title: "Ḥadīth: best of stories",
      paragraphs: [
        "Prophetic praise for Sūrah Yūsuf encourages slow recitation.",
      ],
    },
    {
      title: "Sibling trauma",
      paragraphs: [
        "Therapists use well scene to discuss scapegoating children.",
      ],
    },
  ],
  "ep-np-yusuf-throne": [
    {
      title: "Qurʾān: no blame today",
      paragraphs: [
        "Yūsuf 92 forgiveness speech—limits and healing in same breath.",
      ],
    },
    {
      title: "Ḥadīth: charity to relatives",
      paragraphs: [
        "Reports on maintaining ties even when wronged—parallel ethics.",
      ],
    },
    {
      title: "Restorative justice",
      paragraphs: [
        "Compare to modern RJ circles cautiously.",
      ],
    },
  ],
  "ep-np-nuh-long-call": [
    {
      title: "Qurʾān: centuries compressed",
      paragraphs: [
        "Nūḥ 25–26 on 950 years excepted—tafsīr ranges on literal vs idiomatic time.",
      ],
    },
    {
      title: "Ḥadīth: few believed",
      paragraphs: [
        "Reports on low follower counts emphasize quality over metrics.",
      ],
    },
    {
      title: "Long-game activism",
      paragraphs: [
        "Climate and daʿwah both cite Nūḥ’s stamina without despair posting.",
      ],
    },
  ],
  "ep-np-dawud-case": [
    {
      title: "Qurʾān: judgment test",
      paragraphs: [
        "Ṣād 21–26 narrative on sheep dispute—Qurʾān as ethics casebook.",
      ],
    },
    {
      title: "Ḥadīth: judging self first",
      paragraphs: [
        "Reports on fear of bias in judgment pair with story.",
      ],
    },
    {
      title: "Implicit bias training",
      paragraphs: [
        "Judicial education imports prophetic mirror.",
      ],
    },
  ],
  "ep-pm-ascent-maqam": [
    {
      title: "Qurʾān: prayer as gift",
      paragraphs: [
        "Isrāʾ āyah plus repeated ṣalāh commands frame five prayers as lightened load.",
      ],
    },
    {
      title: "Ḥadīth: fifty to five",
      paragraphs: [
        "Miʿrāj reports in Bukhārī/Muslim—Mūsā’s counsel to reduce for ummah’s weakness is pedagogical humility.",
      ],
    },
    {
      title: "Chronic illness ṣalāh",
      paragraphs: [
        "Concessions after appreciating gift, not skipping lazily.",
      ],
    },
  ],
  "ep-pm-taif-return": [
    {
      title: "Qurʾān: mercy to worlds",
      paragraphs: [
        "Al-Anbiyāʾ 107 and rahmah themes underpin refusing mountain-crush revenge.",
      ],
    },
    {
      title: "Ḥadīth: angel of mountains",
      paragraphs: [
        "Canonical reports on supplication and refusal—peak mercy pedagogy.",
      ],
    },
    {
      title: "Restorative cities",
      paragraphs: [
        "Later opening of Ṭāʾif read as delayed fruit of duʿāʾ.",
      ],
    },
  ],
};
