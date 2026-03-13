export const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
export const EXTRAS  = '.,;:!?\'-/"@'.split('');

export const PRESETS = {
  'MessagEase Taps': 'aehinorst',
  'all':             LETTERS.join(''),
  'none':            '',
};

// Top 50 bigrams by frequency (Norvig/Mayzner, Google Books corpus)
export const BIGRAMS = [
  'th','he','in','er','an','re','on','at','en','nd',
  'ti','es','or','te','of','ed','is','it','al','ar',
  'st','to','nt','ng','se','ha','as','ou','io','le',
  've','co','me','de','hi','ri','ro','ic','ne','ea',
  'ra','ce','li','ch','ll','be','ma','si','om','ur',
];

// Top 50 trigrams by frequency (Norvig/Mayzner, Google Books corpus)
export const TRIGRAMS = [
  'the','and','ing','ion','tio','ent','ati','for','her','ter',
  'hat','tha','ere','ate','his','con','res','ver','all','ons',
  'nce','men','ith','ted','ers','pro','thi','wit','are','ess',
  'not','ive','was','ect','rea','com','eve','per','int','est',
  'sta','cti','ica','ist','ear','ain','one','our','iti','rat',
];
