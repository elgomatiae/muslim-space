
// Around line 353, replace the score calculations with optional chaining:

const ibadahScore = typeof sectionScores?.ibadah === 'number' && !isNaN(sectionScores.ibadah) ? sectionScores.ibadah : 0;
const ilmScore = typeof sectionScores?.ilm === 'number' && !isNaN(sectionScores.ilm) ? sectionScores.ilm : 0;
const amanahScore = typeof sectionScores?.amanah === 'number' && !isNaN(sectionScores.amanah) ? sectionScores.amanah : 0;
