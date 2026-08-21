import express from 'express';

const router = express.Router();

const COLLECTIONS = [
    // Cinematic Universes (Primary Franchise Hubs)
    {
        id: 'marvel',
        name: 'Marvel Cinematic Universe (MCU)',
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'Marvel',
        desc: 'Official canon timeline from Iron Man to Secret Wars across Phase 1 through Phase 6.',
        backdrop: 'https://image.tmdb.org/t/p/w780/by8z9Fe8y7p4jo2YlW2SZDnptyT.jpg',
        endpoint: 'marvel'
    },
    {
        id: 'dc',
        name: 'DC Universe & DCEU',
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'DC',
        desc: 'The Dark Knight Trilogy, Zack Snyder Justice League, The Batman, and DCU Chapter 1.',
        backdrop: 'https://image.tmdb.org/t/p/w780/IYUD7rAIXzBM91TT3Z5fILUS7n.jpg',
        endpoint: 'dc'
    },
    {
        id: 'starwars',
        name: 'Star Wars Galactic Universe',
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'Star Wars',
        desc: 'Complete Skywalker Saga (Episodes I–IX), Rogue One, The Mandalorian, and Ahsoka.',
        backdrop: 'https://image.tmdb.org/t/p/w780/9zcbqSxdsRMZWHYtyCd1nXPr2xq.jpg',
        endpoint: 'starwars'
    },
    {
        id: 'wizarding_world',
        name: 'Wizarding World (Harry Potter)',
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'Wizarding World',
        desc: 'The entire 8 Harry Potter films plus Fantastic Beasts prequel adventures.',
        backdrop: 'https://image.tmdb.org/t/p/w780/1XAC6RPT01UX9EQGy2JVn5c8pgy.jpg',
        endpoint: 'wizarding_world'
    },
    {
        id: 'monsterverse',
        name: 'Legendary MonsterVerse',
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'MonsterVerse',
        desc: 'Godzilla, Kong: Skull Island, King of the Monsters, Godzilla vs. Kong, and Hollow Earth.',
        backdrop: 'https://image.tmdb.org/t/p/w780/gvLG3Fnznkxl4SmYfcK8gUuqxM8.jpg',
        endpoint: 'monsterverse'
    },
    {
        id: 'middle_earth',
        name: 'Middle-earth (Lord of the Rings)',
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'Middle-earth',
        desc: 'The Lord of the Rings trilogy, The Hobbit adventures, and War of the Rohirrim.',
        backdrop: 'https://image.tmdb.org/t/p/w780/mWDdRXTivGE7aaY2vo1Ie0PfCX5.jpg',
        endpoint: 'middle_earth'
    },
    {
        id: 'spider_verse',
        name: "Sony's Spider-Man Universe & Spider-Verse",
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'Spider-Verse & SSU',
        desc: 'Into the Spider-Verse, Across the Spider-Verse, Venom trilogy, Morbius, and Kraven.',
        backdrop: 'https://image.tmdb.org/t/p/w780/kVd3a9YeLGkoeR50jGEXM6EqseS.jpg',
        endpoint: 'spider_verse'
    },
    {
        id: 'xmen',
        name: 'X-Men Mutant Universe',
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'X-Men',
        desc: 'Original X-Men Trilogy, First Class, Days of Future Past, Deadpool, and Logan.',
        backdrop: 'https://image.tmdb.org/t/p/w780/qTdCfGyDisY9e8BLycszlyTsPWx.jpg',
        endpoint: 'xmen'
    },
    {
        id: 'fast_and_furious',
        name: 'Fast & Furious (Fast Saga)',
        tag: 'FRANCHISE',
        category: 'universes',
        universe: 'Fast & Furious',
        desc: 'High-octane saga from The Fast and the Furious (2001) to Fast X and Hobbs & Shaw.',
        backdrop: 'https://image.tmdb.org/t/p/w780/4XM8DUTQb3lhLemJC51Jx4a2EuA.jpg',
        endpoint: 'fast_and_furious'
    },
    {
        id: 'john_wick',
        name: 'John Wick (High Table Universe)',
        tag: 'FRANCHISE',
        category: 'universes',
        universe: 'John Wick',
        desc: 'Baba Yaga action masterworks from Chapter 1 to Chapter 4, The Continental, and Ballerina.',
        backdrop: 'https://image.tmdb.org/t/p/w780/7I6VUdPj6tQECNHdviJkUHD2u89.jpg',
        endpoint: 'john_wick'
    },

    // OTT Platforms & Global Cinema
    {
        id: 'netflix',
        name: 'Netflix Originals & Blockbusters',
        tag: 'OTT NETWORK',
        category: 'platforms',
        desc: 'Award-winning Netflix originals, trending thriller series, and exclusive world cinema.',
        backdrop: 'https://image.tmdb.org/t/p/w780/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
        endpoint: 'netflix'
    },
    {
        id: 'prime',
        name: 'Amazon Prime Video Hits',
        tag: 'OTT NETWORK',
        category: 'platforms',
        desc: 'Prime exclusives, The Boys, Rings of Power, Fallout, and blockbuster movie premieres.',
        backdrop: 'https://image.tmdb.org/t/p/w780/n6vVs6z8obNbExdD3QHTr4Utu1Z.jpg',
        endpoint: 'prime'
    },
    {
        id: 'disney',
        name: 'Disney+ Vault',
        tag: 'OTT NETWORK',
        category: 'platforms',
        desc: 'Disney classics, Pixar animation masterpieces, and National Geographic.',
        backdrop: 'https://image.tmdb.org/t/p/w780/q3jHCb4dMfYF6ojikKuHd6LscxC.jpg',
        endpoint: 'disney'
    },
    {
        id: 'hbo',
        name: 'HBO Max & Warner Bros',
        tag: 'PREMIUM NETWORK',
        category: 'platforms',
        desc: 'Game of Thrones, House of the Dragon, The Last of Us, DC Universe, and Dune.',
        backdrop: 'https://image.tmdb.org/t/p/w780/577eXC8wFQT0eUrJcgznSiFPRmk.jpg',
        endpoint: 'hbo'
    },
    {
        id: 'appletv',
        name: 'Apple TV+ Exclusives',
        tag: 'PREMIUM STREAM',
        category: 'platforms',
        desc: 'Severance, Ted Lasso, Foundation, Silo, and high-budget sci-fi masterworks.',
        backdrop: 'https://image.tmdb.org/t/p/w780/ixgFmf1X59PUZam2qbAfskx2gQr.jpg',
        endpoint: 'appletv'
    },
    {
        id: 'anime_hub',
        name: 'Anime Mega-Vault (Shonen & Movies)',
        tag: 'ANIME & MANGA',
        category: 'world',
        desc: 'Demon Slayer, Jujutsu Kaisen, Attack on Titan, Solo Leveling, One Piece, Studio Ghibli.',
        backdrop: 'https://image.tmdb.org/t/p/w780/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg',
        endpoint: 'anime_hub'
    },
    {
        id: 'kdrama',
        name: 'Korean Wave (K-Drama & Thrillers)',
        tag: 'WORLD CINEMA',
        category: 'world',
        desc: 'Squid Game, Parasite, All of Us Are Dead, Train to Busan, and iconic K-Romance.',
        backdrop: 'https://image.tmdb.org/t/p/w780/2meX1nMdScFOoV4370rqHWKmXhY.jpg',
        endpoint: 'kdrama'
    },
    {
        id: 'bollywood',
        name: 'Bollywood & Pan-India Cinema',
        tag: 'PAN-INDIA HITS',
        category: 'world',
        desc: 'RRR, KGF, Bahubali, Jawan, Kalki 2898 AD, Salaar, and Indian action spectacles.',
        backdrop: 'https://image.tmdb.org/t/p/w780/i0Y0wP8H6SRgjr6QmuwbtQbS24D.jpg',
        endpoint: 'bollywood'
    }
];

router.get('/', (req, res) => {
    res.json(COLLECTIONS);
});

router.get('/:id', (req, res) => {
    const col = COLLECTIONS.find(c => c.id === req.params.id);
    if (!col) return res.status(404).json({ error: 'Collection not found' });
    res.json(col);
});

export default router;
