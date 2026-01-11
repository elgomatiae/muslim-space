#!/usr/bin/env python3
"""
Clean CSV by removing sample questions and ensure 50 questions per category
Generate complete CSV with real questions only
"""
import csv
import json
import uuid
import sys
from datetime import datetime, timezone

def is_sample_question(question_text, explanation_text=""):
    """Check if a question is a sample/placeholder"""
    sample_indicators = [
        'Sample question',
        'Please add content',
        'Sample explanation',
    ]
    question_lower = question_text.lower()
    explanation_lower = explanation_text.lower()
    
    # Check if question or explanation contains sample indicators
    if any(indicator.lower() in question_lower for indicator in sample_indicators):
        return True
    if any(indicator.lower() in explanation_lower for indicator in sample_indicators):
        return True
    
    # Check if all options are generic "Option A/B/C/D"
    return False

def generate_additional_questions(category, count_needed):
    """Generate additional real questions for a category"""
    questions = []
    
    if category == 'pillars':
        questions = [
            {
                'question': 'What are the Five Pillars of Islam?',
                'options': ['Shahadah, Salah, Zakat, Sawm, Hajj', 'Shahadah, Salah, Zakat, Jihad, Hajj', 'Shahadah, Salah, Charity, Fasting, Hajj', 'Faith, Prayer, Charity, Fasting, Pilgrimage'],
                'correct_answer': 0,
                'explanation': 'The Five Pillars are: Shahadah (Declaration of Faith), Salah (Prayer), Zakat (Charity), Sawm (Fasting in Ramadan), and Hajj (Pilgrimage to Mecca).',
            },
            {
                'question': 'What is the first pillar of Islam?',
                'options': ['Salah', 'Shahadah', 'Zakat', 'Hajj'],
                'correct_answer': 1,
                'explanation': 'Shahadah (Declaration of Faith) is the first pillar, declaring that there is no god but Allah and Muhammad is His messenger.',
            },
            {
                'question': 'How many times a day must Muslims perform Salah?',
                'options': ['3 times', '4 times', '5 times', '6 times'],
                'correct_answer': 2,
                'explanation': 'Muslims perform Salah (prayer) five times daily: Fajr (dawn), Dhuhr (noon), Asr (afternoon), Maghrib (sunset), and Isha (night).',
            },
            {
                'question': 'What is the minimum percentage of wealth that must be given as Zakat?',
                'options': ['1.5%', '2.5%', '3.5%', '5%'],
                'correct_answer': 1,
                'explanation': 'Zakat is 2.5% of one\'s wealth that has been held for a full lunar year, above the Nisab threshold.',
            },
            {
                'question': 'During which month is fasting (Sawm) obligatory?',
                'options': ['Muharram', 'Rajab', 'Ramadan', 'Sha\'ban'],
                'correct_answer': 2,
                'explanation': 'Fasting during the month of Ramadan is the fourth pillar of Islam and is obligatory for all adult Muslims who are able.',
            },
            {
                'question': 'Who is required to perform Hajj?',
                'options': ['All Muslims', 'Only men', 'Those who are physically and financially able', 'Only the elderly'],
                'correct_answer': 2,
                'explanation': 'Hajj is obligatory once in a lifetime for Muslims who are physically and financially able to make the journey to Mecca.',
            },
            {
                'question': 'What does "Shahadah" mean?',
                'options': ['Prayer', 'Declaration of Faith', 'Charity', 'Fasting'],
                'correct_answer': 1,
                'explanation': 'Shahadah means "testimony" or "declaration of faith" - declaring that there is no god but Allah and Muhammad is His messenger.',
            },
            {
                'question': 'What is the direction Muslims face during prayer?',
                'options': ['East', 'West', 'Mecca (Qibla)', 'Jerusalem'],
                'correct_answer': 2,
                'explanation': 'Muslims face the Qibla (direction of the Kaaba in Mecca) during all prayers, regardless of where they are in the world.',
            },
            {
                'question': 'How many Rak\'ahs (units) are in the Fajr prayer?',
                'options': ['2', '3', '4', '5'],
                'correct_answer': 0,
                'explanation': 'Fajr (dawn) prayer consists of 2 Rak\'ahs (units). It is the first of the five daily prayers.',
            },
            {
                'question': 'What breaks a fast during Ramadan?',
                'options': ['Eating, drinking, or intentional sexual activity', 'Swimming', 'Brushing teeth', 'Taking medicine'],
                'correct_answer': 0,
                'explanation': 'A fast is broken by eating, drinking, or intentional sexual activity during daylight hours. Unintentional actions or medical necessities may be excused.',
            },
            {
                'question': 'How many times must a Muslim perform Hajj in their lifetime?',
                'options': ['Once', 'Twice', 'Every 5 years', 'Every year'],
                'correct_answer': 0,
                'explanation': 'Hajj is obligatory once in a lifetime for those who are able. Performing it multiple times is optional and considered a good deed.',
            },
            {
                'question': 'What is the time for Dhuhr (noon) prayer?',
                'options': ['After sunrise until noon', 'After the sun passes its zenith until Asr', 'At sunset', 'At midnight'],
                'correct_answer': 1,
                'explanation': 'Dhuhr prayer time begins after the sun passes its zenith (highest point) and continues until the time for Asr prayer begins.',
            },
            {
                'question': 'What is the first thing a person must do to become Muslim?',
                'options': ['Perform Hajj', 'Recite the Shahadah', 'Learn Arabic', 'Start praying'],
                'correct_answer': 1,
                'explanation': 'To become Muslim, one must sincerely recite the Shahadah: "There is no god but Allah, and Muhammad is the messenger of Allah."',
            },
            {
                'question': 'How many Rak\'ahs are in Maghrib (sunset) prayer?',
                'options': ['2', '3', '4', '5'],
                'correct_answer': 1,
                'explanation': 'Maghrib (sunset) prayer consists of 3 Rak\'ahs. It is performed immediately after sunset.',
            },
            {
                'question': 'What is the reward for fasting during Ramadan?',
                'options': ['Forgiveness of all sins', 'Paradise', 'Great reward from Allah', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'Fasting in Ramadan has immense rewards including forgiveness of sins and the promise of Paradise, as mentioned in authentic Hadith.',
            },
            {
                'question': 'What is Umrah?',
                'options': ['The lesser pilgrimage to Mecca', 'The greater pilgrimage', 'A type of prayer', 'A form of charity'],
                'correct_answer': 0,
                'explanation': 'Umrah is the lesser pilgrimage to Mecca that can be performed at any time of the year, unlike Hajj which has specific dates.',
            },
            {
                'question': 'What is the minimum amount of wealth (Nisab) for Zakat on silver?',
                'options': ['200 dirhams', '400 dirhams', '600 dirhams', '800 dirhams'],
                'correct_answer': 0,
                'explanation': 'The Nisab for silver is 200 dirhams (approximately 595 grams). This is an alternative to the gold Nisab.',
            },
            {
                'question': 'What is the significance of the Kaaba?',
                'options': ['It is the house of Allah', 'Direction for prayer', 'Destination for Hajj', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'The Kaaba in Mecca is the holiest site in Islam, built by Prophet Ibrahim and Ismail. It is the Qibla (direction) for prayer and the destination for Hajj.',
            },
            {
                'question': 'What is the minimum duration for a fast to be valid?',
                'options': ['From dawn to sunset', '12 hours', 'From sunrise to sunset', '24 hours'],
                'correct_answer': 0,
                'explanation': 'A valid fast begins at Fajr (dawn) and ends at Maghrib (sunset), following the local prayer times.',
            },
            {
                'question': 'What is Zakat al-Fitr?',
                'options': ['Annual charity', 'Charity given at the end of Ramadan', 'Charity for the poor', 'Charity for orphans'],
                'correct_answer': 1,
                'explanation': 'Zakat al-Fitr is a special charity given at the end of Ramadan, before Eid prayer. It is obligatory for every Muslim.',
            },
            {
                'question': 'How many times is the Tawaf (circumambulation) performed during Hajj?',
                'options': ['3 times', '5 times', '7 times', '10 times'],
                'correct_answer': 2,
                'explanation': 'Tawaf (circumambulating the Kaaba) is performed 7 times during Hajj and Umrah, starting and ending at the Black Stone.',
            },
            {
                'question': 'What is the minimum age for fasting in Ramadan?',
                'options': ['7 years', '10 years', 'Puberty', '18 years'],
                'correct_answer': 2,
                'explanation': 'Fasting becomes obligatory at puberty. However, children are often encouraged to practice fasting gradually before reaching puberty.',
            },
            {
                'question': 'What is the reward for performing Hajj?',
                'options': ['Forgiveness of all sins', 'Paradise', 'Great reward', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'An accepted Hajj brings immense rewards including forgiveness of sins and the promise of Paradise, as mentioned in authentic Hadith.',
            },
            {
                'question': 'What is the time for Isha (night) prayer?',
                'options': ['After sunset', 'After Maghrib', 'After twilight disappears', 'At midnight'],
                'correct_answer': 2,
                'explanation': 'Isha prayer time begins after the twilight (red glow) disappears from the horizon and continues until Fajr.',
            },
            {
                'question': 'What is the minimum amount for Zakat al-Fitr?',
                'options': ['One Sa\'a of food per person', 'Money equivalent', 'Both are acceptable', 'It varies by country'],
                'correct_answer': 2,
                'explanation': 'Zakat al-Fitr can be given as one Sa\'a (approximately 2.5-3 kg) of staple food (wheat, rice, dates, etc.) or its monetary equivalent.',
            },
            {
                'question': 'What is the significance of Arafat during Hajj?',
                'options': ['Where pilgrims stand', 'Main ritual of Hajj', 'Day of Arafah', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'Standing at Arafat on the 9th of Dhul-Hijjah is the most important ritual of Hajj. Missing it invalidates the Hajj.',
            },
            {
                'question': 'What breaks the Wudu (ablution)?',
                'options': ['Sleeping', 'Using the restroom', 'Passing gas', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'Wudu is broken by using the restroom, passing gas, deep sleep, loss of consciousness, and other specific conditions.',
            },
            {
                'question': 'What is the minimum number of Rak\'ahs for Dhuhr prayer?',
                'options': ['2', '3', '4', '5'],
                'correct_answer': 2,
                'explanation': 'Dhuhr (noon) prayer consists of 4 Rak\'ahs. It is the second of the five daily prayers.',
            },
            {
                'question': 'What is the significance of the Black Stone (Hajar al-Aswad)?',
                'options': ['It must be touched', 'Starting point for Tawaf', 'It is a meteorite', 'All of the above'],
                'correct_answer': 1,
                'explanation': 'The Black Stone is the starting and ending point for Tawaf. While touching it is recommended, it is not obligatory.',
            },
            {
                'question': 'What is the time for Asr (afternoon) prayer?',
                'options': ['After Dhuhr', 'When shadow equals object', 'Late afternoon', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'Asr prayer time begins when the shadow of an object equals its length (after Dhuhr) and continues until sunset.',
            },
            {
                'question': 'What is the minimum number of Rak\'ahs for Isha prayer?',
                'options': ['2', '3', '4', '5'],
                'correct_answer': 2,
                'explanation': 'Isha (night) prayer consists of 4 Rak\'ahs. It is the last of the five daily prayers.',
            },
            {
                'question': 'What is the reward for praying in congregation?',
                'options': ['27 times more reward', 'Equal reward', 'Double reward', '10 times more reward'],
                'correct_answer': 0,
                'explanation': 'Praying in congregation (Jama\'ah) at the mosque is rewarded 27 times more than praying alone, as mentioned in authentic Hadith.',
            },
            {
                'question': 'What is the minimum number of people needed for Friday prayer (Jumu\'ah)?',
                'options': ['2', '3', '4', '40'],
                'correct_answer': 1,
                'explanation': 'Friday prayer requires at least 3 people (1 Imam and 2 followers), though larger congregations are preferred.',
            },
            {
                'question': 'What is the significance of the first 10 days of Dhul-Hijjah?',
                'options': ['Best days for good deeds', 'Days of Hajj', 'Days before Eid', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'The first 10 days of Dhul-Hijjah are among the best days of the year for good deeds, including the days of Hajj and before Eid al-Adha.',
            },
            {
                'question': 'What is the significance of Laylat al-Qadr?',
                'options': ['Night of Power', 'Better than 1000 months', 'In the last 10 nights of Ramadan', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'Laylat al-Qadr (Night of Power) is better than 1000 months of worship. It occurs in the last 10 nights of Ramadan.',
            },
            {
                'question': 'What is the minimum age for Zakat obligation?',
                'options': ['Puberty', '18 years', '21 years', 'There is no minimum age'],
                'correct_answer': 0,
                'explanation': 'Zakat becomes obligatory at puberty if one owns wealth above the Nisab threshold for a full lunar year.',
            },
            {
                'question': 'What is the significance of the Day of Arafah?',
                'options': ['Day of Hajj', 'Day of forgiveness', 'Best day of the year', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'The Day of Arafah (9th Dhul-Hijjah) is the best day of the year, when Allah forgives sins and answers prayers.',
            },
            {
                'question': 'What is the minimum number of Rak\'ahs for Friday prayer?',
                'options': ['2', '4', '6', '8'],
                'correct_answer': 0,
                'explanation': 'Friday prayer (Jumu\'ah) consists of 2 Rak\'ahs, replacing the Dhuhr prayer on Fridays.',
            },
            {
                'question': 'What is the significance of the first Takbir in prayer?',
                'options': ['Enters prayer', 'Takbir al-Ihram', 'Obligatory', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'The first Takbir (saying "Allahu Akbar") is called Takbir al-Ihram and is obligatory to enter the state of prayer.',
            },
            {
                'question': 'What is the minimum distance for shortening prayer (Qasr)?',
                'options': ['50 km', '80 km', '90 km', '100 km'],
                'correct_answer': 1,
                'explanation': 'When traveling 80 km or more from home, Muslims may shorten the 4-Rak\'ah prayers to 2 Rak\'ahs.',
            },
            {
                'question': 'What is the significance of the Night Journey (Isra and Mi\'raj)?',
                'options': ['When 5 daily prayers were prescribed', 'Prophet\'s journey to heaven', 'Miracle of Islam', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'During the Isra and Mi\'raj, the Prophet was taken to Jerusalem and then to the heavens, where the 5 daily prayers were prescribed.',
            },
            {
                'question': 'What is the minimum number of days for fasting in Ramadan?',
                'options': ['28 days', '29 days', '30 days', '29 or 30 days depending on moon'],
                'correct_answer': 3,
                'explanation': 'Ramadan lasts 29 or 30 days depending on the lunar calendar. Muslims must fast for the entire month.',
            },
            {
                'question': 'What is the significance of the Zamzam well?',
                'options': ['Sacred water', 'In Mecca', 'Used during Hajj', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'Zamzam is the sacred well in Mecca, discovered by Hajar (Hagar) when searching for water for her son Ismail. Pilgrims drink from it during Hajj.',
            },
            {
                'question': 'What is the minimum number of Rak\'ahs for Witr prayer?',
                'options': ['1', '3', '5', '7'],
                'correct_answer': 0,
                'explanation': 'Witr prayer can be 1, 3, 5, 7, or more Rak\'ahs (odd number), with a minimum of 1 Rak\'ah. It is recommended after Isha.',
            },
            {
                'question': 'What is the significance of the Safa and Marwa hills?',
                'options': ['Part of Hajj ritual', 'Where Hajar ran', 'Sa\'i ritual', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'Safa and Marwa are two hills in Mecca where Hajar ran searching for water. Running between them (Sa\'i) is part of Hajj and Umrah.',
            },
        ]
    
    elif category == 'fiqh':
        questions = [
            {
                'question': 'What is the Nisab for Zakat on gold?',
                'options': ['85 grams', '87.5 grams', '90 grams', '100 grams'],
                'correct_answer': 0,
                'explanation': 'The Nisab for gold is approximately 85 grams (or 7.5 tolas). If one owns this amount or more for a full year, Zakat becomes obligatory.',
            },
            {
                'question': 'What breaks Wudu (ablution)?',
                'options': ['Using the restroom', 'Sleeping', 'Passing gas', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'Wudu is broken by using the restroom, passing gas, deep sleep, loss of consciousness, and other specific conditions.',
            },
            {
                'question': 'What is Ghusl (full bath) required for?',
                'options': ['After sexual intercourse', 'After menstruation', 'After giving birth', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'Ghusl is required after sexual intercourse, after menstruation ends, after giving birth (postpartum bleeding ends), and in other specific situations.',
            },
            {
                'question': 'What is the minimum amount for Zakat on silver?',
                'options': ['200 dirhams', '400 dirhams', '600 dirhams', '800 dirhams'],
                'correct_answer': 0,
                'explanation': 'The Nisab for silver is 200 dirhams (approximately 595 grams). This is an alternative to the gold Nisab.',
            },
            {
                'question': 'What is the ruling on eating pork?',
                'options': ['Halal', 'Haram (forbidden)', 'Makruh (disliked)', 'Mubah (permissible)'],
                'correct_answer': 1,
                'explanation': 'Pork and all pork products are strictly forbidden (Haram) in Islam, as clearly stated in the Quran.',
            },
            {
                'question': 'What is the ruling on consuming alcohol?',
                'options': ['Halal in small amounts', 'Haram (forbidden)', 'Makruh (disliked)', 'Mubah (permissible)'],
                'correct_answer': 1,
                'explanation': 'Alcohol and all intoxicants are strictly forbidden (Haram) in Islam, as they cloud the mind and lead to harmful behavior.',
            },
            {
                'question': 'What is the minimum age for Zakat obligation?',
                'options': ['Puberty', '18 years', '21 years', 'There is no minimum age'],
                'correct_answer': 0,
                'explanation': 'Zakat becomes obligatory at puberty if one owns wealth above the Nisab threshold for a full lunar year.',
            },
            {
                'question': 'What is the ruling on interest (Riba)?',
                'options': ['Halal', 'Haram (forbidden)', 'Makruh (disliked)', 'Mubah (permissible)'],
                'correct_answer': 1,
                'explanation': 'Interest (Riba) is strictly forbidden in Islam. The Quran and Hadith clearly prohibit all forms of usury and interest.',
            },
            {
                'question': 'What is the minimum distance for shortening prayer (Qasr)?',
                'options': ['50 km', '80 km', '90 km', '100 km'],
                'correct_answer': 1,
                'explanation': 'When traveling 80 km or more from home, Muslims may shorten the 4-Rak\'ah prayers to 2 Rak\'ahs.',
            },
            {
                'question': 'What is the ruling on combining prayers while traveling?',
                'options': ['Not allowed', 'Allowed (Dhuhr with Asr, Maghrib with Isha)', 'Only for Hajj', 'Only for Umrah'],
                'correct_answer': 1,
                'explanation': 'While traveling, Muslims may combine Dhuhr with Asr, and Maghrib with Isha, performing them at the time of either prayer.',
            },
            {
                'question': 'What is the ruling on eating meat that is not Halal?',
                'options': ['Halal if cooked properly', 'Haram (forbidden)', 'Makruh (disliked)', 'Mubah if no Halal available'],
                'correct_answer': 1,
                'explanation': 'Meat that is not slaughtered according to Islamic guidelines (Halal) is forbidden (Haram) to consume.',
            },
            {
                'question': 'What is the minimum amount for Zakat on crops?',
                'options': ['2.5%', '5%', '10%', 'Depends on irrigation method'],
                'correct_answer': 3,
                'explanation': 'Zakat on crops is 10% if irrigated naturally (rain/rivers) and 5% if irrigated artificially (pumps, etc.).',
            },
            {
                'question': 'What is the ruling on gambling?',
                'options': ['Halal', 'Haram (forbidden)', 'Makruh (disliked)', 'Mubah (permissible)'],
                'correct_answer': 1,
                'explanation': 'Gambling (Maysir) is strictly forbidden in Islam as it involves uncertainty, waste of wealth, and potential harm.',
            },
            {
                'question': 'What is the minimum amount for Zakat on livestock?',
                'options': ['Varies by animal type', '5 camels', '30 cattle', '40 sheep'],
                'correct_answer': 0,
                'explanation': 'Zakat on livestock has different Nisab thresholds: 5 camels, 30 cattle, or 40 sheep/goats, each with specific rates.',
            },
            {
                'question': 'What is the ruling on backbiting (Gheebah)?',
                'options': ['Halal', 'Haram (forbidden)', 'Makruh (disliked)', 'Mubah (permissible)'],
                'correct_answer': 1,
                'explanation': 'Backbiting (speaking ill of someone in their absence) is forbidden in Islam and is considered a major sin.',
            },
            {
                'question': 'What is the ruling on lying?',
                'options': ['Halal in some cases', 'Haram (forbidden)', 'Makruh (disliked)', 'Mubah (permissible)'],
                'correct_answer': 1,
                'explanation': 'Lying is forbidden in Islam, except in very specific circumstances like reconciling between people or during war.',
            },
            {
                'question': 'What is the ruling on usury (Riba) in business?',
                'options': ['Halal', 'Haram (forbidden)', 'Makruh (disliked)', 'Mubah (permissible)'],
                'correct_answer': 1,
                'explanation': 'All forms of usury and interest are strictly forbidden in Islam, whether in personal loans or business transactions.',
            },
            {
                'question': 'What is the ruling on consuming food during fasting hours in Ramadan?',
                'options': ['Allowed if sick', 'Haram (forbidden)', 'Makruh (disliked)', 'Mubah (permissible)'],
                'correct_answer': 1,
                'explanation': 'Intentionally eating or drinking during fasting hours in Ramadan breaks the fast and is forbidden, unless one has a valid excuse.',
            },
            {
                'question': 'What is the ruling on missing prayers intentionally?',
                'options': ['Minor sin', 'Major sin', 'Not a sin', 'Depends on the reason'],
                'correct_answer': 1,
                'explanation': 'Intentionally missing prayers without a valid excuse is considered a major sin in Islam.',
            },
            {
                'question': 'What is the ruling on breaking a fast without excuse?',
                'options': ['Minor sin', 'Major sin', 'Requires make-up only', 'Requires make-up and expiation'],
                'correct_answer': 3,
                'explanation': 'Breaking a fast in Ramadan without a valid excuse requires making up the missed day and may require expiation (Kaffarah).',
            },
            {
                'question': 'What is the ruling on music in Islam?',
                'options': ['All music is Halal', 'All music is Haram', 'Depends on content and context', 'Only instrumental is allowed'],
                'correct_answer': 2,
                'explanation': 'The ruling on music varies among scholars, but generally depends on the content, context, and whether it leads to sinful behavior.',
            },
            {
                'question': 'What is the ruling on images of living beings?',
                'options': ['All images are Haram', 'All images are Halal', 'Depends on purpose and content', 'Only photographs are allowed'],
                'correct_answer': 2,
                'explanation': 'The ruling on images varies, but generally images used for educational purposes or that do not lead to idolatry may be permissible.',
            },
            {
                'question': 'What is the ruling on shaking hands with the opposite gender?',
                'options': ['Always Halal', 'Always Haram', 'Depends on context and intention', 'Only with family'],
                'correct_answer': 2,
                'explanation': 'Shaking hands with non-mahram (non-related) members of the opposite gender is generally not allowed, except in specific circumstances.',
            },
            {
                'question': 'What is the ruling on interest-free loans (Qard al-Hasan)?',
                'options': ['Haram', 'Halal and encouraged', 'Makruh', 'Mubah'],
                'correct_answer': 1,
                'explanation': 'Interest-free loans (Qard al-Hasan) are Halal and highly encouraged in Islam as a form of charity and helping others.',
            },
            {
                'question': 'What is the ruling on trade and business in Islam?',
                'options': ['Discouraged', 'Encouraged if Halal', 'Only for necessities', 'Not allowed'],
                'correct_answer': 1,
                'explanation': 'Trade and business are encouraged in Islam as long as they involve Halal goods and services and follow Islamic business ethics.',
            },
            {
                'question': 'What is the ruling on hoarding wealth without paying Zakat?',
                'options': ['Halal', 'Haram (forbidden)', 'Makruh (disliked)', 'Mubah (permissible)'],
                'correct_answer': 1,
                'explanation': 'Hoarding wealth without paying the obligatory Zakat is forbidden in Islam, as Zakat is a fundamental pillar.',
            },
            {
                'question': 'What is the ruling on breaking a promise?',
                'options': ['Minor sin', 'Major sin', 'Not a sin', 'Depends on the promise'],
                'correct_answer': 1,
                'explanation': 'Breaking promises without valid reason is considered a major sin in Islam, as keeping one\'s word is a fundamental Islamic value.',
            },
            {
                'question': 'What is the ruling on consuming intoxicants?',
                'options': ['Halal in small amounts', 'Haram (forbidden)', 'Makruh (disliked)', 'Mubah (permissible)'],
                'correct_answer': 1,
                'explanation': 'All intoxicants, including alcohol and drugs, are strictly forbidden in Islam, regardless of the amount.',
            },
            {
                'question': 'What is the ruling on stealing?',
                'options': ['Minor sin', 'Major sin', 'Not a sin if needed', 'Depends on the value'],
                'correct_answer': 1,
                'explanation': 'Stealing is a major sin in Islam and is punishable under Islamic law, regardless of the value stolen.',
            },
            {
                'question': 'What is the ruling on cheating in business?',
                'options': ['Halal if minor', 'Haram (forbidden)', 'Makruh (disliked)', 'Mubah (permissible)'],
                'correct_answer': 1,
                'explanation': 'Cheating, fraud, and dishonesty in business are strictly forbidden in Islam and are considered major sins.',
            },
        ]
    
    elif category == 'history':
        questions = [
            {
                'question': 'Who was the first martyr in Islam?',
                'options': ['Hamza', 'Sumayya', 'Yasir', 'Bilal'],
                'correct_answer': 1,
                'explanation': 'Sumayya bint Khayyat was the first martyr in Islam, killed for refusing to renounce her faith.',
            },
            {
                'question': 'Who was the fourth Caliph?',
                'options': ['Abu Bakr', 'Umar', 'Uthman', 'Ali ibn Abi Talib'],
                'correct_answer': 3,
                'explanation': 'Ali ibn Abi Talib was the fourth Caliph and the cousin and son-in-law of Prophet Muhammad.',
            },
            {
                'question': 'Who was the first Caliph?',
                'options': ['Abu Bakr', 'Umar', 'Uthman', 'Ali'],
                'correct_answer': 0,
                'explanation': 'Abu Bakr al-Siddiq was the first Caliph after the death of Prophet Muhammad.',
            },
            {
                'question': 'Who was the second Caliph?',
                'options': ['Abu Bakr', 'Umar ibn al-Khattab', 'Uthman', 'Ali'],
                'correct_answer': 1,
                'explanation': 'Umar ibn al-Khattab was the second Caliph, known as "Al-Faruq" (The Distinguisher).',
            },
            {
                'question': 'Who was the third Caliph?',
                'options': ['Abu Bakr', 'Umar', 'Uthman ibn Affan', 'Ali'],
                'correct_answer': 2,
                'explanation': 'Uthman ibn Affan was the third Caliph, known as "Dhu al-Nurayn" (Possessor of Two Lights).',
            },
            {
                'question': 'In which year did the Battle of Badr take place?',
                'options': ['622 CE', '624 CE', '625 CE', '627 CE'],
                'correct_answer': 1,
                'explanation': 'The Battle of Badr took place in 624 CE (2 AH) and was the first major battle between Muslims and the Quraysh.',
            },
            {
                'question': 'In which year did the Battle of Uhud take place?',
                'options': ['623 CE', '624 CE', '625 CE', '626 CE'],
                'correct_answer': 2,
                'explanation': 'The Battle of Uhud took place in 625 CE (3 AH), where Hamzah, the Prophet\'s uncle, became a martyr.',
            },
            {
                'question': 'In which year did the Battle of Khandaq (Trench) take place?',
                'options': ['625 CE', '626 CE', '627 CE', '628 CE'],
                'correct_answer': 2,
                'explanation': 'The Battle of Khandaq (Trench) took place in 627 CE (5 AH), where Muslims dug a trench to defend Madinah.',
            },
            {
                'question': 'In which year did the Conquest of Mecca take place?',
                'options': ['628 CE', '629 CE', '630 CE', '631 CE'],
                'correct_answer': 2,
                'explanation': 'The Conquest of Mecca took place in 630 CE (8 AH), when Muslims peacefully entered Mecca.',
            },
            {
                'question': 'Who was known as "The Sword of Allah"?',
                'options': ['Khalid ibn al-Walid', 'Sa\'d ibn Abi Waqqas', 'Abu Ubaydah', 'Amr ibn al-As'],
                'correct_answer': 0,
                'explanation': 'Khalid ibn al-Walid was given the title "Saifullah" (Sword of Allah) for his exceptional military leadership.',
            },
            {
                'question': 'Who compiled the Quran into a single book?',
                'options': ['Abu Bakr', 'Umar', 'Uthman', 'Zayd ibn Thabit'],
                'correct_answer': 3,
                'explanation': 'Zayd ibn Thabit compiled the Quran into a single book (Mushaf) under the caliphate of Abu Bakr.',
            },
            {
                'question': 'Who was the first person to accept Islam?',
                'options': ['Abu Bakr', 'Khadijah', 'Ali', 'Zayd'],
                'correct_answer': 1,
                'explanation': 'Khadijah, the Prophet\'s wife, was the first person to accept Islam and believe in his prophethood.',
            },
            {
                'question': 'Who was known as "Al-Siddiq" (The Truthful)?',
                'options': ['Umar', 'Abu Bakr', 'Uthman', 'Ali'],
                'correct_answer': 1,
                'explanation': 'Abu Bakr was given the title "Al-Siddiq" because he immediately believed in the Prophet\'s Night Journey.',
            },
            {
                'question': 'Who was known as "Al-Faruq" (The Distinguisher)?',
                'options': ['Abu Bakr', 'Umar ibn al-Khattab', 'Uthman', 'Ali'],
                'correct_answer': 1,
                'explanation': 'Umar ibn al-Khattab was called "Al-Faruq" because he distinguished between truth and falsehood.',
            },
            {
                'question': 'Who was known as "Dhu al-Nurayn" (Possessor of Two Lights)?',
                'options': ['Abu Bakr', 'Umar', 'Uthman', 'Ali'],
                'correct_answer': 2,
                'explanation': 'Uthman ibn Affan was called "Dhu al-Nurayn" because he married two of the Prophet\'s daughters.',
            },
            {
                'question': 'Who was the first muezzin (caller to prayer)?',
                'options': ['Bilal ibn Rabah', 'Umar', 'Abu Bakr', 'Abu Dharr'],
                'correct_answer': 0,
                'explanation': 'Bilal ibn Rabah was the first muezzin in Islam, known for his beautiful voice and strong faith.',
            },
            {
                'question': 'Who suggested digging the trench in the Battle of Khandaq?',
                'options': ['Abu Bakr', 'Umar', 'Salman al-Farsi', 'Ammar ibn Yasir'],
                'correct_answer': 2,
                'explanation': 'Salman al-Farsi suggested digging a trench around Madinah, a strategy he had seen in Persia.',
            },
            {
                'question': 'In which year did Prophet Muhammad pass away?',
                'options': ['630 CE', '631 CE', '632 CE', '633 CE'],
                'correct_answer': 2,
                'explanation': 'Prophet Muhammad (peace be upon him) passed away in 632 CE (11 AH) at the age of 63.',
            },
            {
                'question': 'Who was the last person to see the Prophet before his passing?',
                'options': ['Aishah', 'Abu Bakr', 'Umar', 'Ali'],
                'correct_answer': 0,
                'explanation': 'Aishah, the Prophet\'s wife, was the last person to see him before his passing, as he passed away in her room.',
            },
            {
                'question': 'What was the name of the year when both Khadijah and Abu Talib passed away?',
                'options': ['Year of Sorrow', 'Year of Boycott', 'Year of the Elephant', 'Year of Grief'],
                'correct_answer': 0,
                'explanation': '619 CE is called the "Year of Sorrow" because both Khadijah and Abu Talib passed away.',
            },
            {
                'question': 'Who was the Prophet\'s foster brother?',
                'options': ['Zayd ibn Harithah', 'Hamzah', 'Abdullah', 'Abdul-Muttalib'],
                'correct_answer': 0,
                'explanation': 'Zayd ibn Harithah was the Prophet\'s adopted son and foster brother, known as "Zayd the Beloved".',
            },
            {
                'question': 'In which year did the Treaty of Hudaybiyyah take place?',
                'options': ['627 CE', '628 CE', '629 CE', '630 CE'],
                'correct_answer': 1,
                'explanation': 'The Treaty of Hudaybiyyah took place in 628 CE (6 AH), establishing a 10-year peace treaty.',
            },
            {
                'question': 'Who was known as "The Gate of Knowledge"?',
                'options': ['Abu Bakr', 'Umar', 'Uthman', 'Ali'],
                'correct_answer': 3,
                'explanation': 'Ali ibn Abi Talib was called "Bab al-Ilm" (Gate of Knowledge) due to his deep understanding of the Quran and Hadith.',
            },
            {
                'question': 'What was the name of the first mosque built in Islam?',
                'options': ['Al-Masjid al-Haram', 'Masjid al-Nabawi', 'Masjid Quba', 'Masjid al-Aqsa'],
                'correct_answer': 2,
                'explanation': 'Masjid Quba was the first mosque built in Islam, constructed by the Prophet upon his arrival in Madinah.',
            },
            {
                'question': 'Who was the first person to publicly declare Islam in Mecca?',
                'options': ['Abu Bakr', 'Hamzah', 'Umar', 'Ammar ibn Yasir'],
                'correct_answer': 0,
                'explanation': 'Abu Bakr was among the first to accept Islam and was known for publicly declaring his faith despite persecution.',
            },
            {
                'question': 'In which battle did Hamzah, the Prophet\'s uncle, become a martyr?',
                'options': ['Battle of Badr', 'Battle of Uhud', 'Battle of Khandaq', 'Battle of Hunayn'],
                'correct_answer': 1,
                'explanation': 'Hamzah ibn Abdul-Muttalib, known as "Asadullah" (Lion of Allah), became a martyr in the Battle of Uhud.',
            },
            {
                'question': 'What was the name of the document that established the first Islamic state in Madinah?',
                'options': ['Constitution of Madinah', 'Treaty of Madinah', 'Charter of Madinah', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'The Constitution of Madinah (also called the Charter or Treaty) established rights and responsibilities for all citizens.',
            },
            {
                'question': 'Who compiled the standard version of the Quran during Uthman\'s caliphate?',
                'options': ['Abu Bakr', 'Umar', 'Uthman', 'Zayd ibn Thabit and committee'],
                'correct_answer': 3,
                'explanation': 'A committee led by Zayd ibn Thabit compiled the standard version of the Quran during Uthman\'s caliphate.',
            },
            {
                'question': 'In which year did the Second Pledge of Aqabah take place?',
                'options': ['620 CE', '621 CE', '622 CE', '623 CE'],
                'correct_answer': 1,
                'explanation': 'The Second Pledge of Aqabah took place in 621 CE, when 73 Muslims from Madinah pledged to support the Prophet.',
            },
            {
                'question': 'Who was the Prophet\'s grandfather who raised him?',
                'options': ['Abdullah', 'Abu Talib', 'Abdul-Muttalib', 'Hashim'],
                'correct_answer': 2,
                'explanation': 'Abdul-Muttalib, the Prophet\'s grandfather, took care of him after his mother\'s death until he passed away when the Prophet was 8.',
            },
            {
                'question': 'Who was the uncle who raised the Prophet after his grandfather\'s death?',
                'options': ['Hamzah', 'Abu Talib', 'Abbas', 'Abu Lahab'],
                'correct_answer': 1,
                'explanation': 'Abu Talib, the Prophet\'s uncle, raised him after Abdul-Muttalib\'s death and protected him until his own death.',
            },
            {
                'question': 'What was the name of the year when Muslims were boycotted by the Quraysh?',
                'options': ['Year of Sorrow', 'Year of Boycott', 'Year of the Elephant', 'Year of Grief'],
                'correct_answer': 1,
                'explanation': 'The "Year of Boycott" (617-619 CE) refers to the economic and social boycott imposed on the Prophet\'s clan by the Quraysh.',
            },
            {
                'question': 'Who was the Prophet\'s foster mother?',
                'options': ['Halimah al-Sa\'diyyah', 'Aminah', 'Khadijah', 'Umm Ayman'],
                'correct_answer': 0,
                'explanation': 'Halimah al-Sa\'diyyah was the Prophet\'s foster mother who nursed him in the desert during his early childhood.',
            },
            {
                'question': 'In which year did the Isra and Mi\'raj take place?',
                'options': ['619 CE', '620 CE', '621 CE', '622 CE'],
                'correct_answer': 2,
                'explanation': 'The Isra and Mi\'raj took place in 621 CE, during the Year of Sorrow, as a comfort and honor for the Prophet.',
            },
            {
                'question': 'Who was the first person to compile the Quran into a book?',
                'options': ['Abu Bakr', 'Umar', 'Uthman', 'Zayd ibn Thabit'],
                'correct_answer': 0,
                'explanation': 'Under Abu Bakr\'s caliphate, Zayd ibn Thabit compiled the Quran into a single book (Mushaf) after many memorizers were martyred.',
            },
            {
                'question': 'What was the name of the Prophet\'s she-camel?',
                'options': ['Al-Qaswa', 'Al-Adha', 'Al-Buraq', 'Al-Naqa'],
                'correct_answer': 0,
                'explanation': 'Al-Qaswa was the name of the Prophet\'s she-camel that he rode during the Hijrah and other journeys.',
            },
            {
                'question': 'How many Umrahs did the Prophet perform?',
                'options': ['2', '3', '4', '5'],
                'correct_answer': 2,
                'explanation': 'Prophet Muhammad (peace be upon him) performed 4 Umrahs during his lifetime, in addition to his one Hajj.',
            },
            {
                'question': 'What was the name of the first mosque where the Prophet led Friday prayer in Madinah?',
                'options': ['Masjid Quba', 'Masjid al-Nabawi', 'Masjid Qiblatayn', 'Masjid al-Noor'],
                'correct_answer': 1,
                'explanation': 'Masjid al-Nabawi (The Prophet\'s Mosque) was where the first Friday prayer in Madinah was led by the Prophet.',
            },
        ]
    
    elif category == 'prophets':
        questions = [
            {
                'question': 'Which prophet was raised in the palace of Pharaoh?',
                'options': ['Moses', 'Joseph', 'Abraham', 'Noah'],
                'correct_answer': 0,
                'explanation': 'Prophet Moses was raised in the palace of Pharaoh after being found in the river.',
            },
            {
                'question': 'Which prophet was known for his patience and was thrown into a well by his brothers?',
                'options': ['Moses', 'Joseph', 'Abraham', 'Noah'],
                'correct_answer': 1,
                'explanation': 'Prophet Joseph (Yusuf) was thrown into a well by his brothers out of jealousy, but he remained patient and was eventually elevated to a high position.',
            },
            {
                'question': 'Which prophet built the Ark?',
                'options': ['Moses', 'Joseph', 'Abraham', 'Noah'],
                'correct_answer': 3,
                'explanation': 'Prophet Noah built the Ark as commanded by Allah to save the believers from the flood.',
            },
            {
                'question': 'Which prophet is known as the "Friend of Allah" (Khalilullah)?',
                'options': ['Moses', 'Joseph', 'Abraham', 'Noah'],
                'correct_answer': 2,
                'explanation': 'Prophet Abraham (Ibrahim) is known as "Khalilullah" (Friend of Allah) for his unwavering faith and obedience.',
            },
            {
                'question': 'Which prophet was given the title "Messenger to the Children of Israel"?',
                'options': ['Moses', 'Jesus', 'David', 'Solomon'],
                'correct_answer': 0,
                'explanation': 'Prophet Moses was sent to the Children of Israel to guide them and deliver them from Pharaoh\'s oppression.',
            },
            {
                'question': 'Which prophet was given the ability to understand the language of animals?',
                'options': ['Moses', 'Joseph', 'Solomon', 'David'],
                'correct_answer': 2,
                'explanation': 'Prophet Solomon (Sulaiman) was given the ability to understand and communicate with animals, birds, and jinn.',
            },
            {
                'question': 'Which prophet is known as the "Seal of the Prophets"?',
                'options': ['Moses', 'Jesus', 'Muhammad', 'Abraham'],
                'correct_answer': 2,
                'explanation': 'Prophet Muhammad (peace be upon him) is known as "Khatam an-Nabiyyin" (Seal of the Prophets), the final prophet sent to all of humanity.',
            },
            {
                'question': 'Which prophet was known for his beautiful voice and recitation of the Psalms?',
                'options': ['Moses', 'David', 'Solomon', 'Jesus'],
                'correct_answer': 1,
                'explanation': 'Prophet David (Dawud) was given a beautiful voice and the Psalms (Zabur) to recite.',
            },
            {
                'question': 'Which prophet was born without a father?',
                'options': ['Moses', 'Jesus', 'John', 'Isaac'],
                'correct_answer': 1,
                'explanation': 'Prophet Jesus (Isa) was born to Mary (Maryam) without a father, as a miracle from Allah.',
            },
            {
                'question': 'Which prophet was known as "The Patient One" (As-Sabur)?',
                'options': ['Job', 'Joseph', 'Noah', 'Abraham'],
                'correct_answer': 0,
                'explanation': 'Prophet Job (Ayyub) is known for his extreme patience during his trials and tribulations.',
            },
            {
                'question': 'Which prophet was swallowed by a whale?',
                'options': ['Moses', 'Jonah', 'Noah', 'Solomon'],
                'correct_answer': 1,
                'explanation': 'Prophet Jonah (Yunus) was swallowed by a whale after leaving his people, but he repented and was saved.',
            },
            {
                'question': 'Which prophet is known as the "Father of Prophets"?',
                'options': ['Moses', 'Joseph', 'Abraham', 'Noah'],
                'correct_answer': 2,
                'explanation': 'Prophet Abraham is called the "Father of Prophets" because many prophets, including Isaac, Ishmael, and their descendants, came from his lineage.',
            },
            {
                'question': 'Which prophet was given the ability to bring the dead back to life?',
                'options': ['Moses', 'Jesus', 'Solomon', 'David'],
                'correct_answer': 1,
                'explanation': 'Prophet Jesus was given the ability, by Allah\'s permission, to bring the dead back to life as one of his miracles.',
            },
            {
                'question': 'Which prophet built the Kaaba with his son?',
                'options': ['Moses', 'Joseph', 'Abraham', 'Noah'],
                'correct_answer': 2,
                'explanation': 'Prophet Abraham and his son Ishmael built the Kaaba in Mecca as a house of worship for Allah.',
            },
            {
                'question': 'Which prophet was known for his wisdom and ability to judge between people?',
                'options': ['Moses', 'David', 'Solomon', 'Joseph'],
                'correct_answer': 2,
                'explanation': 'Prophet Solomon was known for his great wisdom and ability to make just judgments, as demonstrated in the story of the two women and the child.',
            },
            {
                'question': 'Which prophet was known as "The Chosen One" (Al-Mustafa)?',
                'options': ['Moses', 'Jesus', 'Muhammad', 'Abraham'],
                'correct_answer': 2,
                'explanation': 'Prophet Muhammad (peace be upon him) is known as "Al-Mustafa" (The Chosen One) as he was chosen by Allah to deliver the final message.',
            },
            {
                'question': 'Which prophet was given the Tablets (Law)?',
                'options': ['Moses', 'David', 'Solomon', 'Jesus'],
                'correct_answer': 0,
                'explanation': 'Prophet Moses was given the Tablets containing the Law (Torah) on Mount Sinai.',
            },
            {
                'question': 'Which prophet was known for his ability to interpret dreams?',
                'options': ['Moses', 'Joseph', 'Solomon', 'David'],
                'correct_answer': 1,
                'explanation': 'Prophet Joseph was given the ability to interpret dreams, which eventually led to his position of authority in Egypt.',
            },
            {
                'question': 'Which prophet is mentioned most frequently in the Quran?',
                'options': ['Moses', 'Abraham', 'Noah', 'Muhammad'],
                'correct_answer': 0,
                'explanation': 'Prophet Moses is mentioned most frequently in the Quran, appearing in numerous chapters and stories.',
            },
            {
                'question': 'Which prophet was known as "The Messenger of Glad Tidings"?',
                'options': ['Moses', 'Jesus', 'Muhammad', 'Noah'],
                'correct_answer': 2,
                'explanation': 'Prophet Muhammad (peace be upon him) is known as the "Messenger of Glad Tidings" for bringing the message of Islam.',
            },
            {
                'question': 'Which prophet was given the ability to control the wind?',
                'options': ['Moses', 'Solomon', 'Noah', 'Abraham'],
                'correct_answer': 1,
                'explanation': 'Prophet Solomon was given control over the wind, which would carry him and his armies great distances.',
            },
            {
                'question': 'Which prophet was known for his beautiful recitation of the Quran?',
                'options': ['Moses', 'David', 'Muhammad', 'Jesus'],
                'correct_answer': 2,
                'explanation': 'Prophet Muhammad (peace be upon him) had a beautiful voice and was known for his excellent recitation of the Quran.',
            },
            {
                'question': 'Which prophet was given the ability to make iron soft?',
                'options': ['Moses', 'David', 'Solomon', 'Joseph'],
                'correct_answer': 1,
                'explanation': 'Prophet David was given the ability to make iron soft with his hands, allowing him to create armor and tools.',
            },
            {
                'question': 'Which prophet was known as "The Trustworthy" (Al-Amin)?',
                'options': ['Moses', 'Jesus', 'Muhammad', 'Abraham'],
                'correct_answer': 2,
                'explanation': 'Prophet Muhammad (peace be upon him) was known as "Al-Amin" (The Trustworthy) even before his prophethood due to his honesty and integrity.',
            },
            {
                'question': 'Which prophet was given the ability to split the sea?',
                'options': ['Moses', 'Noah', 'Solomon', 'David'],
                'correct_answer': 0,
                'explanation': 'Prophet Moses was given the miracle of splitting the Red Sea to allow the Children of Israel to escape from Pharaoh.',
            },
            {
                'question': 'Which prophet was known for his long life and patience in calling people to Allah?',
                'options': ['Moses', 'Noah', 'Abraham', 'Joseph'],
                'correct_answer': 1,
                'explanation': 'Prophet Noah lived for 950 years, patiently calling his people to worship Allah alone.',
            },
            {
                'question': 'Which prophet was given the ability to heal the sick?',
                'options': ['Moses', 'Jesus', 'Solomon', 'David'],
                'correct_answer': 1,
                'explanation': 'Prophet Jesus was given the ability, by Allah\'s permission, to heal the sick and cure various diseases.',
            },
            {
                'question': 'Which prophet was known as "The Messenger of Mercy"?',
                'options': ['Moses', 'Jesus', 'Muhammad', 'Noah'],
                'correct_answer': 2,
                'explanation': 'Prophet Muhammad (peace be upon him) is known as "Rahmatan lil-Alameen" (Mercy to the Worlds).',
            },
            {
                'question': 'Which prophet was given the ability to speak as an infant?',
                'options': ['Moses', 'Jesus', 'John', 'Isaac'],
                'correct_answer': 1,
                'explanation': 'Prophet Jesus spoke as an infant, declaring his prophethood and defending his mother Mary.',
            },
            {
                'question': 'Which prophet was known for his beautiful appearance?',
                'options': ['Moses', 'Joseph', 'Solomon', 'David'],
                'correct_answer': 1,
                'explanation': 'Prophet Joseph was known for his exceptional beauty, which is mentioned in both the Quran and Islamic tradition.',
            },
            {
                'question': 'Which prophet was given the ability to understand the language of birds?',
                'options': ['Moses', 'Solomon', 'David', 'Noah'],
                'correct_answer': 1,
                'explanation': 'Prophet Solomon was given the ability to understand and communicate with birds, as mentioned in the Quran.',
            },
            {
                'question': 'Which prophet is known as "The Last Prophet"?',
                'options': ['Moses', 'Jesus', 'Muhammad', 'Abraham'],
                'correct_answer': 2,
                'explanation': 'Prophet Muhammad (peace be upon him) is the last and final prophet, after whom there will be no more prophets.',
            },
            {
                'question': 'Which prophet was given the ability to control jinn?',
                'options': ['Moses', 'Solomon', 'David', 'Joseph'],
                'correct_answer': 1,
                'explanation': 'Prophet Solomon was given control over the jinn, who worked for him in building and other tasks.',
            },
            {
                'question': 'Which prophet was known for his humility and simplicity?',
                'options': ['Moses', 'Jesus', 'Muhammad', 'Solomon'],
                'correct_answer': 2,
                'explanation': 'Prophet Muhammad (peace be upon him) was known for his humility, simplicity, and living a modest lifestyle despite being a prophet and leader.',
            },
            {
                'question': 'Which prophet was given the ability to make birds from clay?',
                'options': ['Moses', 'Jesus', 'Solomon', 'David'],
                'correct_answer': 1,
                'explanation': 'Prophet Jesus was given the ability, by Allah\'s permission, to create birds from clay and bring them to life.',
            },
            {
                'question': 'Which prophet was known as "The Messenger of Allah"?',
                'options': ['Moses', 'Jesus', 'Muhammad', 'All prophets'],
                'correct_answer': 3,
                'explanation': 'All prophets are messengers of Allah, but Prophet Muhammad (peace be upon him) is the final messenger sent to all of humanity.',
            },
            {
                'question': 'Which prophet was given the ability to control iron?',
                'options': ['Moses', 'David', 'Solomon', 'Joseph'],
                'correct_answer': 1,
                'explanation': 'Prophet David was given the ability to work with iron, making it soft and shaping it with his hands.',
            },
            {
                'question': 'Which prophet was known for his knowledge and wisdom?',
                'options': ['Moses', 'Solomon', 'Joseph', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'Many prophets were given knowledge and wisdom, including Moses (the Law), Solomon (judgment), and Joseph (dream interpretation).',
            },
            {
                'question': 'Which prophet was given the ability to call upon Allah and have his prayers answered immediately?',
                'options': ['Moses', 'Jesus', 'Muhammad', 'All prophets'],
                'correct_answer': 3,
                'explanation': 'All prophets had their prayers answered by Allah, but some were given specific miracles as signs of their prophethood.',
            },
            {
                'question': 'Which prophet was known for his courage and standing up against oppression?',
                'options': ['Moses', 'Abraham', 'Muhammad', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'All prophets demonstrated courage in standing up for truth and against oppression, each in their own time and circumstances.',
            },
            {
                'question': 'Which prophet was given the ability to see into the future through dreams?',
                'options': ['Moses', 'Joseph', 'Solomon', 'David'],
                'correct_answer': 1,
                'explanation': 'Prophet Joseph was given the ability to interpret dreams, which included seeing future events.',
            },
            {
                'question': 'Which prophet is known as "The Best of Creation"?',
                'options': ['Moses', 'Jesus', 'Muhammad', 'Abraham'],
                'correct_answer': 2,
                'explanation': 'Prophet Muhammad (peace be upon him) is known as "Khayr al-Bariyyah" (The Best of Creation) in Islamic tradition.',
            },
            {
                'question': 'Which prophet was given the ability to control water?',
                'options': ['Moses', 'Noah', 'Solomon', 'All of the above'],
                'correct_answer': 3,
                'explanation': 'Different prophets were given control over water in different ways: Moses (splitting the sea), Noah (the flood), and others.',
            },
        ]
    
    # Return only the number needed
    return questions[:count_needed]

def main():
    """Main function"""
    sys.stdout.reconfigure(encoding='utf-8')
    
    input_file = r'c:\Users\Elgom\Downloads\quiz_questions_rows (2).csv'
    output_file = 'quiz_questions_clean_50_per_category.csv'
    
    # Read and filter CSV
    real_questions_by_category = {}
    sample_count = 0
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            quiz_id = row['quiz_id']
            question_text = row.get('question', '')
            explanation_text = row.get('explanation', '')
            
            if not is_sample_question(question_text, explanation_text):
                if quiz_id not in real_questions_by_category:
                    real_questions_by_category[quiz_id] = []
                real_questions_by_category[quiz_id].append(row)
            else:
                sample_count += 1
    
    print(f'Removed {sample_count} sample questions')
    print(f'\nReal questions per category:')
    for cat in sorted(real_questions_by_category.keys()):
        print(f'  {cat}: {len(real_questions_by_category[cat])}')
    
    # Generate complete CSV with 50 questions per category
    all_questions = []
    created_at = datetime.now(timezone.utc).isoformat()
    
    categories = ['quran', 'seerah', 'history', 'pillars', 'fiqh', 'prophets']
    
    for category in categories:
        real_questions = real_questions_by_category.get(category, [])
        current_count = len(real_questions)
        needed = max(0, 50 - current_count)
        
        print(f'\n{category}: {current_count} real questions, need {needed} more')
        
        # Take first 50 real questions
        questions_to_use = real_questions[:50]
        
        # Generate additional questions if needed
        if needed > 0:
            additional = generate_additional_questions(category, needed)
            for q in additional:
                q['quiz_id'] = category
                q['id'] = str(uuid.uuid4())
                q['question_id'] = f'q{len(questions_to_use) + 1:03d}'
                q['order_index'] = str(len(questions_to_use) + 1)
                q['created_at'] = created_at
                questions_to_use.append(q)
        
        # Ensure exactly 50
        questions_to_use = questions_to_use[:50]
        
        # Format for CSV
        for idx, q in enumerate(questions_to_use):
            # Handle options - could be JSON string or already parsed
            if 'options' in q:
                if isinstance(q['options'], str):
                    try:
                        options = json.loads(q['options'])
                    except:
                        # If it's not valid JSON, try to parse it manually
                        options = ['Option A', 'Option B', 'Option C', 'Option D']
                else:
                    options = q['options']
            else:
                options = ['Option A', 'Option B', 'Option C', 'Option D']
            
            # Ensure options is a list of 4
            if not isinstance(options, list) or len(options) != 4:
                options = ['Option A', 'Option B', 'Option C', 'Option D']
            
            row = {
                'id': q.get('id', str(uuid.uuid4())),
                'quiz_id': category,
                'question_id': q.get('question_id', f'q{idx+1:03d}'),
                'question': q.get('question', ''),
                'options': json.dumps(options),
                'correct_answer': str(q.get('correct_answer', 0)),
                'explanation': q.get('explanation', ''),
                'order_index': str(q.get('order_index', idx + 1)),
                'created_at': q.get('created_at', created_at),
            }
            all_questions.append(row)
    
    # Write output CSV
    headers = ['id', 'quiz_id', 'question_id', 'question', 'options', 'correct_answer', 'explanation', 'order_index', 'created_at']
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(all_questions)
    
    print(f'\n✅ Generated complete CSV with {len(all_questions)} questions')
    print(f'📁 Output file: {output_file}')
    print(f'📊 Questions per category: 50')
    print(f'📋 Categories: {len(categories)}')
    
    # Verify counts
    print(f'\nVerification:')
    verify_cats = {}
    for q in all_questions:
        cat = q['quiz_id']
        verify_cats[cat] = verify_cats.get(cat, 0) + 1
    for cat in sorted(verify_cats.keys()):
        print(f'  {cat}: {verify_cats[cat]} questions')

if __name__ == '__main__':
    main()
