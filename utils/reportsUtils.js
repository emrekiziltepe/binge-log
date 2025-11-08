import { removeDuplicates } from './commonUtils';

// Format activity detail
export const formatActivityDetail = (activity, t) => {
  if (!activity) return '';
  
  if (activity.type === 'series' && activity.detail) {
    const parts = activity.detail.split(';');
    const formatted = parts.map(part => {
      const [season, ...episodeParts] = part.split(',');
      const episodes = episodeParts.join(',');
      
      if (episodes) {
        const episodeList = episodes.split(',')
          .map(ep => parseInt(ep.trim()))
          .filter(ep => !isNaN(ep))
          .sort((a, b) => a - b);
        
        if (episodeList.length === 0) {
          return `${t('activity.season')} ${season}`;
        }
        
        const ranges = [];
        let start = episodeList[0];
        let end = episodeList[0];
        
        for (let i = 1; i < episodeList.length; i++) {
          if (episodeList[i] === end + 1) {
            end = episodeList[i];
          } else {
            if (start === end) {
              ranges.push(start.toString());
            } else {
              ranges.push(`${start}-${end}`);
            }
            start = episodeList[i];
            end = episodeList[i];
          }
        }
        
        if (start === end) {
          ranges.push(start.toString());
        } else {
          ranges.push(`${start}-${end}`);
        }
        
        return `${t('activity.season')} ${season}, ${t('activity.episode')}: ${ranges.join(', ')}`;
      }
      return `${t('activity.season')} ${season}`;
    });
    return formatted.join(' | ');
  } else if (activity.type === 'book' && activity.detail) {
    return `${t('activity.pagesCount', { pages: activity.detail })}`;
  }
  return activity.detail || '';
};


