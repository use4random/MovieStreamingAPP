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
        backdrop: 'https://image.tmdb.org/t/p/w780/yF1eOAnYvKdsqRERdpUmFCeCvrR.jpg',
        endpoint: 'marvel'
    },
    {
        id: 'dc',
        name: 'DC Universe & DCEU',
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'DC',
        desc: 'The Dark Knight Trilogy, Zack Snyder Justice League, The Batman, and DCU Chapter 1.',
        backdrop: 'https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
        endpoint: 'dc'
    },
    {
        id: 'starwars',
        name: 'Star Wars Galactic Universe',
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'Star Wars',
        desc: 'Complete Skywalker Saga (Episodes I–IX), Rogue One, The Mandalorian, and Ahsoka.',
        backdrop: 'https://image.tmdb.org/t/p/w780/5Ih9mK3R4Wj7v5vFpZ9u6sR3S0P.jpg',
        endpoint: 'starwars'
    },
    {
        id: 'wizarding_world',
        name: 'Wizarding World (Harry Potter)',
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'Wizarding World',
        desc: 'The entire 8 Harry Potter films plus Fantastic Beasts prequel adventures.',
        backdrop: 'https://image.tmdb.org/t/p/w780/8f9dnOtpQZzp731kS8vJ9u6eW7P.jpg',
        endpoint: 'wizarding_world'
    },
    {
        id: 'monsterverse',
        name: 'Legendary MonsterVerse',
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'MonsterVerse',
        desc: 'Godzilla, Kong: Skull Island, King of the Monsters, Godzilla vs. Kong, and Hollow Earth.',
        backdrop: 'https://image.tmdb.org/t/p/w780/qrGtVF3YZvJqIauC19qZz8s9d6t.jpg',
        endpoint: 'monsterverse'
    },
    {
        id: 'middle_earth',
        name: 'Middle-earth (Lord of the Rings)',
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'Middle-earth',
        desc: 'The Lord of the Rings trilogy, The Hobbit adventures, and War of the Rohirrim.',
        backdrop: 'https://image.tmdb.org/t/p/w780/zW0v2YT74C69cuiefl8vxR7Rtuv.jpg',
        endpoint: 'middle_earth'
    },
    {
        id: 'spider_verse',
        name: "Sony's Spider-Man Universe & Spider-Verse",
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'Spider-Verse & SSU',
        desc: 'Into the Spider-Verse, Across the Spider-Verse, Venom trilogy, Morbius, and Kraven.',
        backdrop: 'https://image.tmdb.org/t/p/w780/e50914.jpg',
        endpoint: 'spider_verse'
    },
    {
        id: 'xmen',
        name: 'X-Men Mutant Universe',
        tag: 'UNIVERSE',
        category: 'universes',
        universe: 'X-Men',
        desc: 'Original X-Men Trilogy, First Class, Days of Future Past, Deadpool, and Logan.',
        backdrop: 'https://image.tmdb.org/t/p/w780/2u0pG8L4o4mZz5L0s4W.jpg',
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
        backdrop: 'https://image.tmdb.org/t/p/w780/7I6VUdPj6tQECNHdviJkUHD2f89.jpg',
        endpoint: 'john_wick'
    },

    // OTT Platforms & Global Cinema
    {
        id: 'netflix',
        name: 'Netflix Originals & Blockbusters',
        tag: 'OTT NETWORK',
        category: 'platforms',
        desc: 'Award-winning Netflix originals, trending thriller series, and exclusive world cinema.',
        backdrop: 'https://image.tmdb.org/t/p/w780/9faGSFi5jam6pDWGNd0P8Jez3v5.jpg',
        endpoint: 'netflix'
    },
    {
        id: 'prime',
        name: 'Amazon Prime Video Hits',
        tag: 'OTT NETWORK',
        category: 'platforms',
        desc: 'Prime exclusives, The Boys, Rings of Power, Fallout, and blockbuster movie premieres.',
        backdrop: 'https://image.tmdb.org/t/p/w780/muth4A1y2r82D6qC3v8Gg2Z3cE6.jpg',
        endpoint: 'prime'
    },
    {
        id: 'disney',
        name: 'Disney+ Vault',
        tag: 'OTT NETWORK',
        category: 'platforms',
        desc: 'Disney classics, Pixar animation masterpieces, and National Geographic.',
        backdrop: 'https://image.tmdb.org/t/p/w780/t5zCBSGu5xO5R4v8pMRYvuvIShl.jpg',
        endpoint: 'disney'
    },
    {
        id: 'hbo',
        name: 'HBO Max & Warner Bros',
        tag: 'PREMIUM NETWORK',
        category: 'platforms',
        desc: 'Game of Thrones, House of the Dragon, The Last of Us, DC Universe, and Dune.',
        backdrop: 'https://image.tmdb.org/t/p/w780/zW0v2YT74C69cuiefl8vxR7Rtuv.jpg',
        endpoint: 'hbo'
    },
    {
        id: 'appletv',
        name: 'Apple TV+ Exclusives',
        tag: 'PREMIUM STREAM',
        category: 'platforms',
        desc: 'Severance, Ted Lasso, Foundation, Silo, and high-budget sci-fi masterworks.',
        backdrop: 'https://image.tmdb.org/t/p/w780/vIjyK7jXG6k9B87F7hL2hT73cI4.jpg',
        endpoint: 'appletv'
    },
    {
        id: 'anime_hub',
        name: 'Anime Mega-Vault (Shonen & Movies)',
        tag: 'ANIME & MANGA',
        category: 'world',
        desc: 'Demon Slayer, Jujutsu Kaisen, Attack on Titan, Solo Leveling, One Piece, Studio Ghibli.',
        backdrop: 'https://image.tmdb.org/t/p/w780/mDfG3Y5Qn71e549y8xW9RjKkY1b.jpg',
        endpoint: 'anime_hub'
    },
    {
        id: 'kdrama',
        name: 'Korean Wave (K-Drama & Thrillers)',
        tag: 'WORLD CINEMA',
        category: 'world',
        desc: 'Squid Game, Parasite, All of Us Are Dead, Train to Busan, and iconic K-Romance.',
        backdrop: 'https://image.tmdb.org/t/p/w780/dKQAO5uH0uB7p7T7g0J8R9sP7G.jpg',
        endpoint: 'kdrama'
    },
    {
        id: 'bollywood',
        name: 'Bollywood & Pan-India Cinema',
        tag: 'PAN-INDIA HITS',
        category: 'world',
        desc: 'RRR, KGF, Bahubali, Jawan, Kalki 2898 AD, Salaar, and Indian action spectacles.',
        backdrop: 'https://image.tmdb.org/t/p/w780/8YFL5QQVPy3AgrEQxNYvsUmGI5P.jpg',
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
