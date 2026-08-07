import type { ChapterMeta, ChapterId } from '@/types/question';

/**
 * The five chapters of "Life in the United Kingdom: A Guide for New Residents"
 * (3rd edition), with the section numbering used throughout the question bank.
 *
 * `examWeight` is the share of a 24-question mock. It follows the real test's
 * emphasis — history, modern society and government carry most of the paper —
 * rather than splitting evenly, which would make mocks unrepresentative.
 */
export const CHAPTERS: ChapterMeta[] = [
  {
    id: 1,
    title: 'The values and principles of the UK',
    shortTitle: 'Values & principles',
    blurb:
      'The fundamental principles of British life, what the citizenship pledge commits you to, and what you need before you can apply.',
    examWeight: 0.08,
    sections: [
      {
        id: '1.1',
        title: 'The values and principles of the UK',
        blurb:
          'Democracy, the rule of law, individual liberty, tolerance, and taking part in community life.',
      },
    ],
  },
  {
    id: 2,
    title: 'What is the UK?',
    shortTitle: 'What is the UK?',
    blurb:
      'The four nations, the Crown dependencies and overseas territories, and how they fit together.',
    examWeight: 0.08,
    sections: [
      {
        id: '2.1',
        title: 'What is the UK?',
        blurb: 'England, Scotland, Wales and Northern Ireland, and what "British Isles" covers.',
      },
    ],
  },
  {
    id: 3,
    title: 'A long and illustrious history',
    shortTitle: 'History',
    blurb:
      'From the Stone Age to the present day. The longest chapter in the handbook and the largest share of the test.',
    examWeight: 0.35,
    sections: [
      {
        id: '3.1',
        title: 'Early Britain',
        blurb: 'Stone Age to the Norman Conquest: Romans, Anglo-Saxons, Vikings, 1066.',
      },
      {
        id: '3.2',
        title: 'The Middle Ages',
        blurb:
          'Magna Carta, the Hundred Years War, the Black Death, the Wars of the Roses, early Parliament.',
      },
      {
        id: '3.3',
        title: 'The Tudors and Stuarts',
        blurb:
          'The Reformation, Elizabeth I, the Civil War, the Restoration and the Glorious Revolution.',
      },
      {
        id: '3.4',
        title: 'A global power',
        blurb:
          'The Union, the Enlightenment, the Industrial Revolution, the Empire and the abolition of slavery.',
      },
      {
        id: '3.5',
        title: 'The 20th century',
        blurb: 'The two World Wars, the vote for women, the Great Depression, the Blitz.',
      },
      {
        id: '3.6',
        title: 'Britain since 1945',
        blurb:
          'The welfare state and the NHS, immigration, decolonisation, the Troubles, devolution.',
      },
    ],
  },
  {
    id: 4,
    title: 'A modern, thriving society',
    shortTitle: 'Modern society',
    blurb:
      'The UK as it is now: its people, faiths, festivals, sport, arts, and the places worth visiting.',
    examWeight: 0.26,
    sections: [
      {
        id: '4.1',
        title: 'The UK today',
        blurb: 'Population, where people live, the census, and the languages spoken.',
      },
      {
        id: '4.2',
        title: 'Religion',
        blurb: 'Faiths practised in the UK, the Church of England, and patron saints.',
      },
      {
        id: '4.3',
        title: 'Customs and traditions',
        blurb: 'The festivals and holidays that shape the British calendar.',
      },
      {
        id: '4.4',
        title: 'Sport',
        blurb: 'Football, cricket, rugby, tennis, motor sport, and the Olympics.',
      },
      {
        id: '4.5',
        title: 'Arts and culture',
        blurb: 'Music, theatre, literature, film, architecture, fashion and design.',
      },
      {
        id: '4.6',
        title: 'Leisure',
        blurb: 'Gardening, food, film-going, pubs, and betting and gambling rules.',
      },
      {
        id: '4.7',
        title: 'Places of interest',
        blurb: 'National parks, UNESCO sites and landmarks across the four nations.',
      },
    ],
  },
  {
    id: 5,
    title: 'The UK government, the law and your role',
    shortTitle: 'Government & law',
    blurb:
      'How the country is run, the courts, the taxes you pay, and what is expected of you as a resident.',
    examWeight: 0.23,
    sections: [
      {
        id: '5.1',
        title: 'The development of British democracy',
        blurb: 'How the franchise widened from a narrow electorate to universal suffrage.',
      },
      {
        id: '5.2',
        title: 'The British constitution',
        blurb:
          'The monarchy, the two Houses of Parliament, the Prime Minister, and the devolved administrations.',
      },
      {
        id: '5.3',
        title: 'The government',
        blurb: 'Elections, the electoral register, MPs, the Cabinet, and the civil service.',
      },
      {
        id: '5.4',
        title: 'The UK and international institutions',
        blurb: 'The Commonwealth, the UN, NATO, and the Council of Europe.',
      },
      {
        id: '5.5',
        title: 'Respecting the law',
        blurb: 'Criminal and civil law, the courts, the police, and legal advice.',
      },
      {
        id: '5.6',
        title: 'Fundamental principles',
        blurb: 'Rights and responsibilities, equality law, and offences that are never tolerated.',
      },
      {
        id: '5.7',
        title: 'Taxation and money',
        blurb: 'Income Tax, National Insurance, Self Assessment, and the driving rules.',
      },
      {
        id: '5.8',
        title: 'Your role in the community',
        blurb: 'Volunteering, jury service, school governors, and looking after the environment.',
      },
    ],
  },
];

export const CHAPTER_IDS: ChapterId[] = [1, 2, 3, 4, 5];

export function getChapter(id: ChapterId): ChapterMeta {
  const chapter = CHAPTERS.find((c) => c.id === id);
  if (!chapter) throw new Error(`Unknown chapter: ${id}`);
  return chapter;
}

export function getSectionTitle(section: string): string {
  for (const chapter of CHAPTERS) {
    const match = chapter.sections.find((s) => s.id === section);
    if (match) return match.title;
  }
  return section;
}
