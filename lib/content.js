// Editorial content for the marketing site. Vehicle specifications are the publicly
// published figures for each system; company milestones are widely reported. Everything
// financial on this site is illustrative — see the disclaimer in the footer.

export const VEHICLES = [
  {
    id: 'falcon-9',
    eyebrow: 'Orbital-class · Reusable',
    name: 'Falcon 9',
    image: '/falcon9-launch.jpg',
    position: 'center',
    lede:
      'The first orbital-class rocket capable of reflight. Falcon 9 lands its first stage on land or on an autonomous droneship, refurbishes it, and flies it again — the single change that reset the cost of reaching orbit.',
    body:
      'Nine Merlin engines lift the vehicle off the pad; the same booster returns minutes later under its own power. Boosters have now flown well into the double digits individually, and the fleet sustains a launch cadence no other provider has matched.',
    specs: [
      ['Height', '70 m'],
      ['Diameter', '3.7 m'],
      ['Payload to LEO', '22,800 kg'],
      ['Payload to GTO', '8,300 kg'],
      ['First-stage engines', '9 × Merlin 1D'],
      ['First landing', 'December 2015'],
    ],
    linkTicker: 'FLCN9',
  },
  {
    id: 'falcon-heavy',
    eyebrow: 'Heavy lift · Triple core',
    name: 'Falcon Heavy',
    image: '/falcon-heavy-landing.jpg',
    position: 'center',
    lede:
      'Three Falcon 9 first stages bolted together — twenty-seven Merlin engines generating more than five million pounds of thrust at liftoff.',
    body:
      'On its debut the two side boosters returned to Cape Canaveral and touched down side by side, seconds apart. Falcon Heavy opens the heaviest commercial and national-security payloads, direct-to-GEO insertions, and interplanetary trajectories.',
    specs: [
      ['Height', '70 m'],
      ['Liftoff thrust', '5.1M lbf'],
      ['Payload to LEO', '63,800 kg'],
      ['Payload to Mars', '16,800 kg'],
      ['Engines', '27 × Merlin 1D'],
      ['First flight', 'February 2018'],
    ],
    linkTicker: 'FLCN9',
  },
  {
    id: 'dragon',
    eyebrow: 'Human spaceflight',
    name: 'Dragon',
    image: '/dragon-iss.jpg',
    position: 'center',
    lede:
      'The only American spacecraft currently flying astronauts to the International Space Station — and the first commercial vehicle in history to do it.',
    body:
      'Dragon carries up to seven crew, docks with the station autonomously, and returns to a water landing under parachutes. The cargo variant has resupplied the ISS since 2012. Private crewed missions now fly on the same airframe.',
    specs: [
      ['Crew capacity', 'Up to 7'],
      ['Trunk volume', '37 m³'],
      ['Return payload', '3,000 kg'],
      ['Docking', 'Fully autonomous'],
      ['First crewed flight', 'May 2020'],
      ['Reusability', 'Capsule reflown'],
    ],
    linkTicker: 'DRGN',
  },
  {
    id: 'starship',
    eyebrow: 'Fully reusable · Mars-capable',
    name: 'Starship',
    image: '/starship-ascent.jpg',
    position: 'center',
    lede:
      'The largest and most powerful launch vehicle ever built — and the first designed to be fully and rapidly reusable, booster and ship alike.',
    body:
      'Super Heavy lifts the stack with thirty-three Raptor engines, then returns to the launch site to be caught by the tower arms. Starship continues to orbit. Built from stainless steel and running on methalox — a propellant that can eventually be manufactured on Mars — it is the vehicle the entire Mars architecture depends on.',
    specs: [
      ['Stack height', '~121 m'],
      ['Booster engines', '33 × Raptor'],
      ['Payload to LEO', '100–150 t'],
      ['Propellant', 'Liquid methane / LOX'],
      ['Structure', 'Stainless steel'],
      ['Recovery', 'Tower catch'],
    ],
    linkTicker: 'STRSHP',
  },
];

export const STARLINK = {
  image: '/starlink-launch.jpg',
  stats: [
    ['Satellites in orbit', '7,000+'],
    ['Countries served', '100+'],
    ['Orbit altitude', '~550 km'],
    ['Typical latency', '20–40 ms'],
  ],
};

export const VISION_POINTS = [
  {
    n: '01',
    title: 'A backup drive for consciousness',
    copy:
      'The founding argument is risk management on a civilisational scale: life that exists on one planet can be ended by one event. Life on two planets cannot.',
  },
  {
    n: '02',
    title: 'A self-sustaining city',
    copy:
      'Not a flag and footprints — a city on Mars large enough to survive if resupply from Earth stopped entirely. The working figure has long been around a million people.',
  },
  {
    n: '03',
    title: 'Fly, land, refuel, repeat',
    copy:
      'The economics only close with full reuse and orbital refuelling. Launch windows to Mars open roughly every 26 months, so fleets must depart together.',
  },
  {
    n: '04',
    title: 'Make the propellant there',
    copy:
      'Methane and oxygen can be produced from Martian water and atmospheric CO₂. That is why Starship burns methalox and not the kerosene Falcon uses.',
  },
];

export const MILESTONES = [
  ['2002', 'Founded with the stated goal of reducing space transport cost and enabling Mars settlement.'],
  ['2008', 'Falcon 1 reaches orbit on its fourth attempt — the first privately developed liquid-fuel rocket to do so.'],
  ['2012', 'Dragon becomes the first commercial spacecraft to deliver cargo to the ISS.'],
  ['2015', 'Falcon 9 lands its first stage back at Cape Canaveral. Reuse stops being theoretical.'],
  ['2018', 'Falcon Heavy debuts; both side boosters land simultaneously.'],
  ['2020', 'Dragon carries NASA astronauts to orbit — the first crewed flight from U.S. soil in nine years.'],
  ['2021→', 'Starlink scales to thousands of satellites and millions of subscribers worldwide.'],
  ['Now', 'Starship flight testing continues toward orbital reuse, lunar landings and Mars.'],
];

export const THESIS = [
  {
    title: 'Access normally reserved for institutions',
    copy:
      'Private companies of this scale raise from venture funds, sovereign wealth and a short list of insiders. This platform models what fractional retail access to those same programs would look like.',
  },
  {
    title: 'Revenue that already exists',
    copy:
      'Launch services and Starlink subscriptions are real, recurring lines of business — not pre-revenue speculation. Cash from them funds the harder frontier work.',
  },
  {
    title: 'Optionality on the frontier',
    copy:
      'Starship and Mars are long-duration, high-variance bets. Holding them alongside cash-flow programs is how you carry that exposure without betting everything on it.',
  },
  {
    title: 'Exit paths',
    copy:
      'A Starlink separation has been discussed publicly for years and is the most-cited liquidity event for holders of this kind of exposure.',
  },
];

export const VALUATION_MARKS = [
  ['2019', 33],
  ['2020', 46],
  ['2021', 100],
  ['2022', 127],
  ['2023', 150],
  ['2024', 210],
  ['2025', 350],
];

export const FAQ = [
  {
    q: 'Is this affiliated with SpaceX?',
    a: 'No. SpaceX Invest is a fictional product built as a design prototype. It is not affiliated with, endorsed by, sponsored by or connected to Space Exploration Technologies Corp. in any way. All names, vehicles and marks referenced belong to their respective owners.',
  },
  {
    q: 'Is real money involved?',
    a: 'No. Your balance, deposits, withdrawals and holdings are simulated and stored only in your own browser. Nothing is transmitted anywhere, no securities are offered or sold, and no account can be funded with real currency.',
  },
  {
    q: 'Where do the figures come from?',
    a: 'Vehicle specifications are the publicly published numbers for each system. Company milestones are widely reported events. Every financial figure — projected returns, unit prices, round progress and valuation marks — is illustrative and generated for the demo.',
  },
  {
    q: 'Can I really invest in SpaceX this way?',
    a: 'Not here. In reality, exposure to private companies is generally limited to accredited or institutional investors through vehicles such as secondary marketplaces or SPVs, subject to strict eligibility rules. This site does not provide, arrange or facilitate any of that.',
  },
  {
    q: 'How do I reset my account?',
    a: 'Clearing site data for localhost in your browser resets the balance, holdings and transaction history back to the starting state.',
  },
];
