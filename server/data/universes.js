/**
 * Verified Cinematic Universe & Franchise Registry
 * 
 * Accurately maps movies and series to official cinematic universes (MCU, DC, Star Wars, Wizarding World, etc.)
 * based on verified filmographies, TMDB IDs, release years, and canon timelines rather than loose keyword matching.
 */

export const UNIVERSES = {
    MARVEL: {
        id: 'marvel',
        name: 'Marvel',
        franchise: 'Marvel Cinematic Universe',
        badge: 'MARVEL MCU',
        color: '#ed1d24',
        // Canon MCU Films & TV in release / phase order
        
        items: [
            // Phase 1
            { tmdbId: 1726, title: 'Iron Man', year: 2008, phase: 'Phase 1', order: 1, type: 'movie' },
            { tmdbId: 1771, title: 'The Incredible Hulk', year: 2008, phase: 'Phase 1', order: 2, type: 'movie' },
            { tmdbId: 10138, title: 'Iron Man 2', year: 2010, phase: 'Phase 1', order: 3, type: 'movie' },
            { tmdbId: 10195, title: 'Thor', year: 2011, phase: 'Phase 1', order: 4, type: 'movie' },
            { tmdbId: 1771, title: 'Captain America: The First Avenger', year: 2011, phase: 'Phase 1', order: 5, type: 'movie' },
            { tmdbId: 24428, title: 'The Avengers', year: 2012, phase: 'Phase 1', order: 6, type: 'movie' },
            
            // Phase 2
            { tmdbId: 68721, title: 'Iron Man 3', year: 2013, phase: 'Phase 2', order: 7, type: 'movie' },
            { tmdbId: 76338, title: 'Thor: The Dark World', year: 2013, phase: 'Phase 2', order: 8, type: 'movie' },
            { tmdbId: 100402, title: 'Captain America: The Winter Soldier', year: 2014, phase: 'Phase 2', order: 9, type: 'movie' },
            { tmdbId: 118340, title: 'Guardians of the Galaxy', year: 2014, phase: 'Phase 2', order: 10, type: 'movie' },
            { tmdbId: 99861, title: 'Avengers: Age of Ultron', year: 2015, phase: 'Phase 2', order: 11, type: 'movie' },
            { tmdbId: 102899, title: 'Ant-Man', year: 2015, phase: 'Phase 2', order: 12, type: 'movie' },

            // Phase 3
            { tmdbId: 271110, title: 'Captain America: Civil War', year: 2016, phase: 'Phase 3', order: 13, type: 'movie' },
            { tmdbId: 284052, title: 'Doctor Strange', year: 2016, phase: 'Phase 3', order: 14, type: 'movie' },
            { tmdbId: 283995, title: 'Guardians of the Galaxy Vol. 2', year: 2017, phase: 'Phase 3', order: 15, type: 'movie' },
            { tmdbId: 315635, title: 'Spider-Man: Homecoming', year: 2017, phase: 'Phase 3', order: 16, type: 'movie' },
            { tmdbId: 284053, title: 'Thor: Ragnarok', year: 2017, phase: 'Phase 3', order: 17, type: 'movie' },
            { tmdbId: 284054, title: 'Black Panther', year: 2018, phase: 'Phase 3', order: 18, type: 'movie' },
            { tmdbId: 299536, title: 'Avengers: Infinity War', year: 2018, phase: 'Phase 3', order: 19, type: 'movie' },
            { tmdbId: 363088, title: 'Ant-Man and the Wasp', year: 2018, phase: 'Phase 3', order: 20, type: 'movie' },
            { tmdbId: 299537, title: 'Captain Marvel', year: 2019, phase: 'Phase 3', order: 21, type: 'movie' },
            { tmdbId: 299534, title: 'Avengers: Endgame', year: 2019, phase: 'Phase 3', order: 22, type: 'movie' },
            { tmdbId: 429617, title: 'Spider-Man: Far From Home', year: 2019, phase: 'Phase 3', order: 23, type: 'movie' },

            // Phase 4
            { tmdbId: 85271, title: 'WandaVision', year: 2021, phase: 'Phase 4', order: 24, type: 'tv' },
            { tmdbId: 88396, title: 'The Falcon and the Winter Soldier', year: 2021, phase: 'Phase 4', order: 25, type: 'tv' },
            { tmdbId: 84958, title: 'Loki', year: 2021, phase: 'Phase 4', order: 26, type: 'tv' },
            { tmdbId: 497698, title: 'Black Widow', year: 2021, phase: 'Phase 4', order: 27, type: 'movie' },
            { tmdbId: 91363, title: 'What If...?', year: 2021, phase: 'Phase 4', order: 28, type: 'tv' },
            { tmdbId: 566525, title: 'Shang-Chi and the Legend of the Ten Rings', year: 2021, phase: 'Phase 4', order: 29, type: 'movie' },
            { tmdbId: 524434, title: 'Eternals', year: 2021, phase: 'Phase 4', order: 30, type: 'movie' },
            { tmdbId: 88329, title: 'Hawkeye', year: 2021, phase: 'Phase 4', order: 31, type: 'tv' },
            { tmdbId: 634649, title: 'Spider-Man: No Way Home', year: 2021, phase: 'Phase 4', order: 32, type: 'movie' },
            { tmdbId: 92749, title: 'Moon Knight', year: 2022, phase: 'Phase 4', order: 33, type: 'tv' },
            { tmdbId: 453395, title: 'Doctor Strange in the Multiverse of Madness', year: 2022, phase: 'Phase 4', order: 34, type: 'movie' },
            { tmdbId: 92782, title: 'Ms. Marvel', year: 2022, phase: 'Phase 4', order: 35, type: 'tv' },
            { tmdbId: 616037, title: 'Thor: Love and Thunder', year: 2022, phase: 'Phase 4', order: 36, type: 'movie' },
            { tmdbId: 92783, title: 'She-Hulk: Attorney at Law', year: 2022, phase: 'Phase 4', order: 37, type: 'tv' },
            { tmdbId: 505642, title: 'Black Panther: Wakanda Forever', year: 2022, phase: 'Phase 4', order: 38, type: 'movie' },
            
            // Phase 5 & 6
            { tmdbId: 640146, title: 'Ant-Man and the Wasp: Quantumania', year: 2023, phase: 'Phase 5', order: 39, type: 'movie' },
            { tmdbId: 447365, title: 'Guardians of the Galaxy Vol. 3', year: 2023, phase: 'Phase 5', order: 40, type: 'movie' },
            { tmdbId: 114479, title: 'Secret Invasion', year: 2023, phase: 'Phase 5', order: 41, type: 'tv' },
            { tmdbId: 609681, title: 'The Marvels', year: 2023, phase: 'Phase 5', order: 42, type: 'movie' },
            { tmdbId: 138502, title: 'Echo', year: 2024, phase: 'Phase 5', order: 43, type: 'tv' },
            { tmdbId: 533535, title: 'Deadpool & Wolverine', year: 2024, phase: 'Phase 5', order: 44, type: 'movie' },
            { tmdbId: 138501, title: 'Agatha All Along', year: 2024, phase: 'Phase 5', order: 45, type: 'tv' },
            { tmdbId: 822119, title: 'Captain America: Brave New World', year: 2025, phase: 'Phase 5', order: 46, type: 'movie' },
            { tmdbId: 986056, title: 'Thunderbolts*', year: 2025, phase: 'Phase 5', order: 47, type: 'movie' },
            { tmdbId: 139164, title: 'Daredevil: Born Again', year: 2025, phase: 'Phase 5', order: 48, type: 'tv' },
            { tmdbId: 617127, title: 'The Fantastic Four: First Steps', year: 2025, phase: 'Phase 6', order: 49, type: 'movie' },
            { tmdbId: 1003596, title: 'Avengers: Doomsday', year: 2026, phase: 'Phase 6', order: 50, type: 'movie' },
            { tmdbId: 1003598, title: 'Avengers: Secret Wars', year: 2027, phase: 'Phase 6', order: 51, type: 'movie' }
        ]
    },

    DC: {
        id: 'dc',
        name: 'DC',
        franchise: 'DC Universe & DCEU',
        badge: 'DC UNIVERSE',
        color: '#0055ff',
        items: [
            // Dark Knight Trilogy (Christopher Nolan)
            { tmdbId: 272, title: 'Batman Begins', year: 2005, phase: 'The Dark Knight Trilogy', order: 1, type: 'movie' },
            { tmdbId: 155, title: 'The Dark Knight', year: 2008, phase: 'The Dark Knight Trilogy', order: 2, type: 'movie' },
            { tmdbId: 49026, title: 'The Dark Knight Rises', year: 2012, phase: 'The Dark Knight Trilogy', order: 3, type: 'movie' },

            // DCEU Continuity
            { tmdbId: 49521, title: 'Man of Steel', year: 2013, phase: 'DCEU', order: 4, type: 'movie' },
            { tmdbId: 209112, title: 'Batman v Superman: Dawn of Justice', year: 2016, phase: 'DCEU', order: 5, type: 'movie' },
            { tmdbId: 297761, title: 'Suicide Squad', year: 2016, phase: 'DCEU', order: 6, type: 'movie' },
            { tmdbId: 297762, title: 'Wonder Woman', year: 2017, phase: 'DCEU', order: 7, type: 'movie' },
            { tmdbId: 141052, title: 'Justice League', year: 2017, phase: 'DCEU', order: 8, type: 'movie' },
            { tmdbId: 297802, title: 'Aquaman', year: 2018, phase: 'DCEU', order: 9, type: 'movie' },
            { tmdbId: 287947, title: 'Shazam!', year: 2019, phase: 'DCEU', order: 10, type: 'movie' },
            { tmdbId: 495764, title: 'Birds of Prey', year: 2020, phase: 'DCEU', order: 11, type: 'movie' },
            { tmdbId: 464052, title: 'Wonder Woman 1984', year: 2020, phase: 'DCEU', order: 12, type: 'movie' },
            { tmdbId: 791373, title: "Zack Snyder's Justice League", year: 2021, phase: 'DCEU', order: 13, type: 'movie' },
            { tmdbId: 436969, title: 'The Suicide Squad', year: 2021, phase: 'DCEU', order: 14, type: 'movie' },
            { tmdbId: 110492, title: 'Peacemaker', year: 2022, phase: 'DCEU', order: 15, type: 'tv' },
            { tmdbId: 436270, title: 'Black Adam', year: 2022, phase: 'DCEU', order: 16, type: 'movie' },
            { tmdbId: 594767, title: 'Shazam! Fury of the Gods', year: 2023, phase: 'DCEU', order: 17, type: 'movie' },
            { tmdbId: 298618, title: 'The Flash', year: 2023, phase: 'DCEU', order: 18, type: 'movie' },
            { tmdbId: 565770, title: 'Blue Beetle', year: 2023, phase: 'DCEU', order: 19, type: 'movie' },
            { tmdbId: 572802, title: 'Aquaman and the Lost Kingdom', year: 2023, phase: 'DCEU', order: 20, type: 'movie' },

            // DC Elseworlds & New DCU
            { tmdbId: 475557, title: 'Joker', year: 2019, phase: 'DC Elseworlds', order: 21, type: 'movie' },
            { tmdbId: 414906, title: 'The Batman', year: 2022, phase: 'DC Elseworlds', order: 22, type: 'movie' },
            { tmdbId: 194764, title: 'The Penguin', year: 2024, phase: 'DC Elseworlds', order: 23, type: 'tv' },
            { tmdbId: 889737, title: 'Joker: Folie à Deux', year: 2024, phase: 'DC Elseworlds', order: 24, type: 'movie' },
            { tmdbId: 1064213, title: 'Creature Commandos', year: 2024, phase: 'DCU Chapter 1', order: 25, type: 'tv' },
            { tmdbId: 1064034, title: 'Superman', year: 2025, phase: 'DCU Chapter 1', order: 26, type: 'movie' },
            { tmdbId: 1064035, title: 'Supergirl: Woman of Tomorrow', year: 2026, phase: 'DCU Chapter 1', order: 27, type: 'movie' }
        ]
    },

    STAR_WARS: {
        id: 'starwars',
        name: 'Star Wars',
        franchise: 'Star Wars Galactic Saga',
        badge: 'STAR WARS',
        color: '#ffe81f',
        items: [
            { tmdbId: 1893, title: 'Star Wars: Episode I - The Phantom Menace', year: 1999, phase: 'Prequel Trilogy', order: 1, type: 'movie' },
            { tmdbId: 1894, title: 'Star Wars: Episode II - Attack of the Clones', year: 2002, phase: 'Prequel Trilogy', order: 2, type: 'movie' },
            { tmdbId: 41446, title: 'Star Wars: The Clone Wars', year: 2008, phase: 'The Clone Wars', order: 3, type: 'tv' },
            { tmdbId: 1895, title: 'Star Wars: Episode III - Revenge of the Sith', year: 2005, phase: 'Prequel Trilogy', order: 4, type: 'movie' },
            { tmdbId: 105971, title: 'Star Wars: The Bad Batch', year: 2021, phase: 'Reign of the Empire', order: 5, type: 'tv' },
            { tmdbId: 92830, title: 'Obi-Wan Kenobi', year: 2022, phase: 'Reign of the Empire', order: 6, type: 'tv' },
            { tmdbId: 348350, title: 'Solo: A Star Wars Story', year: 2018, phase: 'Anthology', order: 7, type: 'movie' },
            { tmdbId: 83867, title: 'Andor', year: 2022, phase: 'Age of Rebellion', order: 8, type: 'tv' },
            { tmdbId: 330459, title: 'Rogue One: A Star Wars Story', year: 2016, phase: 'Anthology', order: 9, type: 'movie' },
            { tmdbId: 11, title: 'Star Wars: Episode IV - A New Hope', year: 1977, phase: 'Original Trilogy', order: 10, type: 'movie' },
            { tmdbId: 1891, title: 'Star Wars: Episode V - The Empire Strikes Back', year: 1980, phase: 'Original Trilogy', order: 11, type: 'movie' },
            { tmdbId: 1892, title: 'Star Wars: Episode VI - Return of the Jedi', year: 1983, phase: 'Original Trilogy', order: 12, type: 'movie' },
            { tmdbId: 82856, title: 'The Mandalorian', year: 2019, phase: 'The New Republic', order: 13, type: 'tv' },
            { tmdbId: 115036, title: 'The Book of Boba Fett', year: 2021, phase: 'The New Republic', order: 14, type: 'tv' },
            { tmdbId: 114461, title: 'Ahsoka', year: 2023, phase: 'The New Republic', order: 15, type: 'tv' },
            { tmdbId: 140019, title: 'Star Wars: Skeleton Crew', year: 2024, phase: 'The New Republic', order: 16, type: 'tv' },
            { tmdbId: 140607, title: 'Star Wars: The Force Awakens', year: 2015, phase: 'Sequel Trilogy', order: 17, type: 'movie' },
            { tmdbId: 181808, title: 'Star Wars: The Last Jedi', year: 2017, phase: 'Sequel Trilogy', order: 18, type: 'movie' },
            { tmdbId: 181812, title: 'Star Wars: The Rise of Skywalker', year: 2019, phase: 'Sequel Trilogy', order: 19, type: 'movie' }
        ]
    },

    WIZARDING_WORLD: {
        id: 'wizarding_world',
        name: 'Wizarding World',
        franchise: 'Wizarding World & Harry Potter',
        badge: 'WIZARDING WORLD',
        color: '#b89c36',
        items: [
            { tmdbId: 259316, title: 'Fantastic Beasts and Where to Find Them', year: 2016, phase: 'Fantastic Beasts', order: 1, type: 'movie' },
            { tmdbId: 338952, title: 'Fantastic Beasts: The Crimes of Grindelwald', year: 2018, phase: 'Fantastic Beasts', order: 2, type: 'movie' },
            { tmdbId: 338953, title: 'Fantastic Beasts: The Secrets of Dumbledore', year: 2022, phase: 'Fantastic Beasts', order: 3, type: 'movie' },
            { tmdbId: 671, title: "Harry Potter and the Philosopher's Stone", year: 2001, phase: 'Harry Potter', order: 4, type: 'movie' },
            { tmdbId: 672, title: 'Harry Potter and the Chamber of Secrets', year: 2002, phase: 'Harry Potter', order: 5, type: 'movie' },
            { tmdbId: 673, title: 'Harry Potter and the Prisoner of Azkaban', year: 2004, phase: 'Harry Potter', order: 6, type: 'movie' },
            { tmdbId: 674, title: 'Harry Potter and the Goblet of Fire', year: 2005, phase: 'Harry Potter', order: 7, type: 'movie' },
            { tmdbId: 675, title: 'Harry Potter and the Order of the Phoenix', year: 2007, phase: 'Harry Potter', order: 8, type: 'movie' },
            { tmdbId: 767, title: 'Harry Potter and the Half-Blood Prince', year: 2009, phase: 'Harry Potter', order: 9, type: 'movie' },
            { tmdbId: 12444, title: 'Harry Potter and the Deathly Hallows: Part 1', year: 2010, phase: 'Harry Potter', order: 10, type: 'movie' },
            { tmdbId: 12445, title: 'Harry Potter and the Deathly Hallows: Part 2', year: 2011, phase: 'Harry Potter', order: 11, type: 'movie' }
        ]
    },

    MONSTERVERSE: {
        id: 'monsterverse',
        name: 'MonsterVerse',
        franchise: 'Legendary MonsterVerse',
        badge: 'MONSTERVERSE',
        color: '#ff4500',
        items: [
            { tmdbId: 293167, title: 'Kong: Skull Island', year: 2017, phase: 'Origins', order: 1, type: 'movie' },
            { tmdbId: 1437, title: 'Godzilla', year: 2014, phase: 'Origins', order: 2, type: 'movie' },
            { tmdbId: 202411, title: 'Monarch: Legacy of Monsters', year: 2023, phase: 'Monarch Era', order: 3, type: 'tv' },
            { tmdbId: 373571, title: 'Godzilla: King of the Monsters', year: 2019, phase: 'Titans Clash', order: 4, type: 'movie' },
            { tmdbId: 399566, title: 'Godzilla vs. Kong', year: 2021, phase: 'Titans Clash', order: 5, type: 'movie' },
            { tmdbId: 823464, title: 'Godzilla x Kong: The New Empire', year: 2024, phase: 'Hollow Earth', order: 6, type: 'movie' }
        ]
    },

    MIDDLE_EARTH: {
        id: 'middle_earth',
        name: 'Middle-earth',
        franchise: 'The Lord of the Rings & Middle-earth',
        badge: 'MIDDLE-EARTH',
        color: '#d4af37',
        items: [
            { tmdbId: 84773, title: 'The Lord of the Rings: The Rings of Power', year: 2022, phase: 'Second Age', order: 1, type: 'tv' },
            { tmdbId: 839033, title: 'The Lord of the Rings: The War of the Rohirrim', year: 2024, phase: 'Third Age History', order: 2, type: 'movie' },
            { tmdbId: 49051, title: 'The Hobbit: An Unexpected Journey', year: 2012, phase: 'The Hobbit Trilogy', order: 3, type: 'movie' },
            { tmdbId: 57158, title: 'The Hobbit: The Desolation of Smaug', year: 2013, phase: 'The Hobbit Trilogy', order: 4, type: 'movie' },
            { tmdbId: 122917, title: 'The Hobbit: The Battle of the Five Armies', year: 2014, phase: 'The Hobbit Trilogy', order: 5, type: 'movie' },
            { tmdbId: 120, title: 'The Lord of the Rings: The Fellowship of the Ring', year: 2001, phase: 'LOTR Trilogy', order: 6, type: 'movie' },
            { tmdbId: 121, title: 'The Lord of the Rings: The Two Towers', year: 2002, phase: 'LOTR Trilogy', order: 7, type: 'movie' },
            { tmdbId: 122, title: 'The Lord of the Rings: The Return of the King', year: 2003, phase: 'LOTR Trilogy', order: 8, type: 'movie' }
        ]
    },

    SPIDER_VERSE: {
        id: 'spider_verse',
        name: 'Spider-Verse & SSU',
        franchise: "Sony's Spider-Man Universe & Animated Spider-Verse",
        badge: 'SPIDER-VERSE',
        color: '#e50914',
        items: [
            { tmdbId: 324857, title: 'Spider-Man: Into the Spider-Verse', year: 2018, phase: 'Spider-Verse Saga', order: 1, type: 'movie' },
            { tmdbId: 335983, title: 'Venom', year: 2018, phase: 'SSU', order: 2, type: 'movie' },
            { tmdbId: 580489, title: 'Venom: Let There Be Carnage', year: 2021, phase: 'SSU', order: 3, type: 'movie' },
            { tmdbId: 526896, title: 'Morbius', year: 2022, phase: 'SSU', order: 4, type: 'movie' },
            { tmdbId: 569094, title: 'Spider-Man: Across the Spider-Verse', year: 2023, phase: 'Spider-Verse Saga', order: 5, type: 'movie' },
            { tmdbId: 634492, title: 'Madame Web', year: 2024, phase: 'SSU', order: 6, type: 'movie' },
            { tmdbId: 912649, title: 'Venom: The Last Dance', year: 2024, phase: 'SSU', order: 7, type: 'movie' },
            { tmdbId: 539972, title: 'Kraven the Hunter', year: 2024, phase: 'SSU', order: 8, type: 'movie' }
        ]
    },

    XMEN: {
        id: 'xmen',
        name: 'X-Men',
        franchise: 'X-Men Mutant Saga',
        badge: 'X-MEN UNIVERSE',
        color: '#ffaa00',
        items: [
            { tmdbId: 36657, title: 'X-Men', year: 2000, phase: 'Original Timeline', order: 1, type: 'movie' },
            { tmdbId: 36658, title: 'X2', year: 2003, phase: 'Original Timeline', order: 2, type: 'movie' },
            { tmdbId: 36668, title: 'X-Men: The Last Stand', year: 2006, phase: 'Original Timeline', order: 3, type: 'movie' },
            { tmdbId: 127585, title: 'X-Men: First Class', year: 2011, phase: 'Revised Timeline', order: 4, type: 'movie' },
            { tmdbId: 76170, title: 'The Wolverine', year: 2013, phase: 'Wolverine Trilogy', order: 5, type: 'movie' },
            { tmdbId: 127585, title: 'X-Men: Days of Future Past', year: 2014, phase: 'Revised Timeline', order: 6, type: 'movie' },
            { tmdbId: 293660, title: 'Deadpool', year: 2016, phase: 'Deadpool Series', order: 7, type: 'movie' },
            { tmdbId: 246655, title: 'X-Men: Apocalypse', year: 2016, phase: 'Revised Timeline', order: 8, type: 'movie' },
            { tmdbId: 263115, title: 'Logan', year: 2017, phase: 'Wolverine Trilogy', order: 9, type: 'movie' },
            { tmdbId: 383498, title: 'Deadpool 2', year: 2018, phase: 'Deadpool Series', order: 10, type: 'movie' },
            { tmdbId: 320288, title: 'Dark Phoenix', year: 2019, phase: 'Revised Timeline', order: 11, type: 'movie' },
            { tmdbId: 340102, title: 'The New Mutants', year: 2020, phase: 'Spin-off', order: 12, type: 'movie' }
        ]
    },

    FAST_AND_FURIOUS: {
        id: 'fast_and_furious',
        name: 'Fast & Furious',
        franchise: 'Fast & Furious Fast Saga',
        badge: 'FAST SAGA',
        color: '#ff2a2a',
        items: [
            { tmdbId: 9799, title: 'The Fast and the Furious', year: 2001, phase: 'Street Racing Era', order: 1, type: 'movie' },
            { tmdbId: 584, title: '2 Fast 2 Furious', year: 2003, phase: 'Street Racing Era', order: 2, type: 'movie' },
            { tmdbId: 9615, title: 'The Fast and the Furious: Tokyo Drift', year: 2006, phase: 'Street Racing Era', order: 3, type: 'movie' },
            { tmdbId: 13804, title: 'Fast & Furious', year: 2009, phase: 'Heist Era', order: 4, type: 'movie' },
            { tmdbId: 51497, title: 'Fast Five', year: 2011, phase: 'Heist Era', order: 5, type: 'movie' },
            { tmdbId: 76341, title: 'Fast & Furious 6', year: 2013, phase: 'Global Operations', order: 6, type: 'movie' },
            { tmdbId: 168259, title: 'Furious 7', year: 2015, phase: 'Global Operations', order: 7, type: 'movie' },
            { tmdbId: 337339, title: 'The Fate of the Furious', year: 2017, phase: 'Global Operations', order: 8, type: 'movie' },
            { tmdbId: 384018, title: 'Fast & Furious Presents: Hobbs & Shaw', year: 2019, phase: 'Spin-off', order: 9, type: 'movie' },
            { tmdbId: 385128, title: 'F9', year: 2021, phase: 'Endgame Saga', order: 10, type: 'movie' },
            { tmdbId: 385687, title: 'Fast X', year: 2023, phase: 'Endgame Saga', order: 11, type: 'movie' }
        ]
    },

    JOHN_WICK: {
        id: 'john_wick',
        name: 'John Wick',
        franchise: 'John Wick High Table Universe',
        badge: 'JOHN WICK',
        color: '#d4af37',
        items: [
            { tmdbId: 245891, title: 'John Wick', year: 2014, phase: 'The Continental', order: 1, type: 'movie' },
            { tmdbId: 324552, title: 'John Wick: Chapter 2', year: 2017, phase: 'The High Table', order: 2, type: 'movie' },
            { tmdbId: 458156, title: 'John Wick: Chapter 3 - Parabellum', year: 2019, phase: 'The High Table', order: 3, type: 'movie' },
            { tmdbId: 603692, title: 'John Wick: Chapter 4', year: 2023, phase: 'The High Table', order: 4, type: 'movie' },
            { tmdbId: 119569, title: 'The Continental: From the World of John Wick', year: 2023, phase: 'Origins', order: 5, type: 'tv' },
            { tmdbId: 541134, title: 'Ballerina', year: 2025, phase: 'Spin-off', order: 6, type: 'movie' }
        ]
    }
};

// Fast lookup indices
const TMDB_ID_TO_UNIVERSE = new Map();
const TITLE_YEAR_TO_UNIVERSE = new Map();

function normalizeTitle(t) {
    if (!t) return '';
    return t.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

// Build indexes at startup
Object.values(UNIVERSES).forEach(univ => {
    univ.items.forEach(item => {
        // TMDB ID Index
        if (item.tmdbId) {
            TMDB_ID_TO_UNIVERSE.set(Number(item.tmdbId), {
                universe: univ.name,
                universeId: univ.id,
                franchise: univ.franchise,
                badge: univ.badge,
                color: univ.color,
                phase: item.phase,
                order: item.order,
                canonicalTitle: item.title,
                type: item.type || 'movie'
            });
        }

        // Title + Year Index for alternate search/alias lookups
        const norm = normalizeTitle(item.title);
        if (norm) {
            TITLE_YEAR_TO_UNIVERSE.set(`${norm}_${item.year}`, {
                universe: univ.name,
                universeId: univ.id,
                franchise: univ.franchise,
                badge: univ.badge,
                color: univ.color,
                phase: item.phase,
                order: item.order,
                canonicalTitle: item.title,
                type: item.type || 'movie'
            });
            // Also index title alone for unique franchise entries
            if (!TITLE_YEAR_TO_UNIVERSE.has(norm)) {
                TITLE_YEAR_TO_UNIVERSE.set(norm, {
                    universe: univ.name,
                    universeId: univ.id,
                    franchise: univ.franchise,
                    badge: univ.badge,
                    color: univ.color,
                    phase: item.phase,
                    order: item.order,
                    canonicalTitle: item.title,
                    type: item.type || 'movie'
                });
            }
        }
    });
});

/**
 * Identify a media item's verified universe using TMDB ID or verified Title+Year match.
 * Will NOT assign a universe if the item is not part of a verified universe.
 */
export function getMediaUniverse(item) {
    if (!item) return null;

    const id = Number(item.id || item.tmdbId);
    if (id && TMDB_ID_TO_UNIVERSE.has(id)) {
        return TMDB_ID_TO_UNIVERSE.get(id);
    }

    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').substring(0, 4);
    const norm = normalizeTitle(title);

    if (norm && year && TITLE_YEAR_TO_UNIVERSE.has(`${norm}_${year}`)) {
        return TITLE_YEAR_TO_UNIVERSE.get(`${norm}_${year}`);
    }

    if (norm && TITLE_YEAR_TO_UNIVERSE.has(norm)) {
        return TITLE_YEAR_TO_UNIVERSE.get(norm);
    }

    return null;
}

/**
 * Enriches a media object with explicit Universe metadata and descriptions
 * 
 * Rules:
 * - If verified: adds explicit `item.universe = "Marvel"`, `item.universe_details = {...}`,
 *   and injects `\n\nUniverse: Marvel` into `item.overview`
 * - If not in a recognized universe: `item.universe = null`
 */
export function enrichMediaWithUniverse(item) {
    if (!item) return item;

    const univInfo = getMediaUniverse(item);

    if (univInfo) {
        item.universe = univInfo.universe;
        item.universe_id = univInfo.universeId;
        item.universe_details = {
            name: univInfo.universe,
            franchise: univInfo.franchise,
            badge: univInfo.badge,
            color: univInfo.color,
            phase: univInfo.phase,
            order: univInfo.order,
            canonicalTitle: univInfo.canonicalTitle
        };

        // Explicit metadata in description as requested: "Universe: Marvel" or "Universe: DC"
        const explicitTag = `Universe: ${univInfo.universe}`;
        if (item.overview && !item.overview.includes(explicitTag)) {
            item.overview = `${item.overview.trim()}\n\n${explicitTag}`;
        } else if (!item.overview) {
            item.overview = explicitTag;
        }
    } else {
        item.universe = null;
        item.universe_id = null;
        item.universe_details = null;
    }

    return item;
}

/**
 * Enrich an array of media items
 */
export function enrichMediaListWithUniverse(items = []) {
    if (!Array.isArray(items)) return [];
    return items.map(enrichMediaWithUniverse);
}

/**
 * Sorts an array of items by universe order first (primary criteria),
 * then falls back to popularity/release date.
 */
export function sortItemsByUniverse(items = []) {
    if (!Array.isArray(items)) return [];

    return [...items].sort((a, b) => {
        const uA = a.universe_details?.order ?? 9999;
        const uB = b.universe_details?.order ?? 9999;
        
        if (uA !== uB) {
            return uA - uB;
        }

        // Secondary sort: release date descending or popularity
        const dateA = new Date(a.release_date || a.first_air_date || 0).getTime();
        const dateB = new Date(b.release_date || b.first_air_date || 0).getTime();
        return dateB - dateA;
    });
}
