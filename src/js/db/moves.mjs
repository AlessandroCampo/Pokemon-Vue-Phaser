import { allAnimations } from "./animations.mjs"

class Move {
    constructor({ name, type, category, power, accuracy, pp, makes_contact, description, animation, effects, priority, targets, sound, repetitions, crhit_ratio }) {
        this.name = name
        this.type = type
        this.category = category || 'Physical'
        this.power = power
        this.accuracy = accuracy || 100
        this.pp = pp
        this.makes_contact = makes_contact
        this.description = description || ''
        this.animation = animation || null
        this.effects = effects || null
        this.priority = priority || 1
        this.targets = targets || true
        this.sound = sound || null
        this.repetitions = repetitions || 1
        this.crhit_ratio = crhit_ratio || 1
    }
}

const bulletSeedHits = function () {
    // Define the probabilities and corresponding number of hits
    const probabilities = [3 / 8, 3 / 8, 1 / 8, 1 / 8];
    const hits = [2, 3, 4, 5];

    // Generate a random number between 0 and 1
    const rand = Math.random();

    // Calculate the cumulative probability
    let cumulativeProbability = 0;
    for (let i = 0;i < probabilities.length;i++) {
        cumulativeProbability += probabilities[i];
        if (rand < cumulativeProbability) {
            return hits[i]; // Return the corresponding number of hits
        }
    }

    // This line should never be reached, but just in case
    return hits[hits.length - 1];
}

// NORMAL TYPE MOVES

const tackle = new Move({
    name: 'Tackle',
    category: 'physical',
    type: 'normal',
    power: 40,
    accuracy: 100,
    pp: {
        max: 35,
        current: 35
    },
    makes_contact: true,
    animation: allAnimations.tackle_animation,
    description: 'A physical attack in which the user charges and slams into the target with its whole body.',
    effects: null
})

const pound = new Move({
    name: 'Pound',
    category: 'physical',
    type: 'normal',
    power: 40,
    accuracy: 100,
    pp: {
        max: 35,
        current: 35
    },
    makes_contact: true,
    animation: allAnimations.tackle_animation,
    description: 'The target is physically pounded with a long tail, a foreleg, or the like.',
    effects: null
})

const scratch = new Move({
    name: 'Scratch',
    category: 'physical',
    type: 'normal',
    power: 40,
    accuracy: 100,
    pp: {
        max: 35,
        current: 35
    },
    makes_contact: true,
    animation: null,
    description: 'Hard, pointed, sharp claws rake the target to inflict damage.',
    effects: null
})

const pay_day = new Move({
    name: 'Pay Day',
    category: 'physical',
    type: 'normal',
    power: 40,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: true,
    animation: null,
    description: 'Coins are hurled at the target to inflict damage. Money is earned after the battle.',
    effects: [{ type: 'earn_money', amount: 20 }]
})

const quick_attack = new Move({
    name: 'Quick Attack',
    category: 'physical',
    type: 'normal',
    power: 40,
    accuracy: 100,
    pp: {
        max: 30,
        current: 30
    },
    makes_contact: true,
    animation: allAnimations.tackle_animation,
    description: 'The user lunges at the target to inflict damage, moving at blinding speed. This move always goes first.',
    effects: null,
    priority: 2
})

const stomp = new Move({
    name: 'Stomp',
    category: 'physical',
    type: 'normal',
    power: 65,
    accuracy: 100,
    pp: {
        max: 25,
        current: 25
    },
    makes_contact: true,
    animation: null,
    description: 'The user attacks by stomping on the target with a big foot. This may also make the target flinch.',
    effects: [{ type: 'apply_flinch', applied_status: 'flinch', target: 'enemy', chance: 30 }]
})

const headbutt = new Move({
    name: 'Headbutt',
    category: 'physical',
    type: 'normal',
    power: 70,
    accuracy: 100,
    pp: {
        max: 25,
        current: 25
    },
    makes_contact: true,
    animation: null,
    description: 'The user sticks out its head and attacks by charging straight into the target. This may also make the target flinch.',
    effects: [{ type: 'apply_flinch', applied_status: 'flinch', target: 'enemy', chance: 30 }]
})

const take_down = new Move({
    name: 'Take Down',
    category: 'Physical',
    type: 'normal',
    power: 90,
    accuracy: 85,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: true,
    animation: null,
    description: 'A reckless full-body charge attack for slamming into the target. This also damages the user a little',
    effects: [{ type: 'recoil', amount: 0.25 }]
})

const growl = new Move({
    name: 'Growl',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 1000,
    pp: {
        max: 40,
        current: 40
    },
    makes_contact: false,
    animation: null,
    description: 'The user growls in an endearing way, making opposing Pokémon less wary. This lowers their Attack stats.',
    effects: [{ type: 'modify_stat', target_stat: 'atk', target: 'enemy', stages: -1, target_stat_label: 'attack' }]
})

const growth = new Move({
    name: 'Growth',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 1000,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The user’s body grows all at once, boosting the Attack and Sp. Atk stats.',
    effects: [{ type: 'modify_stat', target_stat: 'atk', target: 'ally', stages: +1, target_stat_label: 'attack' }, { type: 'modify_stat', target_stat: 'sp_atk', target: 'ally', stages: +1, target_stat_label: 'special attack' }]
})

const howl = new Move({
    name: 'Howl',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 1000,
    pp: {
        max: 40,
        current: 40
    },
    makes_contact: false,
    animation: null,
    description: 'The user howls loudly to rouse itself and its allies. This boosts their Attack stats.',
    effects: [{ type: 'modify_stat', target_stat: 'atk', target: 'ally', stages: +1, target_stat_label: 'attack' }]
})

const harden = new Move({
    name: 'Harden',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 1000,
    pp: {
        max: 30,
        current: 30
    },
    makes_contact: false,
    animation: null,
    description: 'The user stiffens all the muscles in its body to boost its Defense stat.',
    effects: [{ type: 'modify_stat', target_stat: 'def', target: 'ally', stages: +1, target_stat_label: 'defense' }]
})


const focus_energy = new Move({
    name: 'Focus Energy',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 100,
    pp: {
        max: 30,
        current: 30
    },
    makes_contact: false,
    animation: null,
    description: 'The user takes a deep breath and focuses so that its future attacks have a heightened chance of landing critical hits.',
    effects: [{ type: 'modify_stat', target_stat: 'crhit_chance', target: 'ally', stages: +1, target_stat_label: 'attack' }]
})

const leer = new Move({
    name: 'Leer',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 100,
    pp: {
        max: 30,
        current: 30
    },
    makes_contact: false,
    animation: null,
    description: 'The user gives opposing Pokémon an intimidating leer that lowers their Defense stats.',
    effects: [{ type: 'modify_stat', target_stat: 'def', target: 'enemy', stages: -1, target_stat_label: 'defense' }]
})

const tail_whip = new Move({
    name: 'Tail Whip',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 100,
    pp: {
        max: 30,
        current: 30
    },
    makes_contact: false,
    animation: null,
    description: 'The user wags its tail cutely, making opposing Pokémon less wary. This lowers their Defense stats.',
    effects: [{ type: 'modify_stat', target_stat: 'def', target: 'enemy', stages: -1, target_stat_label: 'defense' }]
})

const protect = new Move({
    name: 'Protect',
    category: 'status',
    type: 'fighting',
    power: null,
    accuracy: 100,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'This move enables the user to protect itself from all attacks. Its chance of failing rises if it is used in succession.',
    effects: [{ type: 'protect' }],
    priority: 4
})


const self_destruct = new Move({
    name: 'Self Destruct',
    category: 'physical',
    type: 'normal',
    power: 200,
    accuracy: 100,
    pp: {
        max: 5,
        current: 5
    },
    makes_contact: false,
    animation: null,
    description: 'The user attacks everything around it by causing an explosion. The user faints upon using this move.',
    effects: [{ type: 'self_faint' }]
})

const recover = new Move({
    name: 'Recover',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 200,
    pp: {
        max: 5,
        current: 5
    },
    makes_contact: false,
    animation: null,
    description: 'Restoring its own cells, the user restores its own HP by half of its max HP.',
    effects: [{ type: 'heal', amount: 0.5 }]
})


const dobule_team = new Move({
    name: 'Double Team',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 1000,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'By moving rapidly, the user makes illusory copies of itself to boost its evasiveness.',
    effects: [{ type: 'modify_stat', target_stat: 'evasion', target: 'ally', stages: +1, target_stat_label: 'evasiveness' }]
})

const minimize = new Move({
    name: 'Minimize',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 1000,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'The user compresses its body to make itself look smaller, which sharply boosts its evasiveness.',
    effects: [{ type: 'modify_stat', target_stat: 'evasion', target: 'ally', stages: +2, target_stat_label: 'evasiveness' }]
})

const smoke_screen = new Move({
    name: 'Smoke Screen',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 100,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'The user releases an obscuring cloud of smoke or ink. This lowers the target’s accuracy.',
    effects: [{ type: 'modify_stat', target_stat: 'accuracy', target: 'enemy', stages: -1, target_stat_label: 'accuracy' }]
})

const supersonic = new Move({

    name: 'Supersonic',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 55,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The user generates odd sound waves from its body that confuse the target.',
    effects: [{ type: 'apply_confusion', applied_status: 'confused', target: 'enemy', chance: 100 }]
})

const swagger = new Move({

    name: 'Swagger',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 85,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'The user enrages and confuses the target. However, this also sharply boosts the target’s Attack stat.',
    effects: [{ type: 'apply_confusion', applied_status: 'confused', target: 'enemy', chance: 100 }, { type: 'modify_stat', target_stat: 'atk', target: 'enemy', stages: +2, target_stat_label: 'attack' }]
})



const rock_climb = new Move({
    name: 'Rock Climb',
    category: 'physical',
    type: 'normal',
    power: 90,
    accuracy: 85,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The target is hit by a weak telekinetic force. This may also confuse the target.',
    effects: [{ type: 'apply_confusion', applied_status: 'confused', target: 'enemy', chance: 20 }]

})

const slash = new Move({
    name: 'Slash',
    category: 'physical',
    type: 'normal',
    power: 70,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: true,
    animation: null,
    description: 'The target is attacked with a slash of claws or blades. Critical hits land more easily.',
    effects: null,
    crhit_ratio: 3
})

const fury_swipes = new Move({
    name: 'Fury Swipes',
    category: 'physical',
    type: 'normal',
    power: 18,
    accuracy: 80,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: true,
    animation: null,
    description: 'The user attacks by raking the target with claws, scythes, or the like. This move hits two to five times in a row.',
    effects: null,
    repetitions: bulletSeedHits()
})

// WATERTYPE MOVES 
const water_gun = new Move({
    name: 'Water Gun',
    category: 'special',
    type: 'water',
    power: 40,
    accuracy: 100,
    pp: {
        max: 25,
        current: 25
    },
    makes_contact: false,
    animation: null,
    description: 'The target is blasted with a forceful shot of water.',

})

const brine = new Move({
    name: 'Brine',
    category: 'special',
    type: 'water',
    power: 65,
    accuracy: 100,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'This move’s power is doubled if the target’s HP is at half or less.',

})


const water_pulse = new Move({
    name: 'Water Pulse',
    category: 'special',
    type: 'water',
    power: 60,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The user attacks the target with a pulsing blast of water. This may also confuse the target.',
    effects: [{ type: 'apply_confusion', applied_status: 'confused', target: 'enemy', chance: 20 }]

})

const aqua_jet = new Move({
    name: 'Aqua Jet',
    category: 'physical',
    type: 'water',
    power: 40,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: true,
    animation: allAnimations.tackle_animation,
    description: 'The user lunges at the target to inflict damage, moving at blinding speed. This move always goes first.',
    effects: null,
    priority: 2
})

const bubble_beam = new Move({
    name: 'Bubble Beam',
    category: 'physical',
    type: 'water',
    power: 65,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'A spray of bubbles is forcefully ejected at the target. This may also lower the target’s Speed stat',
    effects: [{ type: 'modify_stat', target_stat: 'speed', target: 'enemy', stages: -1, target_stat_label: 'speed', chance: 10 }]
})

const withdraw = new Move({
    name: 'Withdraw',
    category: 'status',
    type: 'water',
    power: null,
    accuracy: 100,
    pp: {
        max: 40,
        current: 40
    },
    makes_contact: false,
    animation: null,
    description: 'The user withdraws its body into its hard shell, boosting its Defense stat.',
    effects: [{ type: 'modify_stat', target_stat: 'def', target: 'ally', stages: +1, target_stat_label: 'defense' }]
})

// FIRE TYPE MOVES

const flame_charge = new Move({
    name: 'Flame Charge',
    category: 'physical',
    type: 'fire',
    power: 50,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: true,
    animation: null,
    description: 'Cloaking itself in flame, the user attacks the target. Then, building up momentum, the user boosts its Speed stat.',
    effects: [{ type: 'modify_stat', target_stat: 'speed', target: 'ally', stages: +1, target_stat_label: 'speed', chance: 100 }]
})

const ember = new Move({
    name: 'Ember',
    category: 'special',
    type: 'fire',
    power: 40,
    accuracy: 100,
    pp: {
        max: 25,
        current: 25
    },
    makes_contact: false,
    animation: null,
    description: 'The target is attacked with small flames. This may also leave the target with a burn.',
    effects: [{ type: 'apply_status', applied_status: 'burned', target: 'enemy', chance: 10 }]

})

// GRASS TYPE

const leafage = new Move({
    name: 'Leafage',
    category: 'physical',
    type: 'grass',
    power: 40,
    accuracy: 100,
    pp: {
        max: 40,
        current: 40
    },
    makes_contact: false,
    animation: allAnimations.tackle_animation,
    description: 'The user attacks by pelting the target with leaves.',
    effects: null
})

const absorb = new Move({
    name: 'Absorb',
    category: 'special',
    type: 'grass',
    power: 20,
    accuracy: 100,
    pp: {
        max: 25,
        current: 25
    },
    makes_contact: false,
    animation: null,
    description: 'A nutrient-draining attack. The user’s HP is restored by up to half the damage taken by the target.',
    effects: [{ type: 'drain', target: 'ally', amount: 0.5 }]

})

const mega_drain = new Move({
    name: 'Mega Drain',
    category: 'special',
    type: 'grass',
    power: 40,
    accuracy: 100,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'A nutrient-draining attack. The user’s HP is restored by up to half the damage taken by the target.',
    effects: [{ type: 'drain', target: 'ally', amount: 0.5 }]

})

const giga_drain = new Move({
    name: 'Giga Drain',
    category: 'special',
    type: 'grass',
    power: 75,
    accuracy: 100,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'A nutrient-draining attack. The user’s HP is restored by up to half the damage taken by the target.',
    effects: [{ type: 'drain', target: 'ally', amount: 0.5 }]

})

const stun_spore = new Move({
    name: 'Stun Spore',
    category: 'status',
    type: 'grass',
    power: null,
    accuracy: 75,
    pp: {
        max: 30,
        current: 30
    },
    makes_contact: false,
    animation: null,
    description: 'The user scatters a cloud of numbing powder that paralyzes the target.',
    effects: [{ type: 'apply_status', applied_status: 'paralyzed', target: 'enemy', chance: 100 }]

})

const synthesis = new Move({
    name: 'Synthesis',
    category: 'status',
    type: 'grass',
    power: null,
    accuracy: 200,
    pp: {
        max: 5,
        current: 5
    },
    makes_contact: false,
    animation: null,
    description: 'The user restores its own HP. The amount of HP regained varies with the weather.',
    effects: [{ type: 'heal', amount: 0.25 }]
})


const bullet_seed = new Move({
    name: 'Bullet Seed',
    category: 'physical',
    type: 'grass',
    power: 25,
    accuracy: 100,
    pp: {
        max: 30,
        current: 30
    },
    makes_contact: false,
    animation: null,
    description: 'The user forcefully shoots seeds at the target two to five times in a row.',
    effects: null,
    repetitions: bulletSeedHits()
})

//PSYCHIC TYPE

const hypnosis = new Move({
    name: 'Hypnosis',
    category: 'status',
    type: 'psychic',
    power: null,
    accuracy: 60,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The user employs hypnotic suggestion to make the target fall asleep.',
    effects: [{ type: 'apply_status', applied_status: 'asleep', target: 'enemy', chance: 100 }]

})

const confusion = new Move({
    name: 'Confusion',
    category: 'special',
    type: 'psychic',
    power: 50,
    accuracy: 100,
    pp: {
        max: 25,
        current: 25
    },
    makes_contact: false,
    animation: null,
    description: 'The target is hit by a weak telekinetic force. This may also confuse the target.',
    effects: [{ type: 'apply_confusion', applied_status: 'confused', target: 'enemy', chance: 10 }]

})

const psychic = new Move({
    name: 'Psychic',
    category: 'special',
    type: 'psychic',
    power: 90,
    accuracy: 100,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'The target is hit with a strong telekinetic force to inflict damage. This may also lower the target’s Sp. Def stat.',
    effects: [{ type: 'apply_confusion', applied_status: 'confused', target: 'enemy', chance: 10 }]

})

const psybeam = new Move({
    name: 'Psybeam',
    category: 'special',
    type: 'psychic',
    power: 65,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The target is hit by a weak telekinetic force. This may also confuse the target.',
    effects: [{ type: 'apply_confusion', applied_status: 'confused', target: 'enemy', chance: 10 }]

})

const draining_kiss = new Move({
    name: 'Draining Kiss',
    category: 'special',
    type: 'psychic',
    power: 50,
    accuracy: 100,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'The user steals the target’s HP with a kiss. The user’s HP is restored by over half the damage taken by the target.',
    effects: [{ type: 'drain', target: 'ally', amount: 0.75 }]

})

const moonlight = new Move({
    name: 'Moonlight',
    category: 'status',
    type: 'psychic',
    power: null,
    accuracy: 200,
    pp: {
        max: 5,
        current: 5
    },
    makes_contact: false,
    animation: null,
    description: 'The user restores its own HP. The amount of HP regained varies with the weather.',
    effects: [{ type: 'heal', amount: 0.5 }]
})

// FIGHTINING TYPE MOVES

const seismic_toss = new Move({
    name: 'Seismic Toss',
    category: 'physical',
    type: 'fighting',
    power: 1,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: true,
    animation: null,
    description: 'The target is thrown using the power of gravity. It inflicts damage equal to the user’s level.',
    effects: null
})

const double_kick = new Move({
    name: 'Double Kick',
    category: 'physical',
    type: 'fighting',
    power: 30,
    accuracy: 100,
    pp: {
        max: 30,
        current: 30
    },
    makes_contact: true,
    animation: null,
    description: 'The user attacks by kicking the target twice in a row using two feet.',
    effects: null,
    repetitions: 2
})

const low_kick = new Move({
    name: 'Low Kick',
    category: 'physical',
    type: 'fighting',
    power: 1,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: true,
    animation: null,
    description: 'A powerful low kick that makes the target fall over. The heavier the target, the greater the move’s power',
    effects: null
})

const brick_break = new Move({
    name: 'Brick Break',
    category: 'physical',
    type: 'fighting',
    power: 75,
    accuracy: 100,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: true,
    animation: null,
    description: 'The user attacks with a swift chop. This move can also break barriers, such as Light Screen and Reflect.',
    effects: null
})


const detect = new Move({
    name: 'Detect',
    category: 'status',
    type: 'fighting',
    power: null,
    accuracy: 100,
    pp: {
        max: 5,
        current: 5
    },
    makes_contact: false,
    animation: null,
    description: 'This move enables the user to protect itself from all attacks. Its chance of failing rises if it is used in succession.',
    effects: [{ type: 'protect' }],
    priority: 4
})

const rock_smash = new Move({
    name: 'Rock Smash',
    category: 'physical',
    type: 'fighting',
    power: 40,
    accuracy: 100,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: true,
    animation: null,
    description: 'The user attacks with a punch that may lower the target’s Defense stat. It’s also one of the Pokétch’s hidden moves.',
    effects: [{ type: 'modify_stat', target_stat: 'def', target: 'enemy', stages: -1, target_stat_label: 'defense' }]
})

const bulk_up = new Move({
    name: 'Bulk Up',
    category: 'status',
    type: 'fighting',
    power: null,
    accuracy: 1000,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The user tenses its muscles to bulk up its body, boosting its Attack and Defense stats.',
    effects: [{ type: 'modify_stat', target_stat: 'def', target: 'ally', stages: +1, target_stat_label: 'defense' }, { type: 'modify_stat', target_stat: 'atk', target: 'ally', stages: +1, target_stat_label: 'attack' }]
})

// ELECTRIC MOVES

const thunder_wave = new Move({
    name: 'Thunder Wave',
    category: 'status',
    type: 'electric',
    power: null,
    accuracy: 90,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The user launches a weak jolt of electricity that paralyzes the target.',
    effects: [{ type: 'apply_status', applied_status: 'paralyzed', target: 'enemy', chance: 100 }]

})

const shock_wave = new Move({
    name: 'Shock Wave',
    category: 'special',
    type: 'electric',
    power: 60,
    accuracy: 1000,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The user strikes the target with a quick jolt of electricity. This attack never misses.',
    effects: null

})

//ROCK MOVES

const rock_trhow = new Move({
    name: 'Rock Throw',
    category: 'physical',
    type: 'rock',
    power: 50,
    accuracy: 90,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'The user picks up and throws a small rock at the target to attack.',
    effects: null
})

const rock_slide = new Move({
    name: 'Rock Slide',
    category: 'physical',
    type: 'rock',
    power: 50,
    accuracy: 90,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'Large boulders are hurled at opposing Pokémon to inflict damage. This may also make the opposing Pokémon flinch.',
    effects: [{ type: 'apply_flinch', applied_status: 'flinch', target: 'enemy', chance: 30 }]
})

const rock_tomb = new Move({
    name: 'Rock Tomb',
    category: 'physical',
    type: 'rock',
    power: 60,
    accuracy: 95,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'Boulders are hurled at the target. This also lowers the target’s Speed stat by preventing its movement.',
    effects: [{ type: 'modify_stat', target_stat: 'speed', target: 'enemy', stages: -1, target_stat_label: 'speed', chance: 100 }]
})

const rock_polish = new Move({
    name: 'Rock Polish',
    category: 'status',
    type: 'rock',
    power: null,
    accuracy: 1000,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The user polishes its body to reduce drag. This sharply boosts the user’s Speed stat.',
    effects: [{ type: 'modify_stat', target_stat: 'speed', target: 'ally', stages: +2, target_stat_label: 'speed' }],
})


//GROUND TYPE MOVES


const sand_attack = new Move({
    name: 'Sand Attack',
    category: 'status',
    type: 'groundd',
    power: null,
    accuracy: 100,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'Sand is hurled in the target’s face, lowering the target’s accuracy.',
    effects: [{ type: 'modify_stat', target_stat: 'accuracy', target: 'enemy', stages: -1, target_stat_label: 'accuracy' }]
})

const mud_shot = new Move({
    name: 'Mud Shot',
    category: 'physical',
    type: 'ground',
    power: 55,
    accuracy: 95,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'The user attacks by hurling a blob of mud at the target. This also lowers the target’s Speed stat.',
    effects: [{ type: 'modify_stat', target_stat: 'speed', target: 'enemy', stages: -1, target_stat_label: 'speed', chance: 100 }]
})

const bulldoze = new Move({
    name: 'Bulldoze',
    category: 'physical',
    type: 'ground',
    power: 60,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The user strikes everything around it by stomping down on the ground. This lowers the Speed stats of those hit.',
    effects: [{ type: 'modify_stat', target_stat: 'speed', target: 'enemy', stages: -1, target_stat_label: 'speed', chance: 100 }]
})





// ICE MOVES 

const ice_beam = new Move({
    name: 'Ice Beam',
    category: 'special',
    type: 'ice',
    power: 90,
    accuracy: 100,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'The target is struck with an icy-cold beam of energy. This may also leave the target frozen.',
    effects: [{ type: 'apply_status', applied_status: 'frozen', target: 'enemy', chance: 100 }]

})

const powder_snow = new Move({
    name: 'Powder Snow',
    category: 'special',
    type: 'ice',
    power: 40,
    accuracy: 100,
    pp: {
        max: 25,
        current: 25
    },
    makes_contact: false,
    animation: null,
    description: 'The user attacks with a chilling gust of powdery snow. This may also leave opposing Pokémon frozen.',
    effects: [{ type: 'apply_status', applied_status: 'frozen', target: 'enemy', chance: 10 }]

})


const ice_fang = new Move({
    name: 'Ice Fang',
    category: 'physical',
    type: 'ice',
    power: 65,
    accuracy: 95,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'The user bites with cold-infused fangs. This may also make the target flinch or leave it frozen.',
    effects: [{ type: 'apply_status', applied_status: 'frozen', target: 'enemy', chance: 10 }, { type: 'apply_flinch', applied_status: 'flinch', target: 'enemy', chance: 10 }]

})

const icy_wind = new Move({
    name: 'Icy Wind',
    category: 'special',
    type: 'ice',
    power: 55,
    accuracy: 95,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'The user attacks with a gust of chilled air. This also lowers opposing Pokémon’s Speed stats',
    effects: [{ type: 'modify_stat', target_stat: 'speed', target: 'enemy', stages: -1, target_stat_label: 'speed', chance: 100 }]

})

const frost_breath = new Move({
    name: 'Frost Breath',
    category: 'special',
    type: 'ice',
    power: 60,
    accuracy: 90,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'The user attacks by blowing its cold breath on the target. This move always lands a critical hit.',
    effects: null,
    crhit_ratio: 1000
})

// POISON  MOVES

const sludge_bomb = new Move({
    name: 'Sludge Bomb',
    category: 'special',
    type: 'poison',
    power: 90,
    accuracy: 100,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'Unsanitary sludge is hurled at the target. This may also poison the target.',
    effects: [{ type: 'apply_status', applied_status: 'poisoned', target: 'enemy', chance: 30 }]

})

const poison_fang = new Move({
    name: 'Poison Fang',
    category: 'physical',
    type: 'poison',
    power: 50,
    accuracy: 100,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: true,
    animation: null,
    description: 'The user bites the target with toxic fangs. This may also leave the target poisoned.',
    effects: [{ type: 'apply_status', applied_status: 'poisoned', target: 'enemy', chance: 50 }]

})

const poison_tail = new Move({
    name: 'Poison Tail',
    category: 'physical',
    type: 'poison',
    power: 50,
    accuracy: 100,
    pp: {
        max: 25,
        current: 25
    },
    makes_contact: true,
    animation: null,
    description: 'The target is attacked with a slash of claws or blades. Critical hits land more easily.',
    effects: [{ type: 'apply_status', applied_status: 'poisoned', target: 'enemy', chance: 10 }],
    crhit_ratio: 3
})

const venoshock = new Move({
    name: 'Venoshock',
    category: 'special',
    type: 'poison',
    power: 65,
    accuracy: 100,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'The user bites the target with toxic fangs. This may also leave the target poisoned.',
    effects: null

})

const poison_sting = new Move({
    name: 'Poison Sting',
    category: 'physical',
    type: 'poison',
    power: 15,
    accuracy: 100,
    pp: {
        max: 35,
        current: 35
    },
    makes_contact: false,
    animation: null,
    description: '	The user stabs the target with a poisonous stinger to inflict damage. This may also poison the target.',
    effects: [{ type: 'apply_status', applied_status: 'poisoned', target: 'enemy', chance: 30 }]

})

const toxic = new Move({
    name: 'Toxic',
    category: 'status',
    type: 'poison',
    power: null,
    accuracy: 100,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'A move that leaves the target poisoned.',
    effects: [{ type: 'apply_status', applied_status: 'poisoned', target: 'enemy', chance: 100 }]

})

//FLYING MOVES

const wing_attack = new Move({
    name: 'Wing Attack',
    category: 'physical',
    type: 'flying',
    power: 60,
    accuracy: 100,
    pp: {
        max: 35,
        current: 35
    },
    makes_contact: true,
    animation: null,
    description: 'The target is struck with large, imposing wings spread wide to inflict damage.',
    effects: null
})

const gust = new Move({
    name: 'Gust',
    category: 'special',
    type: 'flying',
    power: 40,
    accuracy: 100,
    pp: {
        max: 35,
        current: 35
    },
    makes_contact: false,
    animation: null,
    description: 'A gust of wind is whipped up by wings and launched at the target to inflict damage.',
    effects: null
})

const peck = new Move({
    name: 'Peck',
    category: 'physical',
    type: 'flying',
    power: 35,
    accuracy: 100,
    pp: {
        max: 35,
        current: 35
    },
    makes_contact: true,
    animation: null,
    description: 'The target is jabbed with a sharply pointed beak or horn.',
    effects: null
})

const aerial_ace = new Move({
    name: 'Aerial Ace',
    category: 'physical',
    type: 'flying',
    power: 60,
    accuracy: 1000,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: true,
    animation: null,
    description: 'The user confounds the target with speed, then slashes. This attack never misses.',
    effects: null

})

const air_cutter = new Move({
    name: 'Air Cutter',
    category: 'special',
    type: 'flying',
    power: 60,
    accuracy: 95,
    pp: {
        max: 25,
        current: 25
    },
    makes_contact: false,
    animation: null,
    description: 'The user launches razor-like wind to slash opposing Pokémon. This move has a heightened chance of landing a critical hit.',
    effects: null,
    crhit_ratio: 3
})
//BUG MOVES

const bug_bite = new Move({
    name: 'Bug Bite',
    category: 'physical',
    type: 'bug',
    power: 60,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: true,
    animation: null,
    description: 'The user attacks by biting the target. If the target is holding a Berry, the user eats it and gains its effect.',
    effects: null
})

const mega_horn = new Move({
    name: 'Megahorn',
    category: 'physical',
    type: 'bug',
    power: 120,
    accuracy: 85,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: true,
    animation: null,
    description: 'Using its tough and impressive horn, the user rams into the target with no letup.',
    effects: null
})

const x_scissor = new Move({
    name: 'X-Scissor',
    category: 'physical',
    type: 'bug',
    power: 80,
    accuracy: 100,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: true,
    animation: null,
    description: 'The user slashes at the target by crossing its scythes or claws as if they were a pair of scissors.',
    effects: null
})

const pin_missle = new Move({
    name: 'Pin Missile',
    category: 'physical',
    type: 'bug',
    power: 25,
    accuracy: 95,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The user attacks by shooting sharp spikes at the target. This move hits two to five times in a row.',
    effects: null,
    repetitions: bulletSeedHits()
})



const string_shot = new Move({
    name: 'String Shot',
    category: 'status',
    type: 'bug',
    power: null,
    accuracy: 95,
    pp: {
        max: 40,
        current: 40
    },
    makes_contact: true,
    animation: null,
    description: 'The user blows silk from its mouth that binds opposing Pokémon and harshly lowers their Speed stats.',
    effects: [{ type: 'modify_stat', target_stat: 'speed', target: 'enemy', stages: -2, target_stat_label: 'speed' }],
})


//logic for  berry interaction

// DARK MOVES

const bite = new Move({
    name: 'Bite',
    category: 'physical',
    type: 'dark',
    power: 60,
    accuracy: 100,
    pp: {
        max: 25,
        current: 25
    },
    makes_contact: true,
    animation: null,
    description: 'The target is bitten with viciously sharp fangs. This may also make the target flinch.',
    effects: [{ type: 'apply_flinch', applied_status: 'flinch', target: 'enemy', chance: 30 }]
})

const brutal_swing = new Move({
    name: 'Brutal Swing',
    category: 'physical',
    type: 'dark',
    power: 60,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: true,
    animation: null,
    description: 'The user swings its body around violently to inflict damage on everything in its vicinity.',
    effects: null
})

const night_slash = new Move({
    name: 'Night Slash',
    category: 'physical',
    type: 'dark',
    power: 70,
    accuracy: 100,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: true,
    animation: null,
    description: 'The user slashes the target the instant an opportunity arises. This move has a heightened chance of landing a critical hit.',
    effects: null,
    crhit_ratio: 3
})

//FAIRY MOVES 

const baby_doll_eyes = new Move({
    name: 'Baby-Doll Eyes',
    category: 'status',
    type: 'fairy',
    power: null,
    accuracy: 100,
    pp: {
        max: 30,
        current: 30
    },
    makes_contact: false,
    animation: null,
    description: 'The user stares at the target with its baby-doll eyes, which lowers the target’s Attack stat. This move always goes first.',
    effects: [{ type: 'modify_stat', target_stat: 'atk', target: 'enemy', stages: -1, target_stat_label: 'attack' }],
    priority: 2
})

const disarming_voice = new Move({
    name: 'Disarming Voice',
    category: 'Special',
    type: 'fairy',
    power: 40,
    accuracy: 1000,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'Letting out a charming cry, the user does emotional damage to opposing Pokémon. This attack never misses..',
    effects: null

})

//DRAGON MOVES

const dragon_breath = new Move({
    name: 'Dragon Breath',
    category: 'special',
    type: 'dragon',
    power: 60,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: '	The user exhales a mighty gust that inflicts damage. This may also leave the target with paralysis.',
    effects: [{ type: 'applied_status', applied_status: 'paralyzed', target: 'enemy', chance: 30 }]
})

//GHOST MOVES

const confuse_ray = new Move({
    name: 'Confuse Ray',
    category: 'status',
    type: 'ghost',
    power: null,
    accuracy: 100,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'The target is exposed to a sinister ray that causes confusion.',
    effects: [{ type: 'apply_confusion', applied_status: 'confused', target: 'enemy', chance: 100 }]
})

const lick = new Move({
    name: 'Lick',
    category: 'physical',
    type: 'ghost',
    power: 30,
    accuracy: 100,
    pp: {
        max: 30,
        current: 30
    },
    makes_contact: false,
    animation: null,
    description: 'The user licks the target with a long tongue to inflict damage. This may also leave the target with paralysis.',
    effects: [{ type: 'applied_status', applied_status: 'paralyzed', target: 'enemy', chance: 30 }]
})

const astonish = new Move({
    name: 'Astonish',
    category: 'physical',
    type: 'ghost',
    power: 30,
    accuracy: 100,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: true,
    animation: null,
    description: 'The user attacks the target by crying out in a startling fashion. This may also make the target flinch.',
    effects: [{ type: 'apply_flinch', applied_status: 'flinch', target: 'enemy', chance: 30 }]
})
const hex = new Move({
    name: 'Hex',
    category: 'special',
    type: 'ghost',
    power: 50,
    accuracy: 100,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'This relentless attack does massive damage to a target affected by status conditions.',
    effects: null
})

const night_shade = new Move({
    name: 'Night Shade',
    category: 'special',
    type: 'ghost',
    power: 1,
    accuracy: 100,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'The user makes the target see a frightening mirage. It inflicts damage equal to the user’s level.',
    effects: null
})

//steel

const metal_claw = new Move({
    name: 'Metal Claw',
    category: 'physical',
    type: 'fire',
    power: 50,
    accuracy: 95,
    pp: {
        max: 35,
        current: 35
    },
    makes_contact: true,
    animation: null,
    description: 'The target is raked with steel claws. This may also boost the user’s Attack stat',
    effects: [{ type: 'modify_stat', target_stat: 'atk', target: 'ally', stages: +1, target_stat_label: 'attack', chance: 10 }]
})


export const all_moves = {
    tackle,
    growl,
    water_gun,
    withdraw,
    dobule_team,
    smoke_screen,
    flame_charge,
    ember,
    mega_drain,
    supersonic,
    self_destruct,
    thunder_wave,
    seismic_toss,
    rock_trhow,
    hypnosis,
    confusion,
    rock_slide,
    ice_beam,
    sludge_bomb,
    giga_drain,
    moonlight,
    recover,
    rock_tomb,
    quick_attack,
    pound,
    leafage,
    detect,
    leer,
    protect,
    rock_smash,
    sand_attack,
    wing_attack,
    howl,
    bite,
    tail_whip,
    baby_doll_eyes,
    headbutt,
    draining_kiss,
    psybeam,
    scratch,
    pay_day,
    take_down,
    shock_wave,
    disarming_voice,
    focus_energy,
    dragon_breath,
    lick,
    confuse_ray,
    bulk_up,
    low_kick,
    gust,
    bug_bite,
    poison_sting,
    stun_spore,
    string_shot,
    peck,
    double_kick,
    bullet_seed,
    absorb,
    growth,
    synthesis,
    astonish,
    aqua_jet,
    harden,
    metal_claw,
    mud_shot,
    water_pulse,
    aerial_ace,
    rock_polish,
    night_slash,
    mega_horn,
    brick_break,
    toxic,
    rock_climb,
    x_scissor,
    slash,
    brine,
    stomp,
    poison_fang,
    ice_fang,
    hex,
    venoshock,
    poison_tail,
    bulldoze,
    brutal_swing,
    minimize,
    fury_swipes,
    icy_wind,
    frost_breath,
    powder_snow,
    night_shade,
    swagger,
    pin_missle,
    air_cutter,
    bubble_beam,
    psychic
}