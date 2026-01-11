-- ============================================================================
-- IMPORT DUAS DATA FROM CSV
-- ============================================================================
-- This script imports duas from the CSV file into the mental_health_duas table
-- Run this after creating the mental_health_duas table (003_create_wellness_tables.sql)

-- Category mapping from CSV category_id to app emotion_category:
-- stress -> anxiety (or distress for Yunus dua)
-- forgiveness -> peace
-- protection -> peace
-- strength -> patience
-- gratitude -> peace
-- family -> peace
-- health -> hope
-- success -> hope
-- sleep -> peace
-- morning -> peace
-- evening -> peace
-- travel -> peace

INSERT INTO public.mental_health_duas (id, title, arabic_text, transliteration, translation, context, emotion_category, source, benefits, is_active, order_index, created_at, updated_at)
VALUES
-- Forgiveness -> Peace
('00135cb3-407c-4ad3-9441-0a7241e1ff0e', 'Forgiveness', 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ', 'Rabbigh-fir li wa tub ''alayy', 'My Lord, forgive me and accept my repentance', NULL, 'peace', 'Abu Dawud', NULL, true, 2, NOW(), NOW()),
('0885868d-1dd1-4d2b-a136-dd8fe6dc8f1c', 'Forgiveness', 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', 'Allahumma innaka ''afuwwun tuhibbul-''afwa fa''fu ''anni', 'O Allah, You are Forgiving and love forgiveness, so forgive me', NULL, 'peace', 'Tirmidhi', NULL, true, 3, NOW(), NOW()),
('242e688b-0a81-48f2-a035-b1aea0e28cd0', 'Forgiveness', 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ', 'Astaghfirullahul-''Azim', 'I seek forgiveness from Allah, the Magnificent', NULL, 'peace', 'Abu Dawud', NULL, true, 1, NOW(), NOW()),
('e9aa2c9d-ddda-4287-bc60-a02f61dba476', 'Forgiveness', 'رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا', 'Rabbana zalamna anfusana wa illam taghfir lana', 'Our Lord, we have wronged ourselves, and if You do not forgive us', NULL, 'peace', 'Quran 7:23', NULL, true, 4, NOW(), NOW()),

-- Evening -> Peace
('09ece0df-5ace-4bbd-85a8-5c5e57528850', 'Evening', 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ', 'Amsayna wa amsal-mulku lillahi walhamdulillah', 'We have entered the evening and the dominion and praise belong to Allah', NULL, 'peace', 'Muslim', NULL, true, 3, NOW(), NOW()),
('1288b557-bd1f-407b-8e36-e3f8241e6223', 'Evening', 'اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ', 'Allahumma inni amsaytu ushhiduka', 'O Allah, I have entered the evening and I bear witness to You', NULL, 'peace', 'Abu Dawud', NULL, true, 2, NOW(), NOW()),
('54f620a4-d4a0-4cba-a6cd-dbcc3352c066', 'Evening', 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ', 'Amsayna wa amsal-mulku lillah', 'We have entered the evening and the dominion belongs to Allah', NULL, 'peace', 'Muslim', NULL, true, 1, NOW(), NOW()),

-- Protection -> Peace
('0f19b982-00cc-4fbb-ae0c-759520b8d98b', 'Protection', 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', 'A''udhu bikalimatillahit-tammati min sharri ma khalaq', 'I seek refuge in the perfect words of Allah from the evil of what He has created', NULL, 'peace', 'Muslim', NULL, true, 1, NOW(), NOW()),
('0faeb8ba-d81c-43f3-8a80-65e599ac5eb7', 'Protection', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْبَرَصِ وَالْجُنُونِ', 'Allahumma inni a''udhu bika minal-barasi wal-junun', 'O Allah, I seek refuge in You from leprosy and madness', NULL, 'peace', 'Abu Dawud', NULL, true, 3, NOW(), NOW()),
('68828f45-9e44-403a-9594-67390a502769', 'Protection', 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ', 'Bismillahil-ladhi la yadurru ma''asmihi shay''', 'In the name of Allah with whose name nothing is harmed', NULL, 'peace', 'Tirmidhi', NULL, true, 2, NOW(), NOW()),
('99cdf81c-7e9c-4099-9729-f5f38011e530', 'Protection', 'أَعُوذُ بِاللَّهِ السَّمِيعِ الْعَلِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ', 'A''udhu billahis-sami''il-''alimi minash-shaytanir-rajim', 'I seek refuge in Allah, the All-Hearing, the All-Knowing, from the accursed Satan', NULL, 'peace', 'Abu Dawud', NULL, true, 4, NOW(), NOW()),

-- Strength -> Patience
('202114f8-f138-4a9b-8c60-c64f91ce32c8', 'Strength', 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', 'Rabbi ishrah li sadri wa yassir li amri', 'My Lord, expand for me my breast and ease for me my task', NULL, 'patience', 'Quran 20:25-26', NULL, true, 1, NOW(), NOW()),
('23d9a694-f079-409e-bbec-6a86d377c2c9', 'Strength', 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ', 'Hasbiyallahu la ilaha illa huwa', 'Sufficient for me is Allah; there is no deity except Him', NULL, 'patience', 'Quran 9:129', NULL, true, 3, NOW(), NOW()),
('32e68520-3c00-4c13-89b3-0f5545a80d03', 'Strength', 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا', 'Rabbana afrigh ''alayna sabran wa thabbit aqdamana', 'Our Lord, pour upon us patience and plant firmly our feet', NULL, 'patience', 'Quran 2:250', NULL, true, 2, NOW(), NOW()),

-- Sleep -> Peace
('22afd063-0675-4b95-a166-06e17a3a0cfc', 'Sleep', 'اللَّهُمَّ بِاسْمِكَ أَحْيَا وَأَمُوتُ', 'Allahumma bismika ahya wa amut', 'O Allah, in Your name I live and die', NULL, 'peace', 'Bukhari', NULL, true, 3, NOW(), NOW()),
('56723b48-1981-49be-911b-2b6071176661', 'Sleep', 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', 'Bismika Allahumma amutu wa ahya', 'In Your name, O Allah, I die and I live', NULL, 'peace', 'Bukhari', NULL, true, 1, NOW(), NOW()),
('e5da41c0-9e8a-46a6-a1b2-84bef299d7e9', 'Sleep', 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ', 'Allahumma qini ''adhabaka yawma tab''athu ''ibadak', 'O Allah, protect me from Your punishment on the Day You resurrect Your servants', NULL, 'peace', 'Abu Dawud', NULL, true, 2, NOW(), NOW()),

-- Gratitude -> Peace
('2a19d5e5-cd1a-4513-b11e-d1c5ec3fb675', 'Gratitude', 'اللَّهُمَّ لَكَ الْحَمْدُ كُلُّهُ', 'Allahumma lakal-hamdu kulluh', 'O Allah, all praise is due to You', NULL, 'peace', 'Muslim', NULL, true, 2, NOW(), NOW()),
('36646797-de5b-4c4b-90e8-d029894ea4f1', 'Gratitude', 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'Alhamdulillahi rabbil ''alameen', 'All praise is due to Allah, Lord of the worlds', NULL, 'peace', 'Quran 1:2', NULL, true, 1, NOW(), NOW()),
('45aaade5-a090-4c2e-9be7-fc2ecebd25a7', 'Gratitude', 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا', 'Alhamdulillahil-ladhi at''amana wa saqana', 'All praise is due to Allah who has fed us and given us drink', NULL, 'peace', 'Abu Dawud', NULL, true, 3, NOW(), NOW()),

-- Family -> Peace
('2bdf9a07-bb50-46a4-b473-a1b77c5d77ad', 'Family', 'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ', 'Rabbanagh-fir li wa liwalidayya wa lilmu''minin', 'Our Lord, forgive me and my parents and the believers', NULL, 'peace', 'Quran 14:41', NULL, true, 3, NOW(), NOW()),
('436ce8ac-cb47-49cf-8116-1b16f49b3fcd', 'Family', 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي', 'Rabbi ij''alni muqimas-salati wa min dhurriyyati', 'My Lord, make me an establisher of prayer, and [many] from my descendants', NULL, 'peace', 'Quran 14:40', NULL, true, 2, NOW(), NOW()),
('58f69710-e4f3-4c8e-baf0-34e4f3a5d6b9', 'Family', 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ', 'Rabbana hab lana min azwajina wa dhurriyyatina qurrata a''yunin', 'Our Lord, grant us from among our wives and offspring comfort to our eyes', NULL, 'peace', 'Quran 25:74', NULL, true, 1, NOW(), NOW()),
('8ebf607e-7a9b-41e2-97a3-8271ba0064a6', 'Family', 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', 'Rabbir-hamhuma kama rabbayani saghira', 'My Lord, have mercy upon them as they brought me up when I was small', NULL, 'peace', 'Quran 17:24', NULL, true, 4, NOW(), NOW()),

-- Morning -> Peace
('2e3f1cae-cc14-49f0-a358-8f54cb5befe7', 'Morning', 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا', 'Allahumma bika asbahna wa bika amsayna', 'O Allah, by You we enter the morning and by You we enter the evening', NULL, 'peace', 'Abu Dawud', NULL, true, 2, NOW(), NOW()),
('bf52b4de-c871-4cdd-8bdd-abe2c501332e', 'Morning', 'أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ', 'Asbahna ''ala fitratil-Islam', 'We have entered the morning upon the natural religion of Islam', NULL, 'peace', 'Ahmad', NULL, true, 3, NOW(), NOW()),
('f6bb165a-c581-4b3d-83e9-416156ac2140', 'Morning', 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ', 'Asbahna wa asbahal-mulku lillah', 'We have entered the morning and the dominion belongs to Allah', NULL, 'peace', 'Muslim', NULL, true, 1, NOW(), NOW()),

-- Health -> Hope
('308b1057-48c8-4108-b2e7-cb7233aef127', 'Health', 'أَذْهِبِ الْبَاسَ رَبَّ النَّاسِ', 'Adh-hibil-ba''sa rabban-nas', 'Remove the harm, O Lord of mankind', NULL, 'hope', 'Bukhari', NULL, true, 3, NOW(), NOW()),
('bb43d2bd-82f0-4740-888f-e3b2cef85b89', 'Health', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', 'Allahumma inni as''alukal-''afiyata fid-dunya wal-akhirah', 'O Allah, I ask You for well-being in this world and the Hereafter', NULL, 'hope', 'Ibn Majah', NULL, true, 2, NOW(), NOW()),
('d013232b-58f1-4394-a83e-0d6a592cebc7', 'Health', 'اللَّهُمَّ عَافِنِي فِي بَدَنِي', 'Allahumma ''afini fi badani', 'O Allah, grant me health in my body', NULL, 'hope', 'Abu Dawud', NULL, true, 1, NOW(), NOW()),

-- Travel -> Peace
('51ab82ac-fa16-4600-9f49-cd6ccf1e1b67', 'Travel', 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى', 'Allahumma inna nas''aluka fi safarina hadhal-birra wat-taqwa', 'O Allah, we ask You in this journey of ours for righteousness and piety', NULL, 'peace', 'Muslim', NULL, true, 2, NOW(), NOW()),
('c00aa52e-d2b5-4a61-8330-49dcab59a53e', 'Travel', 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ', 'Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin', 'Glory to Him who has subjected this to us, and we could never have it', NULL, 'peace', 'Quran 43:13', NULL, true, 1, NOW(), NOW()),
('f43b54a0-69f3-411c-a61c-2462e3fd260e', 'Travel', 'اللَّهُمَّ اطْوِ لَنَا الْأَرْضَ وَهَوِّنْ عَلَيْنَا السَّفَرَ', 'Allahummah-twi lanal-arda wa hawwin ''alaynas-safar', 'O Allah, shorten the distance for us and make the journey easy', NULL, 'peace', 'Muslim', NULL, true, 3, NOW(), NOW()),

-- Success -> Hope
('99e071ab-425e-4734-a931-cfabceea1e8b', 'Success', 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً', 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanah', 'Our Lord, give us in this world good and in the Hereafter good', NULL, 'hope', 'Quran 2:201', NULL, true, 2, NOW(), NOW()),
('9a34991d-4a2d-4b8c-9fba-af27b2a3280d', 'Success', 'رَبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ', 'Rabbi adkhilni mudkhala sidq', 'My Lord, cause me to enter a sound entrance', NULL, 'hope', 'Quran 17:80', NULL, true, 3, NOW(), NOW()),
('ccc9f4ad-b7e2-4f2e-8456-064a3d4f06a1', 'Success', 'رَبِّ زِدْنِي عِلْمًا', 'Rabbi zidni ''ilma', 'My Lord, increase me in knowledge', NULL, 'hope', 'Quran 20:114', NULL, true, 1, NOW(), NOW()),

-- Stress -> Anxiety (most) or Distress (Yunus dua)
('c37b9574-7785-4290-b3ac-01aeeabfa06c', 'Stress & Anxiety', 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا', 'Allahumma la sahla illa ma ja''altahu sahla', 'O Allah, there is no ease except what You make easy', NULL, 'anxiety', 'Ibn Hibban', NULL, true, 4, NOW(), NOW()),
('d3915aae-24ea-45e5-b5e2-385c706a8740', 'Stress & Anxiety', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ', 'Allahumma inni a''udhu bika minal-hammi wal-hazan', 'O Allah, I seek refuge in You from worry and grief', NULL, 'anxiety', 'Bukhari', NULL, true, 3, NOW(), NOW()),
('d6dfc0e4-2092-4cc1-b00f-d2fd53eed43d', 'Stress & Anxiety', 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', 'Hasbunallahu wa ni''mal wakeel', 'Allah is sufficient for us, and He is the best Disposer of affairs', NULL, 'anxiety', 'Quran 3:173', NULL, true, 1, NOW(), NOW()),
('e3974702-108b-4a73-88c3-c57ea7bd8b84', 'Stress & Anxiety', 'لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ', 'La ilaha illa anta subhanaka inni kuntu minaz-zalimin', 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers', NULL, 'distress', 'Quran 21:87', NULL, true, 2, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  arabic_text = EXCLUDED.arabic_text,
  transliteration = EXCLUDED.transliteration,
  translation = EXCLUDED.translation,
  emotion_category = EXCLUDED.emotion_category,
  source = EXCLUDED.source,
  order_index = EXCLUDED.order_index,
  updated_at = NOW();
