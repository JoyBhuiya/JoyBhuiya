import type { Question } from '@/types/question';
import { bool, multi, single } from './helpers';

/** Chapter 4, part four — the remaining detail across the modern-society sections. */
export const questions: Question[] = [
  // ---- 4.1 ---------------------------------------------------------------
  single('q4-501', '4.1', 'The UK today', 'What proportion of the UK population lives in England?', ['About a quarter', 'About half', 'More than four fifths', 'About two thirds'], 2, 'England accounts for well over 80% of the UK population.'),
  bool('q4-502', '4.1', 'The UK today', 'The UK population includes people who describe themselves as having no religion.', true, 'A substantial and growing proportion of people report no religious affiliation.', 1),
  single('q4-503', '4.1', 'The UK today', 'When was the first census taken in the UK?', ['1801', '1851', '1901', '1951'], 0, 'The first census was taken in 1801 and one has been taken every ten years since, apart from during the Second World War.', 3),
  single('q4-504', '4.1', 'The UK today', 'What does an ageing population mean for the UK?', ['Greater demand on pensions, healthcare and social care', 'A shrinking economy overnight', 'Fewer schools are needed immediately', 'No practical effect'], 0, 'People living longer increases demand for pensions, healthcare and social care.'),

  // ---- 4.2 ---------------------------------------------------------------
  single('q4-521', '4.2', 'Religion', 'Which two saints’ days fall in the spring?', ['St David’s Day and St George’s Day', 'St Andrew’s Day and St Patrick’s Day', 'St George’s Day and St Andrew’s Day', 'St David’s Day and St Andrew’s Day'], 0, 'St David’s Day is 1 March and St George’s Day is 23 April; St Patrick’s Day is 17 March and St Andrew’s Day 30 November.', 3),
  bool('q4-522', '4.2', 'Religion', 'The Church of Scotland is Presbyterian rather than Anglican.', true, 'The Church of Scotland is a Presbyterian Church, governed by ministers and elders rather than bishops.'),
  single('q4-523', '4.2', 'Religion', 'Which faiths have long-established communities in the UK?', ['Christianity, Islam, Hinduism, Sikhism, Judaism and Buddhism', 'Christianity only', 'Christianity and Islam only', 'None besides Christianity'], 0, 'The UK is home to well-established communities of all these faiths, and to people of no faith.'),
  bool('q4-524', '4.2', 'Religion', 'Employers must generally make reasonable adjustments for religious observance where they can.', true, 'Equality law protects religion and belief, and unjustified discrimination is unlawful.', 3),

  // ---- 4.3 ---------------------------------------------------------------
  single('q4-541', '4.3', 'Customs and traditions', 'Which flower is associated with St David’s Day?', ['The daffodil', 'The rose', 'The thistle', 'The shamrock'], 0, 'The daffodil and the leek are both Welsh emblems worn on St David’s Day.'),
  single('q4-542', '4.3', 'Customs and traditions', 'Which plant is the emblem of Scotland?', ['The thistle', 'The rose', 'The daffodil', 'The shamrock'], 0, 'The thistle is Scotland’s national emblem.', 1),
  single('q4-543', '4.3', 'Customs and traditions', 'Which flower is the emblem of England?', ['The rose', 'The thistle', 'The daffodil', 'The shamrock'], 0, 'The rose is England’s national emblem, dating back to the Tudor rose.', 1),
  single('q4-544', '4.3', 'Customs and traditions', 'Which plant is the emblem of Northern Ireland?', ['The shamrock', 'The rose', 'The thistle', 'The daffodil'], 0, 'The shamrock is associated with Northern Ireland and with St Patrick.', 1),
  bool('q4-545', '4.3', 'Customs and traditions', 'There are public holidays at Christmas and Easter across the UK.', true, 'Christmas Day, Boxing Day and Good Friday are public holidays throughout the UK.', 1),
  single('q4-546', '4.3', 'Customs and traditions', 'What is the significance of 1 January in the UK?', ['New Year’s Day, a public holiday', 'The start of the tax year', 'A religious feast day', 'The date of the census'], 0, 'New Year’s Day is a public holiday. Scotland also has a holiday on 2 January.'),
  single('q4-547', '4.3', 'Customs and traditions', 'What happens on Remembrance Sunday?', ['Ceremonies are held at war memorials across the country', 'Fireworks are set off', 'Children go trick-or-treating', 'Pancakes are eaten'], 0, 'Wreaths are laid at war memorials, with the national ceremony held at the Cenotaph in Whitehall.'),

  // ---- 4.4 ---------------------------------------------------------------
  single('q4-561', '4.4', 'Sport', 'Which competition is contested by England, Scotland, Wales, Ireland, France and Italy?', ['The Six Nations', 'The Ashes', 'The Open', 'The Grand National'], 0, 'The Six Nations is the annual northern hemisphere rugby union championship.'),
  bool('q4-562', '4.4', 'Sport', 'Sport is an important part of British culture and there are many amateur clubs.', true, 'Amateur clubs and local leagues exist for most sports across the UK.', 1),
  single('q4-563', '4.4', 'Sport', 'Which two teams contest the Ashes?', ['England and Australia', 'England and India', 'England and South Africa', 'England and the West Indies'], 0, 'The Ashes is the Test series between England and Australia.', 1),
  single('q4-564', '4.4', 'Sport', 'Which UK city hosted the Commonwealth Games in 2014?', ['Glasgow', 'Manchester', 'Cardiff', 'Belfast'], 0, 'Glasgow hosted the Commonwealth Games in 2014; Manchester had hosted them in 2002.', 3),
  multi('q4-565', '4.4', 'Sport', 'Select the TWO tennis facts about Wimbledon.', ['It is played on grass', 'It is held in Manchester', 'It is the oldest tennis tournament in the world', 'It is played indoors only'], [0, 2], 'Wimbledon, held in London, is the oldest tennis tournament in the world and the only Grand Slam played on grass.'),

  // ---- 4.5 ---------------------------------------------------------------
  single('q4-581', '4.5', 'Arts and culture', 'What is the Mercury Music Prize awarded for?', ['The best album from the UK or Ireland', 'The best film', 'The best novel', 'The best play'], 0, 'The Mercury Prize is awarded annually for the best album released in the UK or Ireland.', 3),
  single('q4-582', '4.5', 'Arts and culture', 'Which museum in London holds one of the world’s great collections of art and antiquities?', ['The British Museum', 'The Science Museum', 'The Imperial War Museum', 'The Design Museum'], 0, 'The British Museum holds collections from cultures across the world and is free to enter.'),
  bool('q4-583', '4.5', 'Arts and culture', 'The National Gallery in London houses a major collection of European paintings.', true, 'The National Gallery in Trafalgar Square holds Western European paintings from the thirteenth to the twentieth century.'),
  single('q4-584', '4.5', 'Arts and culture', 'Which annual festival features music at Worthy Farm in Somerset?', ['Glastonbury', 'The Proms', 'The Edinburgh Fringe', 'Notting Hill Carnival'], 0, 'Glastonbury is one of the largest music festivals in the world.'),
  single('q4-585', '4.5', 'Arts and culture', 'What is the Notting Hill Carnival?', ['A Caribbean-led street festival held in London each August', 'A classical music season', 'A film festival', 'A literary festival in Wales'], 0, 'The Notting Hill Carnival is a major Caribbean street festival held in London over the August bank holiday.'),
  single('q4-586', '4.5', 'Arts and culture', 'Which poet laureate role exists in the UK?', ['A poet appointed to write for national occasions', 'A prize for young writers', 'A university professorship', 'A publishing award'], 0, 'The Poet Laureate is appointed to mark national occasions in verse.', 3),

  // ---- 4.6 ---------------------------------------------------------------
  single('q4-601', '4.6', 'Leisure', 'What is a "Sunday roast"?', ['A traditional meal of roast meat with vegetables', 'A market held on Sundays', 'A type of cake', 'A church service'], 0, 'The Sunday roast, typically beef, lamb or chicken with vegetables, is a long-standing British tradition.'),
  bool('q4-602', '4.6', 'Leisure', 'Many people in the UK take part in gardening, DIY and other home-based hobbies.', true, 'Gardening and home improvement are among the most popular leisure activities in the UK.', 1),
  single('q4-603', '4.6', 'Leisure', 'What is required to keep a dog in a public place in the UK?', ['It must wear a collar with the owner’s name and address', 'It must be muzzled at all times', 'It must be registered with the police', 'Nothing is required'], 0, 'Dogs in public must wear a collar showing the owner’s name and address, and must be microchipped.', 3),
  single('q4-604', '4.6', 'Leisure', 'What age must you be to gamble online or in a casino in the UK?', ['16', '18', '21', '25'], 1, 'You must be 18 or over to gamble, whether online, in a betting shop or in a casino.'),

  // ---- 4.7 ---------------------------------------------------------------
  single('q4-621', '4.7', 'Places of interest', 'Which is the highest mountain in England?', ['Scafell Pike', 'Ben Nevis', 'Snowdon', 'Helvellyn'], 0, 'Scafell Pike in the Lake District is the highest mountain in England.'),
  single('q4-622', '4.7', 'Places of interest', 'What are the Cotswolds known for?', ['Rolling hills and honey-coloured stone villages', 'Industrial heritage', 'Mountain ranges', 'Coastal cliffs'], 0, 'The Cotswolds is an Area of Outstanding Natural Beauty known for its limestone villages.', 3),
  bool('q4-623', '4.7', 'Places of interest', 'National parks in the UK are protected areas open to the public.', true, 'National parks are protected landscapes that people are free to visit and enjoy.', 1),
  single('q4-624', '4.7', 'Places of interest', 'Where is the Roman Baths visitor site?', ['Bath', 'York', 'Chester', 'Colchester'], 0, 'The Roman Baths in the city of Bath were built around natural hot springs.'),
  single('q4-625', '4.7', 'Places of interest', 'What can you visit at Stormont?', ['The Parliament Buildings of Northern Ireland', 'A Roman fort', 'A national park', 'A cathedral'], 0, 'Stormont in Belfast houses the Northern Ireland Assembly.'),
  multi('q4-626', '4.7', 'Places of interest', 'Select the TWO places found in Wales.', ['Snowdonia', 'The Lake District', 'The Senedd', 'Edinburgh Castle'], [0, 2], 'Snowdonia and the Senedd are in Wales. The Lake District is in England and Edinburgh Castle in Scotland.'),
];
