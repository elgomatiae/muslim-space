
# Islamic Quiz System Guide

## Overview
The Islamic Quiz system in the Muslim Lifestyle app provides users with randomized quizzes from a comprehensive question bank. Each quiz category contains over 100 questions, and when a user takes a quiz, 10 questions are randomly selected.

## Quiz Categories

All quiz categories now have **100 questions each**:

1. **Quran** - 100 questions about the Quran, its Surahs, verses, and teachings
2. **Hadith** - 100 questions about Hadith science, collections, and narrations
3. **Fiqh** - 100 questions about Islamic jurisprudence and rulings
4. **Islamic History** - 100 questions about Islamic history, battles, and dynasties
5. **Prophets** - 100 questions about the prophets mentioned in Islam
6. **Aqeedah** - 100 questions about Islamic creed and beliefs

## Question Difficulty Levels

Each question is categorized by difficulty:
- **Easy** (~30 questions per category): Basic knowledge questions
- **Medium** (~40 questions per category): Intermediate level questions
- **Hard** (~20 questions per category): Advanced knowledge questions

## How It Works

### For Users:
1. Navigate to the Learning tab
2. Select "Quizzes"
3. Choose a quiz category
4. The system randomly selects 10 questions from the 100+ available
5. Answer all questions
6. View results and earn Ilm points

### Random Selection Algorithm:
```typescript
// Fetch all questions for the category
const { data, error } = await supabase
  .from('quiz_questions')
  .select('*')
  .eq('category_id', categoryId)
  .eq('is_active', true);

// Randomly shuffle and select 10 questions
const shuffled = [...data].sort(() => Math.random() - 0.5);
const selected = shuffled.slice(0, 10);
```

## Database Structure

### Tables:
- **quiz_categories**: Stores quiz category information
- **quiz_questions**: Stores all quiz questions (600+ total)
- **user_quiz_attempts**: Tracks user quiz attempts
- **user_quiz_answers**: Stores individual answers for each attempt

### Quiz Questions Table Schema:
```sql
quiz_questions (
  id uuid PRIMARY KEY,
  category_id uuid REFERENCES quiz_categories(id),
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_answer text CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation text,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
)
```

## Features

### Current Features:
- ✅ Random selection of 10 questions per quiz
- ✅ 100+ questions per category
- ✅ Multiple difficulty levels
- ✅ Detailed explanations for each answer
- ✅ Progress tracking
- ✅ Score calculation and history
- ✅ Integration with Iman Tracker (Ilm ring)
- ✅ Beautiful UI with gradient cards
- ✅ Statistics tracking (average score, best score, attempts)

### Quiz Flow:
1. **Category Selection**: User selects a quiz category
2. **Question Loading**: System fetches and randomizes questions
3. **Quiz Taking**: User answers 10 questions one by one
4. **Answer Submission**: Each answer is validated
5. **Explanation Display**: Correct answer and explanation shown
6. **Results**: Final score, percentage, and time taken displayed
7. **Ilm Points**: User earns points for completing the quiz

## Iman Tracker Integration

Completing quizzes contributes to the **Ilm (Knowledge) Ring** in the Iman Tracker:
- Each quiz completion increments `ilm_weekly_quizzes_completed`
- Users can set weekly quiz goals
- Progress is tracked and displayed in the Iman Tracker

## Adding More Questions

To add more questions to any category:

1. **Via Supabase Dashboard**:
   - Navigate to the `quiz_questions` table
   - Click "Insert row"
   - Fill in all required fields
   - Set `is_active` to `true`

2. **Via SQL Migration**:
```sql
INSERT INTO quiz_questions (
  category_id, 
  question_text, 
  option_a, 
  option_b, 
  option_c, 
  option_d, 
  correct_answer, 
  explanation, 
  difficulty
) VALUES (
  (SELECT id FROM quiz_categories WHERE name = 'Quran' LIMIT 1),
  'Your question here?',
  'Option A',
  'Option B',
  'Option C',
  'Option D',
  'A',
  'Explanation here',
  'medium'
);
```

## Best Practices

### For Question Creation:
1. **Clear Questions**: Make questions clear and unambiguous
2. **Accurate Answers**: Ensure correct answers are verified
3. **Helpful Explanations**: Provide detailed explanations
4. **Balanced Difficulty**: Maintain a good mix of easy, medium, and hard questions
5. **Islamic Accuracy**: Verify all information with authentic Islamic sources

### For Admins:
1. Regularly review and update questions
2. Add new questions to maintain variety
3. Monitor user feedback on question quality
4. Ensure questions are appropriate for all difficulty levels
5. Keep explanations educational and beneficial

## Performance Considerations

- Questions are fetched once per quiz session
- Random selection happens client-side for better performance
- Results are saved to Supabase for tracking
- Caching can be implemented for frequently accessed categories

## Future Enhancements

Potential improvements:
- [ ] Timed quizzes with countdown
- [ ] Leaderboards for quiz scores
- [ ] Daily quiz challenges
- [ ] Quiz streaks and badges
- [ ] Multiplayer quiz competitions
- [ ] Category-specific achievements
- [ ] Question difficulty adaptation based on user performance
- [ ] Detailed analytics per question
- [ ] Community-submitted questions (with moderation)
- [ ] Quiz sharing and challenges with friends

## Troubleshooting

### Common Issues:

**Issue**: Quiz shows "Not Enough Questions"
- **Solution**: Ensure the category has at least 10 active questions

**Issue**: Same questions appearing frequently
- **Solution**: Add more questions to the category (100+ recommended)

**Issue**: Questions not loading
- **Solution**: Check Supabase connection and RLS policies

**Issue**: Scores not saving
- **Solution**: Verify user authentication and database permissions

## RLS Policies

Ensure proper Row Level Security policies are in place:

```sql
-- Users can view all active quiz questions
CREATE POLICY "Anyone can view active quiz questions"
ON quiz_questions FOR SELECT
USING (is_active = true);

-- Users can view their own quiz attempts
CREATE POLICY "Users can view own quiz attempts"
ON user_quiz_attempts FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own quiz attempts
CREATE POLICY "Users can insert own quiz attempts"
ON user_quiz_attempts FOR INSERT
WITH CHECK (user_id = auth.uid());
```

## Conclusion

The Islamic Quiz system provides an engaging way for users to test and improve their Islamic knowledge. With 600+ questions across 6 categories and random selection ensuring variety, users can take quizzes multiple times without repetition. The system integrates seamlessly with the Iman Tracker to encourage continuous learning.

For questions or support, refer to the main app documentation or contact the development team.
