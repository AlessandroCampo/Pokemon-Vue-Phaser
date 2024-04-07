import { allAnimations } from "./animations.mjs"

class Move {
    constructor({ name, type, category, power, accuracy, pp, makes_contact, description, animation, effects, priority, targets }) {
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
    }
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
    accuracy: 100,
    pp: {
        max: 40,
        current: 40
    },
    makes_contact: false,
    animation: null,
    description: 'The user growls in an endearing way, making opposing Pokémon less wary. This lowers their Attack stats.',
    effects: [{ type: 'modify_stat', target_stat: 'atk', target: 'enemy', stages: -1, target_stat_label: 'attack' }]
})

const howl = new Move({
    name: 'Howl',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 100,
    pp: {
        max: 40,
        current: 40
    },
    makes_contact: false,
    animation: null,
    description: 'The user howls loudly to rouse itself and its allies. This boosts their Attack stats.',
    effects: [{ type: 'modify_stat', target_stat: 'atk', target: 'ally', stages: +1, target_stat_label: 'attack' }]
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
    name: 'Recover ',
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
    name: 'Double Team ',
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
    description: 'By moving rapidly, the user makes illusory copies of itself to boost its evasiveness.',
    effects: [{ type: 'modify_stat', target_stat: 'evasion', target: 'ally', stages: +1, target_stat_label: 'evasiveness' }]
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

    name: 'Supersonic ',
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

const withdraw = new Move({
    name: 'Withdraw ',
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
    effects: [{ type: 'modify_stat', target_stat: 'speed', target: 'ally', stages: +1, target_stat_label: 'speed' }]

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
    name: 'Leafage ',
    category: 'physical',
    type: 'grass',
    power: 4000,
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
    name: 'Confusion ',
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
    name: 'Moonlight ',
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
    name: 'Bulk up',
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
    effects: [{ type: 'modify_stat', target_stat: 'speed', target: 'enemy', stages: -1, target_stat_label: 'speed' }]
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
    effects: [{ type: 'apply_status', applied_status: 'frozen', target: 'enemy', chance: 10 }]

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
    low_kick

}