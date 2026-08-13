/** Community post display constants (spec §16). */

export const POST_TYPE_LABELS = {
  announcement: 'Announcement',
  knowledge: 'Knowledge',
  career_advice: 'Career advice',
  event: 'Event',
  achievement: 'Achievement',
  opportunity: 'Opportunity',
  technical: 'Technical',
  study_tips: 'Study tips',
  alumni_experience: 'Alumni experience',
};

export const POST_TYPE_OPTIONS = Object.entries(POST_TYPE_LABELS).map(([value, label]) => ({ value, label }));
